"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const nock = require("nock");
const release = require("./release");
const utils = require("../../utils");
const projectUtils = require("../../projectUtils");
const schemaMigration = require("../../dataconnect/schemaMigration");
const prompts = require("../../dataconnect/prompts");
const logger_1 = require("../../logger");
const poller = require("../../operation-poller");
const api_1 = require("../../api");
const context_1 = require("./context");
describe("dataconnect release", () => {
    let sandbox;
    let migrateSchemaStub;
    let promptDeleteConnectorStub;
    let pollOperationStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        migrateSchemaStub = sandbox.stub(schemaMigration, "migrateSchema").resolves();
        promptDeleteConnectorStub = sandbox.stub(prompts, "promptDeleteConnector").resolves();
        sandbox.stub(projectUtils, "needProjectId").returns("test-project");
        sandbox.stub(utils, "logLabeledSuccess");
        sandbox
            .stub(utils, "consoleUrl")
            .returns("https://console.firebase.google.com/project/test-project/dataconnect");
        sandbox.stub(logger_1.logger, "debug");
        pollOperationStub = sandbox.stub(poller, "pollOperation").resolves();
    });
    afterEach(() => {
        sandbox.restore();
        nock.cleanAll();
    });
    it("should deploy a schema and a connector", async () => {
        nock((0, api_1.dataconnectOrigin)())
            .patch("/v1/projects/p/locations/l/services/s1/connectors/c1?allow_missing=true")
            .reply(200, { name: "op-name" });
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/p/locations/l/services/s1/connectors?pageSize=100&pageToken=&fields=")
            .reply(200, { connectors: [] });
        const serviceInfos = [
            {
                serviceName: "projects/p/locations/l/services/s1",
                dataConnectYaml: {
                    serviceId: "s1",
                    schema: { datasource: { postgresql: { schemaValidation: "STRICT" } } },
                },
                schemas: [{ name: "projects/p/locations/l/services/s1/schemas/main" }],
                connectorInfo: [
                    {
                        connector: { name: "projects/p/locations/l/services/s1/connectors/c1" },
                        connectorYaml: { connectorId: "c1" },
                    },
                ],
            },
        ];
        const context = { dataconnect: { serviceInfos, deployStats: (0, context_1.initDeployStats)() } };
        const options = {};
        await release.default(context, options);
        (0, chai_1.expect)(migrateSchemaStub.calledOnce).to.be.true;
        (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        (0, chai_1.expect)(promptDeleteConnectorStub.notCalled).to.be.true;
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should handle connector pre-deployment failure", async () => {
        nock((0, api_1.dataconnectOrigin)())
            .patch("/v1/projects/p/locations/l/services/s1/connectors/c1?allow_missing=true")
            .reply(500, "pre-deploy failed");
        nock((0, api_1.dataconnectOrigin)())
            .patch("/v1/projects/p/locations/l/services/s1/connectors/c1?allow_missing=true")
            .reply(200, { name: "op-name" });
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/p/locations/l/services/s1/connectors?pageSize=100&pageToken=&fields=")
            .reply(200, { connectors: [] });
        const serviceInfos = [
            {
                serviceName: "projects/p/locations/l/services/s1",
                dataConnectYaml: {
                    serviceId: "s1",
                    schema: { datasource: { postgresql: { schemaValidation: "STRICT" } } },
                },
                schemas: [{ name: "projects/p/locations/l/services/s1/schemas/main" }],
                connectorInfo: [
                    {
                        connector: { name: "projects/p/locations/l/services/s1/connectors/c1" },
                        connectorYaml: { connectorId: "c1" },
                    },
                ],
            },
        ];
        const context = { dataconnect: { serviceInfos, deployStats: (0, context_1.initDeployStats)() } };
        const options = {};
        await release.default(context, options);
        (0, chai_1.expect)(migrateSchemaStub.calledOnce).to.be.true;
        (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should prompt to delete unused connectors", async () => {
        nock((0, api_1.dataconnectOrigin)())
            .patch("/v1/projects/p/locations/l/services/s1/connectors/c1?allow_missing=true")
            .reply(200, { name: "op-name" });
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/p/locations/l/services/s1/connectors?pageSize=100&pageToken=&fields=")
            .reply(200, {
            connectors: [{ name: "projects/p/locations/l/services/s1/connectors/unused-connector" }],
        });
        const serviceInfos = [
            {
                serviceName: "projects/p/locations/l/services/s1",
                dataConnectYaml: {
                    serviceId: "s1",
                    schema: { datasource: { postgresql: { schemaValidation: "STRICT" } } },
                },
                schemas: [{ name: "projects/p/locations/l/services/s1/schemas/main" }],
                connectorInfo: [
                    {
                        connector: { name: "projects/p/locations/l/services/s1/connectors/c1" },
                        connectorYaml: { connectorId: "c1" },
                    },
                ],
            },
        ];
        const context = { dataconnect: { serviceInfos, deployStats: (0, context_1.initDeployStats)() } };
        const options = {};
        await release.default(context, options);
        (0, chai_1.expect)(promptDeleteConnectorStub.calledOnceWith(options, "projects/p/locations/l/services/s1/connectors/unused-connector")).to.be.true;
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should not prompt to delete unused connectors with filters", async () => {
        nock((0, api_1.dataconnectOrigin)())
            .patch("/v1/projects/p/locations/l/services/s1/connectors/c1?allow_missing=true")
            .reply(200, { name: "op-name" });
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/p/locations/l/services/s1/connectors?pageSize=100&pageToken=&fields=")
            .reply(200, {
            connectors: [{ name: "projects/p/locations/l/services/s1/connectors/unused-connector" }],
        });
        const serviceInfos = [
            {
                serviceName: "projects/p/locations/l/services/s1",
                dataConnectYaml: {
                    serviceId: "s1",
                    schema: { datasource: { postgresql: { schemaValidation: "STRICT" } } },
                },
                schemas: [{ name: "projects/p/locations/l/services/s1/schemas/main" }],
                connectorInfo: [
                    {
                        connector: { name: "projects/p/locations/l/services/s1/connectors/c1" },
                        connectorYaml: { connectorId: "c1" },
                    },
                ],
            },
        ];
        const context = {
            dataconnect: { serviceInfos, filters: [{ serviceId: "s1" }], deployStats: (0, context_1.initDeployStats)() },
        };
        const options = {};
        await release.default(context, options);
        (0, chai_1.expect)(promptDeleteConnectorStub.notCalled).to.be.true;
    });
});
//# sourceMappingURL=release.spec.js.map