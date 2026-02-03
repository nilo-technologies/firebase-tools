"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const clc = require("colorette");
const hostingApi = require("../../hosting/api");
const tracking = require("../../track");
const deploymentTool = require("../../deploymentTool");
const utils = require("../../utils");
const prepare_1 = require("./prepare");
const utils_1 = require("../../utils");
const backend = require("../functions/backend");
describe("hosting prepare", () => {
    let hostingStub;
    let trackingStub;
    let backendStub;
    let loggerStub;
    let siteConfig;
    let firebaseJson;
    let options;
    beforeEach(() => {
        hostingStub = sinon.stub(hostingApi);
        trackingStub = sinon.stub(tracking);
        backendStub = sinon.stub(backend);
        loggerStub = sinon.stub(utils, "logLabeledBullet");
        siteConfig = {
            site: "site",
            public: ".",
            rewrites: [
                {
                    glob: "run",
                    run: {
                        serviceId: "service",
                        pinTag: true,
                    },
                },
                {
                    glob: "**",
                    function: {
                        functionId: "function",
                        pinTag: true,
                    },
                },
            ],
        };
        firebaseJson = {
            hosting: siteConfig,
        };
        options = {
            cwd: ".",
            configPath: ".",
            only: "hosting",
            except: "",
            filteredTargets: ["HOSTING"],
            force: false,
            nonInteractive: false,
            debug: false,
            config: {
                src: firebaseJson,
            },
            rc: null,
            normalizedHostingConfig: [siteConfig],
        };
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("passes a smoke test with web framework", async () => {
        siteConfig.webFramework = "fake-framework";
        hostingStub.createVersion.callsFake((siteId, version) => {
            (0, chai_1.expect)(siteId).to.equal(siteConfig.site);
            (0, chai_1.expect)(version.status).to.equal("CREATED");
            (0, chai_1.expect)(version.labels).to.deep.equal({
                ...deploymentTool.labels(),
                "firebase-web-framework": "fake-framework",
            });
            return Promise.resolve("version");
        });
        const context = {
            projectId: "project",
        };
        await (0, prepare_1.prepare)(context, options);
        (0, chai_1.expect)(trackingStub.trackGA4).to.have.been.calledOnceWith("hosting_version", {
            framework: "fake-framework",
        });
        (0, chai_1.expect)(hostingStub.createVersion).to.have.been.calledOnce;
        (0, chai_1.expect)(context.hosting).to.deep.equal({
            deploys: [
                {
                    config: siteConfig,
                    version: "version",
                },
            ],
        });
        (0, chai_1.expect)(loggerStub).to.have.been.calledWith("hosting", `The site ${clc.bold("site")} will pin rewrites to the current latest ` +
            `revision of service(s) ${clc.bold("service")}`);
    });
    it("passes a smoke test without web framework", async () => {
        hostingStub.createVersion.callsFake((siteId, version) => {
            (0, chai_1.expect)(siteId).to.equal(siteConfig.site);
            (0, chai_1.expect)(version.status).to.equal("CREATED");
            (0, chai_1.expect)(version.labels).to.deep.equal(deploymentTool.labels());
            return Promise.resolve("version");
        });
        const context = {
            projectId: "project",
        };
        await (0, prepare_1.prepare)(context, options);
        (0, chai_1.expect)(trackingStub.trackGA4).to.have.been.calledOnceWith("hosting_version", {
            framework: "classic",
        });
        (0, chai_1.expect)(hostingStub.createVersion).to.have.been.calledOnce;
        (0, chai_1.expect)(context.hosting).to.deep.equal({
            deploys: [
                {
                    config: siteConfig,
                    version: "version",
                },
            ],
        });
    });
    describe("unsafePins", () => {
        const apiRewriteWithoutPin = {
            glob: "**",
            run: {
                serviceId: "service",
                region: "us-central1",
            },
        };
        const apiRewriteWithPin = (0, utils_1.cloneDeep)(apiRewriteWithoutPin);
        apiRewriteWithPin.run.tag = "tag";
        const configWithRunPin = {
            site: "site",
            rewrites: [
                {
                    glob: "**",
                    run: {
                        serviceId: "service",
                        pinTag: true,
                    },
                },
            ],
        };
        const configWithFuncPin = {
            site: "site",
            rewrites: [
                {
                    glob: "**",
                    function: {
                        functionId: "function",
                        pinTag: true,
                    },
                },
            ],
        };
        beforeEach(() => {
            backendStub.existingBackend.resolves({
                endpoints: {
                    "us-central1": {
                        function: {
                            id: "function",
                            runServiceId: "service",
                        },
                    },
                },
                requiredAPIs: [],
                environmentVariables: {},
            });
        });
        function stubUnpinnedRewrite() {
            stubRewrite(apiRewriteWithoutPin);
        }
        function stubPinnedRewrite() {
            stubRewrite(apiRewriteWithPin);
        }
        function stubRewrite(rewrite) {
            hostingStub.getChannel.resolves({
                release: {
                    version: {
                        config: {
                            rewrites: [rewrite],
                        },
                    },
                },
            });
        }
        it("does not care about modifying live (implicit)", async () => {
            stubUnpinnedRewrite();
            await (0, chai_1.expect)((0, prepare_1.unsafePins)({ projectId: "project" }, configWithRunPin)).to.eventually.deep.equal([]);
        });
        it("does not care about modifying live (explicit)", async () => {
            stubUnpinnedRewrite();
            await (0, chai_1.expect)((0, prepare_1.unsafePins)({ projectId: "project", hostingChannel: "live" }, configWithRunPin)).to.eventually.deep.equal([]);
        });
        it("does not care about already pinned rewrites (run)", async () => {
            stubPinnedRewrite();
            await (0, chai_1.expect)((0, prepare_1.unsafePins)({ projectId: "project", hostingChannel: "test" }, configWithRunPin)).to.eventually.deep.equal([]);
        });
        it("does not care about already pinned rewrites (gcf)", async () => {
            stubPinnedRewrite();
            await (0, chai_1.expect)((0, prepare_1.unsafePins)({ projectId: "project", hostingChannel: "test" }, configWithFuncPin)).to.eventually.deep.equal([]);
        });
        it("rejects about newly pinned rewrites (run)", async () => {
            stubUnpinnedRewrite();
            await (0, chai_1.expect)((0, prepare_1.unsafePins)({ projectId: "project", hostingChannel: "test" }, configWithRunPin)).to.eventually.deep.equal(["**"]);
        });
        it("rejects about newly pinned rewrites (gcf)", async () => {
            stubUnpinnedRewrite();
            await (0, chai_1.expect)((0, prepare_1.unsafePins)({ projectId: "project", hostingChannel: "test" }, configWithFuncPin)).to.eventually.deep.equal(["**"]);
        });
    });
    describe("hasPinnedFunctions", () => {
        it("detects function tags", () => {
            (0, chai_1.expect)((0, prepare_1.hasPinnedFunctions)(options)).to.be.true;
        });
        it("detects a lack of function tags", () => {
            delete options.config.src.hosting?.rewrites?.[1]?.function?.pinTag;
            (0, chai_1.expect)((0, prepare_1.hasPinnedFunctions)(options)).to.be.false;
        });
    });
    describe("addPinnedFunctionsToOnlyString", () => {
        it("adds functions to deploy targets w/ codebases", async () => {
            backendStub.existingBackend.resolves({
                endpoints: {
                    "us-central1": {
                        function: {
                            id: "function",
                            runServiceId: "service",
                            codebase: "backend",
                        },
                    },
                },
                requiredAPIs: [],
                environmentVariables: {},
            });
            await (0, chai_1.expect)((0, prepare_1.addPinnedFunctionsToOnlyString)({}, options)).to.eventually.be.true;
            (0, chai_1.expect)(options.only).to.equal("hosting,functions:backend:function");
            (0, chai_1.expect)(loggerStub).to.have.been.calledWith("hosting", `The following function(s) are pinned to site ${clc.bold("site")} ` +
                `and will be deployed as well: ${clc.bold("function")}`);
        });
        it("adds functions to deploy targets w/o codebases", async () => {
            backendStub.existingBackend.resolves({
                endpoints: {
                    "us-central1": {
                        function: {
                            id: "function",
                            runServiceId: "service",
                        },
                    },
                },
                requiredAPIs: [],
                environmentVariables: {},
            });
            await (0, chai_1.expect)((0, prepare_1.addPinnedFunctionsToOnlyString)({}, options)).to.eventually.be.true;
            (0, chai_1.expect)(options.only).to.equal("hosting,functions:default:function");
        });
        it("doesn't add untagged functions", async () => {
            delete siteConfig.rewrites[1].function.pinTag;
            await (0, chai_1.expect)((0, prepare_1.addPinnedFunctionsToOnlyString)({}, options)).to.eventually.be.false;
            (0, chai_1.expect)(options.only).to.equal("hosting");
            (0, chai_1.expect)(backendStub.existingBackend).to.not.have.been.called;
        });
    });
});
//# sourceMappingURL=prepare.spec.js.map