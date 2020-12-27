
import * as fs from "fs";
import * as process from "process";
import * as readline from "readline";

main();

function main() {
    const file: string | undefined = process.argv[2];

    if (file) {
        const games = fs.readFileSync(file)
            .toString()
            .split("\n");
    } else {
        const rl = readline.createInterface(process.stdin);
        rl.on("line", line => {

        });
    }
}
