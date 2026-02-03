"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const sinon = require("sinon");
const fs = require("fs-extra");
const downloadableEmulators = require("./downloadableEmulators");
const types_1 = require("./types");
const emulatorUpdateDetails = require("./downloadableEmulatorInfo.json");
function checkDownloadPath(name) {
    const emulator = downloadableEmulators.getDownloadDetails(name);
    (0, chai_1.expect)(path.basename(emulator.opts.remoteUrl)).to.eq(path.basename(emulator.downloadPath));
}
describe("downloadDetails", () => {
    let sandbox;
    let chmodStub;
    beforeEach(() => {
        chmodStub = sinon.stub(fs, "chmodSync").returns();
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        chmodStub.restore();
        sandbox.restore();
    });
    it("should match the basename of remoteUrl", () => {
        checkDownloadPath(types_1.Emulators.FIRESTORE);
        checkDownloadPath(types_1.Emulators.DATABASE);
        checkDownloadPath(types_1.Emulators.PUBSUB);
    });
    it("should apply environment varable overrides", () => {
        sandbox.stub(process, "env").value({
            ...process.env,
            FIRESTORE_EMULATOR_BINARY_PATH: "my/fake/firestore",
            DATABASE_EMULATOR_BINARY_PATH: "my/fake/database",
            PUBSUB_EMULATOR_BINARY_PATH: "my/fake/pubsub",
            DATACONNECT_EMULATOR_BINARY_PATH: "my/fake/dataconnect",
        });
        (0, chai_1.expect)(downloadableEmulators.getDownloadDetails(types_1.Emulators.FIRESTORE).binaryPath).to.equal("my/fake/firestore");
        (0, chai_1.expect)(downloadableEmulators.getDownloadDetails(types_1.Emulators.DATABASE).binaryPath).to.equal("my/fake/database");
        (0, chai_1.expect)(downloadableEmulators.getDownloadDetails(types_1.Emulators.PUBSUB).binaryPath).to.equal("my/fake/pubsub");
        (0, chai_1.expect)(downloadableEmulators.getDownloadDetails(types_1.Emulators.DATACONNECT).binaryPath).to.equal("my/fake/dataconnect");
        (0, chai_1.expect)(chmodStub.callCount).to.equal(4);
    });
    it("should select the right binary for the host environment", () => {
        let downloadDetails;
        sandbox.stub(process, "platform").value("linux");
        downloadDetails = downloadableEmulators.getDownloadDetails(types_1.Emulators.DATACONNECT);
        (0, chai_1.expect)(downloadDetails.opts.remoteUrl).to.equal(emulatorUpdateDetails.dataconnect.linux.remoteUrl);
        sandbox.stub(process, "platform").value("win32");
        downloadDetails = downloadableEmulators.getDownloadDetails(types_1.Emulators.DATACONNECT);
        (0, chai_1.expect)(downloadDetails.opts.remoteUrl).to.equal(emulatorUpdateDetails.dataconnect.win32.remoteUrl);
        sandbox.stub(process, "platform").value("darwin");
        sandbox.stub(process, "arch").value("x64");
        downloadDetails = downloadableEmulators.getDownloadDetails(types_1.Emulators.DATACONNECT);
        (0, chai_1.expect)(downloadDetails.opts.remoteUrl).to.equal(emulatorUpdateDetails.dataconnect.darwin.remoteUrl);
        sandbox.stub(process, "arch").value("arm64");
        downloadDetails = downloadableEmulators.getDownloadDetails(types_1.Emulators.DATACONNECT);
        (0, chai_1.expect)(downloadDetails.opts.remoteUrl).to.equal(emulatorUpdateDetails.dataconnect.darwin_arm64.remoteUrl);
    });
});
//# sourceMappingURL=downloadableEmulators.spec.js.map