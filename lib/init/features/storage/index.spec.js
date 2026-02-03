"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const _ = require("lodash");
const sinon = require("sinon");
const config_1 = require("../../../config");
const index_1 = require("./index");
const prompt = require("../../../prompt");
const rules = require("./rules");
describe("storage", () => {
    const sandbox = sinon.createSandbox();
    let writeProjectFileStub;
    let confirmWriteProjectFileStub;
    let promptStub;
    let getRulesFromConsoleStub;
    beforeEach(() => {
        writeProjectFileStub = sandbox.stub(config_1.Config.prototype, "writeProjectFile");
        confirmWriteProjectFileStub = sandbox.stub(config_1.Config.prototype, "confirmWriteProjectFile");
        promptStub = sandbox.stub(prompt, "input");
        getRulesFromConsoleStub = sandbox.stub(rules, "getRulesFromConsole");
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("askQuestions", () => {
        it("should set up the correct properties in the project", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                projectId: "demo-project",
                projectLocation: "us-central",
                instructions: [],
            };
            const config = new config_1.Config({}, { projectDir: "test", cwd: "test" });
            promptStub.returns("storage.rules");
            confirmWriteProjectFileStub.resolves(true);
            getRulesFromConsoleStub.resolves(null);
            await (0, index_1.askQuestions)(setup, config);
            await (0, index_1.actuate)(setup, config);
            (0, chai_1.expect)(_.get(setup, "config.storage.rules")).to.deep.equal("storage.rules");
            (0, chai_1.expect)(writeProjectFileStub).to.have.been.calledWith("storage.rules", sinon.match.string);
        });
        it("should use downloaded rules if available", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                projectId: "demo-project",
                projectLocation: "us-central",
                instructions: [],
            };
            const config = new config_1.Config({}, { projectDir: "test", cwd: "test" });
            promptStub.returns("storage.rules");
            confirmWriteProjectFileStub.resolves(true);
            const existingRules = "service firebase.storage { match /b/{bucket}/o { match /{allPaths=**} { allow read, write: if request.auth != null; } } }";
            getRulesFromConsoleStub.resolves(existingRules);
            await (0, index_1.askQuestions)(setup, config);
            await (0, index_1.actuate)(setup, config);
            (0, chai_1.expect)(_.get(setup, "config.storage.rules")).to.deep.equal("storage.rules");
            (0, chai_1.expect)(writeProjectFileStub).to.have.been.calledWith("storage.rules", existingRules);
        });
    });
});
//# sourceMappingURL=index.spec.js.map