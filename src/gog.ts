import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as levenshtein from "fastest-levenshtein";
import * as querystring from "querystring";
import { bug, minBy, nonNaN, RecursivePartial } from "./util";

export interface GogResult {
    name: string;
    score?: number;
    url: string;
}

interface GogSearch {
    products: GogSearchProduct[];
}

interface GogSearchProduct {
    rating: number;
    title: string;
    url: string;
}

interface TargetGame {
    name: string;
    url: string;
}

function absoluteUrl(relativeUrl: string): string {
    return "https://www.gog.com" + relativeUrl;
}

export async function getData(game: string): Promise<GogResult | undefined> {
    const searchData = await search(game);
    if (!searchData) return undefined;

    const { name, url } = searchData;

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

async function search(game: string): Promise<TargetGame | undefined> {
    const gameStr = querystring.escape(game);
    const gogDataUrl = `https://www.gog.com/games/ajax/filtered?limit=10&search=${gameStr}`;

    const searchDataMaybeInvalid = await fetch(gogDataUrl)
        .then(res => res.json()) as RecursivePartial<GogSearch> | null;

    if (!searchDataMaybeInvalid?.products) bug();
    const searchData = searchDataMaybeInvalid as GogSearch;

    // find best match
    const closest = minBy(searchData.products, product => {
        if (!product) return bug();
        if (typeof product.title !== "string") bug();
        if (typeof product.url !== "string") bug();

        return levenshtein.distance(game, product.title);
    });

    if (!closest) return undefined;

    const url = absoluteUrl(closest.url);
    const name = closest.title;

    return {
        name,
        url,
    };
}
