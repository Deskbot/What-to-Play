import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as querystring from "querystring";
import { URL } from "url";
import { bug, nonNaN } from "./util";

type BothScores = Pick<MetacriticResult, "metascore" | "userscore">;

export type MetacriticPlatform =
    "playstation-5"
    | "playstation-4"
    | "playstation-3"
    | "playstation-2"
    | "playstation"
    | "playstation-vita"
    | "psp"
    | "xbox-series-x"
    | "xbox-one"
    | "xbox-360"
    | "xbox"
    | "pc"
    | "switch"
    | "wii-u"
    | "wii"
    | "gamecube"
    | "nintendo-64"
    | "3ds"
    | "ds"
    | "game-boy-advance"
    | "ios"
    | "dreamcast";

export interface MetacriticResult {
    name: string;
    url: string;

    /**
     * can assume that if metascore is present, the corresponding url will be present
     */
    metascore?: number;
    /**
     * can assume that if userscore is present, the corresponding url will be present
     */
    userscore?: number;

    metascoreUrl?: string;
    userscoreUrl?: string;
}

interface MetacriticSearchResult {
    name: string;
    platform: MetacriticPlatform;
    reviewUrl: string;
}

export const platforms: ReadonlyMap<RegExp, MetacriticPlatform> = new Map([
    [/^(ps|playstation).*5$/i, "playstation-5"],
    [/^(ps|playstation).*4$/i, "playstation-4"],
    [/^(ps|playstation).*3$/i, "playstation-3"],
    [/^(ps|playstation).*2$/i, "playstation-2"],
    [/^(ps|playstation).*1?$/i, "playstation"],
    [/^(ps|playstation).*v(ita)?$/i, "playstation-vita"],
    [/^(ps|playstation).*(p|portable)$/i, "psp"],
    [/^xbox.*s?e?(ries)?.*$/i, "xbox-series-x"],
    [/^xbox.*(one|1)$/i, "xbox-one"],
    [/^xbox.*360$/i, "xbox-360"],
    [/^xbox$/i, "xbox"],
    [/^pc|windows|mac|linux|desktop$/i, "pc"],
    [/^(nintendo.*)?switch$/i, "switch"],
    [/^(nintendo.*)?wii.*u$/i, "wii-u"],
    [/^(nintendo.*)?wii$/i, "wii"],
    [/^(nintendo.*)?gamecube$/i, "gamecube"],
    [/^n(intendo)?.*64$/i, "nintendo-64"],
    [/^(nintendo.*)?3ds$/i, "3ds"],
    [/^(nintendo.*)?ds.*$/i, "ds"],
    [/^(nintendo.*)?(game.*boy.*advance|gba)$/i, "game-boy-advance"],
    [/^ios|android|mobile|(smart)?phone|tablet$/i, "ios"],
    [/^(sega.*)?dreamcast$/i, "dreamcast"],
]);

function absoluteUrl(relativeUrl: string): string {
    return "https://www.metacritic.com" + relativeUrl;
}

async function awaitPair<A, B>([a, promiseB]: [A, Promise<B>]): Promise<[A, B]> {
    return [a, await promiseB];
}

export async function getData(game: string, platforms: MetacriticPlatform[]): Promise<MetacriticResult | undefined> {
    const productData = await searchGame(game);
    if (productData === undefined) return undefined;

    const { name, platform, reviewUrl } = productData;

    // get scores from product pages

    const reviewPageText = await fetch(reviewUrl).then(res => res.text());
    const reviewPage = cheerio.load(reviewPageText);

    // get promises that return the score on each wanted platform

    // get other review pages for other platforms from the initial review page
    const scorePromises = getOtherPlatformUrls(reviewPage, platforms)
        .map(url => awaitPair([url, getScoresByUrl(url)]));

    // add the starting page score if it is for a platform we want
    if (platforms.includes(platform)) {
        scorePromises.push(awaitPair([reviewUrl, getScores(reviewPage)]));
    }

    // aggregate scores from all platforms

    const scores = await Promise.all(scorePromises);

    let metascoreMax: number | undefined;
    let userscoreMax: number | undefined;
    let bestMetascoreUrl: string | undefined;
    let bestUserscoreUrl: string | undefined;

    for (const [url, { metascore, userscore }] of scores) {
        // undefined compared (> or <) with undefined or with a number
        // always results in false

        if ((metascore as number) > (metascoreMax as number) || metascoreMax === undefined) {
            metascoreMax = metascore;
            bestMetascoreUrl = url;
        }
        if ((userscore as number) > (userscoreMax as number) || userscoreMax === undefined) {
            userscoreMax = userscore;
            bestUserscoreUrl = url;
        }
    }

    return {
        name,
        url: reviewUrl,
        metascore: metascoreMax,
        userscore: userscoreMax,
        metascoreUrl: bestMetascoreUrl,
        userscoreUrl: bestUserscoreUrl,
    };
}

async function searchGame(game: string): Promise<MetacriticSearchResult | undefined> {
    const searchUrl = "https://www.metacritic.com/autosearch";
    const gameStr = querystring.escape(game);

    const postData = `search_term=${gameStr}`;

    const searchResult = await fetch(searchUrl, {
        method: "POST",
        body: postData,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
        }
    })
        .then(res => res.json());

    if (!searchResult.autoComplete) bug();

    const topProduct = searchResult.autoComplete[0];
    if (!topProduct) return undefined;

    const reviewUrl = topProduct.url;
    if (!reviewUrl) bug();

    const name = topProduct.name
    const platform = platformFromAbsoluteUrl(reviewUrl);

    return {
        name,
        platform,
        reviewUrl,
    };
}

function getOtherPlatformUrls(page: cheerio.Root, platforms: MetacriticPlatform[]): string[] {
    const urls = [] as string[];

    page(".product_platforms")
        .first()
        .find("a")
        .each((_, elem) => {
            const tagElem = elem as cheerio.TagElement;
            const href = tagElem.attribs && tagElem.attribs["href"];
            if (!href) bug();

            const platform = platformFromRelativeUrl(href);

            if (platforms.includes(platform)) {
                urls.push(absoluteUrl(href));
            }
        });

    return urls;
}

async function getScoresByUrl(scoreUrl: string): Promise<BothScores> {
    const scorePageText = await fetch(scoreUrl).then(res => res.text());
    const scorePage = cheerio.load(scorePageText);
    return getScores(scorePage);
}

async function getScores(scorePage: cheerio.Root): Promise<BothScores> {
    const metascoreStr =
        scorePage(".product_scores")
            .find(".main_details") // different
            .find(".metascore_w")
            .find("span") // different
            .text()
            .trim();

    const userscoreStr =
        scorePage(".product_scores")
            .find(".side_details") // different
            .find(".metascore_w")
            .text()
            .trim();

    return {
        metascore: nonNaN(parseFloat(metascoreStr), undefined),
        userscore: nonNaN(parseFloat(userscoreStr), undefined),
    };
}

/** url looks like: /game/platform-name/game-name */
function platformFromRelativeUrl(url: string): MetacriticPlatform {
    return url.split("/")[2] as MetacriticPlatform
        ?? bug();
}

/** url looks like: https://www.metacritic.com/game/platform-name/game-name */
function platformFromAbsoluteUrl(url: string): MetacriticPlatform {
    const parsedUrl = new URL(url);
    return platformFromRelativeUrl(parsedUrl.pathname);
}

export function toPlatform(str: string): MetacriticPlatform | undefined {
    for (const [pattern, platform] of platforms) {
        if (str.match(pattern)) {
            return platform;
        }
    }

    return undefined;
}
