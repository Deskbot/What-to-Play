import { closestSearchResult } from "./search";
import { HowLongToBeatService } from 'howlongtobeat';

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
            mainStory: bestResult?.gameplayMain,
            mainPlusExtra: bestResult?.gameplayMainExtra,
            completionist: bestResult?.gameplayCompletionist,
        },
        url: `https://howlongtobeat.com/game/${bestResult.id}`
    }
}