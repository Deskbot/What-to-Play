
import * as cheerio from "cheerio";
import { bug, getPage, nonNaN } from "./util";

export type SteamResults = {
    name: string,
    recentScore: number | undefined,
    allTimeScore: number | undefined,
    url: string,
} | undefined;

export async function getInfo(name: string): Promise<SteamResults> {
    const searchUrl = `https://store.steampowered.com/search/?term=${name}`;

    const searchPage = cheerio.load(await getPage(searchUrl));

    const searchResultRow = searchPage(".search_result_row").first();
    const resultName = searchResultRow.find(".title").first().text();
    const scoreUrl = searchResultRow.attr("href");

    if (!searchResultRow) return undefined;
    if (!resultName) bug();
    if (!scoreUrl) bug();

    const storePage = cheerio.load(await getPage(scoreUrl));
    const reviewInfos = storePage(".user_reviews_summary_row")

    const recentReviewPercent = reviewRowToPercent(reviewInfos.get(0));
    const allReviewsPercent = reviewRowToPercent(reviewInfos.get(1));

    return {
        name: resultName,
        recentScore: nonNaN(recentReviewPercent, undefined),
        allTimeScore: nonNaN(allReviewsPercent, undefined),
        url: scoreUrl,
    };
}

function reviewRowToPercent(row: cheerio.Cheerio): number {
    const recentReviewText = row.attr("data-tooltip-html") as string;

    // the percent is at the start and consists of up to 3 characters followed by a % sign
    const recentReviewPercentStr = recentReviewText.substr(0, 3).replace(/[^0-9]/g, "");

    return parseInt(recentReviewPercentStr);
}
