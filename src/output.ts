import * as gog from "./gog";
import * as metacritic from "./metacritic";
import * as steam from "./steam";
import { MetacriticPlatform } from "./metacritic";
import { csvFriendly, printable } from "./util";

export interface ResultJson {
    game: string;
    gog: gog.GogResult | undefined;
    metacritic: metacritic.MetacriticResult | undefined;
    steam: steam.SteamResult | undefined;
}

export type CsvHeaders =
    "Game"
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
    | "GOG Score";

export type ResultCSV = Record<CsvHeaders, string>;

export const csvHeaders: ReadonlyArray<CsvHeaders> = [
    "Game",
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
];

export async function getData(game: string, platforms: MetacriticPlatform[]): Promise<ResultJson> {
    return {
        game,
        gog: await gog.getData(game),
        metacritic: await metacritic.getInfo(game, platforms),
        steam: await steam.getInfo(game),
    };
}

export async function getJson(game: string, platforms: MetacriticPlatform[]): Promise<string> {
    return JSON.stringify(await getData(game, platforms));
}

export async function getCsv(game: string, platforms: MetacriticPlatform[]): Promise<string> {
    const buffer = [] as string[];

    const data = await getData(game, platforms);
    if (data === undefined) return "";

    const newData = {
        "Game": data.game,
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
