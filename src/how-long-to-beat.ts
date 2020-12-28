import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as querystring from "querystring";
import { bug, nonNaN } from "./util";

export interface HowLongToBeatResult {
    name: string;
    mainStory: number;
    mainPlusExtra: number;
    completionist: number;
    url: string;
}

export async function getData(game: string): Promise<HowLongToBeatResult | undefined> {
    const searchUrl = "https://howlongtobeat.com/search_results?page=1";
    const gameStr = querystring.escape(game);
    const postData = `queryString=${gameStr}&t=games&sorthead=popular&sortd=Normal Order`;

    const html = await fetch(searchUrl, {
        method: "POST",
        body: postData
    })
    .then(res => res.text());

    const searchPage = cheerio.load(html);
    const searchResult = searchPage(".search_list_details").first();

    if (searchResult.length === 0) return undefined;

    const nameElem = searchResult
        .find("a")
        .first();

    const name = nameElem.text();
    if (!name) bug();

    const url = "https://howlongtobeat.com/" + nameElem.attr("href");

    const timeElems = searchResult
        .find(".search_list_details_block")
        .first()
        .find(".time_100");

    if (timeElems.length === 0) bug();

    const mainStory = getTimeFromBlock(timeElems.get(0));
    const mainPlusExtra = getTimeFromBlock(timeElems.get(1));
    const completionist = getTimeFromBlock(timeElems.get(2));

    return {
        name,
        mainStory,
        mainPlusExtra,
        completionist,
        url,
    };
}

function getTimeFromBlock(block: any): number {
    if (!block || typeof block.nodeValue !== "string") {
        bug();
    }

    const timeStr = (block.nodeValue as string).replace("½", ".5");

    return nonNaN(parseFloat(timeStr), bug());
}
