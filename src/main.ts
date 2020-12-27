
import * as fs from "fs";
import * as minimist from "minimist";
import * as process from "process";
import * as readline from "readline";
import { csvHeaders, getCsv, getJson } from "./output";

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

    if (csv) {
        console.log(csvHeaders.join(","));
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
