
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as querystring from "querystring";
import { closestSearchResult } from "./search";
import { bug, nonNaN } from "./util";

export interface SteamResult {
    name: string;
    recentScore?: number;
    allTimeScore?: number;
    url: string;
    releaseDate: string;
}

interface SteamSearchResult {
    name: string;
    url: string;
}

/**
 * @param country 2-character country code defined by "ISO 3166-1 alpha-2"
 */
export async function getData(game: string, country: string): Promise<SteamResult | undefined> {
    const productData = await searchGame(game, country);
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

    const releaseDate = storePage(storePage(".release_date .date").get(0)).text();

    return {
        name,
        recentScore,
        allTimeScore,
        url,
        releaseDate,
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

async function searchGame(game: string, country: string): Promise<SteamSearchResult | undefined> {
    const gameStr = querystring.escape(game);
    const searchUrl = `https://store.steampowered.com/search/suggest?f=games&cc=${country}&term=${gameStr}`;
    const searchDropdownHTML = await getSteamPage(searchUrl);

    const searchDom = cheerio.load(searchDropdownHTML);

    const searchResults = searchDom(".match")
        .toArray()
        .map(searchDom);

    const bestResult = closestSearchResult(
        game,
        searchResults,
        product => product.find(".match_name").text()
    );

    if (!bestResult) return undefined;

    const name = bestResult.find(".match_name").text();
    const url = bestResult.attr("href");

    if (!name) bug();
    if (!url) bug();

    return {
        name,
        url,
    };
}
