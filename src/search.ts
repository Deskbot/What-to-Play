import * as levenshtein from "fastest-levenshtein";
import { LCS } from "js-lcs";

export function closestSearchResult<T>(game: string, products: T[], getName: (product: T) => string): T | undefined {
    if (products.length === 0) return undefined;

    const gameSanitised = sanitise(game);

    let bestMatch: T | undefined;

    // anything below 3 is insignificant
    // a product with lcs = 3 can still be outputted because it equals this
    let matchLcs = 3; // bigger is better
    let matchLevenshtein = Infinity; // smaller is better

    for (const product of products) {
        const name = sanitise(getName(product));

        const productLcs = LCS.size(gameSanitised, name);

        // maybe replace best match with a product that has a smaller LCS
        if (productLcs > matchLcs) {
            matchLcs = productLcs;
            matchLevenshtein = levenshtein.distance(gameSanitised, name); // store in case needed
            bestMatch = product;
        }

        // if they match, fallback on levenshtein comparison
        else if (productLcs === matchLcs) {
            const productLeven = levenshtein.distance(gameSanitised, name);
            if (productLeven < matchLevenshtein) {
                matchLevenshtein = productLeven;
                bestMatch = product;
            }
        }
    }

    return bestMatch;
}

const nonAlphanumeric = /[^a-z0-9\(\)]/g;
function sanitise(str: string): string {
    return str.toLowerCase().replace(nonAlphanumeric, "");
}
