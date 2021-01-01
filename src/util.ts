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

export function nonNaN<T>(num: number, fallback: T): number | T {
    if (Number.isNaN(num)) {
        return fallback;
    } else {
        return num;
    }
}

export function printable(val: string | number | undefined): string {
    if (val === undefined) return "";
    return val.toString();
}

export type RecursivePartial<T> = {
    [K in keyof T]?: T[K] extends (infer U)[]
        ? RecursivePartial<U>[]
        : RecursivePartial<T[K]>
};

/**
 * Takes asynchronous functions and spawns them
 * only when the last function to be given has been spawned and resolved.
 * If a promise rejects, no further functions are called.
 */
export class Sequence {
    private currentCommand: Promise<void> | undefined;
    private commands = [] as Array<() => Promise<void>>;

    andThen(asyncCommand: () => Promise<void>) {
        if (this.currentCommand === undefined) {
            this.schedule(asyncCommand);
        } else {
            this.commands.push(asyncCommand);
        }
    }

    private schedule(asyncCommand: () => Promise<void>) {
        this.currentCommand = asyncCommand();

        // when the current command is done, start the next one
        this.currentCommand.then(() => {
            const nextCommand = this.commands.shift();

            if (nextCommand === undefined) {
                this.currentCommand = undefined;
            } else {
                this.schedule(nextCommand);
            }
        });
    }
}
