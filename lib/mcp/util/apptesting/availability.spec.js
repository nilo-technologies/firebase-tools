"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockfs = require("mock-fs");
const sinon = require("sinon");
const index_1 = require("../../index");
const availability_1 = require("./availability");
const chai_1 = require("chai");
const ensureApiEnabled = require("../../../ensureApiEnabled");
describe("isAppTestingAvailable", () => {
    let sandbox;
    let checkStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        checkStub = sandbox.stub(ensureApiEnabled, "check");
    });
    afterEach(() => {
        sandbox.restore();
        mockfs.restore();
    });
    const mockContext = (projectDir) => ({
        projectId: "test-project",
        accountEmail: null,
        config: {
            projectDir: projectDir,
        },
        host: new index_1.FirebaseMcpServer({}),
        rc: {},
        firebaseCliCommand: "firebase",
        isBillingEnabled: false,
    });
    it("returns false for non mobile project", async () => {
        checkStub.resolves(true);
        mockfs({
            "/test-dir": {
                "package.json": '{ "name": "web-app" }',
                "index.html": "<html></html>",
            },
        });
        const result = await (0, availability_1.isAppTestingAvailable)(mockContext("/test-dir"));
        (0, chai_1.expect)(result).to.be.false;
    });
    it("returns false if App Distribution API isn't enabled", async () => {
        checkStub.resolves(false);
        mockfs({
            "/test-dir": {
                android: {
                    "build.gradle": "",
                    src: { main: {} },
                },
            },
        });
        const result = await (0, availability_1.isAppTestingAvailable)(mockContext("/test-dir"));
        (0, chai_1.expect)(result).to.be.false;
    });
    it("returns true for an Android project with API enabled", async () => {
        checkStub.resolves(true);
        mockfs({
            "/test-dir": {
                android: {
                    "build.gradle": "",
                    src: { main: {} },
                },
            },
        });
        const result = await (0, availability_1.isAppTestingAvailable)(mockContext("/test-dir"));
        (0, chai_1.expect)(result).to.be.true;
    });
    it("returns true for an iOS project with API enabled", async () => {
        checkStub.resolves(true);
        mockfs({
            "/test-dir": {
                ios: {
                    Podfile: "",
                    "Project.xcodeproj": {},
                },
            },
        });
        const result = await (0, availability_1.isAppTestingAvailable)(mockContext("/test-dir"));
        (0, chai_1.expect)(result).to.be.true;
    });
    it("returns true for an Flutter project with API enabled", async () => {
        checkStub.resolves(true);
        mockfs({
            "/test-dir": {
                "pubspec.yaml": "",
                ios: { "Runner.xcodeproj": {} },
                android: { src: { main: {} } },
            },
        });
        const result = await (0, availability_1.isAppTestingAvailable)(mockContext("/test-dir"));
        (0, chai_1.expect)(result).to.be.true;
    });
});
//# sourceMappingURL=availability.spec.js.map