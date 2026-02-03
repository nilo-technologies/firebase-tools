"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hooks_1 = require("./hooks");
describe("genHookScript", () => {
    const BUNDLE = {
        version: "v1alpha",
    };
    it("generates executable script from anonymous functions", () => {
        const hookFn = (b) => {
            return b;
        };
        const expectedSnippet = `const bundle = ((b) => {
            return b;
        })({"version":"v1alpha"});`;
        (0, chai_1.expect)((0, hooks_1.genHookScript)(BUNDLE, hookFn)).to.include(expectedSnippet);
    });
    it("generates executable script from a named function", () => {
        function hookFn(b) {
            return b;
        }
        const expectedSnippet = `const bundle = (function hookFn(b) {
            return b;
        })({"version":"v1alpha"});`;
        (0, chai_1.expect)((0, hooks_1.genHookScript)(BUNDLE, hookFn)).to.include(expectedSnippet);
    });
    it("generates executable script from an object method", () => {
        const a = {
            hookFn(b) {
                return b;
            },
        };
        const expectedSnippet = `const bundle = (function hookFn(b) {
                return b;
            })({"version":"v1alpha"});`;
        (0, chai_1.expect)((0, hooks_1.genHookScript)(BUNDLE, a.hookFn)).to.include(expectedSnippet);
    });
});
//# sourceMappingURL=hooks.spec.js.map