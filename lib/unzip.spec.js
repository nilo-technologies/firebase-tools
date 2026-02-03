"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs");
const os_1 = require("os");
const path = require("path");
const unzip_1 = require("./unzip");
const zip_files_1 = require("./test/fixtures/zip-files");
describe("unzip", () => {
    let tempDir;
    before(async () => {
        tempDir = await fs.promises.mkdtemp(path.join((0, os_1.tmpdir)(), "firebasetest-"));
    });
    after(async () => {
        await fs.promises.rm(tempDir, { recursive: true });
    });
    for (const { name, archivePath, inflatedDir, wantErr } of zip_files_1.ZIP_CASES) {
        if (!wantErr) {
            it(`should unzip a zip file with ${name} case`, async () => {
                const unzipPath = path.join(tempDir, name);
                await (0, unzip_1.unzip)(archivePath, unzipPath);
                const expectedSize = await calculateFolderSize(inflatedDir);
                (0, chai_1.expect)(await calculateFolderSize(unzipPath)).to.eql(expectedSize);
            }).timeout(2000);
        }
        else {
            it(`should throw "${wantErr}" when reading a zip file with ${name} case`, async () => {
                const unzipPath = path.join(tempDir, name);
                (0, chai_1.expect)((0, unzip_1.unzip)(archivePath, unzipPath)).to.eventually.be.rejectedWith(wantErr);
            });
        }
    }
});
async function calculateFolderSize(folderPath) {
    const files = await fs.promises.readdir(folderPath);
    let size = 0;
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) {
            size += await calculateFolderSize(filePath);
        }
        else {
            size += stat.size;
        }
    }
    return size;
}
//# sourceMappingURL=unzip.spec.js.map