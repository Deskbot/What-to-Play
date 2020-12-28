import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { bug, nonNaN } from "./util";

export interface MetacriticResult {
    name: string;
    url: string;
    metascore: number | undefined;
    userscore: number | undefined;
}

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
    return "https://www.metacritic.com/" + relativeUrl;
}

export async function getInfo(game: string, platforms: MetacriticPlatform[]): Promise<MetacriticResult | undefined> {
    const searchUrl = `https://www.metacritic.com/search/game/${game}/results`;

    const searchPageText = await fetch(searchUrl).then(res => res.text());
    const searchPage = cheerio.load(searchPageText);

    // choose one of the products found on the search page:

    const product = searchPage(".main_stats").first();

    const anchor = product.parent().find("a");
    const name = anchor.text().trim();
    const href = anchor.attr("href");
    if (!href) bug();

    // determine scores

    const scoreUrl = absoluteUrl(href);
    if (!scoreUrl) bug();

    const scorePageText = await fetch(scoreUrl).then(res => res.text());
    const reviewPage = cheerio.load(scorePageText);

    // get promises that return the score on each wanted platform

    // get other review pages for other platforms from the initial review page
    const scorePromises = getOtherPlatformUrls(reviewPage, platforms)
        .map(getScoresByUrl);

    const startingPlatform = platformFromUrl(href);
    if (platforms.includes(startingPlatform)) {
        scorePromises.push(getScores(reviewPage));
    }

    // aggregate scores from all platforms

    const scores = await Promise.all(scorePromises);

    let metascoreMax: number | undefined;
    let userscoreMax: number | undefined;

    for (const { metascore, userscore } of scores) {
        // undefined compared (> or <) with undefined or with a number
        // always results in false

        if ((metascore as number) > (metascoreMax as number) || metascoreMax === undefined) {
            metascoreMax = metascore;
        }
        if ((userscore as number) > (userscoreMax as number) || userscoreMax === undefined) {
            userscoreMax = userscore;
        }
    }

    return {
        name,
        url: scoreUrl,
        metascore: metascoreMax,
        userscore: userscoreMax,
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

            const platform = platformFromUrl(href);

            if (platforms.includes(platform)) {
                urls.push(absoluteUrl(href));
            }
        });

    return urls;
}

async function getScoresByUrl(scoreUrl: string): Promise<Pick<MetacriticResult, "metascore" | "userscore">> {
    const scorePageText = await fetch(scoreUrl).then(res => res.text());
    const scorePage = cheerio.load(scorePageText);
    return getScores(scorePage);
}

async function getScores(scorePage: cheerio.Root): Promise<Pick<MetacriticResult, "metascore" | "userscore">> {
    const metascoreStr =
        scorePage(".product_scores")
            .find(".main_details") // different
            .find(".metascore_w")
            .find("span") // different
            .text()
            .trim();

    const metascore = nonNaN(parseFloat(metascoreStr), undefined);

    const userscoreStr =
        scorePage(".product_scores")
            .find(".side_details") // different
            .find(".metascore_w")
            .text()
            .trim();

    const userscore = nonNaN(parseFloat(userscoreStr), undefined);

    return {
        metascore,
        userscore,
    };
}

/** url looks like: /game/platform-name/game-name */
function platformFromUrl(url: string): MetacriticPlatform {
    return url.split("/")[2] as MetacriticPlatform
        ?? bug();
}

export function toPlatform(str: string): MetacriticPlatform | undefined {
    for (const [pattern, platform] of platforms) {
        if (str.match(pattern)) {
            return platform;
        }
    }

    return undefined;
}
