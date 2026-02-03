"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const fs = require("fs-extra");
const init = require("./index");
const sdk = require("./sdk");
const config_1 = require("../../../config");
const provison = require("../../../dataconnect/provisionCloudSql");
const cloudbilling = require("../../../gcp/cloudbilling");
const ensureApis = require("../../../dataconnect/ensureApis");
const client = require("../../../dataconnect/client");
const MOCK_RC = { projects: {}, targets: {}, etags: {} };
describe("init dataconnect", () => {
    describe.skip("askQuestions", () => {
    });
    describe("actuation", () => {
        const sandbox = sinon.createSandbox();
        let provisionCSQLStub;
        let askWriteProjectFileStub;
        let ensureSyncStub;
        let sdkActuateStub;
        beforeEach(() => {
            provisionCSQLStub = sandbox.stub(provison, "setupCloudSql");
            ensureSyncStub = sandbox.stub(fs, "ensureFileSync");
            sdkActuateStub = sandbox.stub(sdk, "actuate").resolves();
            sandbox.stub(cloudbilling, "isBillingEnabled").resolves(true);
            sandbox.stub(ensureApis, "ensureApis").resolves();
            sandbox.stub(client, "listSchemas").resolves([]);
        });
        afterEach(() => {
            sandbox.restore();
        });
        const cases = [
            {
                desc: "empty project should generate template",
                requiredInfo: mockRequiredInfo(),
                config: mockConfig(),
                expectedSource: "dataconnect",
                expectedFiles: [
                    "dataconnect/dataconnect.yaml",
                    "dataconnect/seed_data.gql",
                    "dataconnect/schema/schema.gql",
                    "dataconnect/example/connector.yaml",
                    "dataconnect/example/queries.gql",
                    "dataconnect/example/mutations.gql",
                ],
                expectCSQLProvisioning: true,
                expectEnsureSchemaGQL: false,
            },
            {
                desc: "existing project should use existing directory",
                requiredInfo: mockRequiredInfo(),
                config: mockConfig({ dataconnect: { source: "not-dataconnect" } }),
                expectedSource: "not-dataconnect",
                expectedFiles: [
                    "not-dataconnect/dataconnect.yaml",
                    "not-dataconnect/seed_data.gql",
                    "not-dataconnect/schema/schema.gql",
                    "not-dataconnect/example/connector.yaml",
                    "not-dataconnect/example/queries.gql",
                    "not-dataconnect/example/mutations.gql",
                ],
                expectCSQLProvisioning: true,
                expectEnsureSchemaGQL: false,
            },
            {
                desc: "should write schema files",
                requiredInfo: mockRequiredInfo({
                    serviceGql: {
                        schemaGql: [
                            {
                                path: "schema.gql",
                                content: "## Fake GQL",
                            },
                        ],
                        connectors: [],
                    },
                }),
                config: mockConfig({}),
                expectedSource: "dataconnect",
                expectedFiles: ["dataconnect/dataconnect.yaml", "dataconnect/schema/schema.gql"],
                expectCSQLProvisioning: true,
                expectEnsureSchemaGQL: false,
            },
            {
                desc: "should write connector files",
                requiredInfo: mockRequiredInfo({
                    serviceGql: {
                        schemaGql: [],
                        connectors: [
                            {
                                id: "my-connector",
                                path: "hello",
                                files: [
                                    {
                                        path: "queries.gql",
                                        content: "## Fake GQL",
                                    },
                                ],
                            },
                        ],
                    },
                }),
                config: mockConfig({}),
                expectedSource: "dataconnect",
                expectedFiles: [
                    "dataconnect/dataconnect.yaml",
                    "dataconnect/hello/connector.yaml",
                    "dataconnect/hello/queries.gql",
                ],
                expectCSQLProvisioning: true,
                expectEnsureSchemaGQL: false,
            },
            {
                desc: "should provision cloudSQL resources ",
                requiredInfo: mockRequiredInfo({}),
                config: mockConfig({}),
                expectedSource: "dataconnect",
                expectedFiles: [
                    "dataconnect/dataconnect.yaml",
                    "dataconnect/seed_data.gql",
                    "dataconnect/schema/schema.gql",
                    "dataconnect/example/connector.yaml",
                    "dataconnect/example/queries.gql",
                    "dataconnect/example/mutations.gql",
                ],
                expectCSQLProvisioning: true,
                expectEnsureSchemaGQL: false,
            },
            {
                desc: "should handle schema with no files",
                requiredInfo: mockRequiredInfo({
                    serviceGql: {
                        schemaGql: [],
                        connectors: [
                            {
                                id: "my-connector",
                                path: "hello",
                                files: [
                                    {
                                        path: "queries.gql",
                                        content: "## Fake GQL",
                                    },
                                ],
                            },
                        ],
                    },
                }),
                config: mockConfig({
                    dataconnect: {
                        source: "dataconnect",
                    },
                }),
                expectedSource: "dataconnect",
                expectedFiles: [
                    "dataconnect/dataconnect.yaml",
                    "dataconnect/hello/connector.yaml",
                    "dataconnect/hello/queries.gql",
                ],
                expectCSQLProvisioning: true,
                expectEnsureSchemaGQL: true,
            },
        ];
        for (const c of cases) {
            it(c.desc, async () => {
                askWriteProjectFileStub = sandbox.stub(c.config, "askWriteProjectFile");
                askWriteProjectFileStub.resolves();
                provisionCSQLStub.resolves();
                await init.actuate({
                    projectId: "test-project",
                    rcfile: MOCK_RC,
                    config: c.config.src,
                    featureInfo: { dataconnect: c.requiredInfo, dataconnectSdk: { apps: [] } },
                    instructions: [],
                }, c.config, {});
                (0, chai_1.expect)(c.config.get("dataconnect.source")).to.equal(c.expectedSource);
                if (c.expectEnsureSchemaGQL) {
                    (0, chai_1.expect)(ensureSyncStub).to.have.been.calledWith("dataconnect/schema/schema.gql");
                }
                (0, chai_1.expect)(askWriteProjectFileStub.args.map((a) => a[0])).to.deep.equal(c.expectedFiles);
                (0, chai_1.expect)(provisionCSQLStub.called).to.equal(c.expectCSQLProvisioning);
                (0, chai_1.expect)(sdkActuateStub.called).to.be.true;
            });
        }
    });
    describe("toDNSCompatibleId", () => {
        const cases = [
            {
                description: "Should noop compatible strings",
                input: "this-is-compatible",
                expected: "this-is-compatible",
            },
            {
                description: "Should lower case",
                input: "This-Is-Compatible",
                expected: "this-is-compatible",
            },
            {
                description: "Should strip special characters",
                input: "this-is-compatible?~!@#$%^&*()_+=",
                expected: "this-is-compatible",
            },
            {
                description: "Should strip trailing and leading -",
                input: "---this-is-compatible---",
                expected: "this-is-compatible",
            },
            {
                description: "Should cut to 63 characters",
                input: "a".repeat(1000),
                expected: "a".repeat(63),
            },
        ];
        for (const c of cases) {
            it(c.description, () => {
                (0, chai_1.expect)(init.toDNSCompatibleId(c.input)).to.equal(c.expected);
            });
        }
    });
});
function mockConfig(data = {}) {
    return new config_1.Config(data, { projectDir: "." });
}
function mockRequiredInfo(info = {}) {
    return {
        flow: "test",
        appDescription: "",
        serviceId: "test-service",
        locationId: "europe-north3",
        cloudSqlInstanceId: "csql-instance",
        cloudSqlDatabase: "csql-db",
        shouldProvisionCSQL: true,
        ...info,
    };
}
//# sourceMappingURL=index.spec.js.map