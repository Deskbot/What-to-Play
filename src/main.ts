
import * as fs from "fs";
import * as minimist from "minimist";
import * as process from "process";
import * as readline from "readline";
import * as steam from "./steam";
import { csvFriendly, printable } from "./util";

interface Printer {
    (game: string): void;
}

try {
    main();
} catch (err) {
    console.error(err);
    process.exit(1);
}

function main() {
    const args = minimist(process.argv.slice(2));

    // default to CSV
    const csv = !args["json"];

    if (!csv) {
        console.log("TODO csv headers");
    }

    const resultToString = csv
        ? getCsv
        : getJson;
    const print: Printer = game => resultToString(game).then(console.log);

    const file = args._[0] as string | undefined; // first arg

    if (file) {
        fs.readFileSync(file)
            .toString()
            .split("\n")
            .forEach(print);
    } else {
        readline.createInterface(process.stdin)
            .on("line", print);
    }
}

export function getData(game: string): Promise<steam.SteamResult | undefined> {
    return steam.getInfo(game);
}

export async function getJson(game: string): Promise<string> {
    return JSON.stringify(await getData(game));
}

// WIP
export async function getCsv(game: string): Promise<string> {
    const buffer = [] as string[];

    const data = await getData(game)

    if (data === undefined) return "";

    // iterate through in the same order every time guaranteed
    const keys = Object.keys(data) as (keyof steam.SteamResult)[];

    for (const key of keys) {
        buffer.push(csvFriendly(printable(data[key])));
        buffer.push(",");
    }

    buffer.push("\n");

    return buffer.join("");
}
