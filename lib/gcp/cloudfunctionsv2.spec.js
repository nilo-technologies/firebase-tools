"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const cloudfunctionsv2 = require("./cloudfunctionsv2");
const backend = require("../deploy/functions/backend");
const events = require("../functions/events");
const projectConfig = require("../functions/projectConfig");
const constants_1 = require("../functions/constants");
const api_1 = require("../api");
describe("cloudfunctionsv2", () => {
    const FUNCTION_NAME = {
        id: "id",
        region: "region",
        project: "project",
    };
    const CLOUD_FUNCTION_V2_SOURCE = {
        bucket: "sample",
        object: "source.zip",
        generation: 42,
    };
    const ENDPOINT = {
        platform: "gcfv2",
        ...FUNCTION_NAME,
        entryPoint: "function",
        runtime: "nodejs16",
        codebase: projectConfig.DEFAULT_CODEBASE,
        runServiceId: "service",
        source: { storageSource: CLOUD_FUNCTION_V2_SOURCE },
        state: "ACTIVE",
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
            availableMemory: `${backend.DEFAULT_MEMORY}Mi`,
        },
    };
    const RUN_URI = "https://id-nonce-region-project.run.app";
    const GCF_URL = "https://region-project.cloudfunctions.net/id";
    const HAVE_CLOUD_FUNCTION_V2 = {
        ...CLOUD_FUNCTION_V2,
        serviceConfig: {
            service: "service",
            uri: RUN_URI,
        },
        url: GCF_URL,
        state: "ACTIVE",
        updateTime: new Date(),
    };
    describe("functionFromEndpoint", () => {
        it("should guard against version mixing", () => {
            (0, chai_1.expect)(() => {
                cloudfunctionsv2.functionFromEndpoint({ ...ENDPOINT, httpsTrigger: {}, platform: "gcfv1" });
            }).to.throw();
        });
        it("should copy a minimal function", () => {
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                platform: "gcfv2",
                httpsTrigger: {},
            })).to.deep.equal(CLOUD_FUNCTION_V2);
            const eventEndpoint = {
                ...ENDPOINT,
                platform: "gcfv2",
                eventTrigger: {
                    eventType: "google.cloud.audit.log.v1.written",
                    eventFilters: {
                        resource: "projects/p/regions/r/instances/i",
                        serviceName: "compute.googleapis.com",
                    },
                    retry: true,
                    channel: "projects/myproject/locations/us-wildwest11/channels/mychannel",
                },
            };
            const eventGcfFunction = {
                ...CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: "google.cloud.audit.log.v1.written",
                    eventFilters: [
                        {
                            attribute: "resource",
                            value: "projects/p/regions/r/instances/i",
                        },
                        {
                            attribute: "serviceName",
                            value: "compute.googleapis.com",
                        },
                    ],
                    retryPolicy: "RETRY_POLICY_RETRY",
                    channel: "projects/myproject/locations/us-wildwest11/channels/mychannel",
                },
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    environmentVariables: { FUNCTION_SIGNATURE_TYPE: "cloudevent" },
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(eventEndpoint)).to.deep.equal(eventGcfFunction);
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                platform: "gcfv2",
                eventTrigger: {
                    eventType: "google.firebase.database.ref.v1.written",
                    eventFilters: {
                        instance: "my-db-1",
                    },
                    eventFilterPathPatterns: {
                        path: "foo/{bar}",
                    },
                    retry: false,
                },
            })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: "google.firebase.database.ref.v1.written",
                    eventFilters: [
                        {
                            attribute: "instance",
                            value: "my-db-1",
                        },
                        {
                            attribute: "path",
                            value: "foo/{bar}",
                            operator: "match-path-pattern",
                        },
                    ],
                    retryPolicy: "RETRY_POLICY_DO_NOT_RETRY",
                },
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    environmentVariables: { FUNCTION_SIGNATURE_TYPE: "cloudevent" },
                },
            });
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                platform: "gcfv2",
                taskQueueTrigger: {},
            })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                labels: {
                    ...CLOUD_FUNCTION_V2.labels,
                    "deployment-taskqueue": "true",
                },
            });
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                platform: "gcfv2",
                blockingTrigger: {
                    eventType: events.v1.BEFORE_CREATE_EVENT,
                },
            })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                labels: {
                    ...CLOUD_FUNCTION_V2.labels,
                    [constants_1.BLOCKING_LABEL]: "before-create",
                },
            });
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                platform: "gcfv2",
                blockingTrigger: {
                    eventType: events.v1.BEFORE_SIGN_IN_EVENT,
                },
            })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                labels: {
                    ...CLOUD_FUNCTION_V2.labels,
                    [constants_1.BLOCKING_LABEL]: "before-sign-in",
                },
            });
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                platform: "gcfv2",
                callableTrigger: {
                    genkitAction: "flows/flow",
                },
            })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                labels: {
                    ...CLOUD_FUNCTION_V2.labels,
                    "deployment-callable": "true",
                    "genkit-action": "true",
                },
            });
        });
        it("should copy trival fields", () => {
            const fullEndpoint = {
                ...ENDPOINT,
                httpsTrigger: {},
                platform: "gcfv2",
                vpc: {
                    connector: "connector",
                    egressSettings: "ALL_TRAFFIC",
                },
                ingressSettings: "ALLOW_ALL",
                serviceAccount: "inlined@google.com",
                labels: {
                    foo: "bar",
                },
                environmentVariables: {
                    FOO: "bar",
                },
                secretEnvironmentVariables: [
                    {
                        secret: "MY_SECRET",
                        key: "MY_SECRET",
                        projectId: "project",
                    },
                ],
            };
            const fullGcfFunction = {
                ...CLOUD_FUNCTION_V2,
                labels: {
                    ...CLOUD_FUNCTION_V2.labels,
                    foo: "bar",
                },
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    environmentVariables: {
                        FOO: "bar",
                    },
                    secretEnvironmentVariables: [
                        {
                            secret: "MY_SECRET",
                            key: "MY_SECRET",
                            projectId: "project",
                        },
                    ],
                    vpcConnector: "connector",
                    vpcConnectorEgressSettings: "ALL_TRAFFIC",
                    ingressSettings: "ALLOW_ALL",
                    serviceAccountEmail: "inlined@google.com",
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(fullEndpoint)).to.deep.equal(fullGcfFunction);
        });
        it("should calculate non-trivial fields", () => {
            const complexEndpoint = {
                ...ENDPOINT,
                platform: "gcfv2",
                eventTrigger: {
                    eventType: events.v2.PUBSUB_PUBLISH_EVENT,
                    eventFilters: {
                        topic: "projects/p/topics/t",
                        serviceName: "pubsub.googleapis.com",
                    },
                    retry: false,
                },
                maxInstances: 42,
                minInstances: 1,
                timeoutSeconds: 15,
                availableMemoryMb: 128,
            };
            const complexGcfFunction = {
                ...CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: events.v2.PUBSUB_PUBLISH_EVENT,
                    pubsubTopic: "projects/p/topics/t",
                    eventFilters: [
                        {
                            attribute: "serviceName",
                            value: "pubsub.googleapis.com",
                        },
                    ],
                    retryPolicy: "RETRY_POLICY_DO_NOT_RETRY",
                },
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    maxInstanceCount: 42,
                    minInstanceCount: 1,
                    timeoutSeconds: 15,
                    availableMemory: "128Mi",
                    environmentVariables: { FUNCTION_SIGNATURE_TYPE: "cloudevent" },
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(complexEndpoint)).to.deep.equal(complexGcfFunction);
        });
        it("should propagate serviceAccount to eventarc", () => {
            const saEndpoint = {
                ...ENDPOINT,
                platform: "gcfv2",
                eventTrigger: {
                    eventType: events.v2.DATABASE_EVENTS[0],
                    eventFilters: {
                        ref: "ref",
                    },
                    retry: false,
                },
                serviceAccount: "sa@google.com",
            };
            const saGcfFunction = {
                ...CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: events.v2.DATABASE_EVENTS[0],
                    eventFilters: [
                        {
                            attribute: "ref",
                            value: "ref",
                        },
                    ],
                    retryPolicy: "RETRY_POLICY_DO_NOT_RETRY",
                    serviceAccountEmail: "sa@google.com",
                },
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    environmentVariables: {
                        FUNCTION_SIGNATURE_TYPE: "cloudevent",
                    },
                    serviceAccountEmail: "sa@google.com",
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(saEndpoint)).to.deep.equal(saGcfFunction);
        });
        it("should correctly convert CPU and concurrency values", () => {
            const endpoint = {
                ...ENDPOINT,
                platform: "gcfv2",
                httpsTrigger: {},
                concurrency: 40,
                cpu: 2,
            };
            const gcfFunction = {
                ...CLOUD_FUNCTION_V2,
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    maxInstanceRequestConcurrency: 40,
                    availableCpu: "2",
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(endpoint)).to.deep.equal(gcfFunction);
        });
        it("should export codebase as label", () => {
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                codebase: "my-codebase",
                httpsTrigger: {},
            })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                labels: { ...CLOUD_FUNCTION_V2.labels, [constants_1.CODEBASE_LABEL]: "my-codebase" },
            });
        });
        it("should export hash as label", () => {
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({ ...ENDPOINT, hash: "my-hash", httpsTrigger: {} })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                labels: { ...CLOUD_FUNCTION_V2.labels, [constants_1.HASH_LABEL]: "my-hash" },
            });
        });
        it("should expand shorthand service account to full email", () => {
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                serviceAccount: "sa@",
                httpsTrigger: {},
            })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    serviceAccountEmail: `sa@${ENDPOINT.project}.iam.gserviceaccount.com`,
                },
            });
        });
        it("should handle null service account", () => {
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint({
                ...ENDPOINT,
                serviceAccount: null,
                httpsTrigger: {},
            })).to.deep.equal({
                ...CLOUD_FUNCTION_V2,
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    serviceAccountEmail: null,
                },
            });
        });
    });
    describe("endpointFromFunction", () => {
        it("should copy a minimal version", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(HAVE_CLOUD_FUNCTION_V2)).to.deep.equal({
                ...ENDPOINT,
                httpsTrigger: {},
                platform: "gcfv2",
                uri: GCF_URL,
            });
        });
        it("should copy run service IDs", () => {
            const fn = {
                ...HAVE_CLOUD_FUNCTION_V2,
                serviceConfig: {
                    ...HAVE_CLOUD_FUNCTION_V2.serviceConfig,
                    service: "projects/p/locations/l/services/service-id",
                    uri: RUN_URI,
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(fn)).to.deep.equal({
                ...ENDPOINT,
                httpsTrigger: {},
                platform: "gcfv2",
                uri: GCF_URL,
                runServiceId: "service-id",
            });
        });
        it("should translate event triggers", () => {
            let want = {
                ...ENDPOINT,
                platform: "gcfv2",
                uri: GCF_URL,
                eventTrigger: {
                    eventType: events.v2.PUBSUB_PUBLISH_EVENT,
                    eventFilters: { topic: "projects/p/topics/t" },
                    retry: false,
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: events.v2.PUBSUB_PUBLISH_EVENT,
                    pubsubTopic: "projects/p/topics/t",
                },
            })).to.deep.equal(want);
            want = {
                ...want,
                eventTrigger: {
                    eventType: "google.cloud.audit.log.v1.written",
                    eventFilters: {
                        resource: "projects/p/regions/r/instances/i",
                        serviceName: "compute.googleapis.com",
                    },
                    retry: false,
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: "google.cloud.audit.log.v1.written",
                    eventFilters: [
                        {
                            attribute: "resource",
                            value: "projects/p/regions/r/instances/i",
                        },
                        {
                            attribute: "serviceName",
                            value: "compute.googleapis.com",
                        },
                    ],
                },
            })).to.deep.equal(want);
            want = {
                ...want,
                eventTrigger: {
                    eventType: "google.firebase.database.ref.v1.written",
                    eventFilters: {
                        instance: "my-db-1",
                    },
                    eventFilterPathPatterns: {
                        path: "foo/{bar}",
                    },
                    retry: false,
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: "google.firebase.database.ref.v1.written",
                    eventFilters: [
                        {
                            attribute: "instance",
                            value: "my-db-1",
                        },
                        {
                            attribute: "path",
                            value: "foo/{bar}",
                            operator: "match-path-pattern",
                        },
                    ],
                },
            })).to.deep.equal(want);
            want = {
                ...want,
                eventTrigger: {
                    eventType: "google.cloud.firestore.document.v1.written",
                    eventFilters: {
                        database: "(default)",
                        namespace: "(default)",
                    },
                    eventFilterPathPatterns: {
                        document: "users/{userId}",
                    },
                    retry: false,
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: "google.cloud.firestore.document.v1.written",
                    eventFilters: [
                        {
                            attribute: "database",
                            value: "(default)",
                        },
                        {
                            attribute: "namespace",
                            value: "(default)",
                        },
                        {
                            attribute: "document",
                            value: "users/{userId}",
                            operator: "match-path-pattern",
                        },
                    ],
                    pubsubTopic: "eventarc-us-central1-abc",
                },
            })).to.deep.equal(want);
        });
        it("should translate custom event triggers", () => {
            const want = {
                ...ENDPOINT,
                platform: "gcfv2",
                uri: GCF_URL,
                eventTrigger: {
                    eventType: "com.custom.event",
                    eventFilters: { customattr: "customvalue" },
                    channel: "projects/myproject/locations/us-wildwest11/channels/mychannel",
                    retry: false,
                },
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                eventTrigger: {
                    eventType: "com.custom.event",
                    eventFilters: [
                        {
                            attribute: "customattr",
                            value: "customvalue",
                        },
                    ],
                    channel: "projects/myproject/locations/us-wildwest11/channels/mychannel",
                },
            })).to.deep.equal(want);
        });
        it("should translate task queue functions", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                labels: { "deployment-taskqueue": "true" },
            })).to.deep.equal({
                ...ENDPOINT,
                taskQueueTrigger: {},
                platform: "gcfv2",
                uri: GCF_URL,
                labels: { "deployment-taskqueue": "true" },
            });
        });
        it("should translate beforeCreate blocking functions", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                labels: { "deployment-blocking": "before-create" },
            })).to.deep.equal({
                ...ENDPOINT,
                blockingTrigger: {
                    eventType: events.v1.BEFORE_CREATE_EVENT,
                },
                platform: "gcfv2",
                uri: GCF_URL,
                labels: { "deployment-blocking": "before-create" },
            });
        });
        it("should translate beforeSignIn blocking functions", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                labels: { "deployment-blocking": "before-sign-in" },
            })).to.deep.equal({
                ...ENDPOINT,
                blockingTrigger: {
                    eventType: events.v1.BEFORE_SIGN_IN_EVENT,
                },
                platform: "gcfv2",
                uri: GCF_URL,
                labels: { "deployment-blocking": "before-sign-in" },
            });
        });
        it("should copy optional fields", () => {
            const extraFields = {
                ingressSettings: "ALLOW_ALL",
                timeoutSeconds: 15,
                environmentVariables: {
                    FOO: "bar",
                },
            };
            const vpc = {
                connector: "connector",
                egressSettings: "ALL_TRAFFIC",
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                serviceConfig: {
                    ...HAVE_CLOUD_FUNCTION_V2.serviceConfig,
                    ...extraFields,
                    serviceAccountEmail: "inlined@google.com",
                    vpcConnector: vpc.connector,
                    vpcConnectorEgressSettings: vpc.egressSettings,
                    availableMemory: "128Mi",
                    uri: RUN_URI,
                    service: "service",
                },
                labels: {
                    foo: "bar",
                },
            })).to.deep.equal({
                ...ENDPOINT,
                platform: "gcfv2",
                httpsTrigger: {},
                uri: GCF_URL,
                ...extraFields,
                serviceAccount: "inlined@google.com",
                vpc,
                availableMemoryMb: 128,
                labels: {
                    foo: "bar",
                },
            });
        });
        it("should transform fields", () => {
            const extraFields = {
                minInstances: 1,
                maxInstances: 42,
            };
            const extraGcfFields = {
                minInstanceCount: 1,
                maxInstanceCount: 42,
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                serviceConfig: {
                    ...HAVE_CLOUD_FUNCTION_V2.serviceConfig,
                    ...extraGcfFields,
                    uri: RUN_URI,
                    service: "service",
                },
            })).to.deep.equal({
                ...ENDPOINT,
                platform: "gcfv2",
                uri: GCF_URL,
                httpsTrigger: {},
                ...extraFields,
            });
        });
        it("should derive codebase from labels", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                labels: {
                    ...CLOUD_FUNCTION_V2.labels,
                    [constants_1.CODEBASE_LABEL]: "my-codebase",
                },
            })).to.deep.equal({
                ...ENDPOINT,
                platform: "gcfv2",
                uri: GCF_URL,
                httpsTrigger: {},
                labels: {
                    ...ENDPOINT.labels,
                    [constants_1.CODEBASE_LABEL]: "my-codebase",
                },
                codebase: "my-codebase",
            });
        });
        it("should derive hash from labels", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                labels: {
                    ...CLOUD_FUNCTION_V2.labels,
                    [constants_1.CODEBASE_LABEL]: "my-codebase",
                    [constants_1.HASH_LABEL]: "my-hash",
                },
            })).to.deep.equal({
                ...ENDPOINT,
                platform: "gcfv2",
                uri: GCF_URL,
                httpsTrigger: {},
                labels: {
                    ...ENDPOINT.labels,
                    [constants_1.CODEBASE_LABEL]: "my-codebase",
                    [constants_1.HASH_LABEL]: "my-hash",
                },
                codebase: "my-codebase",
                hash: "my-hash",
            });
        });
        it("should convert function without serviceConfig", () => {
            const expectedEndpoint = {
                ...ENDPOINT,
                platform: "gcfv2",
                httpsTrigger: {},
                uri: GCF_URL,
            };
            delete expectedEndpoint.runServiceId;
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                serviceConfig: undefined,
            })).to.deep.equal(expectedEndpoint);
        });
        it("should convert function without buildConfig", () => {
            const expectedEndpoint = {
                ...ENDPOINT,
                platform: "gcfv2",
                httpsTrigger: {},
                uri: GCF_URL,
                entryPoint: "",
                runtime: undefined,
                source: undefined,
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction({
                ...HAVE_CLOUD_FUNCTION_V2,
                buildConfig: undefined,
            })).to.deep.equal(expectedEndpoint);
        });
    });
    describe("createFunction", () => {
        it("should set default environment variables", async () => {
            const testFunction = {
                ...CLOUD_FUNCTION_V2,
                name: "projects/project/locations/region/functions/id",
                serviceConfig: {
                    ...CLOUD_FUNCTION_V2.serviceConfig,
                    environmentVariables: {},
                },
                buildConfig: {
                    ...CLOUD_FUNCTION_V2.buildConfig,
                    environmentVariables: {},
                },
            };
            const scope = nock((0, api_1.functionsV2Origin)())
                .post("/v2/projects/project/locations/region/functions", (body) => {
                (0, chai_1.expect)(body.serviceConfig.environmentVariables).to.have.property("LOG_EXECUTION_ID", "true");
                (0, chai_1.expect)(body.serviceConfig.environmentVariables).to.have.property("FUNCTION_TARGET", "function");
                (0, chai_1.expect)(body.buildConfig.environmentVariables).to.have.property("GOOGLE_NODE_RUN_SCRIPTS", "");
                return true;
            })
                .query({ functionId: "id" })
                .reply(200, { name: "operations/123", done: true });
            await cloudfunctionsv2.createFunction(testFunction);
            (0, chai_1.expect)(scope.isDone()).to.be.true;
        });
    });
    describe("updateFunction", () => {
        it("should set default environment variables", async () => {
            const scope = nock((0, api_1.functionsV2Origin)())
                .patch("/v2/projects/project/locations/region/functions/id", (body) => {
                (0, chai_1.expect)(body.serviceConfig.environmentVariables).to.have.property("LOG_EXECUTION_ID", "true");
                (0, chai_1.expect)(body.serviceConfig.environmentVariables).to.have.property("FUNCTION_TARGET", "function");
                (0, chai_1.expect)(body.buildConfig.environmentVariables).to.have.property("GOOGLE_NODE_RUN_SCRIPTS", "");
                return true;
            })
                .query(true)
                .reply(200, { name: "operations/123", done: true });
            await cloudfunctionsv2.updateFunction(CLOUD_FUNCTION_V2);
            (0, chai_1.expect)(scope.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=cloudfunctionsv2.spec.js.map