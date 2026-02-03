"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const functions_1 = require("./functions");
const functionsEmulator = require("../emulator/functionsEmulator");
const projectUtils = require("../projectUtils");
const auth = require("../auth");
const projectConfig = require("../functions/projectConfig");
const emulatorRegistry = require("../emulator/registry");
const commandUtils = require("../emulator/commandUtils");
describe("FunctionsServer", () => {
    const sandbox = sinon.createSandbox();
    let functionsEmulatorStub;
    let needProjectIdStub;
    let getProjectDefaultAccountStub;
    let normalizeAndValidateStub;
    let startRegistryStub;
    let functionsEmulatorInstance;
    beforeEach(() => {
        functionsEmulatorInstance = {
            start: sandbox.stub().resolves(),
            connect: sandbox.stub().resolves(),
            stop: sandbox.stub().resolves(),
        };
        functionsEmulatorStub = sandbox
            .stub(functionsEmulator, "FunctionsEmulator")
            .returns(functionsEmulatorInstance);
        needProjectIdStub = sandbox.stub(projectUtils, "needProjectId").returns("project-id");
        getProjectDefaultAccountStub = sandbox.stub(auth, "getProjectDefaultAccount").returns({
            user: { email: "test@test.com" },
            tokens: { access_token: "token" },
        });
        normalizeAndValidateStub = sandbox
            .stub(projectConfig, "normalizeAndValidate")
            .returns([{ source: "functions", codebase: "default", runtime: "nodejs18" }]);
        startRegistryStub = sandbox.stub(emulatorRegistry.EmulatorRegistry, "start").resolves();
        sandbox.stub(commandUtils, "parseInspectionPort").returns(9229);
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should throw when calling methods before start", async () => {
        const server = new functions_1.FunctionsServer();
        (0, chai_1.expect)(() => server.get()).to.throw("Must call start() before calling any other operation!");
        await (0, chai_1.expect)(server.connect()).to.be.rejectedWith("Must call start() before calling any other operation!");
        await (0, chai_1.expect)(server.stop()).to.be.rejectedWith("Must call start() before calling any other operation!");
    });
    it("should start the emulator with the correct args", async () => {
        const server = new functions_1.FunctionsServer();
        const options = {
            config: { projectDir: "/path/to/project", src: { functions: {} } },
            projectAlias: "alias",
        };
        await server.start(options, {});
        (0, chai_1.expect)(needProjectIdStub).to.have.been.calledOnceWith(options);
        (0, chai_1.expect)(normalizeAndValidateStub).to.have.been.calledOnceWith({});
        (0, chai_1.expect)(getProjectDefaultAccountStub).to.have.been.calledOnceWith("/path/to/project");
        (0, chai_1.expect)(functionsEmulatorStub).to.have.been.calledOnce;
        const emulatorArgs = functionsEmulatorStub.getCall(0).args[0];
        (0, chai_1.expect)(emulatorArgs.projectId).to.equal("project-id");
        (0, chai_1.expect)(emulatorArgs.projectAlias).to.equal("alias");
        (0, chai_1.expect)(emulatorArgs.projectDir).to.equal("/path/to/project");
        (0, chai_1.expect)(emulatorArgs.emulatableBackends[0].functionsDir).to.contain("functions");
        (0, chai_1.expect)(startRegistryStub).to.have.been.calledOnceWith(functionsEmulatorInstance);
    });
    it("should assign ports correctly when hosting is running", async () => {
        const server = new functions_1.FunctionsServer();
        const options = {
            config: { projectDir: "/path/to/project", src: { functions: {} } },
            port: 8080,
            targets: ["hosting"],
        };
        await server.start(options, {});
        const emulatorArgs = functionsEmulatorStub.getCall(0).args[0];
        (0, chai_1.expect)(emulatorArgs.port).to.equal(8081);
    });
    it("should assign ports correctly when hosting is NOT running", async () => {
        const server = new functions_1.FunctionsServer();
        const options = {
            config: { projectDir: "/path/to/project", src: { functions: {} } },
            port: 8080,
            targets: ["functions"],
        };
        await server.start(options, {});
        const emulatorArgs = functionsEmulatorStub.getCall(0).args[0];
        (0, chai_1.expect)(emulatorArgs.port).to.equal(8080);
    });
    it("should connect to the emulator", async () => {
        const server = new functions_1.FunctionsServer();
        const options = { config: { projectDir: "/path/to/project", src: { functions: {} } } };
        await server.start(options, {});
        await server.connect();
        (0, chai_1.expect)(functionsEmulatorInstance.connect).to.have.been.calledOnce;
    });
    it("should stop the emulator", async () => {
        const server = new functions_1.FunctionsServer();
        const options = { config: { projectDir: "/path/to/project", src: { functions: {} } } };
        await server.start(options, {});
        await server.stop();
        (0, chai_1.expect)(functionsEmulatorInstance.stop).to.have.been.calledOnce;
    });
    it("should get the emulator instance", async () => {
        const server = new functions_1.FunctionsServer();
        const options = { config: { projectDir: "/path/to/project", src: { functions: {} } } };
        await server.start(options, {});
        const instance = server.get();
        (0, chai_1.expect)(instance).to.equal(functionsEmulatorInstance);
    });
});
//# sourceMappingURL=functions.spec.js.map