"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs");
const path = require("path");
const tmp = require("tmp");
const fsutils_1 = require("./fsutils");
describe("fsutils", () => {
    let tmpDir;
    beforeEach(() => {
        tmpDir = tmp.dirSync({ unsafeCleanup: true });
    });
    afterEach(() => {
        tmpDir.removeCallback();
    });
    describe("fileExistsSync", () => {
        it("should return true if the file exists", () => {
            fs.writeFileSync(path.join(tmpDir.name, "test.txt"), "hello");
            (0, chai_1.expect)((0, fsutils_1.fileExistsSync)(path.join(tmpDir.name, "test.txt"))).to.be.true;
        });
        it("should return false if a file does not exist", () => {
            (0, chai_1.expect)((0, fsutils_1.fileExistsSync)(path.join(tmpDir.name, "test.txt"))).to.be.false;
        });
        it("should return false for a directory", () => {
            fs.mkdirSync(path.join(tmpDir.name, "test-dir"));
            (0, chai_1.expect)((0, fsutils_1.fileExistsSync)(path.join(tmpDir.name, "test-dir"))).to.be.false;
        });
    });
    describe("dirExistsSync", () => {
        it("should return true if a directory exists", () => {
            fs.mkdirSync(path.join(tmpDir.name, "test-dir"));
            (0, chai_1.expect)((0, fsutils_1.dirExistsSync)(path.join(tmpDir.name, "test-dir"))).to.be.true;
        });
        it("should return false if a directory does not exist", () => {
            (0, chai_1.expect)((0, fsutils_1.dirExistsSync)(path.join(tmpDir.name, "test-dir"))).to.be.false;
        });
        it("should return false for a file", () => {
            fs.writeFileSync(path.join(tmpDir.name, "test.txt"), "hello");
            (0, chai_1.expect)((0, fsutils_1.dirExistsSync)(path.join(tmpDir.name, "test.txt"))).to.be.false;
        });
    });
    describe("readFile", () => {
        it("should read a file", () => {
            fs.writeFileSync(path.join(tmpDir.name, "test.txt"), "hello world");
            (0, chai_1.expect)((0, fsutils_1.readFile)(path.join(tmpDir.name, "test.txt"))).to.equal("hello world");
        });
        it("should throw an error if the file does not exist", () => {
            (0, chai_1.expect)(() => (0, fsutils_1.readFile)(path.join(tmpDir.name, "test.txt"))).to.throw("File not found");
        });
    });
    describe("listFiles", () => {
        it("should list files in a directory", () => {
            fs.writeFileSync(path.join(tmpDir.name, "test1.txt"), "");
            fs.writeFileSync(path.join(tmpDir.name, "test2.txt"), "");
            fs.mkdirSync(path.join(tmpDir.name, "test-dir"));
            const files = (0, fsutils_1.listFiles)(tmpDir.name).sort();
            (0, chai_1.expect)(files).to.deep.equal(["test-dir", "test1.txt", "test2.txt"]);
        });
        it("should throw an error if the directory does not exist", () => {
            (0, chai_1.expect)(() => (0, fsutils_1.listFiles)(path.join(tmpDir.name, "non-existent-dir"))).to.throw("Directory not found");
        });
        it("should throw an error for a file", () => {
            fs.writeFileSync(path.join(tmpDir.name, "test.txt"), "");
            (0, chai_1.expect)(() => (0, fsutils_1.listFiles)(path.join(tmpDir.name, "test.txt"))).to.throw();
        });
    });
    describe("readFile", () => {
        it("should read a file", () => {
            fs.writeFileSync(path.join(tmpDir.name, "test.txt"), "hello world");
            (0, chai_1.expect)((0, fsutils_1.readFile)(path.join(tmpDir.name, "test.txt"))).to.equal("hello world");
        });
        it("should throw an error if the file does not exist", () => {
            (0, chai_1.expect)(() => (0, fsutils_1.readFile)(path.join(tmpDir.name, "test.txt"))).to.throw("File not found");
        });
        it("should throw an error for a directory", () => {
            fs.mkdirSync(path.join(tmpDir.name, "test-dir"));
            (0, chai_1.expect)(() => (0, fsutils_1.readFile)(path.join(tmpDir.name, "test-dir"))).to.throw();
        });
    });
    describe("moveAll", () => {
        it("should move all files and directories from one directory to another", () => {
            const srcDir = path.join(tmpDir.name, "src");
            const destDir = path.join(tmpDir.name, "dest");
            fs.mkdirSync(srcDir);
            fs.writeFileSync(path.join(srcDir, "file1.txt"), "hello");
            fs.mkdirSync(path.join(srcDir, "dir1"));
            fs.writeFileSync(path.join(srcDir, "dir1", "file2.txt"), "world");
            (0, fsutils_1.moveAll)(srcDir, destDir);
            (0, chai_1.expect)(fs.existsSync(path.join(destDir, "file1.txt"))).to.be.true;
            (0, chai_1.expect)(fs.existsSync(path.join(destDir, "dir1"))).to.be.true;
            (0, chai_1.expect)(fs.existsSync(path.join(destDir, "dir1", "file2.txt"))).to.be.true;
        });
        it("should not move the destination directory into itself", () => {
            const srcDir = path.join(tmpDir.name, "src");
            const destDir = path.join(srcDir, "dest");
            fs.mkdirSync(srcDir);
            fs.mkdirSync(destDir);
            fs.writeFileSync(path.join(srcDir, "file1.txt"), "hello");
            (0, fsutils_1.moveAll)(srcDir, destDir);
            (0, chai_1.expect)(fs.existsSync(path.join(destDir, "file1.txt"))).to.be.true;
            (0, chai_1.expect)(fs.existsSync(path.join(destDir, "dest"))).to.be.false;
        });
    });
});
//# sourceMappingURL=fsutils.spec.js.map