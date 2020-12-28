import { fail } from "assert";

export function average(arr: number[]): number {
    let total = 0;
    const len = arr.length;

    for (let i = 0; i < len; i++) {
        total += arr[i];
    }

    return total / len;
}

export async function awaitPair<A,B>([a, promiseB]: [A, Promise<B>]): Promise<[A, B]> {
    return [a, await promiseB];
}

export function bug(): never {
    fail("bug");
}

export function csvFriendly(s: string): string {
    // if no special characters, it's fine as is
    if (!s.includes(",") && !s.includes("\n") && !s.includes("\"")) {
        return s;
    }

    // special characters are only allowed inside double quotes

    s = s.replace("\"", "\"\""); // replace every double quote with two double quotes

    return `"${s}"`;
}

export function printable(val: string | number | undefined): string {
    if (val === undefined) return "";
    return val.toString();
}

export function nonNaN<T>(num: number, fallback: T): number | T {
    if (Number.isNaN(num)) {
        return fallback;
    } else {
        return num;
    }
}
