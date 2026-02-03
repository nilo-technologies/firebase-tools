"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const runv2 = require("./runv2");
const backend = require("../deploy/functions/backend");
const supported_1 = require("../deploy/functions/runtimes/supported");
const constants_1 = require("../functions/constants");
const apiv2_1 = require("../apiv2");
const error_1 = require("../error");
describe("runv2", () => {
    const PROJECT_ID = "project-id";
    const LOCATION = "us-central1";
    const SERVICE_ID = "functionid";
    const FUNCTION_ID = "functionId";
    const IMAGE_URI = "gcr.io/project/image:latest";
    const BASE_ENDPOINT_RUN = {
        platform: "run",
        id: FUNCTION_ID,
        project: PROJECT_ID,
        region: LOCATION,
        entryPoint: FUNCTION_ID,
        runtime: (0, supported_1.latest)("nodejs"),
        availableMemoryMb: 256,
        cpu: 1,
    };
    const BASE_RUN_SERVICE = {
        name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${SERVICE_ID}`,
        labels: {
            [runv2.RUNTIME_LABEL]: (0, supported_1.latest)("nodejs"),
            [runv2.CLIENT_NAME_LABEL]: "firebase-functions",
        },
        annotations: {
            [runv2.FIREBASE_FUNCTION_METADTA_ANNOTATION]: `{"functionId":"${FUNCTION_ID}"}`,
        },
        template: {
            containers: [
                {
                    name: "worker",
                    image: IMAGE_URI,
                    env: [
                        {
                            name: runv2.FUNCTION_TARGET_ENV,
                            value: FUNCTION_ID,
                        },
                        {
                            name: runv2.FUNCTION_SIGNATURE_TYPE_ENV,
                            value: "http",
                        },
                    ],
                    resources: {
                        limits: {
                            cpu: "1",
                            memory: "256Mi",
                        },
                        startupCpuBoost: true,
                        cpuIdle: true,
                    },
                },
            ],
            containerConcurrency: backend.DEFAULT_CONCURRENCY,
        },
        client: "cli-firebase",
    };
    describe("serviceFromEndpoint", () => {
        it("should copy a minimal endpoint", () => {
            const endpoint = {
                ...BASE_ENDPOINT_RUN,
                httpsTrigger: {},
            };
            (0, chai_1.expect)(runv2.serviceFromEndpoint(endpoint, IMAGE_URI)).to.deep.equal(BASE_RUN_SERVICE);
        });
        it("should handle different codebase", () => {
            const endpoint = {
                ...BASE_ENDPOINT_RUN,
                codebase: "my-codebase",
                httpsTrigger: {},
            };
            const expectedServiceInput = {
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${FUNCTION_ID.toLowerCase()}`,
                labels: {
                    ...BASE_RUN_SERVICE.labels,
                    [constants_1.CODEBASE_LABEL]: "my-codebase",
                },
            };
            (0, chai_1.expect)(runv2.serviceFromEndpoint(endpoint, IMAGE_URI)).to.deep.equal(expectedServiceInput);
        });
        it("should copy environment variables", () => {
            const endpoint = {
                ...BASE_ENDPOINT_RUN,
                httpsTrigger: {},
                environmentVariables: { FOO: "bar" },
            };
            const expectedServiceInput = JSON.parse(JSON.stringify({
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${FUNCTION_ID.toLowerCase()}`,
            }));
            expectedServiceInput.template.containers[0].env.unshift({ name: "FOO", value: "bar" });
            (0, chai_1.expect)(runv2.serviceFromEndpoint(endpoint, IMAGE_URI)).to.deep.equal(expectedServiceInput);
        });
        it("should copy secret environment variables", () => {
            const endpoint = {
                ...BASE_ENDPOINT_RUN,
                httpsTrigger: {},
                secretEnvironmentVariables: [
                    { key: "MY_SECRET", secret: "secret-name", projectId: PROJECT_ID, version: "1" },
                ],
            };
            const expectedServiceInput = JSON.parse(JSON.stringify({
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${FUNCTION_ID.toLowerCase()}`,
            }));
            expectedServiceInput.template.containers[0].env.unshift({
                name: "MY_SECRET",
                valueSource: { secretKeyRef: { secret: "secret-name", version: "1" } },
            });
            (0, chai_1.expect)(runv2.serviceFromEndpoint(endpoint, IMAGE_URI)).to.deep.equal(expectedServiceInput);
        });
        it("should set min/max instances annotations", () => {
            const endpoint = {
                ...BASE_ENDPOINT_RUN,
                httpsTrigger: {},
                minInstances: 1,
                maxInstances: 10,
            };
            const expectedServiceInput = JSON.parse(JSON.stringify({
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${FUNCTION_ID.toLowerCase()}`,
            }));
            expectedServiceInput.scaling = {
                minInstanceCount: 1,
                maxInstanceCount: 10,
            };
            (0, chai_1.expect)(runv2.serviceFromEndpoint(endpoint, IMAGE_URI)).to.deep.equal(expectedServiceInput);
        });
        it("should set concurrency", () => {
            const endpoint = {
                ...BASE_ENDPOINT_RUN,
                httpsTrigger: {},
                concurrency: 50,
            };
            const expectedServiceInput = JSON.parse(JSON.stringify({
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${FUNCTION_ID.toLowerCase()}`,
            }));
            expectedServiceInput.template.containerConcurrency = 50;
            (0, chai_1.expect)(runv2.serviceFromEndpoint(endpoint, IMAGE_URI)).to.deep.equal(expectedServiceInput);
        });
        it("should set memory and CPU", () => {
            const endpoint = {
                ...BASE_ENDPOINT_RUN,
                httpsTrigger: {},
                availableMemoryMb: 512,
                cpu: 2,
            };
            const expectedServiceInput = JSON.parse(JSON.stringify({
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${FUNCTION_ID.toLowerCase()}`,
            }));
            expectedServiceInput.template.containers[0].resources.limits.memory = "512Mi";
            expectedServiceInput.template.containers[0].resources.limits.cpu = "2";
            (0, chai_1.expect)(runv2.serviceFromEndpoint(endpoint, IMAGE_URI)).to.deep.equal(expectedServiceInput);
        });
        it("should remove deployment-tool label", () => {
            const endpoint = {
                ...BASE_ENDPOINT_RUN,
                httpsTrigger: {},
                labels: { "deployment-tool": "firebase-cli" },
            };
            const result = runv2.serviceFromEndpoint(endpoint, IMAGE_URI);
            (0, chai_1.expect)(result.labels?.["deployment-tool"]).to.be.undefined;
            (0, chai_1.expect)(result.labels?.[runv2.CLIENT_NAME_LABEL]).to.equal("firebase-functions");
        });
    });
    describe("endpointFromService", () => {
        it("should copy a minimal service", () => {
            const service = {
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${SERVICE_ID}`,
                annotations: {
                    ...BASE_RUN_SERVICE.annotations,
                    [runv2.FUNCTION_ID_ANNOTATION]: FUNCTION_ID,
                    [runv2.FUNCTION_TARGET_ANNOTATION]: "customEntryPoint",
                    [runv2.TRIGGER_TYPE_ANNOTATION]: "HTTP_TRIGGER",
                },
                template: {
                    containers: [
                        {
                            name: "worker",
                            image: IMAGE_URI,
                            resources: {
                                limits: {
                                    cpu: "1",
                                    memory: "256Mi",
                                },
                                cpuIdle: true,
                                startupCpuBoost: true,
                            },
                        },
                    ],
                },
            };
            const expectedEndpoint = {
                platform: "run",
                id: FUNCTION_ID,
                project: PROJECT_ID,
                region: LOCATION,
                runtime: (0, supported_1.latest)("nodejs"),
                entryPoint: "customEntryPoint",
                availableMemoryMb: 256,
                cpu: 1,
                httpsTrigger: {},
                labels: {
                    [runv2.RUNTIME_LABEL]: (0, supported_1.latest)("nodejs"),
                    [runv2.CLIENT_NAME_LABEL]: "firebase-functions",
                },
                environmentVariables: {},
                secretEnvironmentVariables: [],
            };
            (0, chai_1.expect)(runv2.endpointFromService(service)).to.deep.equal(expectedEndpoint);
        });
        it("should detect a service that's GCF managed", () => {
            const service = {
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${SERVICE_ID}`,
                labels: {
                    [runv2.RUNTIME_LABEL]: (0, supported_1.latest)("nodejs"),
                    [runv2.CLIENT_NAME_LABEL]: "cloud-functions",
                },
                annotations: {
                    ...BASE_RUN_SERVICE.annotations,
                    [runv2.FUNCTION_ID_ANNOTATION]: FUNCTION_ID,
                    [runv2.FUNCTION_TARGET_ANNOTATION]: "customEntryPoint",
                    [runv2.TRIGGER_TYPE_ANNOTATION]: "HTTP_TRIGGER",
                },
                template: {
                    containers: [
                        {
                            name: "worker",
                            image: IMAGE_URI,
                            resources: {
                                limits: {
                                    cpu: "1",
                                    memory: "256Mi",
                                },
                            },
                        },
                    ],
                },
            };
            const expectedEndpoint = {
                platform: "gcfv2",
                id: FUNCTION_ID,
                project: PROJECT_ID,
                region: LOCATION,
                runtime: (0, supported_1.latest)("nodejs"),
                entryPoint: "customEntryPoint",
                availableMemoryMb: 256,
                cpu: 1,
                httpsTrigger: {},
                labels: {
                    [runv2.RUNTIME_LABEL]: (0, supported_1.latest)("nodejs"),
                    [runv2.CLIENT_NAME_LABEL]: "cloud-functions",
                },
                environmentVariables: {},
                secretEnvironmentVariables: [],
            };
            (0, chai_1.expect)(runv2.endpointFromService(service)).to.deep.equal(expectedEndpoint);
        });
        it("should derive id from FIREBASE_FUNCTIONS_METADATA if present", () => {
            const service = {
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${SERVICE_ID}`,
                labels: {
                    [runv2.RUNTIME_LABEL]: (0, supported_1.latest)("nodejs"),
                },
                annotations: {
                    [runv2.FIREBASE_FUNCTION_METADTA_ANNOTATION]: `{"functionId":"firebaseMetadataId"}`,
                    [runv2.FUNCTION_TARGET_ANNOTATION]: "targetId",
                    [runv2.FUNCTION_ID_ANNOTATION]: "annotationId",
                },
                template: {
                    containers: [
                        {
                            name: "worker",
                            image: IMAGE_URI,
                            resources: { limits: { cpu: "1", memory: "256Mi" } },
                        },
                    ],
                },
            };
            const result = runv2.endpointFromService(service);
            (0, chai_1.expect)(result.id).to.equal("firebaseMetadataId");
            (0, chai_1.expect)(result.entryPoint).to.equal("targetId");
        });
        it("should derive id from FUNCTION_TARGET_ANNOTATION if FUNCTION_ID_ANNOTATION is missing", () => {
            const service = {
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${SERVICE_ID}`,
                labels: {
                    [runv2.RUNTIME_LABEL]: (0, supported_1.latest)("nodejs"),
                },
                annotations: {
                    ...BASE_RUN_SERVICE.annotations,
                    [runv2.FUNCTION_TARGET_ANNOTATION]: FUNCTION_ID,
                },
                template: {
                    containers: [
                        {
                            name: "worker",
                            image: IMAGE_URI,
                            resources: { limits: { cpu: "1", memory: "256Mi" } },
                        },
                    ],
                },
            };
            const result = runv2.endpointFromService(service);
            (0, chai_1.expect)(result.id).to.equal(FUNCTION_ID);
            (0, chai_1.expect)(result.entryPoint).to.equal(FUNCTION_ID);
        });
        it("should derive id from service name part if FUNCTION_ID_ANNOTATION and FUNCTION_TARGET_ANNOTATION are missing", () => {
            const service = {
                ...BASE_RUN_SERVICE,
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${SERVICE_ID}`,
                labels: {
                    [runv2.RUNTIME_LABEL]: (0, supported_1.latest)("nodejs"),
                },
                annotations: {},
                template: {
                    containers: [
                        {
                            name: "worker",
                            image: IMAGE_URI,
                            resources: { limits: { cpu: "1", memory: "256Mi" } },
                        },
                    ],
                },
            };
            const result = runv2.endpointFromService(service);
            (0, chai_1.expect)(result.id).to.equal(SERVICE_ID);
            (0, chai_1.expect)(result.entryPoint).to.equal(SERVICE_ID);
        });
        it("should copy env vars and secrets", () => {
            const service = JSON.parse(JSON.stringify(BASE_RUN_SERVICE));
            service.template.containers[0].env = [
                { name: "FOO", value: "bar" },
                {
                    name: "MY_SECRET",
                    valueSource: {
                        secretKeyRef: {
                            secret: `projects/${PROJECT_ID}/secrets/secret-name`,
                            version: "1",
                        },
                    },
                },
            ];
            const result = runv2.endpointFromService(service);
            (0, chai_1.expect)(result.environmentVariables).to.deep.equal({ FOO: "bar" });
            (0, chai_1.expect)(result.secretEnvironmentVariables).to.deep.equal([
                { key: "MY_SECRET", secret: "secret-name", projectId: PROJECT_ID, version: "1" },
            ]);
        });
        it("should copy concurrency, min/max instances", () => {
            const service = JSON.parse(JSON.stringify(BASE_RUN_SERVICE));
            service.template.containerConcurrency = 10;
            service.scaling = {
                minInstanceCount: 2,
                maxInstanceCount: 5,
            };
            const result = runv2.endpointFromService(service);
            (0, chai_1.expect)(result.concurrency).to.equal(10);
            (0, chai_1.expect)(result.minInstances).to.equal(2);
            (0, chai_1.expect)(result.maxInstances).to.equal(5);
        });
        it("should handle missing optional fields gracefully", () => {
            const service = {
                name: `projects/${PROJECT_ID}/locations/${LOCATION}/services/${SERVICE_ID}`,
                generation: 1,
                template: {
                    containers: [
                        {
                            name: "worker",
                            image: IMAGE_URI,
                            resources: { limits: { memory: "128Mi", cpu: "0.5" } },
                        },
                    ],
                },
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString(),
                creator: "test@example.com",
                lastModifier: "test@example.com",
                etag: "test-etag",
            };
            const expectedEndpoint = {
                platform: "run",
                id: SERVICE_ID,
                project: PROJECT_ID,
                region: LOCATION,
                runtime: (0, supported_1.latest)("nodejs"),
                entryPoint: SERVICE_ID,
                availableMemoryMb: 128,
                cpu: 0.5,
                eventTrigger: { eventType: "unknown", retry: false },
                labels: {},
                environmentVariables: {},
                secretEnvironmentVariables: [],
            };
            (0, chai_1.expect)(runv2.endpointFromService(service)).to.deep.equal(expectedEndpoint);
        });
    });
    describe("listServices", () => {
        let sandbox;
        let getStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            getStub = sandbox.stub(apiv2_1.Client.prototype, "get");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return a list of services", async () => {
            const mockServices = [
                {
                    name: "service1",
                    labels: { "goog-managed-by": "cloud-functions" },
                },
                {
                    name: "service2",
                    labels: { "goog-managed-by": "firebase-functions" },
                },
            ];
            getStub.resolves({ status: 200, body: { services: mockServices } });
            const services = await runv2.listServices(PROJECT_ID);
            (0, chai_1.expect)(services).to.deep.equal(mockServices);
            (0, chai_1.expect)(getStub).to.have.been.calledOnceWithExactly(`/projects/${PROJECT_ID}/locations/-/services`, { queryParams: {} });
        });
        it("should handle pagination", async () => {
            const mockServices1 = [
                {
                    name: "service1",
                    labels: { "goog-managed-by": "cloud-functions" },
                },
            ];
            const mockServices2 = [
                {
                    name: "service2",
                    labels: { "goog-managed-by": "firebase-functions" },
                },
            ];
            getStub
                .onFirstCall()
                .resolves({ status: 200, body: { services: mockServices1, nextPageToken: "nextPage" } });
            getStub.onSecondCall().resolves({ status: 200, body: { services: mockServices2 } });
            const services = await runv2.listServices(PROJECT_ID);
            (0, chai_1.expect)(services).to.deep.equal([...mockServices1, ...mockServices2]);
            (0, chai_1.expect)(getStub).to.have.been.calledTwice;
            (0, chai_1.expect)(getStub.firstCall).to.have.been.calledWithExactly(`/projects/${PROJECT_ID}/locations/-/services`, { queryParams: {} });
            (0, chai_1.expect)(getStub.secondCall).to.have.been.calledWithExactly(`/projects/${PROJECT_ID}/locations/-/services`, { queryParams: { pageToken: "nextPage" } });
        });
        it("should throw an error if the API call fails", async () => {
            getStub.resolves({ status: 500, body: "Internal Server Error" });
            try {
                await runv2.listServices(PROJECT_ID);
                chai_1.expect.fail("Should have thrown an error");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(err.message).to.contain("Failed to list services. HTTP Error: 500");
            }
        });
        it("should filter for gcfv2 and firebase-managed services", async () => {
            const mockServices = [
                {
                    name: "service1",
                    labels: { "goog-managed-by": "cloud-functions" },
                },
                {
                    name: "service2",
                    labels: { "goog-managed-by": "firebase-functions" },
                },
                {
                    name: "service3",
                    labels: { "goog-managed-by": "other" },
                },
                {
                    name: "service4",
                    labels: {},
                },
            ];
            getStub.resolves({ status: 200, body: { services: mockServices } });
            const services = await runv2.listServices(PROJECT_ID);
            (0, chai_1.expect)(services).to.deep.equal([mockServices[0], mockServices[1]]);
            (0, chai_1.expect)(getStub).to.have.been.calledOnceWithExactly(`/projects/${PROJECT_ID}/locations/-/services`, { queryParams: {} });
        });
    });
});
//# sourceMappingURL=runv2.spec.js.map