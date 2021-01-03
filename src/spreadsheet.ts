/**
 * The code assumes common spreadsheet syntax.
 */

import { escapeDoubleQuotes } from "./util";

export function count(expressions: string[]) {
    return `COUNT(${expressions.join(", ")})`;
}

/**
 * @param col 1-indexed
 */
export function getCellInCol(col: number): string {
    return `INDIRECT(ADDRESS(ROW(), ${col}))`;
}

export function insteadOfEmpty(expr: string, instead: string): string {
    return `IF((${expr})="", ${instead}, ${expr})`;
}

export function toHyperlink(url: string, text: string | number): string {
    // escape inputs to fit formula syntax
    url = escapeDoubleQuotes(url, '""');

    if (typeof text === "string") {
        text = '"' + escapeDoubleQuotes(text, '""') + '"';
    }

    return `=HYPERLINK("${url}", ${text})`;
}
