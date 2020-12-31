
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as levenshtein from "fastest-levenshtein";
import * as querystring from "querystring";
import { bug, minBy, nonNaN } from "./util";

export interface SteamResult {
    name: string;
    recentScore?: number;
    allTimeScore?: number;
    url: string;
}

interface SteamSearchResult {
    name: string;
    url: string;
}

export async function getData(game: string): Promise<SteamResult | undefined> {
    const productData = await searchGame(game);
    if (productData === undefined) return undefined;

    const { name, url } = productData;

    // get scores from product page

    const storePage = cheerio.load(await getSteamPage(url));
    const reviewInfos = storePage(".user_reviews_summary_row");

    let recentScore: number | undefined;
    let allTimeScore: number | undefined;

    // no review data e.g. unreleased game
    if (reviewInfos.length === 0) {
        recentScore = undefined;
        allTimeScore = undefined;
    }

    // game is recently released
    else if (reviewInfos.length === 1) {
        recentScore = reviewRowToPercent(reviewInfos.get(0));
        allTimeScore = recentScore;
    }

    else {
        recentScore = reviewRowToPercent(reviewInfos.get(0));
        allTimeScore = reviewRowToPercent(reviewInfos.get(1));
    }

    return {
        name,
        recentScore,
        allTimeScore,
        url,
    };
}

async function getSteamPage(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: {
            "Cookie": "birthtime=281318401" // bypass age restriction
        }
    });
    return await res.text();
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

async function searchGame(game: string): Promise<SteamSearchResult | undefined> {
    const gameStr = querystring.escape(game);
    const searchUrl = `https://store.steampowered.com/search/suggest?f=games&cc=US&term=${gameStr}`;
    const searchDropdownHTML = await getSteamPage(searchUrl);

    const searchDom = cheerio.load(searchDropdownHTML);

    const matches = searchDom(".match").toArray();

    const bestMatch = minBy(matches, match => {
        const name = searchDom(match).find(".match_name").text();
        return levenshtein.distance(game, name);
    });

    if (!bestMatch) return undefined;

    const bestElem = searchDom(bestMatch);
    const name = bestElem.find(".match_name").text();
    const url = bestElem.attr("href");

    if (!name) bug();
    if (!url) bug();

    return {
        name,
        url,
    };
}
