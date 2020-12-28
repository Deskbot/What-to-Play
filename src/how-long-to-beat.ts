import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as querystring from "querystring";
import { bug } from "./util";

export interface HowLongToBeatResult {
    name: string;
    mainStory: number | undefined;
    mainPlusExtra: number | undefined;
    completionist: number | undefined;
    url: string;
}

export async function getData(game: string): Promise<HowLongToBeatResult | undefined> {
    // search for game on the website

    const searchUrl = "https://howlongtobeat.com/search_results?page=1";
    const gameStr = querystring.escape(game);
    const postData = `queryString=${gameStr}&t=games&sorthead=popular&sortd=Normal Order`;

    const html = await fetch(searchUrl, {
        method: "POST",
        body: postData,
        headers: {
            "content-type": "application/x-www-form-urlencoded"
        }
    })
    .then(res => res.text());

    // get data about the game out of the results

    const searchPage = cheerio.load(html);
    const searchResult = searchPage(".search_list_details").first(); // only look at first result

    if (searchResult.length === 0) return undefined;

    // get name

    const nameElem = searchResult.find("a").first();
    const name = nameElem.text();
    if (!name) bug();

    // get completion times

    const timeElems = searchResult
        .find(".search_list_tidbit")
        .toArray();

    if (timeElems.length !== 6) bug();

    // every even numbered element is just the text next to the number
    const mainStory = getTimeFromElem(searchPage(timeElems[1]));
    const mainPlusExtra = getTimeFromElem(searchPage(timeElems[3]));
    const completionist = getTimeFromElem(searchPage(timeElems[5]));

    // get url
    const url = "https://howlongtobeat.com/" + nameElem.attr("href");

    return {
        name,
        mainStory,
        mainPlusExtra,
        completionist,
        url,
    };
}

function getTimeFromElem(elem: cheerio.Cheerio): number | undefined {
    const timeStr = elem.html()?.replace("½", ".5");
    const time = parseFloat(timeStr as any); // undefined returns NaN

    if (Number.isNaN(time)) return undefined; // likely lack of data
    return time;
}
