"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const fs = require("fs");
const genkit = require(".");
const prompt = require("../../../prompt");
const spawn = require("../../spawn");
const projectUtils = require("../../../projectUtils");
const functions = require("../functions");
const ensureApiEnabled = require("../../../ensureApiEnabled");
const rc_1 = require("../../../rc");
const config_1 = require("../../../config");
describe("genkit", () => {
    const sandbox = sinon.createSandbox();
    let promptStub;
    let spawnStub;
    let functionsStub;
    let readFileSyncStub;
    let writeFileSyncStub;
    let existsSyncStub;
    let options;
    let cfg;
    beforeEach(() => {
        promptStub = sandbox.stub(prompt);
        spawnStub = sandbox.stub(spawn);
        functionsStub = sandbox.stub(functions);
        sandbox.stub(ensureApiEnabled);
        sandbox.stub(projectUtils, "getProjectId").returns("test-project");
        readFileSyncStub = sandbox.stub(fs, "readFileSync");
        writeFileSyncStub = sandbox.stub(fs, "writeFileSync");
        existsSyncStub = sandbox.stub(fs, "existsSync");
        sandbox.stub(fs, "mkdirSync");
        options = {
            cwd: "",
            configPath: "",
            only: "",
            except: "",
            filteredTargets: [],
            force: false,
            nonInteractive: false,
            debug: false,
            config: new config_1.Config("{}", {}),
            rc: new rc_1.RC(),
        };
        cfg = new config_1.Config({}, { projectDir: "test", cwd: "test" });
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("doSetup", () => {
        beforeEach(() => {
            functionsStub.doSetup.callsFake(async (setup) => {
                setup.functions = {
                    source: "functions",
                    codebase: "default",
                };
                return Promise.resolve();
            });
            readFileSyncStub.returns("{}");
        });
        it("should set up a new genkit project", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            spawnStub.spawnWithOutput.resolves("1.0.0");
            promptStub.confirm.resolves(true);
            promptStub.select
                .onFirstCall()
                .resolves("globally")
                .onSecondCall()
                .resolves("vertexai")
                .onThirdCall()
                .resolves("overwrite")
                .onCall(3)
                .resolves("overwrite");
            existsSyncStub.returns(true);
            await genkit.doSetup(setup, cfg, options);
            (0, chai_1.expect)(setup.functions).to.deep.equal({
                source: "functions",
                codebase: "default",
            });
            (0, chai_1.expect)(spawnStub.wrapSpawn.withArgs("npm", ["install", "-g", "genkit-cli@1.0.0"], "test/functions")
                .calledOnce).to.be.true;
            (0, chai_1.expect)(spawnStub.wrapSpawn.withArgs("npm", [
                "install",
                "express",
                "genkit@1.0.0",
                "@genkit-ai/firebase@1.0.0",
                "@genkit-ai/vertexai@1.0.0",
                "--save",
            ], "test/functions").calledOnce).to.be.true;
            (0, chai_1.expect)(writeFileSyncStub.getCall(0).args[0]).to.equal("test/functions/tsconfig.json");
            (0, chai_1.expect)(writeFileSyncStub.getCall(1).args[0]).to.equal("test/functions/package.json");
            (0, chai_1.expect)(writeFileSyncStub.getCall(2).args[0]).to.equal("test/functions/src/genkit-sample.ts");
        });
        it("should install the cli locally", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            spawnStub.spawnWithOutput.resolves("1.0.0");
            promptStub.confirm.resolves(true);
            promptStub.select.onFirstCall().resolves("project").onSecondCall().resolves("vertexai");
            await genkit.doSetup(setup, cfg, options);
            (0, chai_1.expect)(spawnStub.wrapSpawn.getCall(0).args).to.deep.equal([
                "npm",
                ["install", "genkit-cli@1.0.0", "--save-dev"],
                "test/functions",
            ]);
        });
        it("should set up with the googleai provider", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            spawnStub.spawnWithOutput.resolves("1.0.0");
            promptStub.confirm.resolves(true);
            promptStub.select.onFirstCall().resolves("project").onSecondCall().resolves("googleai");
            await genkit.doSetup(setup, cfg, options);
            (0, chai_1.expect)(spawnStub.wrapSpawn.getCall(1).args).to.deep.equal([
                "npm",
                [
                    "install",
                    "express",
                    "genkit@1.0.0",
                    "@genkit-ai/firebase@1.0.0",
                    "@genkit-ai/googleai@1.0.0",
                    "--save",
                ],
                "test/functions",
            ]);
        });
        it("should not generate a sample file if the user declines", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            spawnStub.spawnWithOutput.resolves("1.0.0");
            promptStub.confirm.onFirstCall().resolves(true).onSecondCall().resolves(false);
            promptStub.select.onFirstCall().resolves("project").onSecondCall().resolves("googleai");
            existsSyncStub.withArgs(sinon.match(/package\.json$/)).returns(true);
            await genkit.doSetup(setup, cfg, options);
            (0, chai_1.expect)(writeFileSyncStub.callCount).to.equal(2);
        });
        it("should keep existing config files if the user chooses", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            spawnStub.spawnWithOutput.resolves("1.0.0");
            promptStub.confirm.onFirstCall().resolves(true).onSecondCall().resolves(false);
            promptStub.select
                .onFirstCall()
                .resolves("project")
                .onSecondCall()
                .resolves("vertexai")
                .onThirdCall()
                .resolves("keep")
                .onCall(3)
                .resolves("keep");
            existsSyncStub.returns(true);
            await genkit.doSetup(setup, cfg, options);
            (0, chai_1.expect)(writeFileSyncStub.callCount).to.equal(0);
        });
        it("should abort if the user declines functions setup", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            spawnStub.spawnWithOutput.resolves("1.0.0");
            promptStub.confirm.resolves(false);
            await genkit.doSetup(setup, cfg, options);
            (0, chai_1.expect)(functionsStub.doSetup.notCalled).to.be.true;
        });
    });
});
//# sourceMappingURL=index.spec.js.map