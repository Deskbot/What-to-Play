import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as querystring from "querystring";
import { MetacriticPlatform, toPlatform } from "./platform";
import { closestSearchResult } from "./search";
import { bug, nonNaN } from "./util";

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
    reviewUrl: string;
}

interface Score {
    platform: MetacriticPlatform
    metascore: number
    url: string | undefined
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

    const { name, reviewUrl } = productData;

    // get metascores from product page

    const reviewPageText = await fetch(reviewUrl).then(res => res.text());
    const $ = cheerio.load(reviewPageText);

    let metascoreMax: number | undefined;
    let bestMetascore: Score | undefined;

    for (const scoreElem of $(".c-gamePlatformsSection_list")) {
        const $scoreElem = $(scoreElem)

        const platform = toPlatform($scoreElem.find("title").first().text().trim())

        // only look at scores for platforms the user has asked for
        if (!platform || !platforms.includes(platform)) {
            continue
        }

        const metascore = parseInt($scoreElem.find(".c-siteReviewScore").text().trim())

        const score: Score = {
            platform,
            metascore,
            url: $scoreElem.attr("href")
        }

        // undefined compared (> or <) with undefined or with a number
        // always results in false

        if ((metascore as number) > (metascoreMax as number) || metascoreMax === undefined) {
            metascoreMax = metascore
            bestMetascore = score
        }
    }

    const userscore = parseInt($(".c-siteReviewScore").text().trim())

    let releaseDate: string | undefined
    for (const elem of $(".c-productHero_score-container").find(".g-text-bold")) {
        const $elem = $(elem)
        if ($elem.text().trim() === "Released On:") {
            releaseDate = $elem.siblings("span").first().text().trim()
        }
    }

    return {
        name,
        url: reviewUrl,
        metascore: bestMetascore?.metascore,
        userscore,
        releaseDate: releaseDate ?? "",
        metascoreUrl: bestMetascore?.url,
        userscoreUrl: reviewUrl,
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
    const searchUrl = `https://www.metacritic.com/search/${encodeURI(gameStr)}?category=13`;

    const searchPageText = await fetch(searchUrl).then(res => res.text());
    const searchPage = cheerio.load(searchPageText);

    const searchResults = searchPage(".c-pageSiteSearch-results")
        .find(".c-pageSiteSearch-results-item")
        .toArray()
        .map(searchPage);

    const getNameForResult = (result: cheerio.Cheerio) => result.find("p").first().text().trim()

    const bestResult = closestSearchResult(
        game,
        searchResults,
        getNameForResult
    );

    if (!bestResult) return undefined;

    const name = getNameForResult(bestResult)

    const href = bestResult.attr("href");
    if (!href) bug();

    const reviewUrl = absoluteUrl(href);
    if (!reviewUrl) bug();

    return {
        name,
        reviewUrl,
    }
}
