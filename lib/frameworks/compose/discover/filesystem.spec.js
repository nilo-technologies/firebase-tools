"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockFileSystem_1 = require("./mockFileSystem");
const chai_1 = require("chai");
describe("MockFileSystem", () => {
    let fileSystem;
    before(() => {
        fileSystem = new mockFileSystem_1.MockFileSystem({
            "package.json": JSON.stringify({
                name: "expressapp",
                version: "1.0.0",
                scripts: {
                    test: 'echo "Error: no test specified" && exit 1',
                },
                dependencies: {
                    express: "^4.18.2",
                },
            }),
        });
    });
    describe("exists", () => {
        it("should return true if file exists in the directory ", async () => {
            const fileExists = await fileSystem.exists("package.json");
            (0, chai_1.expect)(fileExists).to.be.true;
            (0, chai_1.expect)(fileSystem.getExistsCache("package.json")).to.be.true;
        });
        it("should return false if file does not exist in the directory", async () => {
            const fileExists = await fileSystem.exists("nonexistent.txt");
            (0, chai_1.expect)(fileExists).to.be.false;
        });
    });
    describe("read", () => {
        it("should read and return the contents of the file", async () => {
            const fileContent = await fileSystem.read("package.json");
            const expected = JSON.stringify({
                name: "expressapp",
                version: "1.0.0",
                scripts: {
                    test: 'echo "Error: no test specified" && exit 1',
                },
                dependencies: {
                    express: "^4.18.2",
                },
            });
            (0, chai_1.expect)(fileContent).to.equal(expected);
            (0, chai_1.expect)(fileSystem.getContentCache("package.json")).to.equal(expected);
        });
    });
});
//# sourceMappingURL=filesystem.spec.js.map