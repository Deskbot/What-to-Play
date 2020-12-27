import { metacritic } from "./api";
import * as steam from "./steam";
import { csvFriendly, printable } from "./util";

export interface ResultJson {
    game: string;
    metacritic: metacritic.MetacriticResult | undefined;
    steam: steam.SteamResult | undefined;
}

export type CsvHeaders = "Game"
    | "Steam Name"
    | "Steam URL"
    | "Steam All Time % Positive"
    | "Steam Recent % Positive"
    | "Metacritic Name"
    | "Metacritic URL"
    | "Metacritic Critic Score"
    | "Metacritic User Score";

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
    "Metacritic User Score",
];

export async function getData(game: string): Promise<ResultJson> {
    return {
        game,
        metacritic: await metacritic.getInfo(game, []),
        steam: await steam.getInfo(game),
    };
}

export async function getJson(game: string): Promise<string> {
    return JSON.stringify(await getData(game));
}

export async function getCsv(game: string): Promise<string> {
    const buffer = [] as string[];

    const data = await getData(game);
    if (data === undefined) return "";

    const newData = {
        "Game": data.game,
        "Steam Name": data.steam?.name ?? "",
        "Steam URL": data.steam?.url ?? "",
        "Steam All Time % Positive": data.steam?.allTimeScore ?? "",
        "Steam Recent % Positive": data.steam?.recentScore ?? "",
        "Metacritic Name": data.metacritic?.name ?? "",
        "Metacritic URL": data.metacritic?.url ?? "",
        "Metacritic Critic Score": data.metacritic?.metascore ?? "",
        "Metacritic User Score": data.metacritic?.userscore ?? "",
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
