import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { LCS } from "js-lcs";
import * as querystring from "querystring";
import { bug, maxBy } from "./util";

export interface HowLongToBeatResult {
    name: string;
    times: {
        mainStory?: number;
        mainPlusExtra?: number;
        completionist?: number;
        solo?: number;
        coop?: number;
        vs?: number;
    };
    url: string;
}

/**
 * A map from the name of each measure of completion time used by howlongtobeat.com
 * to the key used in the result of this program.
 */
const fieldMap: Record<string, keyof HowLongToBeatResult["times"] | undefined> = {
    "Main Story": "mainStory",
    "Main + Extra": "mainPlusExtra",
    "Completionist": "completionist",
    "Solo": "solo",
    "Co-Op": "coop",
    "Vs.": "vs",
};

export async function getData(game: string): Promise<HowLongToBeatResult | undefined> {
    const searchPage = await getSearchPage(game);

    // choose the best result

    const searchResultElems = searchPage(".search_list_details");
    const searchResults = searchResultElems.toArray().map(searchPage);

    const gameLower = game.toLowerCase();
    const bestResult = maxBy(searchResults, searchResult => {
        const nameElem = searchResult.find("a").first();
        const name = nameElem.text();

        return LCS.size(gameLower, name.toLowerCase());
    });

    if (!bestResult) return undefined;

    // get data about the game out of the best result

    // get name
    const nameElem = bestResult.find("a").first();
    const name = nameElem.text();
    if (!name) bug();

    // get url
    const url = "https://howlongtobeat.com/" + nameElem.attr("href");

    // get completion times

    const gridElems = bestResult
        .find(".search_list_tidbit,.search_list_tidbit_short,.search_list_tidbit_long")
        .toArray();

    const times = {} as HowLongToBeatResult["times"];

    let i = 0;
    while (true) {
        // the elements alternate between labels and fields
        const fieldElem = gridElems[i];
        const timeElem = gridElems[i + 1];
        i += 2;

        if (fieldElem === undefined) break;

        const fieldName = searchPage(fieldElem).text().trim();
        const time = getTimeFromElem(searchPage(timeElem));

        // transform the given field name into the key we want to use in the result
        const key = fieldMap[fieldName];
        if (key === undefined) bug();

        // add the time to the output
        times[key] = time;
    }

    return {
        name,
        times,
        url,
    };
}

/** search for game on the website */
async function getSearchPage(game: string): Promise<cheerio.Root> {
    const searchUrl = "https://howlongtobeat.com/search_results?page=1";
    const gameStr = querystring.escape(game);
    const postData = `queryString=${gameStr}&t=games&sorthead=popular&sortd=Normal Order`;

    const res = await fetch(searchUrl, {
        method: "POST",
        body: postData,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    return cheerio.load(await res.text());
}

function getTimeFromElem(elem: cheerio.Cheerio): number | undefined {
    const timeStr = elem.html()?.replace("½", ".5");
    const time = parseFloat(timeStr as any); // undefined returns NaN

    if (Number.isNaN(time)) return undefined; // likely lack of data i.e. when timeStr === "--"
    return time;
}
