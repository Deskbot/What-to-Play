/**
 * The code assumes common spreadsheet syntax.
 */

import { escapeDoubleQuotes } from "./util";

export function toHyperlink(url: string, text: string | number): string {
    // escape inputs to fit formula syntax
    url = escapeDoubleQuotes(url, '""');

    if (typeof text === "string") {
        text = escapeDoubleQuotes(text, '""');
    }

    return `=HYPERLINK("${url}", "${text}")`;
}
