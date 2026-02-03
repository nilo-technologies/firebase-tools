"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs");
const path = require("path");
const mockfs = require("mock-fs");
const archiver = require("archiver");
const stream_1 = require("stream");
const remoteSource_1 = require("./remoteSource");
const error_1 = require("../../error");
const downloadUtils = require("../../downloadUtils");
describe("remoteSource", () => {
    describe("requireFunctionsYaml", () => {
        afterEach(() => {
            mockfs.restore();
        });
        it("should not throw if functions.yaml exists", () => {
            mockfs({
                "/app/functions.yaml": "runtime: nodejs22",
            });
            (0, chai_1.expect)(() => (0, remoteSource_1.requireFunctionsYaml)("/app")).to.not.throw();
        });
        it("should throw FirebaseError if functions.yaml is missing", () => {
            mockfs({
                "/app/index.js": "console.log('hello')",
            });
            (0, chai_1.expect)(() => (0, remoteSource_1.requireFunctionsYaml)("/app")).to.throw(error_1.FirebaseError, /The remote repository is missing a required deployment manifest/);
        });
    });
    describe("getRemoteSource", () => {
        let downloadToTmpStub;
        beforeEach(() => {
            downloadToTmpStub = sinon.stub(downloadUtils, "downloadToTmp");
        });
        afterEach(() => {
            sinon.restore();
            mockfs.restore();
        });
        async function createZipBuffer(files, topLevelDir) {
            const archive = archiver("zip", { zlib: { level: 9 } });
            const chunks = [];
            const output = new stream_1.Writable({
                write(chunk, _encoding, callback) {
                    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
                    callback();
                },
            });
            return new Promise((resolve, reject) => {
                output.on("finish", () => resolve(Buffer.concat(chunks)));
                archive.on("error", (err) => reject(err));
                archive.pipe(output);
                for (const [filePath, content] of Object.entries(files)) {
                    const entryPath = topLevelDir ? path.join(topLevelDir, filePath) : filePath;
                    archive.append(content, { name: entryPath });
                }
                archive.finalize();
            });
        }
        it("should use GitHub Archive API for GitHub URLs", async () => {
            const zipBuffer = await createZipBuffer({ "functions.yaml": "runtime: nodejs22" }, "repo-main");
            mockfs({
                "/tmp/source.zip": zipBuffer,
                "/dest": {},
            });
            downloadToTmpStub.resolves("/tmp/source.zip");
            const sourceDir = await (0, remoteSource_1.getRemoteSource)("https://github.com/org/repo", "main", "/dest");
            (0, chai_1.expect)(downloadToTmpStub.calledOnce).to.be.true;
            (0, chai_1.expect)(downloadToTmpStub.firstCall.args[0]).to.equal("https://github.com/org/repo/archive/main.zip");
            (0, chai_1.expect)(sourceDir).to.match(/repo-main$/);
            (0, chai_1.expect)(sourceDir).to.contain("/dest");
            (0, chai_1.expect)(fs.statSync(path.join(sourceDir, "functions.yaml")).isFile()).to.be.true;
        });
        it("should support org/repo shorthand", async () => {
            const zipBuffer = await createZipBuffer({ "functions.yaml": "runtime: nodejs22" }, "repo-main");
            mockfs({
                "/tmp/source.zip": zipBuffer,
                "/dest": {},
            });
            downloadToTmpStub.resolves("/tmp/source.zip");
            const sourceDir = await (0, remoteSource_1.getRemoteSource)("org/repo", "main", "/dest");
            (0, chai_1.expect)(downloadToTmpStub.calledOnce).to.be.true;
            (0, chai_1.expect)(downloadToTmpStub.firstCall.args[0]).to.equal("https://github.com/org/repo/archive/main.zip");
            (0, chai_1.expect)(sourceDir).to.match(/repo-main$/);
        });
        it("should strip top-level directory from GitHub archive", async () => {
            const zipBuffer = await createZipBuffer({ "functions.yaml": "runtime: nodejs22" }, "repo-main");
            mockfs({
                "/tmp/source.zip": zipBuffer,
                "/dest": {},
            });
            downloadToTmpStub.resolves("/tmp/source.zip");
            const sourceDir = await (0, remoteSource_1.getRemoteSource)("https://github.com/org/repo", "main", "/dest");
            (0, chai_1.expect)(sourceDir).to.match(/repo-main$/);
            (0, chai_1.expect)(fs.statSync(path.join(sourceDir, "functions.yaml")).isFile()).to.be.true;
        });
        it("should NOT strip top-level directory if multiple files exist at root", async () => {
            const zipBuffer = await createZipBuffer({
                "file1.txt": "content",
                "functions.yaml": "runtime: nodejs22",
                "repo-main/index.js": "console.log('hello')",
            });
            mockfs({
                "/tmp/source.zip": zipBuffer,
                "/dest": {},
            });
            downloadToTmpStub.resolves("/tmp/source.zip");
            const sourceDir = await (0, remoteSource_1.getRemoteSource)("https://github.com/org/repo", "main", "/dest");
            (0, chai_1.expect)(sourceDir).to.not.match(/repo-main$/);
            (0, chai_1.expect)(sourceDir).to.equal("/dest");
            (0, chai_1.expect)(fs.statSync(path.join(sourceDir, "file1.txt")).isFile()).to.be.true;
            (0, chai_1.expect)(fs.statSync(path.join(sourceDir, "functions.yaml")).isFile()).to.be.true;
        });
        it("should throw error if GitHub Archive download fails", async () => {
            mockfs({ "/dest": {} });
            downloadToTmpStub.rejects(new Error("404 Not Found"));
            await (0, chai_1.expect)((0, remoteSource_1.getRemoteSource)("https://github.com/org/repo", "main", "/dest")).to.be.rejectedWith(error_1.FirebaseError, /Failed to download GitHub archive/);
        });
        it("should throw error for non-GitHub URLs", async () => {
            mockfs({ "/dest": {} });
            await (0, chai_1.expect)((0, remoteSource_1.getRemoteSource)("https://gitlab.com/org/repo", "main", "/dest")).to.be.rejectedWith(error_1.FirebaseError, /Only GitHub repositories are supported/);
        });
        it("should validate subdirectory exists after clone", async () => {
            const zipBuffer = await createZipBuffer({ "functions.yaml": "runtime: nodejs22" }, "repo-main");
            mockfs({
                "/tmp/source.zip": zipBuffer,
                "/dest": {},
            });
            downloadToTmpStub.resolves("/tmp/source.zip");
            await (0, chai_1.expect)((0, remoteSource_1.getRemoteSource)("https://github.com/org/repo", "main", "/dest", "nonexistent")).to.be.rejectedWith(error_1.FirebaseError, /Directory 'nonexistent' not found/);
        });
        it("should return source even if functions.yaml is missing", async () => {
            const zipBuffer = await createZipBuffer({ "index.js": "console.log('hello')" }, "repo-main");
            mockfs({
                "/tmp/source.zip": zipBuffer,
                "/dest": {},
            });
            downloadToTmpStub.resolves("/tmp/source.zip");
            const sourceDir = await (0, remoteSource_1.getRemoteSource)("https://github.com/org/repo", "main", "/dest");
            (0, chai_1.expect)(sourceDir).to.match(/repo-main$/);
            (0, chai_1.expect)(fs.statSync(path.join(sourceDir, "index.js")).isFile()).to.be.true;
            (0, chai_1.expect)(() => fs.statSync(path.join(sourceDir, "functions.yaml"))).to.throw();
        });
        it("should prevent path traversal in subdirectory", async () => {
            const zipBuffer = await createZipBuffer({ "functions.yaml": "runtime: nodejs22" }, "repo-main");
            mockfs({
                "/tmp/source.zip": zipBuffer,
                "/dest": {},
            });
            downloadToTmpStub.resolves("/tmp/source.zip");
            await (0, chai_1.expect)((0, remoteSource_1.getRemoteSource)("https://github.com/org/repo", "main", "/dest", "../outside")).to.be.rejectedWith(error_1.FirebaseError, /must not escape/);
        });
        it("should return subdirectory if specified", async () => {
            const zipBuffer = await createZipBuffer({
                "functions.yaml": "runtime: nodejs22",
                "app/index.js": "console.log('hello')",
                "app/functions.yaml": "runtime: nodejs22",
            }, "repo-main");
            mockfs({
                "/tmp/source.zip": zipBuffer,
                "/dest": {},
            });
            downloadToTmpStub.resolves("/tmp/source.zip");
            const sourceDir = await (0, remoteSource_1.getRemoteSource)("https://github.com/org/repo", "main", "/dest", "app");
            (0, chai_1.expect)(sourceDir).to.match(/repo-main\/app$/);
            (0, chai_1.expect)(fs.statSync(path.join(sourceDir, "index.js")).isFile()).to.be.true;
            (0, chai_1.expect)(fs.statSync(path.join(sourceDir, "functions.yaml")).isFile()).to.be.true;
        });
    });
});
//# sourceMappingURL=remoteSource.spec.js.map