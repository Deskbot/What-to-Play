import { fail } from "assert";

export function average(arr: number[]): number {
    let total = 0;
    const len = arr.length;

    for (let i = 0; i < len; i++) {
        total += arr[i];
    }

    return total / len;
}

export function bindUndefined<T, U>(val: T | undefined, func: (val: T) => U): U | undefined {
    if (val === undefined) return undefined;
    return func(val);
}

export function bug(): never {
    fail("bug");
}

export function csvFriendly(s: string): string {
    // if no special characters, it's fine as is
    if (!s.includes(",") && !s.includes("\n") && !s.includes('"')) {
        return s;
    }

    // special characters are only allowed inside double quotes

    s = escapeDoubleQuotes(s, '""');

    return `"${s}"`;
}

const allDoubleQuotes = /"/g;
export function escapeDoubleQuotes(s: string, replacement: string): string {
    return s.replace(allDoubleQuotes, replacement);
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
