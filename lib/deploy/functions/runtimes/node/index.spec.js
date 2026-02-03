"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const path = require("path");
const node = require(".");
const versioning = require("./versioning");
const utils = require("../../../../utils");
const error_1 = require("../../../../error");
const discovery = require("../discovery");
const PROJECT_ID = "test-project";
const PROJECT_DIR = "/some/path";
const SOURCE_DIR = "/some/path/fns";
describe("NodeDelegate", () => {
    describe("getNodeBinary", () => {
        let warnSpy;
        let successSpy;
        let hostVersionMock;
        let localVersionMock;
        beforeEach(() => {
            warnSpy = sinon.spy(utils, "logLabeledWarning");
            successSpy = sinon.spy(utils, "logLabeledSuccess");
            hostVersionMock = sinon.stub(process, "versions");
            localVersionMock = sinon.stub(versioning, "findModuleVersion");
        });
        afterEach(() => {
            warnSpy.restore();
            successSpy.restore();
            hostVersionMock.restore();
            localVersionMock.restore();
        });
        it("prefers locally cached node version if matched with requested version", () => {
            localVersionMock.returns("12.0.0");
            hostVersionMock.value({ node: "14.5.0" });
            const requestedRuntime = "nodejs12";
            const delegate = new node.Delegate(PROJECT_ID, PROJECT_DIR, SOURCE_DIR, requestedRuntime);
            (0, chai_1.expect)(delegate.getNodeBinary()).to.equal(path.join(SOURCE_DIR, "node_modules", "node"));
            (0, chai_1.expect)(successSpy).to.have.been.calledWith("functions", sinon.match("node@12 from local cache."));
            (0, chai_1.expect)(warnSpy).to.not.have.been.called;
        });
        it("checks if requested and hosted runtime version matches", () => {
            hostVersionMock.value({ node: "12.5.0" });
            const requestedRuntime = "nodejs12";
            const delegate = new node.Delegate(PROJECT_ID, PROJECT_DIR, SOURCE_DIR, requestedRuntime);
            (0, chai_1.expect)(delegate.getNodeBinary()).to.equal(process.execPath);
            (0, chai_1.expect)(successSpy).to.have.been.calledWith("functions", sinon.match("node@12 from host."));
            (0, chai_1.expect)(warnSpy).to.not.have.been.called;
        });
        it("warns users if hosted and requested runtime version differs", () => {
            hostVersionMock.value({ node: "12.0.0" });
            const requestedRuntime = "nodejs10";
            const delegate = new node.Delegate(PROJECT_ID, PROJECT_DIR, SOURCE_DIR, requestedRuntime);
            (0, chai_1.expect)(delegate.getNodeBinary()).to.equal(process.execPath);
            (0, chai_1.expect)(successSpy).to.not.have.been.called;
            (0, chai_1.expect)(warnSpy).to.have.been.calledWith("functions", sinon.match("doesn't match"));
        });
        it("throws errors if requested runtime version is invalid", () => {
            const invalidRuntime = "foobar";
            const delegate = new node.Delegate(PROJECT_ID, PROJECT_DIR, SOURCE_DIR, invalidRuntime);
            (0, chai_1.expect)(() => delegate.getNodeBinary()).to.throw(error_1.FirebaseError);
        });
    });
    describe("discoverBuild", () => {
        let getFunctionsSDKVersionMock;
        let detectFromYamlMock;
        beforeEach(() => {
            getFunctionsSDKVersionMock = sinon.stub(versioning, "getFunctionsSDKVersion");
            detectFromYamlMock = sinon.stub(discovery, "detectFromYaml");
        });
        afterEach(() => {
            getFunctionsSDKVersionMock.restore();
            detectFromYamlMock.restore();
        });
        it("throws error if SDK version is too old", async () => {
            getFunctionsSDKVersionMock.returns("3.19.0");
            const delegate = new node.Delegate(PROJECT_ID, PROJECT_DIR, SOURCE_DIR, "nodejs16");
            try {
                await delegate.discoverBuild({}, {});
                throw new Error("Should have thrown");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(err.message).to.include("Please update firebase-functions SDK");
            }
        });
        it("proceeds if SDK version is valid", async () => {
            getFunctionsSDKVersionMock.returns("4.0.0");
            detectFromYamlMock.resolves({ endpoints: {} });
            const delegate = new node.Delegate(PROJECT_ID, PROJECT_DIR, SOURCE_DIR, "nodejs16");
            await delegate.discoverBuild({}, {});
            (0, chai_1.expect)(detectFromYamlMock).to.have.been.called;
        });
        it("proceeds if SDK version is invalid", async () => {
            getFunctionsSDKVersionMock.returns("not-a-version");
            detectFromYamlMock.resolves({ endpoints: {} });
            const delegate = new node.Delegate(PROJECT_ID, PROJECT_DIR, SOURCE_DIR, "nodejs16");
            await delegate.discoverBuild({}, {});
            (0, chai_1.expect)(detectFromYamlMock).to.have.been.called;
        });
    });
});
//# sourceMappingURL=index.spec.js.map