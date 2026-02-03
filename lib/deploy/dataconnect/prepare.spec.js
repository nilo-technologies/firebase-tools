"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const nock = require("nock");
const prepare = require("./prepare");
const load = require("../../dataconnect/load");
const utils = require("../../utils");
const projectUtils = require("../../projectUtils");
const filters = require("../../dataconnect/filters");
const build = require("../../dataconnect/build");
const ensureApis = require("../../dataconnect/ensureApis");
const requireTosAcceptance = require("../../requireTosAcceptance");
const schemaMigration = require("../../dataconnect/schemaMigration");
const provisionCloudSql = require("../../dataconnect/provisionCloudSql");
const cloudbilling = require("../../gcp/cloudbilling");
const error_1 = require("../../error");
describe("dataconnect prepare", () => {
    let sandbox;
    let loadAllStub;
    let buildStub;
    let getResourceFiltersStub;
    let diffSchemaStub;
    let setupCloudSqlStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        loadAllStub = sandbox.stub(load, "loadAll").resolves([]);
        buildStub = sandbox.stub(build, "build").resolves({});
        sandbox.stub(ensureApis, "ensureApis").resolves();
        sandbox.stub(requireTosAcceptance, "requireTosAcceptance").returns(() => Promise.resolve());
        getResourceFiltersStub = sandbox.stub(filters, "getResourceFilters").returns(undefined);
        diffSchemaStub = sandbox.stub(schemaMigration, "diffSchema").resolves();
        setupCloudSqlStub = sandbox.stub(provisionCloudSql, "setupCloudSql").resolves();
        sandbox.stub(projectUtils, "needProjectId").returns("test-project");
        sandbox.stub(utils, "logLabeledBullet");
        sandbox.stub(cloudbilling, "checkBillingEnabled").resolves();
    });
    afterEach(() => {
        sandbox.restore();
        nock.cleanAll();
    });
    it("should do nothing if there are no services", async () => {
        const context = {};
        const options = { config: {} };
        await prepare.default(context, options);
        (0, chai_1.expect)(loadAllStub.calledOnce).to.be.true;
        (0, chai_1.expect)(buildStub.notCalled).to.be.true;
        (0, chai_1.expect)(context).to.deep.equal({
            dataconnect: {
                serviceInfos: [],
                filters: undefined,
                deployStats: context.dataconnect.deployStats,
            },
        });
    });
    it("should build services", async () => {
        const serviceInfos = [{ sourceDirectory: "a" }, { sourceDirectory: "b" }];
        loadAllStub.resolves(serviceInfos);
        const context = {};
        const options = { config: {} };
        await prepare.default(context, options);
        (0, chai_1.expect)(buildStub.callCount).to.equal(2);
        (0, chai_1.expect)(context).to.deep.equal({
            dataconnect: {
                serviceInfos: serviceInfos,
                filters: undefined,
                deployStats: context.dataconnect.deployStats,
            },
        });
    });
    it("should throw an error for unmatched filters", async () => {
        const serviceInfos = [
            {
                dataConnectYaml: { serviceId: "service1" },
                connectorInfo: [{ connectorYaml: { connectorId: "connector1" } }],
            },
        ];
        loadAllStub.resolves(serviceInfos);
        getResourceFiltersStub.returns([{ serviceId: "service2" }]);
        const context = {};
        const options = { config: {} };
        await (0, chai_1.expect)(prepare.default(context, options)).to.be.rejectedWith(error_1.FirebaseError, "The following filters were specified in --only but didn't match anything in this project");
    });
    describe("dryRun", () => {
        it("should diff schema and setup cloud sql", async () => {
            const serviceInfos = [
                {
                    schemas: [
                        {
                            name: "projects/p/locations/l/services/s/schemas/main",
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
                    serviceName: "projects/p/locations/l/services/s",
                    deploymentMetadata: {},
                    dataConnectYaml: {
                        schema: {
                            datasource: {
                                postgresql: {
                                    schemaValidation: "STRICT",
                                },
                            },
                        },
                    },
                },
            ];
            loadAllStub.resolves(serviceInfos);
            const context = {};
            const options = { config: {}, dryRun: true };
            await prepare.default(context, options);
            (0, chai_1.expect)(diffSchemaStub.calledOnce).to.be.true;
            (0, chai_1.expect)(setupCloudSqlStub.calledOnce).to.be.true;
        });
    });
});
//# sourceMappingURL=prepare.spec.js.map