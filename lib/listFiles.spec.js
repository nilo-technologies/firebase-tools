"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const listFiles_1 = require("./listFiles");
const ignores_1 = require("./test/fixtures/ignores");
describe("listFiles", () => {
    it("should ignore firebase-debug.log, specified ignores, and nothing else", () => {
        const fileNames = (0, listFiles_1.listFiles)(ignores_1.FIXTURE_DIR, [
            "index.ts",
            "**/.*",
            "firebase.json",
            "ignored.txt",
            "ignored/**/*.txt",
        ]);
        (0, chai_1.expect)(fileNames).to.have.members(["index.html", "ignored/index.html", "present/index.html"]);
    });
    it("should allow us to not specify additional ignores", () => {
        const fileNames = (0, listFiles_1.listFiles)(ignores_1.FIXTURE_DIR);
        (0, chai_1.expect)(fileNames.sort()).to.have.members([
            ".hiddenfile",
            "index.ts",
            "firebase.json",
            "ignored.txt",
            "ignored/deeper/index.txt",
            "ignored/ignore.txt",
            "ignored/index.html",
            "index.html",
            "present/index.html",
        ]);
    });
});
//# sourceMappingURL=listFiles.spec.js.map