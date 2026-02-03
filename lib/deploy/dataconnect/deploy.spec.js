"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const nock = require("nock");
const deploy = require("./deploy");
const utils = require("../../utils");
const projectUtils = require("../../projectUtils");
const provisionCloudSql = require("../../dataconnect/provisionCloudSql");
const ensureApiEnabled = require("../../ensureApiEnabled");
const prompt = require("../../prompt");
const poller = require("../../operation-poller");
const api_1 = require("../../api");
const context_1 = require("./context");
describe("dataconnect deploy", () => {
    let sandbox;
    let setupCloudSqlStub;
    let confirmStub;
    let pollOperationStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setupCloudSqlStub = sandbox.stub(provisionCloudSql, "setupCloudSql").resolves();
        sandbox.stub(projectUtils, "needProjectId").returns("test-project");
        sandbox.stub(ensureApiEnabled, "ensure").resolves();
        confirmStub = sandbox.stub(prompt, "confirm").resolves(false);
        sandbox.stub(utils, "logLabeledSuccess");
        pollOperationStub = sandbox.stub(poller, "pollOperation").resolves();
    });
    afterEach(() => {
        sandbox.restore();
        nock.cleanAll();
    });
    it("should create a new service", async () => {
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/test-project/locations/-/services")
            .reply(200, { services: [] });
        nock((0, api_1.dataconnectOrigin)())
            .post("/v1/projects/test-project/locations/l/services?service_id=s1")
            .reply(200, { name: "op-name" });
        const serviceInfos = [
            {
                serviceName: "projects/test-project/locations/l/services/s1",
                deploymentMetadata: {},
                schemas: [
                    {
                        name: "projects/test-project/locations/l/services/s1/schemas/main",
                        datasources: [],
                    },
                ],
                dataConnectYaml: { serviceId: "s1" },
            },
        ];
        const context = { dataconnect: { serviceInfos, deployStats: (0, context_1.initDeployStats)() } };
        const options = {};
        await deploy.default(context, options);
        (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should delete an old service if confirmed", async () => {
        const existingServices = [{ name: "projects/test-project/locations/l/services/s2" }];
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/test-project/locations/-/services")
            .reply(200, { services: existingServices });
        nock((0, api_1.dataconnectOrigin)())
            .delete("/v1/projects/test-project/locations/l/services/s2?force=true")
            .reply(200, { name: "op-name" });
        confirmStub.resolves(true);
        const serviceInfos = [];
        const context = { dataconnect: { serviceInfos, deployStats: (0, context_1.initDeployStats)() } };
        const options = {};
        await deploy.default(context, options);
        (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should not delete an old service if not confirmed", async () => {
        const existingServices = [{ name: "projects/test-project/locations/l/services/s2" }];
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/test-project/locations/-/services")
            .reply(200, { services: existingServices });
        confirmStub.resolves(false);
        const serviceInfos = [];
        const context = { dataconnect: { serviceInfos, deployStats: (0, context_1.initDeployStats)() } };
        const options = {};
        await deploy.default(context, options);
        (0, chai_1.expect)(pollOperationStub.notCalled).to.be.true;
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should provision cloud sql", async () => {
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/test-project/locations/-/services")
            .reply(200, { services: [] });
        nock((0, api_1.dataconnectOrigin)())
            .post("/v1/projects/test-project/locations/l/services?service_id=s1")
            .reply(200, { name: "op-name" });
        const serviceInfos = [
            {
                serviceName: "projects/test-project/locations/l/services/s1",
                schemas: [
                    {
                        name: "projects/test-project/locations/l/services/s1/schemas/main",
                        datasources: [
                            {
                                postgresql: {
                                    cloudSql: { instance: "projects/p/locations/l/instances/i" },
                                    database: "db",
                                },
                            },
                        ],
                    },
                ],
                deploymentMetadata: {},
                dataConnectYaml: { serviceId: "s1" },
            },
        ];
        const context = { dataconnect: { serviceInfos, deployStats: (0, context_1.initDeployStats)() } };
        const options = {};
        await deploy.default(context, options);
        (0, chai_1.expect)(setupCloudSqlStub.calledOnce).to.be.true;
    });
    it("should not delete services if filters are present", async () => {
        const existingServices = [{ name: "projects/test-project/locations/l/services/s2" }];
        nock((0, api_1.dataconnectOrigin)())
            .get("/v1/projects/test-project/locations/-/services")
            .reply(200, { services: existingServices });
        const serviceInfos = [];
        const context = {
            dataconnect: { serviceInfos, filters: [{ serviceId: "s1" }], deployStats: (0, context_1.initDeployStats)() },
        };
        const options = {};
        await deploy.default(context, options);
        (0, chai_1.expect)(pollOperationStub.notCalled).to.be.true;
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
});
//# sourceMappingURL=deploy.spec.js.map