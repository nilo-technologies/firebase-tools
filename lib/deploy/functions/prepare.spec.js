"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const build = require("./build");
const prepare = require("./prepare");
const runtimes = require("./runtimes");
const backend = require("./backend");
const ensureApiEnabled = require("../../ensureApiEnabled");
const serviceusage = require("../../gcp/serviceusage");
const prompt = require("../../prompt");
const error_1 = require("../../error");
const v1_1 = require("../../functions/events/v1");
const supported_1 = require("./runtimes/supported");
describe("prepare", () => {
    const ENDPOINT_BASE = {
        platform: "gcfv2",
        id: "id",
        region: "region",
        project: "project",
        entryPoint: "entry",
        runtime: (0, supported_1.latest)("nodejs"),
    };
    const ENDPOINT = {
        ...ENDPOINT_BASE,
        httpsTrigger: {},
    };
    describe("loadCodebases", () => {
        let sandbox;
        let runtimeDelegateStub;
        let discoverBuildStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            discoverBuildStub = sandbox.stub();
            runtimeDelegateStub = {
                language: "nodejs",
                runtime: (0, supported_1.latest)("nodejs"),
                bin: "node",
                validate: sandbox.stub().resolves(),
                build: sandbox.stub().resolves(),
                watch: sandbox.stub().resolves(() => Promise.resolve()),
                discoverBuild: discoverBuildStub,
            };
            discoverBuildStub.resolves(build.of({
                test: {
                    platform: "gcfv2",
                    entryPoint: "test",
                    project: "project",
                    runtime: (0, supported_1.latest)("nodejs"),
                    httpsTrigger: {},
                },
            }));
            sandbox.stub(runtimes, "getRuntimeDelegate").resolves(runtimeDelegateStub);
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should apply the prefix to the function name", async () => {
            const config = [
                { source: "source", codebase: "codebase", prefix: "my-prefix", runtime: "nodejs22" },
            ];
            const options = {
                config: {
                    path: (p) => p,
                },
                projectId: "project",
            };
            const firebaseConfig = { projectId: "project" };
            const runtimeConfig = {};
            const builds = await prepare.loadCodebases(config, options, firebaseConfig, runtimeConfig);
            (0, chai_1.expect)(Object.keys(builds.codebase.endpoints)).to.deep.equal(["my-prefix-test"]);
        });
        it("should preserve runtime from codebase config", async () => {
            const config = [
                { source: "source", codebase: "codebase", runtime: "nodejs20" },
            ];
            const options = {
                config: {
                    path: (p) => p,
                },
                projectId: "project",
            };
            const firebaseConfig = { projectId: "project" };
            const runtimeConfig = {};
            const builds = await prepare.loadCodebases(config, options, firebaseConfig, runtimeConfig);
            (0, chai_1.expect)(builds.codebase.runtime).to.equal("nodejs20");
        });
        it("should pass only firebase config when disallowLegacyRuntimeConfig is true", async () => {
            const config = [
                {
                    source: "source",
                    codebase: "codebase",
                    disallowLegacyRuntimeConfig: true,
                    runtime: "nodejs22",
                },
            ];
            const options = {
                config: {
                    path: (p) => p,
                },
                projectId: "project",
            };
            const firebaseConfig = { projectId: "project" };
            const runtimeConfig = { firebase: firebaseConfig, customKey: "customValue" };
            await prepare.loadCodebases(config, options, firebaseConfig, runtimeConfig);
            (0, chai_1.expect)(discoverBuildStub.calledOnce).to.be.true;
            const callArgs = discoverBuildStub.firstCall.args;
            (0, chai_1.expect)(callArgs[0]).to.deep.equal({ firebase: firebaseConfig });
            (0, chai_1.expect)(callArgs[0]).to.not.have.property("customKey");
        });
        it("should pass full runtime config when disallowLegacyRuntimeConfig is false", async () => {
            const config = [
                {
                    source: "source",
                    codebase: "codebase",
                    disallowLegacyRuntimeConfig: false,
                    runtime: "nodejs22",
                },
            ];
            const options = {
                config: {
                    path: (p) => p,
                },
                projectId: "project",
            };
            const firebaseConfig = { projectId: "project" };
            const runtimeConfig = { firebase: firebaseConfig, customKey: "customValue" };
            await prepare.loadCodebases(config, options, firebaseConfig, runtimeConfig);
            (0, chai_1.expect)(discoverBuildStub.calledOnce).to.be.true;
            const callArgs = discoverBuildStub.firstCall.args;
            (0, chai_1.expect)(callArgs[0]).to.deep.equal(runtimeConfig);
            (0, chai_1.expect)(callArgs[0]).to.have.property("customKey", "customValue");
        });
    });
    describe("inferDetailsFromExisting", () => {
        it("merges env vars if .env is not used", () => {
            const oldE = {
                ...ENDPOINT,
                environmentVariables: {
                    foo: "old value",
                    old: "value",
                },
            };
            const newE = {
                ...ENDPOINT,
                environmentVariables: {
                    foo: "new value",
                    new: "value",
                },
            };
            prepare.inferDetailsFromExisting(backend.of(newE), backend.of(oldE), false);
            (0, chai_1.expect)(newE.environmentVariables).to.deep.equals({
                old: "value",
                new: "value",
                foo: "new value",
            });
        });
        it("overwrites env vars if .env is used", () => {
            const oldE = {
                ...ENDPOINT,
                environmentVariables: {
                    foo: "old value",
                    old: "value",
                },
            };
            const newE = {
                ...ENDPOINT,
                environmentVariables: {
                    foo: "new value",
                    new: "value",
                },
            };
            prepare.inferDetailsFromExisting(backend.of(newE), backend.of(oldE), true);
            (0, chai_1.expect)(newE.environmentVariables).to.deep.equals({
                new: "value",
                foo: "new value",
            });
        });
        it("can noop when there is no prior endpoint", () => {
            const e = { ...ENDPOINT };
            prepare.inferDetailsFromExisting(backend.of(e), backend.of(), false);
            (0, chai_1.expect)(e).to.deep.equal(ENDPOINT);
        });
        it("can fill in regions from last deploy", () => {
            const want = {
                ...ENDPOINT_BASE,
                eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "bucket" },
                    retry: false,
                },
            };
            const have = JSON.parse(JSON.stringify(want));
            have.eventTrigger.region = "us";
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            (0, chai_1.expect)(want.eventTrigger.region).to.equal("us");
        });
        it("doesn't fill in regions if triggers changed", () => {
            const want = {
                ...ENDPOINT_BASE,
                eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalzied",
                    eventFilters: { bucket: "us-bucket" },
                    retry: false,
                },
            };
            const have = JSON.parse(JSON.stringify(want));
            have.eventTrigger.eventFilters = { bucket: "us-central1-bucket" };
            have.eventTrigger.region = "us-central1";
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            (0, chai_1.expect)(want.eventTrigger.region).to.be.undefined;
        });
        it("fills in instance size", () => {
            const want = {
                ...ENDPOINT_BASE,
                httpsTrigger: {},
            };
            const have = JSON.parse(JSON.stringify(want));
            have.availableMemoryMb = 512;
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            (0, chai_1.expect)(want.availableMemoryMb).to.equal(512);
        });
        it("downgrades concurrency if necessary (explicit)", () => {
            const have = {
                ...ENDPOINT_BASE,
                httpsTrigger: {},
                concurrency: 80,
                cpu: 1,
            };
            const want = {
                ...ENDPOINT_BASE,
                httpsTrigger: {},
                cpu: 0.5,
            };
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            prepare.resolveCpuAndConcurrency(backend.of(want));
            (0, chai_1.expect)(want.concurrency).to.equal(1);
        });
        it("downgrades concurrency if necessary (implicit)", () => {
            const have = {
                ...ENDPOINT_BASE,
                httpsTrigger: {},
                concurrency: 80,
                cpu: 1,
            };
            const want = {
                ...ENDPOINT_BASE,
                httpsTrigger: {},
                cpu: "gcf_gen1",
            };
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            prepare.resolveCpuAndConcurrency(backend.of(want));
            (0, chai_1.expect)(want.concurrency).to.equal(1);
        });
        it("upgrades default concurrency with CPU upgrades", () => {
            const have = {
                ...ENDPOINT_BASE,
                httpsTrigger: {},
                availableMemoryMb: 256,
                cpu: "gcf_gen1",
            };
            const want = {
                ...ENDPOINT_BASE,
                httpsTrigger: {},
            };
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            prepare.resolveCpuAndConcurrency(backend.of(want));
            (0, chai_1.expect)(want.concurrency).to.equal(1);
        });
    });
    describe("inferBlockingDetails", () => {
        it("should merge the blocking options and set default value", () => {
            const beforeCreate = {
                ...ENDPOINT_BASE,
                id: "beforeCreate",
                blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: true,
                        refreshToken: false,
                    },
                },
            };
            const beforeSignIn = {
                ...ENDPOINT_BASE,
                id: "beforeSignIn",
                blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                    },
                },
            };
            prepare.inferBlockingDetails(backend.of(beforeCreate, beforeSignIn));
            (0, chai_1.expect)(beforeCreate.blockingTrigger.options?.accessToken).to.be.true;
            (0, chai_1.expect)(beforeCreate.blockingTrigger.options?.idToken).to.be.true;
            (0, chai_1.expect)(beforeCreate.blockingTrigger.options?.refreshToken).to.be.false;
            (0, chai_1.expect)(beforeSignIn.blockingTrigger.options?.accessToken).to.be.true;
            (0, chai_1.expect)(beforeSignIn.blockingTrigger.options?.idToken).to.be.true;
            (0, chai_1.expect)(beforeSignIn.blockingTrigger.options?.refreshToken).to.be.false;
        });
    });
    describe("updateEndpointTargetedStatus", () => {
        let endpoint1InBackend1;
        let endpoint2InBackend1;
        let endpoint1InBackend2;
        let endpoint2InBackend2;
        let backends;
        beforeEach(() => {
            endpoint1InBackend1 = {
                ...ENDPOINT,
                id: "endpoint1",
                platform: "gcfv1",
                codebase: "backend1",
            };
            endpoint2InBackend1 = {
                ...ENDPOINT,
                id: "endpoint2",
                platform: "gcfv1",
                codebase: "backend1",
            };
            endpoint1InBackend2 = {
                ...ENDPOINT,
                id: "endpoint1",
                platform: "gcfv2",
                codebase: "backend2",
            };
            endpoint2InBackend2 = {
                ...ENDPOINT,
                id: "endpoint2",
                platform: "gcfv2",
                codebase: "backend2",
            };
            const backend1 = backend.of(endpoint1InBackend1, endpoint2InBackend1);
            const backend2 = backend.of(endpoint1InBackend2, endpoint2InBackend2);
            backends = { backend1, backend2 };
        });
        it("should mark targeted codebases", () => {
            const filters = [{ codebase: "backend1" }];
            prepare.updateEndpointTargetedStatus(backends, filters);
            (0, chai_1.expect)(endpoint1InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint2InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint1InBackend2.targetedByOnly).to.be.false;
            (0, chai_1.expect)(endpoint2InBackend2.targetedByOnly).to.be.false;
        });
        it("should mark targeted codebases + ids", () => {
            const filters = [{ codebase: "backend1", idChunks: ["endpoint1"] }];
            prepare.updateEndpointTargetedStatus(backends, filters);
            (0, chai_1.expect)(endpoint1InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint2InBackend1.targetedByOnly).to.be.false;
            (0, chai_1.expect)(endpoint1InBackend2.targetedByOnly).to.be.false;
            (0, chai_1.expect)(endpoint2InBackend2.targetedByOnly).to.be.false;
        });
        it("should mark targeted ids", () => {
            const filters = [{ idChunks: ["endpoint1"] }];
            prepare.updateEndpointTargetedStatus(backends, filters);
            (0, chai_1.expect)(endpoint1InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint2InBackend1.targetedByOnly).to.be.false;
            (0, chai_1.expect)(endpoint1InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint2InBackend2.targetedByOnly).to.be.false;
        });
    });
    describe("warnIfNewGenkitFunctionIsMissingSecrets", () => {
        const nonGenkitEndpoint = {
            id: "nonGenkit",
            platform: "gcfv2",
            region: "us-central1",
            project: "project",
            entryPoint: "entry",
            runtime: (0, supported_1.latest)("nodejs"),
            httpsTrigger: {},
        };
        const genkitEndpointWithSecrets = {
            id: "genkitWithSecrets",
            platform: "gcfv2",
            region: "us-central1",
            project: "project",
            entryPoint: "entry",
            runtime: (0, supported_1.latest)("nodejs"),
            callableTrigger: {
                genkitAction: "action",
            },
            secretEnvironmentVariables: [
                {
                    key: "SECRET",
                    secret: "secret",
                    projectId: "project",
                },
            ],
        };
        const genkitEndpointWithoutSecrets = {
            id: "genkitWithoutSecrets",
            platform: "gcfv2",
            region: "us-central1",
            project: "project",
            entryPoint: "entry",
            runtime: (0, supported_1.latest)("nodejs"),
            callableTrigger: {
                genkitAction: "action",
            },
        };
        let confirm;
        beforeEach(() => {
            confirm = sinon.stub(prompt, "confirm");
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("should not prompt if there are no genkit functions", async () => {
            await prepare.warnIfNewGenkitFunctionIsMissingSecrets(backend.empty(), backend.of(nonGenkitEndpoint), {});
            (0, chai_1.expect)(confirm).to.not.be.called;
        });
        it("should not prompt if all genkit functions have secrets", async () => {
            await prepare.warnIfNewGenkitFunctionIsMissingSecrets(backend.empty(), backend.of(genkitEndpointWithSecrets), {});
            (0, chai_1.expect)(confirm).to.not.be.called;
        });
        it("should not prompt if the function is already deployed", async () => {
            await prepare.warnIfNewGenkitFunctionIsMissingSecrets(backend.of(genkitEndpointWithoutSecrets), backend.of(genkitEndpointWithoutSecrets), {});
            (0, chai_1.expect)(confirm).to.not.be.called;
        });
        it("should not prompt if force is true", async () => {
            await prepare.warnIfNewGenkitFunctionIsMissingSecrets(backend.empty(), backend.of(genkitEndpointWithoutSecrets), { force: true });
            (0, chai_1.expect)(confirm).to.not.be.called;
        });
        it("should throw if missing secrets and noninteractive", async () => {
            confirm.resolves(false);
            await (0, chai_1.expect)(prepare.warnIfNewGenkitFunctionIsMissingSecrets(backend.empty(), backend.of(genkitEndpointWithoutSecrets), { nonInteractive: true })).to.be.rejectedWith(error_1.FirebaseError);
            (0, chai_1.expect)(confirm).to.have.been.calledWithMatch({ nonInteractive: true });
        });
        it("should prompt if missing secrets and interactive", async () => {
            confirm.resolves(true);
            await prepare.warnIfNewGenkitFunctionIsMissingSecrets(backend.empty(), backend.of(genkitEndpointWithoutSecrets), {});
            (0, chai_1.expect)(confirm).to.be.calledOnce;
        });
        it("should throw if user declines to deploy", async () => {
            confirm.resolves(false);
            await (0, chai_1.expect)(prepare.warnIfNewGenkitFunctionIsMissingSecrets(backend.empty(), backend.of(genkitEndpointWithoutSecrets), {})).to.be.rejectedWith(error_1.FirebaseError);
        });
    });
    describe("ensureAllRequiredAPIsEnabled", () => {
        let sinonSandbox;
        let ensureApiStub;
        let generateServiceIdentityStub;
        beforeEach(() => {
            sinonSandbox = sinon.createSandbox();
            ensureApiStub = sinonSandbox.stub(ensureApiEnabled, "ensure").resolves();
            generateServiceIdentityStub = sinonSandbox
                .stub(serviceusage, "generateServiceIdentity")
                .resolves();
        });
        afterEach(() => {
            sinonSandbox.restore();
        });
        it("should not enable any APIs for an empty backend", async () => {
            await prepare.ensureAllRequiredAPIsEnabled("project", backend.empty());
            (0, chai_1.expect)(ensureApiStub.called).to.be.false;
            (0, chai_1.expect)(generateServiceIdentityStub.called).to.be.false;
        });
        it("should enable APIs from backend.requiredAPIs", async () => {
            const api1 = "testapi1.googleapis.com";
            const api2 = "testapi2.googleapis.com";
            const b = backend.empty();
            b.requiredAPIs = [{ api: api1 }, { api: api2 }];
            await prepare.ensureAllRequiredAPIsEnabled("project", b);
            (0, chai_1.expect)(ensureApiStub.calledWith("project", api1, "functions", false)).to.be.true;
            (0, chai_1.expect)(ensureApiStub.calledWith("project", api2, "functions", false)).to.be.true;
        });
        it("should enable Secret Manager API if secrets are used ", async () => {
            const e = {
                id: "hasSecrets",
                platform: "gcfv1",
                region: "us-central1",
                project: "project",
                entryPoint: "entry",
                runtime: (0, supported_1.latest)("nodejs"),
                httpsTrigger: {},
                secretEnvironmentVariables: [
                    {
                        key: "SECRET",
                        secret: "secret",
                        projectId: "project",
                    },
                ],
            };
            await prepare.ensureAllRequiredAPIsEnabled("project", backend.of(e));
            (0, chai_1.expect)(ensureApiStub.calledWith("project", "https://secretmanager.googleapis.com", "functions", false)).to.be.true;
        });
        it("should enable GCFv2 APIs and generate required service identities", async () => {
            const e = {
                id: "v2",
                platform: "gcfv2",
                region: "us-central1",
                project: "project",
                entryPoint: "entry",
                runtime: (0, supported_1.latest)("nodejs"),
                httpsTrigger: {},
            };
            await prepare.ensureAllRequiredAPIsEnabled("project", backend.of(e));
            (0, chai_1.expect)(ensureApiStub.calledWith("project", "https://run.googleapis.com", "functions")).to.be
                .true;
            (0, chai_1.expect)(ensureApiStub.calledWith("project", "https://eventarc.googleapis.com", "functions")).to
                .be.true;
            (0, chai_1.expect)(ensureApiStub.calledWith("project", "https://pubsub.googleapis.com", "functions")).to
                .be.true;
            (0, chai_1.expect)(ensureApiStub.calledWith("project", "https://storage.googleapis.com", "functions")).to
                .be.true;
            (0, chai_1.expect)(generateServiceIdentityStub.calledWith("project", "pubsub.googleapis.com", "functions")).to.be.true;
            (0, chai_1.expect)(generateServiceIdentityStub.calledWith("project", "eventarc.googleapis.com", "functions")).to.be.true;
        });
    });
});
//# sourceMappingURL=prepare.spec.js.map