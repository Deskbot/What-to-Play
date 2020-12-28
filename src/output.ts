import * as gog from "./gog";
import * as hltb from "./how-long-to-beat";
import * as metacritic from "./metacritic";
import * as steam from "./steam";
import { MetacriticPlatform } from "./metacritic";
import { average, csvFriendly, printable } from "./util";

export interface AllData {
    game: string;
    aggregateScore: number | undefined;
    hltb: hltb.HowLongToBeatResult | undefined;
    gog: gog.GogResult | undefined;
    metacritic: metacritic.MetacriticResult | undefined;
    steam: steam.SteamResult | undefined;
}

export type CsvHeaders =
    "Game"
    | "Aggregate Score"
    | "Steam Name"
    | "Steam URL"
    | "Steam All Time % Positive"
    | "Steam Recent % Positive"
    | "Metacritic Name"
    | "Metacritic URL"
    | "Metacritic Critic Score"
    | "Metacritic Critic Score URL"
    | "Metacritic User Score"
    | "Metacritic User Score URL"
    | "GOG Name"
    | "GOG URL"
    | "GOG Score"
    | "How Long to Beat Name"
    | "How Long to Beat URL"
    | "How Long to Beat: Main Story"
    | "How Long to Beat: Main Story + Extra"
    | "How Long to Beat: Completionist"
    | "How Long to Beat: Solo"
    | "How Long to Beat: Co-Op"
    | "How Long to Beat: Vs.";

export type ResultCSV = Record<CsvHeaders, string>;

export const csvHeaders: ReadonlyArray<CsvHeaders> = [
    "Game",
    "Aggregate Score",
    "Steam Name",
    "Steam URL",
    "Steam All Time % Positive",
    "Steam Recent % Positive",
    "Metacritic Name",
    "Metacritic URL",
    "Metacritic Critic Score",
    "Metacritic Critic Score URL",
    "Metacritic User Score",
    "Metacritic User Score URL",
    "GOG Name",
    "GOG URL",
    "GOG Score",
    "How Long to Beat Name",
    "How Long to Beat URL",
    "How Long to Beat: Main Story",
    "How Long to Beat: Main Story + Extra",
    "How Long to Beat: Completionist",
    "How Long to Beat: Solo",
    "How Long to Beat: Co-Op",
    "How Long to Beat: Vs.",
];

export async function getData(game: string, platforms: MetacriticPlatform[]): Promise<AllData> {
    const gogData = await gog.getData(game);
    const metacriticData = await metacritic.getInfo(game, platforms);
    const steamData = await steam.getInfo(game);

    return {
        game,
        aggregateScore: aggregateScore(gogData, metacriticData, steamData),
        gog: gogData,
        metacritic: metacriticData,
        steam: steamData,
        hltb: await hltb.getData(game),
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
        "Steam Name": data.steam?.name,
        "Steam URL": data.steam?.url,
        "Steam All Time % Positive": data.steam?.allTimeScore,
        "Steam Recent % Positive": data.steam?.recentScore,
        "Metacritic Name": data.metacritic?.name,
        "Metacritic URL": data.metacritic?.url,
        "Metacritic Critic Score": data.metacritic?.metascore,
        "Metacritic User Score": data.metacritic?.userscore,
        "Metacritic Critic Score URL": data.metacritic?.metascoreUrl,
        "Metacritic User Score URL": data.metacritic?.userScoreUrl,
        "GOG Name": data.gog?.name,
        "GOG URL": data.gog?.url,
        "GOG Score": data.gog?.score,
        "How Long to Beat Name": data.hltb?.name,
        "How Long to Beat URL": data.hltb?.url,
        "How Long to Beat: Main Story": data.hltb?.times.mainStory,
        "How Long to Beat: Main Story + Extra": data.hltb?.times.mainPlusExtra,
        "How Long to Beat: Completionist": data.hltb?.times.completionist,
        "How Long to Beat: Solo": data.hltb?.times.solo,
        "How Long to Beat: Co-Op": data.hltb?.times.coop,
        "How Long to Beat: Vs.": data.hltb?.times.vs,
    };

    // iterate through in the same order every time guaranteed
    const keys = Object.keys(newData) as (keyof ResultCSV)[];

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
