import * as cheerio from "cheerio";
import fetch from "node-fetch";
import * as querystring from "querystring";
import { bug } from "./util";

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
} as const;

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

    // get url
    const url = "https://howlongtobeat.com/" + nameElem.attr("href");

    // get completion times

    const gridElems = searchResult
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

function getTimeFromElem(elem: cheerio.Cheerio): number | undefined {
    const timeStr = elem.html()?.replace("½", ".5");
    const time = parseFloat(timeStr as any); // undefined returns NaN

    if (Number.isNaN(time)) return undefined; // likely lack of data i.e. when timeStr === "--"
    return time;
}
