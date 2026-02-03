"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const events_1 = require("events");
const stream_1 = require("stream");
const fsExtra = require("fs-extra");
const crossSpawn = require("cross-spawn");
const frameworksUtils = require("../utils");
const nuxt2_1 = require("../nuxt2");
const _1 = require(".");
describe("Nuxt 2 utils", () => {
    describe("nuxtAppDiscovery", () => {
        const discoverNuxtDir = ".";
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should find a Nuxt 2 app", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            sandbox.stub(frameworksUtils, "findDependency").returns({
                version: "2.15.8",
                resolved: "https://registry.npmjs.org/nuxt/-/nuxt-2.15.8.tgz",
                overridden: false,
            });
            sandbox
                .stub(frameworksUtils, "relativeRequire")
                .withArgs(discoverNuxtDir, "nuxt/dist/nuxt.js")
                .resolves({
                loadNuxt: () => Promise.resolve({
                    ready: () => Promise.resolve(),
                    options: { dir: { static: "static" } },
                }),
            });
            (0, chai_1.expect)(await (0, nuxt2_1.discover)(discoverNuxtDir)).to.deep.equal({
                mayWantBackend: true,
                version: "2.15.8",
            });
        });
        it("should find a Nuxt 3 app", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            sandbox.stub(frameworksUtils, "findDependency").returns({
                version: "3.0.0",
                resolved: "https://registry.npmjs.org/nuxt/-/nuxt-3.0.0.tgz",
                overridden: false,
            });
            sandbox
                .stub(frameworksUtils, "relativeRequire")
                .withArgs(discoverNuxtDir, "@nuxt/kit")
                .resolves({
                loadNuxtConfig: async function () {
                    return Promise.resolve({
                        ssr: true,
                        app: {
                            baseURL: "/",
                        },
                        dir: {
                            public: "public",
                        },
                    });
                },
            });
            (0, chai_1.expect)(await (0, _1.discover)(discoverNuxtDir)).to.deep.equal({
                mayWantBackend: true,
                version: "3.0.0",
            });
        });
    });
    describe("getDevModeHandle", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should resolve with initial Nuxt 3 dev server output", async () => {
            const process = new events_1.EventEmitter();
            process.stdin = new stream_1.Writable();
            process.stdout = new events_1.EventEmitter();
            process.stderr = new events_1.EventEmitter();
            const cli = Math.random().toString(36).split(".")[1];
            sandbox.stub(frameworksUtils, "getNodeModuleBin").withArgs("nuxt", ".").returns(cli);
            sandbox.stub(crossSpawn, "spawn").withArgs(cli, ["dev"], { cwd: "." }).returns(process);
            const devModeHandle = (0, _1.getDevModeHandle)(".");
            process.stdout.emit("data", `Nuxi 3.0.0

       WARN  Changing NODE_ENV from production to development, to avoid unintended behavior.

      Nuxt 3.0.0 with Nitro 1.0.0

        > Local:    http://localhost:3000/
        > Network:  http://0.0.0.0:3000/
        > Network:  http://[some:ipv6::::::]:3000/
        > Network:  http://[some:other:ipv6:::::]:3000/`);
            await (0, chai_1.expect)(devModeHandle).eventually.be.fulfilled;
        });
    });
});
//# sourceMappingURL=index.spec.js.map