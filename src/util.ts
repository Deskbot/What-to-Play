import { fail } from "assert";
import fetch from "node-fetch";

export function bug(): never {
    fail("bug");
}

export function csvFriendly(s: string): string {
    // if no special characters, it's fine as is
    if (!s.includes(",") && !s.includes("\n") && !s.includes("\"")) {
        return s;
    }

    // special characters are allowed inside double quotes

    s = s.replace("\"", "\"\""); // replace every double quote with two double quotes

    return `"${s}"`;
}

export function printable(val: string | number | undefined): string {
    if (val === undefined) return "";
    return val.toString();
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
