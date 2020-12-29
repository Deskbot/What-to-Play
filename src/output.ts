import * as gog from "./gog";
import * as hltb from "./how-long-to-beat";
import * as metacritic from "./metacritic";
import * as steam from "./steam";
import { MetacriticPlatform } from "./metacritic";
import { average, bindUndefined, csvFriendly, escapeDoubleQuotes, printable } from "./util";

export interface AllData {
    game: string;
    aggregateScore?: number;
    hltb?: hltb.HowLongToBeatResult;
    gog?: gog.GogResult;
    metacritic?: metacritic.MetacriticResult;
    steam?: steam.SteamResult;
}

export const csvHeaders = [
    "Game",
    "Aggregate Score",
    "Steam Name",
    "Steam All Time % Positive",
    "Steam Recent % Positive",
    "Metacritic Name",
    "Metacritic Critic Score",
    "Metacritic User Score",
    "GOG Name",
    "GOG Score",
    "How Long to Beat Name",
    "How Long to Beat: Main Story",
    "How Long to Beat: Main Story + Extra",
    "How Long to Beat: Completionist",
    "How Long to Beat: Solo",
    "How Long to Beat: Co-Op",
    "How Long to Beat: Vs.",
] as const;

export type CsvHeaders = typeof csvHeaders[number];
export type ResultCSV = Record<CsvHeaders, string>;

/**
 * Based on common spreadsheet syntax.
 */
function toHyperlink(url: string, text: string | number): string {
    // escape inputs to fit formula syntax
    url = escapeDoubleQuotes(url, '""');

    if (typeof text === "string") {
        text = escapeDoubleQuotes(text, '""');
    }

    return `=HYPERLINK("${url}", "${text}")`;
}

export async function getData(game: string, platforms: MetacriticPlatform[]): Promise<AllData> {
    const gogDataProm = gog.getData(game);
    const metacriticDataProm = metacritic.getInfo(game, platforms);
    const steamDataProm = steam.getInfo(game);
    const hltbDataProm = hltb.getData(game);

    // spawn all promises before blocking on their results
    const gogData = await gogDataProm;
    const metacriticData = await metacriticDataProm;
    const steamData = await steamDataProm;

    return {
        game,
        aggregateScore: aggregateScore(gogData, metacriticData, steamData),
        gog: gogData,
        metacritic: metacriticData,
        steam: steamData,
        hltb: await hltbDataProm,
    };
}

export async function getJson(game: string, platforms: MetacriticPlatform[]): Promise<string> {
    return JSON.stringify(await getData(game, platforms));
}

export async function getCsv(game: string, platforms: MetacriticPlatform[]): Promise<string> {
    const buffer = [] as string[];

    const data = await getData(game, platforms);

    const newData = {
        "Game": data.game,
        "Aggregate Score": data.aggregateScore,
        "Steam Name": bindUndefined(data.steam, s => toHyperlink(s.url, s.name)),
        "Steam All Time % Positive": data.steam?.allTimeScore,
        "Steam Recent % Positive": data.steam?.recentScore,
        "Metacritic Name": bindUndefined(data.metacritic, m => toHyperlink(m.url, m.name)),
        "Metacritic Critic Score": data.metacritic?.metascore
            ? toHyperlink(data.metacritic.metascoreUrl!, data.metacritic.metascore)
            : undefined,
        "Metacritic User Score": data.metacritic?.userscore
            ? toHyperlink(data.metacritic.userscoreUrl!, data.metacritic.userscore)
            : undefined,
        "GOG Name": bindUndefined(data.gog, g => toHyperlink(g.url, g.name)),
        "GOG Score": data.gog?.score,
        "How Long to Beat Name": bindUndefined(data.hltb, h => toHyperlink(h.url, h.name)),
        "How Long to Beat: Main Story": data.hltb?.times.mainStory,
        "How Long to Beat: Main Story + Extra": data.hltb?.times.mainPlusExtra,
        "How Long to Beat: Completionist": data.hltb?.times.completionist,
        "How Long to Beat: Solo": data.hltb?.times.solo,
        "How Long to Beat: Co-Op": data.hltb?.times.coop,
        "How Long to Beat: Vs.": data.hltb?.times.vs,
    };

    // iterate through in the same order every time guaranteed
    const keys = Object.keys(newData) as CsvHeaders[];

    for (const key of keys) {
        buffer.push(csvFriendly(printable(newData[key])));
        buffer.push(",");
    }

    buffer.push("\n");

    return buffer.join("");
}

function aggregateScore(
    gogData?: gog.GogResult,
    metacriticData?: metacritic.MetacriticResult,
    steamResult?: steam.SteamResult,
): number | undefined {
    let scores = [] as number[];

    const gog_score = gogData?.score;
    const metacritic_metascore = metacriticData?.metascore;
    const metacritic_userscore = metacriticData?.userscore;
    const steam_allTimeScore = steamResult?.allTimeScore;
    const steam_recentScore = steamResult?.recentScore;

    // make all scores out of 100
    if (gog_score !== undefined) {
        scores.push(gog_score * 20);
    }
    if (metacritic_metascore !== undefined) {
        scores.push(metacritic_metascore);
    }
    if (metacritic_userscore !== undefined) {
        scores.push(metacritic_userscore * 10);
    }
    if (steam_allTimeScore !== undefined) {
        scores.push(steam_allTimeScore);
    }
    if (steam_recentScore !== undefined) {
        scores.push(steam_recentScore);
    }

    if (scores.length === 0) {
        return undefined;
    }

    return parseFloat(average(scores).toFixed(1));
}
