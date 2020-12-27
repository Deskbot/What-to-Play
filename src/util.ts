import { fail } from "assert";
import fetch from "node-fetch";

export function bug(): never {
    fail("bug");
}

export function getPage(url: string): Promise<string> {
    return fetch(url).then(res => res.text());
}

export function nonNaN<T>(num: number, fallback: T): number | T {
    if (Number.isNaN(num)) {
        return fallback;
    } else {
        return num;
    }
}
