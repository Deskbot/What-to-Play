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

/**
 * @param num Number of calls to the given function that can be spawned
 *            (i.e. waiting to resolve) at once.
 * @param func The function to limit
 */
export function limitConcurrent<A extends any[], R>(
    num: number,
    func: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
    let concurrent = 0;
    const waiting = [] as Array<() => Promise<void>>;

    const call = (...args: A) => {
        concurrent += 1;
        const prom = func(...args);
        prom.finally(() => {
            concurrent -= 1;
            next();
        });
        return prom;
    };

    const next = () => {
        if (concurrent < num) {
            const nextFunc = waiting.shift();
            if (nextFunc === undefined) return;
            nextFunc();
        }
    };

    const limitedFunc = (...args: A) => {

        // call the function immediately
        if (concurrent < num) {
            return call(...args);
        }

        // delay calling the function

        // return a promise that resolves when the actual promise resolves
        // but put the function to spawn the actual promise in a queue
        // instead of spawning it
        return new Promise<R>((resolve, reject) => {
            const funcForLater = async () => {
                try {
                    resolve(await call(...args));
                } catch (err) {
                    reject(err);
                }
            };

            waiting.push(funcForLater);
        });
    };

    return limitedFunc;
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
