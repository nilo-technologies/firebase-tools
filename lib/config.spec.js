"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const os = require("os");
const chai_1 = require("chai");
const config_1 = require("./config");
const valid_config_1 = require("./test/fixtures/valid-config");
const config_imports_1 = require("./test/fixtures/config-imports");
const dup_top_level_1 = require("./test/fixtures/dup-top-level");
const empty_config_1 = require("./test/fixtures/empty-config");
describe("Config", () => {
    describe("#load", () => {
        it("should load a cjson file when configPath is specified", () => {
            const cwd = __dirname;
            const config = config_1.Config.load({
                cwd,
                configPath: path.relative(cwd, valid_config_1.FIREBASE_JSON_PATH),
            });
            (0, chai_1.expect)(config).to.not.be.null;
            (0, chai_1.expect)(config?.get("database.rules")).to.eq("config/security-rules.json");
        });
        it("should fall back to {} when the file is empty", () => {
            const cwd = __dirname;
            const config = config_1.Config.load({
                cwd,
                configPath: path.relative(cwd, empty_config_1.FIREBASE_JSON_PATH),
            });
            (0, chai_1.expect)(config).to.not.be.null;
            (0, chai_1.expect)(config?.data).to.deep.eq({});
        });
    });
    describe("#path", () => {
        it("should skip an absolute path", () => {
            const config = new config_1.Config({}, { cwd: config_imports_1.FIXTURE_DIR });
            const absPath = "/Users/something";
            (0, chai_1.expect)(config.path(absPath)).to.eq(absPath);
        });
        it("should append a non-absolute path", () => {
            const config = new config_1.Config({}, { cwd: config_imports_1.FIXTURE_DIR });
            const relativePath = "something";
            (0, chai_1.expect)(config.path(relativePath)).to.eq(path.join(config_imports_1.FIXTURE_DIR, relativePath));
        });
    });
    describe("#parseFile", () => {
        it("should load a cjson file", () => {
            const config = new config_1.Config({}, { cwd: config_imports_1.FIXTURE_DIR });
            (0, chai_1.expect)(config.parseFile("hosting", "hosting.json").public).to.equal(".");
        });
        it("should error out for an unknown file", () => {
            const config = new config_1.Config({}, { cwd: config_imports_1.FIXTURE_DIR });
            (0, chai_1.expect)(() => {
                config.parseFile("hosting", "i-dont-exist.json");
            }).to.throw("Imported file i-dont-exist.json does not exist");
        });
        it("should error out for an unrecognized extension", () => {
            const config = new config_1.Config({}, { cwd: config_imports_1.FIXTURE_DIR });
            (0, chai_1.expect)(() => {
                config.parseFile("hosting", "unsupported.txt");
            }).to.throw("unsupported.txt is not of a supported config file type");
        });
    });
    describe("#materialize", () => {
        it("should assign unaltered if an object is found", () => {
            const config = new config_1.Config({ example: { foo: "bar" } }, {});
            (0, chai_1.expect)(config.materialize("example").foo).to.equal("bar");
        });
        it("should prevent top-level key duplication", () => {
            const config = new config_1.Config({ rules: "rules.json" }, { cwd: dup_top_level_1.FIXTURE_DIR });
            (0, chai_1.expect)(config.materialize("rules")).to.deep.equal({ ".read": true });
        });
    });
    describe("functions.source", () => {
        let tmpDir;
        beforeEach(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "firebase-test"));
        });
        afterEach(() => {
            if (tmpDir) {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
        it("injects default source when default dir exists but source is missing", () => {
            fs.mkdirSync(path.join(tmpDir, config_1.Config.DEFAULT_FUNCTIONS_SOURCE));
            const cfg = new config_1.Config({ functions: {} }, { cwd: tmpDir, projectDir: tmpDir });
            (0, chai_1.expect)(cfg.get("functions.source")).to.be.equal("functions");
        });
        it("does not injects default source when default dir is missing", () => {
            const cfg = new config_1.Config({ functions: { runtime: "nodejs20" } }, { cwd: tmpDir, projectDir: tmpDir });
            (0, chai_1.expect)(cfg.get("functions.source")).to.be.undefined;
        });
        it("does not inject source for remoteSource", () => {
            fs.mkdirSync(path.join(tmpDir, config_1.Config.DEFAULT_FUNCTIONS_SOURCE));
            const cfg = new config_1.Config({
                functions: {
                    remoteSource: { repository: "https://github.com/org/repo", ref: "main" },
                    runtime: "nodejs20",
                },
            }, { cwd: tmpDir, projectDir: tmpDir });
            (0, chai_1.expect)(cfg.get("functions.source")).to.be.undefined;
        });
        it("injects into the first empty entry only when default dir exists", () => {
            fs.mkdirSync(path.join(tmpDir, config_1.Config.DEFAULT_FUNCTIONS_SOURCE));
            const cfg = new config_1.Config({
                functions: [
                    { source: "custom-functions" },
                    { runtime: "nodejs20" },
                    {
                        remoteSource: { repository: "https://github.com/org/repo", ref: "main" },
                        runtime: "nodejs20",
                    },
                ],
            }, { cwd: tmpDir, projectDir: tmpDir });
            (0, chai_1.expect)(cfg.get("functions.[0].source")).to.equal("custom-functions");
            (0, chai_1.expect)(cfg.get("functions.[1].source")).to.equal("functions");
            (0, chai_1.expect)(cfg.get("functions.[2].source")).to.be.undefined;
        });
        it("injects only one entry when multiple are empty", () => {
            fs.mkdirSync(path.join(tmpDir, config_1.Config.DEFAULT_FUNCTIONS_SOURCE));
            const cfg = new config_1.Config({
                functions: [{}, {}],
            }, { cwd: tmpDir, projectDir: tmpDir });
            (0, chai_1.expect)(cfg.get("functions.[0].source")).to.equal("functions");
            (0, chai_1.expect)(cfg.get("functions.[1].source")).to.be.undefined;
        });
        it("does not inject when no entry is empty", () => {
            fs.mkdirSync(path.join(tmpDir, config_1.Config.DEFAULT_FUNCTIONS_SOURCE));
            const cfg = new config_1.Config({
                functions: [
                    { source: "dir-a" },
                    {
                        remoteSource: { repository: "https://github.com/org/repo", ref: "main" },
                        runtime: "nodejs20",
                    },
                ],
            }, { cwd: tmpDir, projectDir: tmpDir });
            (0, chai_1.expect)(cfg.get("functions.[0].source")).to.equal("dir-a");
            (0, chai_1.expect)(cfg.get("functions.[1].source")).to.be.undefined;
        });
        it("does not inject for arrays when default dir is missing", () => {
            const cfg = new config_1.Config({
                functions: [{}, { source: "something" }],
            }, { cwd: tmpDir, projectDir: tmpDir });
            (0, chai_1.expect)(cfg.get("functions.[0].source")).to.be.undefined;
            (0, chai_1.expect)(cfg.get("functions.[1].source")).to.equal("something");
        });
    });
});
//# sourceMappingURL=config.spec.js.map