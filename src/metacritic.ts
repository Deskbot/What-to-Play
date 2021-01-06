import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as querystring from "querystring";
import { bug, nonNaN } from "./util";
import { closestSearchResult } from "./search";
import { MetacriticPlatform } from "./platform";

type BothScores = Pick<MetacriticResult, "metascore" | "userscore">;

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

    releaseDate: string;

    metascoreUrl?: string;
    userscoreUrl?: string;
}

interface TargetGame {
    name: string;
    platform: MetacriticPlatform;
    reviewUrl: string;
}

function absoluteUrl(relativeUrl: string): string {
    return "https://www.metacritic.com" + relativeUrl;
}

async function awaitPair<A, B>([a, promiseB]: [A, Promise<B>]): Promise<[A, B]> {
    return [a, await promiseB];
}

export async function getData(game: string, platforms: MetacriticPlatform[]): Promise<MetacriticResult | undefined> {
    const productData = await search(game);
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

    const releaseDate = reviewPage(reviewPage(".summary_detail.release_data .data").get(0)).text();

    return {
        name,
        url: reviewUrl,
        metascore: metascoreMax,
        userscore: userscoreMax,
        releaseDate,
        metascoreUrl: bestMetascoreUrl,
        userscoreUrl: bestUserscoreUrl,
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

async function getScores(scorePage: cheerio.Root): Promise<BothScores> {
    const metascoreStr =
        scorePage(".product_scores")
            .find(".main_details") // different
            .find(".metascore_w")
            .find("span") // different
            .first()
            .text()
            .trim();

    const userscoreStr =
        scorePage(".product_scores")
            .find(".side_details") // different
            .find(".metascore_w")
            .first()
            .text()
            .trim();

    return {
        metascore: nonNaN(parseFloat(metascoreStr), undefined),
        userscore: nonNaN(parseFloat(userscoreStr), undefined),
    };
}

async function getScoresByUrl(scoreUrl: string): Promise<BothScores> {
    const scorePageText = await fetch(scoreUrl).then(res => res.text());
    const scorePage = cheerio.load(scorePageText);
    return getScores(scorePage);
}

/** url looks like: /game/platform-name/game-name */
function platformFromRelativeUrl(url: string): MetacriticPlatform {
    return url.split("/")[2] as MetacriticPlatform
        ?? bug();
}

async function search(game: string): Promise<TargetGame | undefined> {
    const gameStr = querystring.escape(game);
    const searchUrl = `https://www.metacritic.com/search/game/${gameStr}/results`;

    const searchPageText = await fetch(searchUrl).then(res => res.text());
    const searchPage = cheerio.load(searchPageText);

    const searchResults = searchPage(".main_stats").find("a")
        .toArray()
        .map(searchPage);

    const bestResult = closestSearchResult(
        game,
        searchResults,
        product => product.text().trim()
    );

    if (!bestResult) return undefined;

    const name = bestResult.text().trim();

    const href = bestResult.attr("href");
    if (!href) bug();

    const reviewUrl = absoluteUrl(href);
    if (!reviewUrl) bug();

    const platform = platformFromRelativeUrl(href);

    return {
        name,
        platform,
        reviewUrl,
    }
}
