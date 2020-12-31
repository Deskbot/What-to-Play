import { deepStrictEqual, ok, strictEqual } from "assert";
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

    @Test()
    async Sequence() {
        const seq = new util.Sequence();
        const order = [] as number[];

        // add a number to "order" when starting the promise
        // and add another number when resolving the promise
        // later assert that the numbers ended up in order in the right order

        const asyncCommand = (num: number) => {
            order.push(num);
            return new Promise<void>((resolve) => {
                setImmediate(() => {
                    order.push(-num);
                    resolve();
                });
            });
        };

        seq.andThen(() => asyncCommand(1));
        seq.andThen(() => asyncCommand(2));
        seq.andThen(() => asyncCommand(3));
        seq.andThen(() => asyncCommand(4));

        const done = new Promise<void>((resolve) => {
            seq.andThen(async () => {
                resolve();
            });
        });

        await done;

        deepStrictEqual(order, [1, -1, 2, -2, 3, -3, 4, -4]);
    }
}
