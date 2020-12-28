import fetch from "node-fetch";
import { bug } from "./util";

export interface GogResult {
    name: string;
    score: number;
    url: string;
}

interface GogData {
    products: {
        rating: number;
        title: string;
        url: string;
    }[];
}

export async function getData(game: string): Promise<GogResult | undefined> {
    const gogDataUrl = `https://www.gog.com/games/ajax/filtered?limit=1&search=${game}`;

    const data = await fetch(gogDataUrl).then(res => res.json()) as Partial<GogData> | null;
    const gameData = data?.products && data.products[0];

    if (!gameData) return undefined;

    const score = gameData.rating as number;
    const url = gameData.url as string;
    const name = gameData.title as string;

    if (typeof score !== "number" || typeof url !== "string" || typeof name !== "string") bug();

    return {
        name,
        score,
        url,
    };
}
