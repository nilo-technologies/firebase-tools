"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs = require("fs");
const tmp = require("tmp");
const chai_1 = require("chai");
const error_1 = require("./error");
const archiveDirectory_1 = require("./archiveDirectory");
const config_imports_1 = require("./test/fixtures/config-imports");
describe("archiveDirectory", () => {
    it("should archive happy little directories", async () => {
        const result = await (0, archiveDirectory_1.archiveDirectory)(config_imports_1.FIXTURE_DIR, {});
        (0, chai_1.expect)(result.source).to.equal(config_imports_1.FIXTURE_DIR);
        (0, chai_1.expect)(result.size).to.be.greaterThan(0);
    });
    it("should throw a happy little error if the directory doesn't exist", async () => {
        await (0, chai_1.expect)((0, archiveDirectory_1.archiveDirectory)((0, path_1.resolve)(__dirname, "foo"), {})).to.be.rejectedWith(error_1.FirebaseError);
    });
    it("should ignore symlinks", async () => {
        const dir = tmp.dirSync();
        fs.writeFileSync((0, path_1.resolve)(dir.name, "file.txt"), "hello");
        fs.symlinkSync((0, path_1.resolve)(dir.name, "file.txt"), (0, path_1.resolve)(dir.name, "link.txt"));
        const result = await (0, archiveDirectory_1.archiveDirectory)(dir.name, {});
        (0, chai_1.expect)(result.manifest).to.include("file.txt");
        (0, chai_1.expect)(result.manifest).to.not.include("link.txt");
    });
});
//# sourceMappingURL=archiveDirectory.spec.js.map