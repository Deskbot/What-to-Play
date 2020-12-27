
import * as fs from "fs";
import * as process from "process";
import * as readline from "readline";
import * as steam from "./steam";

try {
    main();
} catch (err) {
    console.error(err);
    process.exit(1);
}

function main() {
    const file: string | undefined = process.argv[2];

    if (file) {
        fs.readFileSync(file)
            .toString()
            .split("\n")
            .forEach(printGame);
    } else {
        readline.createInterface(process.stdin)
            .on("line", printGame);
    }
}

export async function printGame(game: string) {
    const result = await steam.getInfo(game);
    console.log(result);
}
