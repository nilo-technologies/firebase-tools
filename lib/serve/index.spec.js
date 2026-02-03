"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const index_1 = require("./index");
const hosting = require("./hosting");
const functions_1 = require("./functions");
const prepareFrameworks = require("../frameworks");
const experiments = require("../experiments");
const config = require("../hosting/config");
const track = require("../track");
const projectUtils = require("../projectUtils");
describe("serve", () => {
    const sandbox = sinon.createSandbox();
    let hostingStart;
    let hostingStop;
    let hostingConnect;
    let functionsStart;
    let functionsStop;
    let functionsConnect;
    let prepareFrameworksStub;
    let experimentsAssertEnabledStub;
    let configExtractStub;
    let trackEmulatorStub;
    let processOnStub;
    let sigintHandler;
    beforeEach(() => {
        hostingStart = sandbox.stub(hosting, "start").resolves({ ports: [] });
        hostingStop = sandbox.stub(hosting, "stop").resolves();
        hostingConnect = sandbox.stub(hosting, "connect").resolves();
        functionsStart = sandbox.stub(functions_1.FunctionsServer.prototype, "start").resolves();
        functionsStop = sandbox.stub(functions_1.FunctionsServer.prototype, "stop").resolves();
        functionsConnect = sandbox.stub(functions_1.FunctionsServer.prototype, "connect").resolves();
        prepareFrameworksStub = sandbox.stub(prepareFrameworks, "prepareFrameworks").resolves();
        experimentsAssertEnabledStub = sandbox.stub(experiments, "assertEnabled");
        configExtractStub = sandbox.stub(config, "extract");
        trackEmulatorStub = sandbox.stub(track, "trackEmulator");
        sandbox.stub(projectUtils, "getProjectId").returns("demo-project");
        processOnStub = sandbox.stub(process, "on");
        processOnStub.withArgs("SIGINT").callsFake((event, handler) => {
            sigintHandler = handler;
            return process;
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    async function triggerSIGINT() {
        await new Promise((resolve) => setImmediate(resolve));
        if (sigintHandler) {
            sigintHandler();
        }
    }
    it("should start and connect to all services, then stop on SIGINT", async () => {
        const options = {
            targets: ["hosting", "functions"],
            port: 8080,
        };
        configExtractStub.returns([]);
        const servePromise = (0, index_1.serve)(options);
        await triggerSIGINT();
        await servePromise;
        (0, chai_1.expect)(hostingStart).to.have.been.calledOnceWith(options);
        (0, chai_1.expect)(functionsStart).to.have.been.calledOnce;
        (0, chai_1.expect)(hostingConnect).to.have.been.calledOnce;
        (0, chai_1.expect)(functionsConnect).to.have.been.calledOnce;
        (0, chai_1.expect)(hostingStop).to.have.been.calledOnceWith(options);
        (0, chai_1.expect)(functionsStop).to.have.been.calledOnce;
    });
    it("should call prepareFrameworks when webframeworks experiment is enabled and hosting source exists", async () => {
        const options = {
            targets: ["hosting"],
            port: 8080,
        };
        configExtractStub.returns([{ source: "some-source" }]);
        const servePromise = (0, index_1.serve)(options);
        await triggerSIGINT();
        await servePromise;
        (0, chai_1.expect)(experimentsAssertEnabledStub).to.have.been.calledOnceWith("webframeworks", "emulate a web framework");
        (0, chai_1.expect)(prepareFrameworksStub).to.have.been.calledOnceWith("emulate", ["hosting"], undefined, options);
    });
    it("should not call prepareFrameworks if hosting target has no source", async () => {
        const options = {
            targets: ["hosting"],
            port: 8080,
        };
        configExtractStub.returns([{}]);
        const servePromise = (0, index_1.serve)(options);
        await triggerSIGINT();
        await servePromise;
        (0, chai_1.expect)(prepareFrameworksStub).to.not.have.been.called;
    });
    it("should throw if webframeworks experiment is not enabled", async () => {
        const options = {
            targets: ["hosting"],
            port: 8080,
        };
        configExtractStub.returns([{ source: "some-source" }]);
        const error = new Error("webframeworks experiment not enabled");
        experimentsAssertEnabledStub.throws(error);
        await (0, chai_1.expect)((0, index_1.serve)(options)).to.be.rejectedWith(error);
        (0, chai_1.expect)(prepareFrameworksStub).to.not.have.been.called;
    });
    it("should track emulator run and started events", async () => {
        const options = {
            targets: ["hosting", "functions"],
            port: 8080,
        };
        configExtractStub.returns([]);
        const servePromise = (0, index_1.serve)(options);
        await triggerSIGINT();
        await servePromise;
        (0, chai_1.expect)(trackEmulatorStub).to.have.been.calledWith("emulator_run", {
            emulator_name: "hosting",
            is_demo_project: "true",
        });
        (0, chai_1.expect)(trackEmulatorStub).to.have.been.calledWith("emulator_run", {
            emulator_name: "functions",
            is_demo_project: "true",
        });
        (0, chai_1.expect)(trackEmulatorStub).to.have.been.calledWith("emulators_started", {
            count: 2,
            count_all: 2,
            is_demo_project: "true",
        });
    });
});
//# sourceMappingURL=index.spec.js.map