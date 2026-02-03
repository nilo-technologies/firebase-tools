"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const prompt = require("../../../prompt");
const config = require("../../../config");
const ensureApiEnabled = require("../../../ensureApiEnabled");
const api_1 = require("../../../firestore/api");
const index_1 = require("./index");
const rules = require("./rules");
const indexes = require("./indexes");
describe("firestore feature init", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("askQuestions", () => {
        it("should prompt for database id and location", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                projectId: "test-project",
                instructions: [],
            };
            const cfg = new config.Config({}, { projectDir: "/", cwd: "/" });
            sandbox.stub(ensureApiEnabled, "ensure").resolves();
            sandbox.stub(api_1.FirestoreApi.prototype, "listDatabases").resolves([]);
            sandbox.stub(api_1.FirestoreApi.prototype, "locations").resolves([
                {
                    name: "projects/test-project/locations/us-central",
                    locationId: "us-central",
                    displayName: "us-central",
                    labels: {},
                    metadata: {},
                },
            ]);
            const selectStub = sandbox.stub(prompt, "select").resolves("us-central");
            const initRulesStub = sandbox.stub(rules, "initRules").resolves();
            const initIndexesStub = sandbox.stub(indexes, "initIndexes").resolves();
            await (0, index_1.askQuestions)(setup, cfg);
            (0, chai_1.expect)(selectStub.calledOnce).to.be.true;
            (0, chai_1.expect)(initRulesStub.calledOnce).to.be.true;
            (0, chai_1.expect)(initIndexesStub.calledOnce).to.be.true;
        });
    });
    describe("actuate", () => {
        it("should write rules and indexes files", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                featureInfo: {
                    firestore: {
                        rulesFilename: "firestore.rules",
                        rules: "rules content",
                        writeRules: true,
                        indexesFilename: "firestore.indexes.json",
                        indexes: "indexes content",
                        writeIndexes: true,
                        databaseId: "(default)",
                        locationId: "us-central",
                    },
                },
                instructions: [],
            };
            const cfg = new config.Config({}, { projectDir: "/", cwd: "/" });
            const writeStub = sandbox.stub(cfg, "writeProjectFile");
            await (0, index_1.actuate)(setup, cfg);
            (0, chai_1.expect)(writeStub.calledTwice).to.be.true;
            (0, chai_1.expect)(writeStub.firstCall.calledWith("firestore.rules", "rules content")).to.be.true;
            (0, chai_1.expect)(writeStub.secondCall.calledWith("firestore.indexes.json", "indexes content")).to.be
                .true;
        });
    });
});
//# sourceMappingURL=index.spec.js.map