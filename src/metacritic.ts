import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { bug, nonNaN } from "./util";

export interface MetacriticResult {
    name: string;
    url: string;
    metascore: number | undefined;
    userscore: number | undefined;
}

export type MetacriticPlatform =
    "playstation-5"
    | "playstation-4"
    | "playstation-3"
    | "playstation-2"
    | "playstation"
    | "playstation-vita"
    | "psp"
    | "xbox-series-x"
    | "xbox-one"
    | "xbox-360"
    | "xbox"
    | "pc"
    | "switch"
    | "wii-u"
    | "wii"
    | "gamecube"
    | "nintendo-64"
    | "3ds"
    | "ds"
    | "game-boy-advance"
    | "ios"
    | "dreamcast";

export const platforms: ReadonlyMap<RegExp, MetacriticPlatform> = new Map([
    [/^(ps|playstation).*5$/i, "playstation-5"],
    [/^(ps|playstation).*4$/i, "playstation-4"],
    [/^(ps|playstation).*3$/i, "playstation-3"],
    [/^(ps|playstation).*2$/i, "playstation-2"],
    [/^(ps|playstation).*1?$/i, "playstation"],
    [/^(ps|playstation).*v(ita)?$/i, "playstation-vita"],
    [/^(ps|playstation).*(p|portable)$/i, "psp"],
    [/^xbox.*s?e?(ries)?.*$/i, "xbox-series-x"],
    [/^xbox.*(one|1)$/i, "xbox-one"],
    [/^xbox.*360$/i, "xbox-360"],
    [/^xbox$/i, "xbox"],
    [/^pc|windows|mac|linux|desktop$/i, "pc"],
    [/^(nintendo.*)?switch$/i, "switch"],
    [/^(nintendo.*)?wii.*u$/i, "wii-u"],
    [/^(nintendo.*)?wii$/i, "wii"],
    [/^(nintendo.*)?gamecube$/i, "gamecube"],
    [/^n(intendo)?.*64$/i, "nintendo-64"],
    [/^(nintendo.*)?3ds$/i, "3ds"],
    [/^(nintendo.*)?ds.*$/i, "ds"],
    [/^(nintendo.*)?(game.*boy.*advance|gba)$/i, "game-boy-advance"],
    [/^ios|android|mobile|(smart)?phone|tablet$/i, "ios"],
    [/^(sega.*)?dreamcast$/i, "dreamcast"],
]);

export async function getInfo(game: string, platforms: MetacriticPlatform[]): Promise<MetacriticResult | undefined> {
    const searchUrl = `https://www.metacritic.com/search/game/${game}/results`;

    const searchPageText = await fetch(searchUrl).then(res => res.text());
    const searchPage = cheerio.load(searchPageText);

    // choose one of the products found on the search page:

    const product = searchPage(".main_stats").first();

    const anchor = product.parent().find("a");
    const name = anchor.text().trim();
    const scoreUrl = "https://www.metacritic.com/" + anchor.attr("href");
    // const platform = anchor.attr("href")?.split("/")[2]; // looks like: /game/platform-name/game-name

    if (!scoreUrl) bug();

    const { metascore, userscore } = await getScoresByUrl(scoreUrl);

    return {
        name,
        url: scoreUrl,
        metascore,
        userscore,
    };
}

async function getScoresByUrl(scoreUrl: string): Promise<Pick<MetacriticResult, "metascore" | "userscore">> {
    const scorePageText = await fetch(scoreUrl).then(res => res.text());
    const scorePage = cheerio.load(scorePageText);
    return getScores(scorePage);
}

async function getScores(scorePage: cheerio.Root): Promise<Pick<MetacriticResult, "metascore" | "userscore">> {
    const metascoreStr =
        scorePage(".product_scores")
            .find(".main_details") // different
            .find(".metascore_w")
            .find("span") // different
            .text()
            .trim();

    const metascore = nonNaN(parseFloat(metascoreStr), undefined);

    const userscoreStr =
        scorePage(".product_scores")
            .find(".side_details") // different
            .find(".metascore_w")
            .text()
            .trim();

    const userscore = nonNaN(parseFloat(userscoreStr), undefined);

    return {
        metascore,
        userscore,
    };
}

export function toPlatform(str: string): MetacriticPlatform | undefined {
    for (const [pattern, platform] of platforms) {
        if (str.match(pattern)) {
            return platform;
        }
    }

    return undefined;
}
