"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockFileSystem_1 = require("../mockFileSystem");
const chai_1 = require("chai");
const node_1 = require("./node");
const error_1 = require("../../../../error");
describe("NodejsRuntime", () => {
    let nodeJSRuntime;
    let allFrameworks;
    before(() => {
        nodeJSRuntime = new node_1.NodejsRuntime();
        allFrameworks = [
            {
                id: "express",
                runtime: "nodejs",
                requiredDependencies: [{ name: "express" }],
            },
            {
                id: "next",
                runtime: "nodejs",
                requiredDependencies: [{ name: "next" }],
                requiredFiles: [["next.config.js"], "next.config.ts"],
                embedsFrameworks: ["react"],
                commands: {
                    dev: {
                        cmd: "next dev",
                        env: { NODE_ENV: "dev" },
                    },
                },
            },
        ];
    });
    describe("getNodeImage", () => {
        it("should return a valid node Image", () => {
            const version = {
                node: "18",
            };
            const actualImage = nodeJSRuntime.getNodeImage(version);
            const expectedImage = "us-docker.pkg.dev/firestack-build/test/run";
            (0, chai_1.expect)(actualImage).to.deep.equal(expectedImage);
        });
    });
    describe("getPackageManager", () => {
        it("should return yarn package manager", async () => {
            const fileSystem = new mockFileSystem_1.MockFileSystem({
                "yarn.lock": "It is test file",
            });
            const actual = await nodeJSRuntime.getPackageManager(fileSystem);
            const expected = "yarn";
            (0, chai_1.expect)(actual).to.equal(expected);
        });
    });
    describe("getDependencies", () => {
        it("should return direct and transitive dependencies", () => {
            const packageJSON = {
                dependencies: {
                    express: "^4.18.2",
                },
                devDependencies: {
                    nodemon: "^2.0.12",
                    mocha: "^9.1.1",
                },
            };
            const actual = nodeJSRuntime.getDependencies(packageJSON);
            const expected = {
                express: "^4.18.2",
                nodemon: "^2.0.12",
                mocha: "^9.1.1",
            };
            (0, chai_1.expect)(actual).to.deep.equal(expected);
        });
    });
    describe("detectedCommands", () => {
        it("should prepend npx to framework commands", async () => {
            const fs = new mockFileSystem_1.MockFileSystem({
                "package.json": "Test file",
            });
            const matchedFramework = {
                id: "next",
                runtime: "nodejs",
                requiredDependencies: [],
                commands: {
                    dev: {
                        cmd: "next dev",
                        env: { NODE_ENV: "dev" },
                    },
                },
            };
            const scripts = {
                build: "next build",
                start: "next start",
            };
            const actual = await nodeJSRuntime.detectedCommands("yarn", scripts, matchedFramework, fs);
            const expected = {
                build: {
                    cmd: "yarn run build",
                },
                dev: {
                    cmd: "npx next dev",
                    env: { NODE_ENV: "dev" },
                },
                run: {
                    cmd: "yarn run start",
                    env: { NODE_ENV: "production" },
                },
            };
            (0, chai_1.expect)(actual).to.deep.equal(expected);
        });
        it("should prefer scripts over framework commands", async () => {
            const fs = new mockFileSystem_1.MockFileSystem({
                "package.json": "Test file",
            });
            const matchedFramework = {
                id: "next",
                runtime: "nodejs",
                requiredDependencies: [],
                commands: {
                    build: {
                        cmd: "next build testing",
                    },
                    run: {
                        cmd: "next start testing",
                        env: { NODE_ENV: "production" },
                    },
                    dev: {
                        cmd: "next dev",
                        env: { NODE_ENV: "dev" },
                    },
                },
            };
            const scripts = {
                build: "next build",
                start: "next start",
            };
            const actual = await nodeJSRuntime.detectedCommands("yarn", scripts, matchedFramework, fs);
            const expected = {
                build: {
                    cmd: "yarn run build",
                },
                dev: {
                    cmd: "npx next dev",
                    env: { NODE_ENV: "dev" },
                },
                run: {
                    cmd: "yarn run start",
                    env: { NODE_ENV: "production" },
                },
            };
            (0, chai_1.expect)(actual).to.deep.equal(expected);
        });
    });
    describe("analyseCodebase", () => {
        it("should return runtime specs", async () => {
            const fileSystem = new mockFileSystem_1.MockFileSystem({
                "next.config.js": "For testing",
                "next.config.ts": "For testing",
                "package.json": JSON.stringify({
                    scripts: {
                        build: "next build",
                        start: "next start",
                    },
                    dependencies: {
                        next: "13.4.5",
                        react: "18.2.0",
                    },
                    engines: {
                        node: "18",
                    },
                }),
            });
            const actual = await nodeJSRuntime.analyseCodebase(fileSystem, allFrameworks);
            const expected = {
                id: "nodejs",
                baseImage: "us-docker.pkg.dev/firestack-build/test/run",
                packageManagerInstallCommand: undefined,
                installCommand: "npm install",
                detectedCommands: {
                    build: {
                        cmd: "npm run build",
                    },
                    dev: {
                        cmd: "npx next dev",
                        env: { NODE_ENV: "dev" },
                    },
                    run: {
                        cmd: "npm run start",
                        env: { NODE_ENV: "production" },
                    },
                },
            };
            (0, chai_1.expect)(actual).to.deep.equal(expected);
        });
        it("should return error", async () => {
            const fileSystem = new mockFileSystem_1.MockFileSystem({
                "next.config.js": "For testing purpose.",
                "next.config.ts": "For testing purpose.",
                "package.json": JSON.stringify({
                    scripts: {
                        build: "next build",
                        start: "next start",
                    },
                    dependencies: {
                        express: "2.0.8",
                        next: "13.4.5",
                        react: "18.2.0",
                    },
                    engines: {
                        node: "18",
                    },
                }),
            });
            await (0, chai_1.expect)(nodeJSRuntime.analyseCodebase(fileSystem, allFrameworks)).to.be.rejectedWith(error_1.FirebaseError, "Failed to parse engine");
        });
    });
});
//# sourceMappingURL=node.spec.js.map