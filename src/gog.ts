import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as querystring from "querystring";
import { bug, nonNaN } from "./util";

export interface GogResult {
    name: string;
    score?: number;
    url: string;
}

interface GogSearch {
    products: {
        rating: number;
        title: string;
        url: string;
    }[];
}

function absoluteUrl(relativeUrl: string): string {
    return "https://www.gog.com" + relativeUrl;
}

export async function getData(game: string): Promise<GogResult | undefined> {
    const gameStr = querystring.escape(game);
    const gogDataUrl = `https://www.gog.com/games/ajax/filtered?limit=1&search=${gameStr}`;

    const searchData = await fetch(gogDataUrl).then(res => res.json()) as Partial<GogSearch> | null;
    const gameData = searchData?.products && searchData.products[0];

    if (!gameData) return undefined;
    if (typeof gameData.url !== "string") bug();
    if (typeof gameData.title !== "string") bug();

    const url = absoluteUrl(gameData.url);
    const name = gameData.title;

    // get the score from the url because that's more reliable and accurate

    const html = await fetch(url).then(res => res.text());
    const gamePage = cheerio.load(html);

    const scoreText = gamePage(".productcard-rating")
        .first()
        .find(".productcard-rating__score")
        .text();

    const score = scoreText
        ? nonNaN(parseFloat(scoreText.split("/")[0]), undefined)
        : undefined; // some pages don't have a score due to there not being enough ratings

    return {
        name,
        score,
        url,
    };
}
