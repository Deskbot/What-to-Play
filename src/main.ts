
import * as fs from "fs";
import * as minimist from "minimist";
import * as process from "process";
import * as readline from "readline";
import { csvHeaderRow, getCsv, getJson } from "./output";
import { limitConcurrent } from "./util";
import { getPlatforms, parsePlatforms } from "./platform";
import { stdout } from "process";

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

    if (args["readme"]) {
        return printReadme();
    }

    // default to CSV
    const csv = !args["json"];

    if (csv) {
        console.log(csvHeaderRow);
    }

    const givenPlatforms: string | undefined = args["p"] || args["platform"];
    const platforms = givenPlatforms
        ? parsePlatforms(givenPlatforms)
        : [...getPlatforms()];

    const resultToString = limitConcurrent(
        5,
        csv
            ? getCsv
            : getJson
    );

    const file = args._[0] as string | undefined; // first arg

    const input = readline.createInterface(
        file
            ? fs.createReadStream(file)
            : process.stdin
    );

    if (csv) {
        input.on("line", game => {
            game = game.trim();

            if (game.length === 0) return undefined;

            resultToString(game, platforms).then(console.log);
        });
    }

    // json
    else {
        stdout.write("[");

        const lines = [] as Promise<void>[];
        let firstLine = true;

        input.on("line", game => {
            game = game.trim();
            if (game.length === 0) return;

            const writeResult = async () => {
                const obj = await resultToString(game, platforms);

                // should be a comma before each object except the first
                if (!firstLine) {
                    stdout.write(",");
                    firstLine = false;
                }

                stdout.write(obj);
            };

            lines.push(writeResult());
        });

        input.on("close", async () => {
            // ensure that the closing brace comes last
            await Promise.all(lines);
            stdout.write("]");
        });
    }
}

function printHelp() {
    console.log("Usage: command (file name)? (argument)*");
    console.log("");
    console.log("Format of file/stdin: new-line-separated list of game names");
    console.log("");
    console.log("Arguments:")
    console.log("-h | --help      : Print help.");
    console.log("--readme         : Print the readme.");
    console.log("-p | --platforms : A comma separated list of platforms. When the score differs by platform, the best score is chosen (defaults to all platforms).");
    console.log("--json           : Output in JSON format (defaults to CSV).");
}

function printReadme() {
    fs.createReadStream(__dirname + "/../README.md")
        .pipe(process.stdout);
}
