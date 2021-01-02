import { ok, strictEqual } from "assert";
import * as util from "./util";
import { Test, TestSuite } from "testyts";

@TestSuite()
export class UtilSuite {
    @Test()
    average() {
        ok(Number.isNaN(util.average([])));
        strictEqual(util.average([1]), 1);
        strictEqual(util.average([1,3]), 2);
    }

    @Test()
    escapeDoubleQuotes() {
        strictEqual(util.escapeDoubleQuotes('',    '""'), '');
        strictEqual(util.escapeDoubleQuotes('str', '""'), 'str');
        strictEqual(util.escapeDoubleQuotes('"',   '""'), '""');
        strictEqual(util.escapeDoubleQuotes('""',  '""'), '""""');
    }
}
