import * as levenshtein from "fastest-levenshtein";
import { LCS } from "js-lcs";

export function closestSearchResult<T>(game: string, products: T[], getName: (product: T) => string): T | undefined {
    if (products.length === 0) return undefined;

    const gameLower = game.toLowerCase();

    let bestMatch: T | undefined;

    let matchLcs = -Infinity; // bigger is better
    let matchLevenshtein = Infinity; // smaller is better

    for (const product of products) {
        const name = getName(product).toLowerCase();

        const productLcs = LCS.size(gameLower, name);

        // maybe replace best match with a product that has a smaller LCS
        if (productLcs > matchLcs) {
            matchLcs = productLcs;
            matchLevenshtein = levenshtein.distance(gameLower, name); // store in case needed
            bestMatch = product;
        }

        // if they match, fallback on levenshtein comparison
        else if (productLcs === matchLcs) {
            const productLeven = levenshtein.distance(gameLower, name);
            if (productLeven < matchLevenshtein) {
                matchLevenshtein = productLeven;
                bestMatch = product;
            }
        }
    }

    return bestMatch;
}
