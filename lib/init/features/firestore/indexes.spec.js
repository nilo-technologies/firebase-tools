"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const prompt = require("../../../prompt");
const config = require("../../../config");
const indexes_1 = require("./indexes");
const api_1 = require("../../../firestore/api");
describe("firestore indexes", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("initIndexes", () => {
        it("should prompt for indexes file and write default indexes", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            const cfg = new config.Config({}, { projectDir: "/", cwd: "/" });
            const inputStub = sandbox.stub(prompt, "input").resolves("firestore.indexes.json");
            const writeStub = sandbox.stub(cfg, "confirmWriteProjectFile").resolves(true);
            await (0, indexes_1.initIndexes)(setup, cfg, {
                databaseId: "(default)",
                indexesFilename: "",
                indexes: "",
                writeIndexes: false,
                rulesFilename: "",
                rules: "",
                writeRules: false,
                locationId: "",
            });
            (0, chai_1.expect)(inputStub.calledOnce).to.be.true;
            (0, chai_1.expect)(writeStub.calledOnceWith("firestore.indexes.json", indexes_1.INDEXES_TEMPLATE)).to.be.true;
        });
        it("should download indexes from console", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                projectId: "test-project",
                instructions: [],
            };
            const cfg = new config.Config({}, { projectDir: "/", cwd: "/" });
            const listIndexesStub = sandbox.stub(api_1.FirestoreApi.prototype, "listIndexes").resolves([]);
            const listFieldOverridesStub = sandbox
                .stub(api_1.FirestoreApi.prototype, "listFieldOverrides")
                .resolves([]);
            const makeIndexSpecStub = sandbox
                .stub(api_1.FirestoreApi.prototype, "makeIndexSpec")
                .returns({ indexes: [], fieldOverrides: [] });
            const writeStub = sandbox.stub(cfg, "confirmWriteProjectFile").resolves(true);
            const info = {
                databaseId: "(default)",
                indexesFilename: "firestore.indexes.json",
                indexes: "",
                writeIndexes: false,
                rulesFilename: "",
                rules: "",
                writeRules: false,
                locationId: "",
            };
            await (0, indexes_1.initIndexes)(setup, cfg, info);
            (0, chai_1.expect)(listIndexesStub.calledOnceWith("test-project", "(default)")).to.be.true;
            (0, chai_1.expect)(listFieldOverridesStub.calledOnceWith("test-project", "(default)")).to.be.true;
            (0, chai_1.expect)(makeIndexSpecStub.calledOnceWith([], [])).to.be.true;
            (0, chai_1.expect)(writeStub.calledOnceWith("firestore.indexes.json", JSON.stringify({ indexes: [], fieldOverrides: [] }, null, 2))).to.be.true;
            (0, chai_1.expect)(info.indexes).to.equal(JSON.stringify({ indexes: [], fieldOverrides: [] }, null, 2));
        });
    });
});
//# sourceMappingURL=indexes.spec.js.map