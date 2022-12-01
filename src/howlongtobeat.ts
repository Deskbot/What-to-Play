import { closestSearchResult } from "./search";
import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';

let hltbService = new HowLongToBeatService();

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

export async function getData(game: string): Promise<HowLongToBeatResult | undefined> {
    const results = await hltbService.search(game);
    console.error(`Searching for ${game}`)
    console.error(results)

    const bestResult = closestSearchResult(
        game,
        results,
        searchResult => searchResult.name
    )

    
    if (bestResult == undefined) return undefined
    
    const correctType: HowLongToBeatResult = {
        name: bestResult?.name,
        times: {
            mainStory: bestResult?.gameplayMain,
            mainPlusExtra: bestResult?.gameplayMainExtra,
            completionist: bestResult?.gameplayCompletionist,
        },
        url: `https://howlongtobeat.com/game/${bestResult.id}`
    }

    return correctType
}