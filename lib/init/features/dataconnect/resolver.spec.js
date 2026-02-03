"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const clc = require("colorette");
const fs = require("fs-extra");
const yaml = require("js-yaml");
const sinon = require("sinon");
const resolver_1 = require("./resolver");
const config_1 = require("../../../config");
const load = require("../../../dataconnect/load");
const experiments = require("../../../experiments");
const prompt = require("../../../prompt");
const expect = chai.expect;
describe("addSchemaToDataConnectYaml", () => {
    let schemaRequiredInfo;
    let dataConnectYaml;
    beforeEach(() => {
        dataConnectYaml = {
            location: "us-central1",
            serviceId: "service-id",
            connectorDirs: [],
        };
        schemaRequiredInfo = {
            id: "test_resolver",
            uri: "www.test.com",
            serviceInfo: {},
        };
    });
    it("add schema to dataconnect.yaml with `schema` field", () => {
        dataConnectYaml.schema = {
            source: "./schema",
            datasource: {},
        };
        (0, resolver_1.addSchemaToDataConnectYaml)(dataConnectYaml, schemaRequiredInfo);
        expect(dataConnectYaml.schema).to.be.undefined;
        expect(dataConnectYaml.schemas).to.have.lengthOf(2);
        expect(dataConnectYaml.schemas).to.deep.equal([
            {
                source: "./schema",
                datasource: {},
            },
            {
                source: "./schema_test_resolver",
                id: "test_resolver",
                datasource: {
                    httpGraphql: {
                        uri: "www.test.com",
                    },
                },
            },
        ]);
    });
    it("add schema to dataconnect.yaml with `schemas` field", () => {
        dataConnectYaml.schemas = [
            {
                source: "./schema",
                datasource: {},
            },
            {
                source: "./schema_existing",
                datasource: {},
            },
        ];
        (0, resolver_1.addSchemaToDataConnectYaml)(dataConnectYaml, schemaRequiredInfo);
        expect(dataConnectYaml.schema).to.be.undefined;
        expect(dataConnectYaml.schemas).to.have.lengthOf(3);
        expect(dataConnectYaml.schemas).to.deep.equal([
            {
                source: "./schema",
                datasource: {},
            },
            {
                source: "./schema_existing",
                datasource: {},
            },
            {
                source: "./schema_test_resolver",
                id: "test_resolver",
                datasource: {
                    httpGraphql: {
                        uri: "www.test.com",
                    },
                },
            },
        ]);
    });
});
describe("askQuestions", () => {
    let setup;
    let config;
    let experimentsStub;
    let loadAllStub;
    let selectStub;
    let inputStub;
    beforeEach(() => {
        setup = {
            config: {},
            rcfile: {},
            instructions: [],
        };
        config = new config_1.Config({}, { projectDir: "." });
        experimentsStub = sinon.stub(experiments, "isEnabled");
        loadAllStub = sinon.stub(load, "loadAll");
        selectStub = sinon.stub(prompt, "select");
        inputStub = sinon.stub(prompt, "input");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should throw error when no services", async () => {
        experimentsStub.returns(true);
        loadAllStub.resolves([]);
        try {
            await (0, resolver_1.askQuestions)(setup, config);
        }
        catch (err) {
            expect(err.message).to.equal(`No Firebase Data Connect workspace found. Run ${clc.bold("firebase init dataconnect")} to set up a service and main schema.`);
        }
    });
    it("should skip service selection when exactly one service", async () => {
        experimentsStub.returns(true);
        loadAllStub.resolves([
            {
                serviceName: "projects/project-id/locations/us-central1/services/service-id",
                dataConnectYaml: { location: "us-central1", serviceId: "service-id" },
            },
        ]);
        inputStub.onFirstCall().resolves("test_resolver");
        await (0, resolver_1.askQuestions)(setup, config);
        expect(selectStub.called).to.be.false;
        expect(inputStub.calledOnce).to.be.true;
        expect(setup.featureInfo?.dataconnectResolver?.id).to.equal("test_resolver");
        expect(setup.featureInfo?.dataconnectResolver?.uri).to.equal("https://test_resolver-PROJECT_NUMBER.us-central1.run.app/graphql");
        expect(setup.featureInfo?.dataconnectResolver?.serviceInfo.serviceName).to.equal("projects/project-id/locations/us-central1/services/service-id");
    });
    it("should prompt for service selection when multiple services", async () => {
        experimentsStub.returns(true);
        loadAllStub.resolves([
            { serviceName: "projects/project-id/locations/us-central1/services/service-id" },
            {
                serviceName: "projects/project-id/locations/us-central1/services/service-id2",
                dataConnectYaml: { location: "us-central1", serviceId: "service-id2" },
            },
        ]);
        selectStub.resolves({
            serviceName: "projects/project-id/locations/us-central1/services/service-id2",
            dataConnectYaml: { location: "us-central1", serviceId: "service-id2" },
        });
        inputStub.onFirstCall().resolves("test_resolver");
        await (0, resolver_1.askQuestions)(setup, config);
        expect(selectStub.calledOnce).to.be.true;
        expect(inputStub.calledOnce).to.be.true;
        expect(setup.featureInfo?.dataconnectResolver?.id).to.equal("test_resolver");
        expect(setup.featureInfo?.dataconnectResolver?.uri).to.equal("https://test_resolver-PROJECT_NUMBER.us-central1.run.app/graphql");
        expect(setup.featureInfo?.dataconnectResolver?.serviceInfo.serviceName).to.equal("projects/project-id/locations/us-central1/services/service-id2");
    });
    it("uses project number in URI if set", async () => {
        setup.projectNumber = "123456789";
        experimentsStub.returns(true);
        loadAllStub.resolves([
            {
                serviceName: "projects/project-id/locations/us-central1/services/service-id",
                dataConnectYaml: { location: "us-central1", serviceId: "service-id" },
            },
        ]);
        inputStub.onFirstCall().resolves("test_resolver");
        await (0, resolver_1.askQuestions)(setup, config);
        expect(selectStub.called).to.be.false;
        expect(inputStub.calledOnce).to.be.true;
        expect(setup.featureInfo?.dataconnectResolver?.id).to.equal("test_resolver");
        expect(setup.featureInfo?.dataconnectResolver?.uri).to.equal("https://test_resolver-123456789.us-central1.run.app/graphql");
        expect(setup.featureInfo?.dataconnectResolver?.serviceInfo.serviceName).to.equal("projects/project-id/locations/us-central1/services/service-id");
    });
});
describe("actuate", () => {
    let setup;
    let config;
    let experimentsStub;
    let writeProjectFileStub;
    let ensureSyncStub;
    beforeEach(() => {
        experimentsStub = sinon.stub(experiments, "isEnabled");
        writeProjectFileStub = sinon.stub();
        ensureSyncStub = sinon.stub(fs, "ensureFileSync");
        setup = {
            config: { projectDir: "/path/to/project" },
            rcfile: {},
            featureInfo: {
                dataconnectResolver: {
                    id: "test_resolver",
                    uri: "www.test.com",
                    serviceInfo: {
                        sourceDirectory: "/path/to/service",
                        serviceName: "service-id",
                        schemas: [],
                        dataConnectYaml: {
                            location: "us-central1",
                            serviceId: "service-id",
                            schemas: [
                                {
                                    source: "./schema",
                                    datasource: {},
                                },
                            ],
                            connectorDirs: [],
                        },
                        connectorInfo: [],
                    },
                },
            },
            instructions: [],
        };
        config = {
            writeProjectFile: writeProjectFileStub,
            projectDir: "/path/to/project",
            get: () => ({}),
            set: () => ({}),
            has: () => true,
            path: (p) => p,
            readProjectFile: () => ({}),
            projectFileExists: () => true,
            deleteProjectFile: () => ({}),
            confirmWriteProjectFile: async () => true,
            askWriteProjectFile: async () => ({}),
        };
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should no-op when fdcwebhooks experiment is not enabled", async () => {
        experimentsStub.returns(false);
        await (0, resolver_1.actuate)(setup, config);
        expect(writeProjectFileStub.called).to.be.false;
        expect(ensureSyncStub.called).to.be.false;
    });
    it("should write dataconnect.yaml and set up empty secondary schema file", async () => {
        experimentsStub.returns(true);
        await (0, resolver_1.actuate)(setup, config);
        expect(writeProjectFileStub.calledOnce).to.be.true;
        const writtenYamlPath = writeProjectFileStub.getCall(0).args[0];
        const writtenYamlContents = writeProjectFileStub.getCall(0).args[1];
        const parsedYaml = yaml.load(writtenYamlContents);
        expect(writtenYamlPath).to.equal("../service/dataconnect.yaml");
        expect(parsedYaml.schemas).to.have.lengthOf(2);
        expect(ensureSyncStub.calledOnce).to.be.true;
        const writtenSchemaPath = ensureSyncStub.getCall(0).args[0];
        expect(writtenSchemaPath).to.equal("/path/to/service/schema_test_resolver/schema.gql");
    });
});
//# sourceMappingURL=resolver.spec.js.map