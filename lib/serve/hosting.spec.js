"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const superstatic = require("superstatic");
const portUtils = require("../emulator/portUtils");
const hostingConfig = require("../hosting/config");
const implicitInit = require("../hosting/implicitInit");
const hosting = require("./hosting");
const requireHostingSite = require("../requireHostingSite");
const utils = require("../utils");
const stream_1 = require("stream");
describe("hosting", () => {
    const sandbox = sinon.createSandbox();
    let checkListenableStub;
    let hostingConfigStub;
    let requireHostingSiteStub;
    let superstaticStub;
    let createDestroyerStub;
    let superstaticServer;
    beforeEach(() => {
        checkListenableStub = sandbox.stub(portUtils, "checkListenable").resolves(true);
        hostingConfigStub = sandbox.stub(hostingConfig, "hostingConfig").returns([
            {
                site: "site-one",
                public: "public",
            },
        ]);
        sandbox.stub(implicitInit, "implicitInit").resolves({
            json: JSON.stringify({ hosting: {} }),
            js: "",
            emulatorsJs: "",
        });
        requireHostingSiteStub = sandbox.stub(requireHostingSite, "requireHostingSite").resolves();
        superstaticServer = {
            on: sandbox.stub(),
            listen: sandbox.stub().callsFake((cb) => {
                if (cb) {
                    cb();
                }
                return superstaticServer;
            }),
        };
        superstaticStub = sandbox.stub(superstatic, "server").returns(superstaticServer);
        createDestroyerStub = sandbox.stub(utils, "createDestroyer");
        sandbox.stub(stream_1.Writable.prototype, "_write").resolves();
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("start", () => {
        it("should start a superstatic server with the correct config", async () => {
            const options = { port: 8080, host: "localhost" };
            await hosting.start(options);
            (0, chai_1.expect)(superstaticStub).to.have.been.calledOnce;
            const superstaticConfig = superstaticStub.getCall(0).args[0];
            (0, chai_1.expect)(superstaticConfig.port).to.equal(8080);
            (0, chai_1.expect)(superstaticConfig.hostname).to.equal("localhost");
            (0, chai_1.expect)(superstaticConfig.config.public).to.equal("public");
            (0, chai_1.expect)(superstaticServer.listen).to.have.been.calledOnce;
        });
        it("should require a hosting site if not specified", async () => {
            const options = { port: 8080, host: "localhost" };
            await hosting.start(options);
            (0, chai_1.expect)(requireHostingSiteStub).to.have.been.calledOnceWith(options);
        });
        it("should not require a hosting site if one is specified", async () => {
            const options = { port: 8080, host: "localhost", site: "my-site" };
            await hosting.start(options);
            (0, chai_1.expect)(requireHostingSiteStub).to.not.have.been.called;
        });
        it("should find an available port", async () => {
            const options = { port: 8080, host: "localhost" };
            checkListenableStub
                .withArgs({ address: "localhost", port: 8080, family: "IPv6" })
                .resolves(false);
            checkListenableStub
                .withArgs({ address: "localhost", port: 8081, family: "IPv6" })
                .resolves(true);
            await hosting.start(options);
            (0, chai_1.expect)(superstaticStub).to.have.been.calledOnce;
            const superstaticConfig = superstaticStub.getCall(0).args[0];
            (0, chai_1.expect)(superstaticConfig.port).to.equal(8081);
        });
        it("should start multiple servers for multiple hosting configs", async () => {
            const options = { port: 8080, host: "localhost" };
            hostingConfigStub.returns([
                { site: "site-one", public: "public" },
                { site: "site-two", public: "public" },
            ]);
            await hosting.start(options);
            (0, chai_1.expect)(superstaticStub).to.have.been.calledTwice;
            const port1 = superstaticStub.getCall(0).args[0].port;
            const port2 = superstaticStub.getCall(1).args[0].port;
            (0, chai_1.expect)(port1).to.equal(8080);
            (0, chai_1.expect)(port2).to.equal(8085);
        });
    });
    describe("stop", () => {
        it("should call the destroyer if the server was started", async () => {
            const destroyer = sandbox.stub().resolves();
            createDestroyerStub.returns(destroyer);
            const options = { port: 8080, host: "localhost" };
            await hosting.start(options);
            await hosting.stop();
            (0, chai_1.expect)(destroyer).to.have.been.calledOnce;
        });
        it("should do nothing if the server was not started", async () => {
            const destroyer = sandbox.stub().resolves();
            createDestroyerStub.returns(destroyer);
            await hosting.stop();
            (0, chai_1.expect)(destroyer).to.not.have.been.called;
        });
    });
});
//# sourceMappingURL=hosting.spec.js.map