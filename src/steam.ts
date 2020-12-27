
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { bug, nonNaN } from "./util";

export type SteamResult = {
    name: string,
    recentScore: number | undefined,
    allTimeScore: number | undefined,
    url: string,
};

export async function getInfo(game: string): Promise<SteamResult | undefined> {
    const searchUrl = `https://store.steampowered.com/search/?term=${game}`;
    const searchPage = cheerio.load(await getPage(searchUrl));

    const searchResultRow = searchPage(".search_result_row").first();
    const realName = searchResultRow.find(".title").first().text();
    const scoreUrl = searchResultRow.attr("href");

    if (searchResultRow.length === 0) return undefined;
    if (!realName) bug();
    if (!scoreUrl) bug();

    const storePage = cheerio.load(await getPage(scoreUrl));
    const reviewInfos = storePage(".user_reviews_summary_row");

    // no reviews
    if (reviewInfos.length < 2) {
        return {
            name: realName,
            recentScore: undefined,
            allTimeScore: undefined,
            url: scoreUrl,
        };
    }

    const recentScore = reviewRowToPercent(reviewInfos.get(0));
    const allTimeScore = reviewRowToPercent(reviewInfos.get(1));

    return {
        name: realName,
        recentScore,
        allTimeScore,
        url: scoreUrl,
    };
}

function getPage(url: string): Promise<string> {
    return fetch(url, {
        headers: {
            "Cookie": "birthtime=281318401" // bypass age restriction
        }
    }).then(res => res.text());
}

function reviewRowToPercent(r: any): number | undefined {
    if (!r.attribs || !r.attribs["data-tooltip-html"]) {
        // some steam store pages have no reviews
        return undefined;
    }

    const row = r as cheerio.TagElement;

    const recentReviewText = row.attribs["data-tooltip-html"];

    // the percent is at the start and consists of up to 3 characters followed by a % sign
    const recentReviewPercentStr = recentReviewText
        .substr(0, 3)
        .replace(/[^0-9]/g, "");

    return nonNaN(parseInt(recentReviewPercentStr), undefined);
}
