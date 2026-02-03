"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockFileSystem_1 = require("./mockFileSystem");
const chai_1 = require("chai");
const frameworkMatcher_1 = require("./frameworkMatcher");
const frameworkSpec_1 = require("./frameworkSpec");
describe("frameworkMatcher", () => {
    let fileSystem;
    const NODE_ID = "nodejs";
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
            "package-lock.json": "Unused: contents of package-lock file",
        });
    });
    describe("frameworkMatcher", () => {
        it("should return express FrameworkSpec after analysing express application", async () => {
            const expressDependency = {
                express: "^4.18.2",
            };
            const matchedFramework = await (0, frameworkMatcher_1.frameworkMatcher)(NODE_ID, fileSystem, frameworkSpec_1.frameworkSpecs, expressDependency);
            const expressFrameworkSpec = {
                id: "express",
                runtime: "nodejs",
                webFrameworkId: "Express.js",
                requiredDependencies: [
                    {
                        name: "express",
                    },
                ],
            };
            (0, chai_1.expect)(matchedFramework).to.deep.equal(expressFrameworkSpec);
        });
    });
    describe("removeEmbededFrameworks", () => {
        it("should return frameworks after removing embeded frameworks", () => {
            const allFrameworks = [
                {
                    id: "express",
                    runtime: "nodejs",
                    requiredDependencies: [],
                },
                {
                    id: "next",
                    runtime: "nodejs",
                    requiredDependencies: [],
                    embedsFrameworks: ["react"],
                },
                {
                    id: "react",
                    runtime: "nodejs",
                    requiredDependencies: [],
                },
            ];
            const actual = (0, frameworkMatcher_1.removeEmbededFrameworks)(allFrameworks);
            const expected = [
                {
                    id: "express",
                    runtime: "nodejs",
                    requiredDependencies: [],
                },
                {
                    id: "next",
                    runtime: "nodejs",
                    requiredDependencies: [],
                    embedsFrameworks: ["react"],
                },
            ];
            (0, chai_1.expect)(actual).to.have.deep.members(expected);
            (0, chai_1.expect)(actual).to.have.length(2);
        });
    });
    describe("filterFrameworksWithFiles", () => {
        it("should return frameworks having all the required files", async () => {
            const allFrameworks = [
                {
                    id: "express",
                    runtime: "nodejs",
                    requiredDependencies: [],
                    requiredFiles: [["package.json", "package-lock.json"]],
                },
                {
                    id: "next",
                    runtime: "nodejs",
                    requiredDependencies: [],
                    requiredFiles: [["next.config.js"], "next.config.ts"],
                },
            ];
            const actual = await (0, frameworkMatcher_1.filterFrameworksWithFiles)(allFrameworks, fileSystem);
            const expected = [
                {
                    id: "express",
                    runtime: "nodejs",
                    requiredDependencies: [],
                    requiredFiles: [["package.json", "package-lock.json"]],
                },
            ];
            (0, chai_1.expect)(actual).to.have.deep.members(expected);
            (0, chai_1.expect)(actual).to.have.length(1);
        });
    });
    describe("filterFrameworksWithDependencies", () => {
        it("should return frameworks having required dependencies with in the project dependencies", () => {
            const allFrameworks = [
                {
                    id: "express",
                    runtime: "nodejs",
                    requiredDependencies: [
                        {
                            name: "express",
                        },
                    ],
                },
                {
                    id: "next",
                    runtime: "nodejs",
                    requiredDependencies: [
                        {
                            name: "next",
                        },
                    ],
                },
            ];
            const projectDependencies = {
                express: "^4.18.2",
            };
            const actual = (0, frameworkMatcher_1.filterFrameworksWithDependencies)(allFrameworks, projectDependencies);
            const expected = [
                {
                    id: "express",
                    runtime: "nodejs",
                    requiredDependencies: [
                        {
                            name: "express",
                        },
                    ],
                },
            ];
            (0, chai_1.expect)(actual).to.have.deep.members(expected);
            (0, chai_1.expect)(actual).to.have.length(1);
        });
    });
});
//# sourceMappingURL=frameworkMatcher.spec.js.map