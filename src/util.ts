import { fail } from "assert";
import * as https from "https";

export function bug(): never {
    fail("bug");
}

export function getPage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const buffer = [] as string[];

        const req = https.request(url, res => {
            res.on("data", data => {
                buffer.push(data);
            });

            res.on("close", () => {
                resolve(buffer.join(""));
            })
        });

        req.on("error", reject);
    });
}

export function nonNaN<T>(num: number, fallback: T): number | T {
    if (Number.isNaN(num)) {
        return fallback;
    } else {
        return num;
    }
}
