import { HowLongToBeatService } from 'howlongtobeat';
import { closestSearchResult } from "./search";

const hltbService = new HowLongToBeatService();

export interface HowLongToBeatResult {
    name: string;
    times: {
        mainStory?: number;
        mainPlusExtra?: number;
        completionist?: number;
    };
    url: string;
}

export async function getData(game: string): Promise<HowLongToBeatResult | undefined> {
    const results = await hltbService.search(game);

    const bestResult = closestSearchResult(
        game,
        results,
        searchResult => searchResult.name
    )

    if (bestResult == undefined) {
        return undefined
    }

    return {
        name: bestResult?.name,
        times: {
            mainStory: nonZero(bestResult?.gameplayMain),
            mainPlusExtra: nonZero(bestResult?.gameplayMainExtra),
            completionist: nonZero(bestResult?.gameplayCompletionist),
        },
        url: `https://howlongtobeat.com/game/${bestResult.id}`
    }
}

function nonZero(num: number | undefined): number | undefined {
    if (num === 0) return undefined
    return num
}
