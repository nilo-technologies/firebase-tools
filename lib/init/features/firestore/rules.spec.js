"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const gcp = require("../../../gcp");
const prompt = require("../../../prompt");
const config = require("../../../config");
const rules_1 = require("./rules");
describe("firestore rules", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("getDefaultRules", () => {
        it("should return the default rules with the correct date", () => {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            const expectedDate = `${date.getFullYear()}, ${date.getMonth() + 1}, ${date.getDate()}`;
            const rules = (0, rules_1.getDefaultRules)();
            (0, chai_1.expect)(rules).to.include(`allow read, write: if request.time < timestamp.date(${expectedDate});`);
        });
    });
    describe("initRules", () => {
        it("should prompt for rules file and write default rules", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            const cfg = new config.Config({}, { projectDir: "/", cwd: "/" });
            sandbox.stub(prompt, "input").resolves("firestore.rules");
            sandbox.stub(cfg, "writeProjectFile");
            const confirmStub = sandbox.stub(cfg, "confirmWriteProjectFile").resolves(true);
            await (0, rules_1.initRules)(setup, cfg, {
                rulesFilename: "",
                rules: "",
                writeRules: false,
                databaseId: "",
                locationId: "",
                indexesFilename: "",
                indexes: "",
                writeIndexes: false,
            });
            (0, chai_1.expect)(confirmStub.calledOnceWith("firestore.rules", (0, rules_1.getDefaultRules)())).to.be.true;
        });
        it("should download rules from console", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                projectId: "test-project",
                instructions: [],
            };
            const cfg = new config.Config({}, { projectDir: "/", cwd: "/" });
            const getRulesetNameStub = sandbox
                .stub(gcp.rules, "getLatestRulesetName")
                .resolves("ruleset-name");
            const getRulesetContentStub = sandbox
                .stub(gcp.rules, "getRulesetContent")
                .resolves([{ name: "file.rules", content: "console rules" }]);
            const writeStub = sandbox.stub(cfg, "confirmWriteProjectFile").resolves(true);
            const info = {
                rulesFilename: "firestore.rules",
                rules: "",
                writeRules: false,
                databaseId: "",
                locationId: "",
                indexesFilename: "",
                indexes: "",
                writeIndexes: false,
            };
            await (0, rules_1.initRules)(setup, cfg, info);
            (0, chai_1.expect)(getRulesetNameStub.calledOnceWith("test-project", "cloud.firestore")).to.be.true;
            (0, chai_1.expect)(getRulesetContentStub.calledOnceWith("ruleset-name")).to.be.true;
            (0, chai_1.expect)(writeStub.calledOnceWith("firestore.rules", "console rules")).to.be.true;
            (0, chai_1.expect)(info.rules).to.equal("console rules");
        });
    });
});
//# sourceMappingURL=rules.spec.js.map