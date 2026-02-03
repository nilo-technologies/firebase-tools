"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const versionHelper_1 = require("./versionHelper");
describe("versionHelper", () => {
    describe("parseVersionPredicate", () => {
        it("should parse a version predicate with a comparator", () => {
            const predicate = ">=1.2.3";
            const result = (0, versionHelper_1.parseVersionPredicate)(predicate);
            (0, chai_1.expect)(result.comparator).to.equal(">=");
            (0, chai_1.expect)(result.targetSemVer).to.equal("1.2.3");
        });
        it("should parse a version predicate without a comparator", () => {
            const predicate = "1.2.3";
            const result = (0, versionHelper_1.parseVersionPredicate)(predicate);
            (0, chai_1.expect)(result.comparator).to.equal("=");
            (0, chai_1.expect)(result.targetSemVer).to.equal("1.2.3");
        });
        it("should not throw an error for an invalid predicate", () => {
            const predicate = "not-a-version";
            const result = (0, versionHelper_1.parseVersionPredicate)(predicate);
            (0, chai_1.expect)(result.comparator).to.equal("=");
            (0, chai_1.expect)(result.targetSemVer).to.equal("not-a-version");
        });
    });
});
//# sourceMappingURL=versionHelper.spec.js.map