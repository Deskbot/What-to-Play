import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { bug, nonNaN } from "./util";

export interface MetacriticResult {
    name: string;
    url: string;
    metascore: number | undefined;
    userscore: number | undefined;
}

export const platforms: ReadonlyArray<readonly [RegExp, string]> = [
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
];

export async function getInfo(game: string, preferredPlatforms: string[]): Promise<MetacriticResult | undefined> {
    const searchUrl = `https://www.metacritic.com/search/game/${game}/results`;

    const searchPageText = await fetch(searchUrl).then(res => res.text());
    const searchPage = cheerio.load(searchPageText);

    // choose one of the products found on the search page:

    let products = searchPage(".main_stats");

    const platformData = new Map<string,cheerio.Cheerio>();

    while (products.length > 0) {
        const product = products.first();
        const platform = product.parent().find(".platform").text();

        // don't overwrite a higher up result
        if (!platformData.has(platform)) {
            platformData.set(platform, product);
        }

        products = products.next();
    }

    const targetPlatform = getMostPreferred(platformData.keys(), preferredPlatforms);
    const targetProduct = platformData.get(targetPlatform)!;

    // get info about the target product

    const anchor = targetProduct.parent().find("a");
    const name = anchor.text().trim();
    const scoreUrl = "https://www.metacritic.com/" + anchor.attr("href");

    if (!scoreUrl) bug();

    // get score

    const scorePageText = await fetch(scoreUrl).then(res => res.text());
    const scorePage = cheerio.load(scorePageText);

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
        name,
        url: scoreUrl,
        metascore,
        userscore,
    };
}

function getMostPreferred(candidates: Iterator<string>, preferred: string[]): string {
    // if none match return the first one
    return candidates.next().value ?? "";
}
