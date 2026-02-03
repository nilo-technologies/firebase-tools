"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const events_1 = require("events");
const stream_1 = require("stream");
const crossSpawn = require("cross-spawn");
const fsExtra = require("fs-extra");
const fsPromises = require("fs/promises");
const path_1 = require("path");
const flutterUtils = require("./utils");
const _1 = require(".");
describe("Flutter", () => {
    describe("discovery", () => {
        const cwd = ".";
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should discover", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            sandbox
                .stub(fsPromises, "readFile")
                .withArgs((0, path_1.join)(cwd, "pubspec.yaml"))
                .resolves(Buffer.from(`dependencies:
  flutter:
    sdk: flutter`));
            (0, chai_1.expect)(await (0, _1.discover)(cwd)).to.deep.equal({
                mayWantBackend: false,
            });
        });
        it("should not discover, if missing files", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(false);
            (0, chai_1.expect)(await (0, _1.discover)(cwd)).to.be.undefined;
        });
        it("should not discovery, not flutter", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            sandbox
                .stub(fsPromises, "readFile")
                .withArgs((0, path_1.join)(cwd, "pubspec.yaml"))
                .resolves(Buffer.from(`dependencies:
  foo:
    bar: 1`));
            (0, chai_1.expect)(await (0, _1.discover)(cwd)).to.be.undefined;
        });
    });
    describe("ɵcodegenPublicDirectory", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should copy over the web dir", async () => {
            const root = Math.random().toString(36).split(".")[1];
            const dist = Math.random().toString(36).split(".")[1];
            const copy = sandbox.stub(fsExtra, "copy");
            await (0, _1.ɵcodegenPublicDirectory)(root, dist);
            (0, chai_1.expect)(copy.getCalls().map((it) => it.args)).to.deep.equal([
                [(0, path_1.join)(root, "build", "web"), dist],
            ]);
        });
    });
    describe("build", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should build", async () => {
            const process = new events_1.EventEmitter();
            process.stdin = new stream_1.Writable();
            process.stdout = new events_1.EventEmitter();
            process.stderr = new events_1.EventEmitter();
            process.status = 0;
            sandbox.stub(flutterUtils, "assertFlutterCliExists").returns(undefined);
            const cwd = ".";
            const stub = sandbox.stub(crossSpawn, "sync").returns(process);
            const result = (0, _1.build)(cwd);
            (0, chai_1.expect)(await result).to.deep.equal({
                wantsBackend: false,
            });
            sinon.assert.calledWith(stub, "flutter", ["build", "web"], { cwd, stdio: "inherit" });
        });
    });
    describe("init", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should create a new project", async () => {
            const process = new events_1.EventEmitter();
            process.stdin = new stream_1.Writable();
            process.stdout = new events_1.EventEmitter();
            process.stderr = new events_1.EventEmitter();
            process.status = 0;
            sandbox.stub(flutterUtils, "assertFlutterCliExists").returns(undefined);
            const projectId = "asdflj-ao9iu4__49";
            const projectName = "asdflj_ao9iu4__49";
            const projectDir = "asfijreou5o";
            const source = "asflijrelijf";
            const stub = sandbox.stub(crossSpawn, "sync").returns(process);
            const result = (0, _1.init)({ projectId, featureInfo: { hosting: { source } } }, { projectDir });
            (0, chai_1.expect)(await result).to.eql(undefined);
            sinon.assert.calledWith(stub, "flutter", [
                "create",
                "--template=app",
                `--project-name=${projectName}`,
                "--overwrite",
                "--platforms=web",
                source,
            ], { cwd: projectDir, stdio: "inherit" });
        });
    });
});
//# sourceMappingURL=index.spec.js.map