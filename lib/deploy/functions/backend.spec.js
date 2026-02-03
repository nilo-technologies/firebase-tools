"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const error_1 = require("../../error");
const backend = require("./backend");
const gcf = require("../../gcp/cloudfunctions");
const gcfV2 = require("../../gcp/cloudfunctionsv2");
const run = require("../../gcp/runv2");
const experiments = require("../../experiments");
const utils = require("../../utils");
const projectConfig = require("../../functions/projectConfig");
describe("Backend", () => {
    const FUNCTION_NAME = {
        id: "id",
        region: "region",
        project: "project",
    };
    const ENDPOINT = {
        platform: "gcfv1",
        ...FUNCTION_NAME,
        entryPoint: "function",
        runtime: "nodejs16",
        codebase: projectConfig.DEFAULT_CODEBASE,
        state: "ACTIVE",
    };
    const CLOUD_FUNCTION = {
        name: "projects/project/locations/region/functions/id",
        entryPoint: "function",
        runtime: "nodejs16",
    };
    const CLOUD_FUNCTION_V2_SOURCE = {
        bucket: "sample",
        object: "source.zip",
        generation: 42,
    };
    const CLOUD_FUNCTION_V2 = {
        name: "projects/project/locations/region/functions/id",
        buildConfig: {
            entryPoint: "function",
            runtime: "nodejs16",
            source: {
                storageSource: CLOUD_FUNCTION_V2_SOURCE,
            },
            environmentVariables: {},
        },
        serviceConfig: {
            service: "projects/project/locations/region/services/service",
            availableCpu: "1",
            maxInstanceRequestConcurrency: 80,
        },
    };
    const GCF_URL = "https://region-project.cloudfunctions.net/id";
    const HAVE_CLOUD_FUNCTION_V2 = {
        ...CLOUD_FUNCTION_V2,
        serviceConfig: {
            service: "service",
            uri: GCF_URL,
            availableCpu: "1",
            maxInstanceRequestConcurrency: 80,
        },
        url: GCF_URL,
        state: "ACTIVE",
        updateTime: new Date(),
    };
    const RUN_SERVICE = {
        name: "projects/project/locations/region/services/id",
        labels: {
            "goog-managed-by": "cloud-functions",
            "goog-cloudfunctions-runtime": "nodejs16",
            "firebase-functions-codebase": "default",
        },
        annotations: {
            "cloudfunctions.googleapis.com/function-id": "id",
            "cloudfunctions.googleapis.com/trigger-type": "HTTP_TRIGGER",
        },
        template: {
            containers: [
                {
                    name: "worker",
                    image: "image",
                    env: [{ name: "FUNCTION_TARGET", value: "function" }],
                    resources: {
                        limits: {
                            cpu: "1",
                            memory: "256Mi",
                        },
                    },
                },
            ],
            containerConcurrency: 80,
        },
        generation: 1,
        createTime: "2023-01-01T00:00:00Z",
        updateTime: "2023-01-01T00:00:00Z",
        creator: "user",
        lastModifier: "user",
        etag: "etag",
    };
    const HAVE_CLOUD_FUNCTION = {
        ...CLOUD_FUNCTION,
        buildId: "buildId",
        versionId: 1,
        updateTime: new Date(),
        status: "ACTIVE",
    };
    describe("Helper functions", () => {
        it("isEmptyBackend", () => {
            (0, chai_1.expect)(backend.isEmptyBackend(backend.empty())).to.be.true;
            (0, chai_1.expect)(backend.isEmptyBackend({
                ...backend.empty(),
                requiredAPIs: [{ api: "foo.googleapis.com", reason: "foo" }],
            })).to.be.false;
            (0, chai_1.expect)(backend.isEmptyBackend(backend.of({ ...ENDPOINT, httpsTrigger: {} })));
        });
        it("names", () => {
            (0, chai_1.expect)(backend.functionName(ENDPOINT)).to.equal("projects/project/locations/region/functions/id");
        });
        it("merge", () => {
            const BASE_ENDPOINT = { ...ENDPOINT, httpsTrigger: {} };
            const e1 = { ...BASE_ENDPOINT, id: "1" };
            const e21 = { ...BASE_ENDPOINT, id: "2.1" };
            const e22 = { ...BASE_ENDPOINT, id: "2.2" };
            const e3 = { ...BASE_ENDPOINT, id: "3" };
            const b1 = backend.of(e1);
            b1.environmentVariables = { foo: "bar" };
            b1.requiredAPIs = [
                { reason: "a", api: "a.com" },
                { reason: "b", api: "b.com" },
            ];
            const b2 = backend.of(e21, e22);
            b2.environmentVariables = { bar: "foo" };
            const b3 = backend.of(e3);
            b3.requiredAPIs = [{ reason: "a", api: "a.com" }];
            const got = backend.merge(b3, b2, b1);
            (0, chai_1.expect)(backend.allEndpoints(got)).to.have.deep.members([e1, e21, e22, e3]);
            (0, chai_1.expect)(got.environmentVariables).to.deep.equal({ foo: "bar", bar: "foo" });
            (0, chai_1.expect)(got.requiredAPIs).to.have.deep.members([
                { reason: "a", api: "a.com" },
                { reason: "b", api: "b.com" },
            ]);
        });
    });
    describe("existing backend", () => {
        let listAllFunctions;
        let listAllFunctionsV2;
        let listServices;
        let logLabeledWarning;
        let isEnabled;
        beforeEach(() => {
            listAllFunctions = sinon.stub(gcf, "listAllFunctions").rejects("Unexpected call");
            listAllFunctionsV2 = sinon.stub(gcfV2, "listAllFunctions").rejects("Unexpected v2 call");
            listServices = sinon.stub(run, "listServices").rejects("Unexpected run call");
            logLabeledWarning = sinon.spy(utils, "logLabeledWarning");
            isEnabled = sinon.stub(experiments, "isEnabled").returns(false);
        });
        afterEach(() => {
            listAllFunctions.restore();
            listAllFunctionsV2.restore();
            listServices.restore();
            logLabeledWarning.restore();
            isEnabled.restore();
        });
        function newContext() {
            return {};
        }
        describe("existingBackend", () => {
            it("should throw error when functions list fails", async () => {
                const context = newContext();
                listAllFunctions.rejects(new error_1.FirebaseError("Failed to list functions"));
                await (0, chai_1.expect)(backend.existingBackend(context)).to.be.rejected;
            });
            it("should cache", async () => {
                const context = newContext();
                listAllFunctions.onFirstCall().resolves({
                    functions: [
                        {
                            ...HAVE_CLOUD_FUNCTION,
                            httpsTrigger: {},
                        },
                    ],
                    unreachable: ["region"],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                const firstBackend = await backend.existingBackend(context);
                const secondBackend = await backend.existingBackend(context);
                await backend.checkAvailability(context, backend.empty());
                (0, chai_1.expect)(firstBackend).to.deep.equal(secondBackend);
                (0, chai_1.expect)(listAllFunctions).to.be.calledOnce;
                (0, chai_1.expect)(listAllFunctionsV2).to.be.calledOnce;
            });
            it("should translate functions", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [
                        {
                            ...HAVE_CLOUD_FUNCTION,
                            httpsTrigger: {},
                        },
                    ],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                const have = await backend.existingBackend(newContext());
                (0, chai_1.expect)(have).to.deep.equal(backend.of({ ...ENDPOINT, httpsTrigger: {} }));
            });
            it("should throw an error if v2 list api throws an error", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.throws(new error_1.FirebaseError("HTTP Error: 500, Internal Error", { status: 500 }));
                await (0, chai_1.expect)(backend.existingBackend(newContext())).to.be.rejectedWith("HTTP Error: 500, Internal Error");
            });
            it("should read v2 functions when enabled", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [HAVE_CLOUD_FUNCTION_V2],
                    unreachable: [],
                });
                const have = await backend.existingBackend(newContext());
                (0, chai_1.expect)(have).to.deep.equal(backend.of({
                    ...ENDPOINT,
                    platform: "gcfv2",
                    concurrency: 80,
                    cpu: 1,
                    httpsTrigger: {},
                    runServiceId: HAVE_CLOUD_FUNCTION_V2.serviceConfig?.service,
                    source: HAVE_CLOUD_FUNCTION_V2.buildConfig?.source,
                    uri: HAVE_CLOUD_FUNCTION_V2.serviceConfig?.uri,
                }));
            });
            it("should deduce features of scheduled functions", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [
                        {
                            ...HAVE_CLOUD_FUNCTION,
                            eventTrigger: {
                                eventType: "google.pubsub.topic.publish",
                                resource: "projects/project/topics/topic",
                            },
                            labels: {
                                "deployment-scheduled": "true",
                            },
                        },
                    ],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                const have = await backend.existingBackend(newContext());
                const want = backend.of({
                    ...ENDPOINT,
                    scheduleTrigger: {},
                    labels: {
                        "deployment-scheduled": "true",
                    },
                });
                (0, chai_1.expect)(have).to.deep.equal(want);
            });
            it("should read v2 functions from Cloud Run when experiment is enabled", async () => {
                isEnabled.withArgs("functionsrunapionly").returns(true);
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listServices.onFirstCall().resolves([RUN_SERVICE]);
                const have = await backend.existingBackend(newContext());
                const wantEndpoint = {
                    ...ENDPOINT,
                    platform: "gcfv2",
                    concurrency: 80,
                    cpu: 1,
                    httpsTrigger: {},
                    availableMemoryMb: 256,
                    environmentVariables: {
                        FUNCTION_TARGET: "function",
                    },
                    labels: {
                        "goog-managed-by": "cloud-functions",
                        "goog-cloudfunctions-runtime": "nodejs16",
                        "firebase-functions-codebase": "default",
                    },
                    secretEnvironmentVariables: [],
                };
                delete wantEndpoint.state;
                (0, chai_1.expect)(have).to.deep.equal(backend.of(wantEndpoint));
                (0, chai_1.expect)(listAllFunctionsV2).to.not.have.been.called;
            });
            it("should handle Cloud Run list errors gracefully when experiment is enabled", async () => {
                isEnabled.withArgs("functionsrunapionly").returns(true);
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listServices.rejects(new Error("Random error"));
                const context = newContext();
                await backend.existingBackend(context);
                (0, chai_1.expect)(context.unreachableRegions?.run).to.deep.equal(["unknown"]);
            });
        });
        describe("checkAvailability", () => {
            it("should throw error when functions list fails", async () => {
                const context = newContext();
                listAllFunctions.rejects(new error_1.FirebaseError("Failed to list functions"));
                await (0, chai_1.expect)(backend.checkAvailability(context, backend.empty())).to.be.rejected;
            });
            it("should do nothing when regions are all avalable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                await backend.checkAvailability(newContext(), backend.empty());
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.not.have.been.called;
            });
            it("should warn if an unused GCFv1 backend is unavailable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["region"],
                });
                listAllFunctionsV2.resolves({
                    functions: [],
                    unreachable: [],
                });
                await backend.checkAvailability(newContext(), backend.empty());
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.have.been.called;
            });
            it("should warn if an unused GCFv2 backend is unavailable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["region"],
                });
                await backend.checkAvailability(newContext(), backend.empty());
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.have.been.called;
            });
            it("should throw if a needed GCFv1 region is unavailable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["region"],
                });
                listAllFunctionsV2.resolves({
                    functions: [],
                    unreachable: [],
                });
                const want = backend.of({ ...ENDPOINT, httpsTrigger: {} });
                await (0, chai_1.expect)(backend.checkAvailability(newContext(), want)).to.eventually.be.rejectedWith(error_1.FirebaseError, /The following Cloud Functions regions are currently unreachable:/);
            });
            it("should throw if a GCFv2 needed region is unavailable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["region"],
                });
                const want = backend.of({
                    ...ENDPOINT,
                    platform: "gcfv2",
                    httpsTrigger: {},
                });
                await (0, chai_1.expect)(backend.checkAvailability(newContext(), want)).to.eventually.be.rejectedWith(error_1.FirebaseError, /The following Cloud Functions V2 regions are currently unreachable:/);
            });
            it("Should only warn when deploying GCFv1 and GCFv2 is unavailable.", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["us-central1"],
                });
                const want = backend.of({ ...ENDPOINT, httpsTrigger: {} });
                await backend.checkAvailability(newContext(), want);
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.have.been.called;
            });
            it("Should only warn when deploying GCFv2 and GCFv1 is unavailable.", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["us-central1"],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                const want = backend.of({ ...ENDPOINT, httpsTrigger: {} });
                await backend.checkAvailability(newContext(), want);
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.have.been.called;
            });
        });
    });
    describe("compareFunctions", () => {
        const fnMembers = {
            project: "project",
            runtime: "nodejs14",
            httpsTrigger: {},
        };
        it("should compare different platforms", () => {
            const left = {
                id: "v1",
                region: "us-central1",
                platform: "gcfv1",
                entryPoint: "v1",
                ...fnMembers,
            };
            const right = {
                id: "v2",
                region: "us-west1",
                platform: "gcfv2",
                entryPoint: "v2",
                ...fnMembers,
            };
            (0, chai_1.expect)(backend.compareFunctions(left, right)).to.eq(1);
            (0, chai_1.expect)(backend.compareFunctions(right, left)).to.eq(-1);
        });
        it("should compare different regions, same platform", () => {
            const left = {
                id: "v1",
                region: "us-west1",
                platform: "gcfv1",
                entryPoint: "v1",
                ...fnMembers,
            };
            const right = {
                id: "newV1",
                region: "us-central1",
                platform: "gcfv1",
                entryPoint: "newV1",
                ...fnMembers,
            };
            (0, chai_1.expect)(backend.compareFunctions(left, right)).to.eq(1);
            (0, chai_1.expect)(backend.compareFunctions(right, left)).to.eq(-1);
        });
        it("should compare different ids, same platform & region", () => {
            const left = {
                id: "v1",
                region: "us-central1",
                platform: "gcfv1",
                entryPoint: "v1",
                ...fnMembers,
            };
            const right = {
                id: "newV1",
                region: "us-central1",
                platform: "gcfv1",
                entryPoint: "newV1",
                ...fnMembers,
            };
            (0, chai_1.expect)(backend.compareFunctions(left, right)).to.eq(1);
            (0, chai_1.expect)(backend.compareFunctions(right, left)).to.eq(-1);
        });
        it("should compare same ids", () => {
            const left = {
                id: "v1",
                region: "us-central1",
                platform: "gcfv1",
                entryPoint: "v1",
                ...fnMembers,
            };
            const right = {
                id: "v1",
                region: "us-central1",
                platform: "gcfv1",
                entryPoint: "v1",
                ...fnMembers,
            };
            (0, chai_1.expect)(backend.compareFunctions(left, right)).to.eq(0);
        });
    });
    describe("comprehension helpers", () => {
        const endpointUS = {
            id: "endpointUS",
            project: "project",
            region: "us-west1",
            platform: "gcfv2",
            runtime: "nodejs16",
            entryPoint: "ep",
            httpsTrigger: {},
        };
        const endpointEU = {
            ...endpointUS,
            id: "endpointEU",
            region: "europe-west1",
        };
        const bkend = {
            ...backend.empty(),
        };
        bkend.endpoints[endpointUS.region] = { [endpointUS.id]: endpointUS };
        bkend.endpoints[endpointEU.region] = { [endpointEU.id]: endpointEU };
        bkend.requiredAPIs = [{ api: "api.google.com", reason: "required" }];
        it("allEndpoints", () => {
            const have = backend.allEndpoints(bkend).sort(backend.compareFunctions);
            const want = [endpointUS, endpointEU].sort(backend.compareFunctions);
            (0, chai_1.expect)(have).to.deep.equal(want);
        });
        it("matchingBackend", () => {
            const have = backend.matchingBackend(bkend, (fn) => fn.id === "endpointUS");
            const want = {
                ...backend.empty(),
                endpoints: {
                    [endpointUS.region]: {
                        [endpointUS.id]: endpointUS,
                    },
                },
                requiredAPIs: [{ api: "api.google.com", reason: "required" }],
            };
            (0, chai_1.expect)(have).to.deep.equal(want);
        });
        it("someEndpoint", () => {
            (0, chai_1.expect)(backend.someEndpoint(bkend, (fn) => fn.id === "endpointUS")).to.be.true;
            (0, chai_1.expect)(backend.someEndpoint(bkend, (fn) => fn.id === "missing")).to.be.false;
        });
        it("findEndpoint", () => {
            (0, chai_1.expect)(backend.findEndpoint(bkend, (fn) => fn.id === "endpointUS")).to.be.deep.equal(endpointUS);
            (0, chai_1.expect)(backend.findEndpoint(bkend, (fn) => fn.id === "missing")).to.be.undefined;
        });
        it("regionalEndpoints", () => {
            const have = backend.regionalEndpoints(bkend, endpointUS.region);
            const want = [endpointUS];
            (0, chai_1.expect)(have).to.deep.equal(want);
        });
        it("hasEndpoint", () => {
            const smallBackend = backend.matchingBackend(bkend, (fn) => fn.id === "endpointUS");
            (0, chai_1.expect)(backend.hasEndpoint(smallBackend)(endpointUS)).to.be.true;
            (0, chai_1.expect)(backend.hasEndpoint(smallBackend)(endpointEU)).to.be.false;
        });
        it("missingEndpoint", () => {
            const smallBackend = backend.matchingBackend(bkend, (fn) => fn.id === "endpointUS");
            (0, chai_1.expect)(backend.missingEndpoint(smallBackend)(endpointUS)).to.be.false;
            (0, chai_1.expect)(backend.missingEndpoint(smallBackend)(endpointEU)).to.be.true;
        });
    });
});
//# sourceMappingURL=backend.spec.js.map