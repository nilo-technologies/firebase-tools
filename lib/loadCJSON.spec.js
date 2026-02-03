"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const loadCJSON_1 = require("./loadCJSON");
const error_1 = require("./error");
describe("loadCJSON", () => {
    const fixturesDir = path.join(__dirname, "test", "fixtures", "loadCJSON");
    it("should return parsed JSON on success", () => {
        const filePath = path.join(fixturesDir, "valid.cjson");
        const result = (0, loadCJSON_1.loadCJSON)(filePath);
        (0, chai_1.expect)(result).to.deep.equal({ key: "value" });
    });
    it("should throw FirebaseError on ENOENT", () => {
        const filePath = path.join(fixturesDir, "nonexistent.cjson");
        (0, chai_1.expect)(() => (0, loadCJSON_1.loadCJSON)(filePath)).to.throw(error_1.FirebaseError, "File " + filePath + " does not exist");
    });
    it("should throw FirebaseError on parse error", () => {
        const filePath = path.join(fixturesDir, "invalid.cjson");
        (0, chai_1.expect)(() => (0, loadCJSON_1.loadCJSON)(filePath)).to.throw(error_1.FirebaseError, new RegExp(`Parse Error in ${filePath}`));
    });
});
//# sourceMappingURL=loadCJSON.spec.js.map