
import * as fs from "fs";
import * as metacritic from "./metacritic";
import * as minimist from "minimist";
import * as process from "process";
import * as readline from "readline";
import { MetacriticPlatform } from "./metacritic";
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

    if (args["h"] || args["help"]) {
        return printHelp();
    }

    // default to CSV
    const csv = !args["json"];

    if (csv) {
        console.log(csvHeaders.join(","));
    }

    const givenPlatforms: string | undefined = args["-p"] || args["--platform"];
    const platforms = givenPlatforms
        ? parsePlatforms(givenPlatforms)
        : [...metacritic.platforms.values()];

    const resultToString = csv
        ? getCsv
        : getJson;

    const print: Printer = (game) => {
        game = game.trim();

        if (game.length > 0) {
            resultToString(game, platforms)
                .then(console.log);
        }
    }

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

function parsePlatforms(str: string): MetacriticPlatform[] {
    const result = [] as MetacriticPlatform[];

    for (let input of str.split(",")) {
        input = input.trim();

        if (input.length === 0) continue;

        const maybePlatform = metacritic.toPlatform(input);
        if (maybePlatform) {
            result.push(maybePlatform);
        }
    }

    return result;
}

function printHelp() {
    console.log("Usage: command (file name)? (argument)*");
    console.log("");
    console.log("Format of file/stdin: new-line-separated list of game names");
    console.log("");
    console.log("Arguments:")
    console.log("-h | --help      : Print help.");
    console.log("-p | --platforms : A comma separated list of platforms. When the score differs by platform, the best score is chosen (defaults to all platforms).");
    console.log("--json           : Output in JSON format (defaults to CSV).");
}
