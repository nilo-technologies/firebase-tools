"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const promptImport = require("../../prompt");
const config_1 = require("../../config");
const functions_1 = require("./functions");
const rc_1 = require("../../rc");
const TEST_SOURCE_DEFAULT = "functions";
const TEST_CODEBASE_DEFAULT = "default";
function createExistingTestSetupAndConfig() {
    const cbconfig = {
        source: TEST_SOURCE_DEFAULT,
        codebase: TEST_CODEBASE_DEFAULT,
        ignore: ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log", "*.local"],
        predeploy: ['npm --prefix "$RESOURCE_DIR" run lint'],
    };
    return {
        setup: {
            config: {
                functions: [cbconfig],
            },
            rcfile: { projects: {}, targets: {}, etags: {} },
            featureArg: true,
            instructions: [],
        },
        config: new config_1.Config({ functions: [cbconfig] }, { projectDir: "test", cwd: "test" }),
    };
}
describe("functions", () => {
    const sandbox = sinon.createSandbox();
    let prompt;
    let askWriteProjectFileStub;
    let emptyConfig;
    let options;
    beforeEach(() => {
        prompt = sinon.stub(promptImport);
        prompt.input.throws("Unexpected input call");
        prompt.select.throws("Unexpected select call");
        prompt.confirm.throws("Unexpected confirm call");
        emptyConfig = new config_1.Config("{}", {});
        options = {
            cwd: "",
            configPath: "",
            only: "",
            except: "",
            filteredTargets: [],
            force: false,
            nonInteractive: false,
            debug: false,
            config: emptyConfig,
            rc: new rc_1.RC(),
        };
    });
    afterEach(() => {
        sinon.verifyAndRestore();
        sandbox.verifyAndRestore();
    });
    describe("doSetup", () => {
        describe("with an uninitialized Firebase project repository", () => {
            it("creates a new javascript codebase with the correct configuration", async () => {
                const setup = { config: { functions: [] }, rcfile: {} };
                prompt.select.onFirstCall().resolves("javascript");
                prompt.confirm.onFirstCall().resolves(true);
                prompt.confirm.onSecondCall().resolves(false);
                askWriteProjectFileStub = sandbox.stub(emptyConfig, "askWriteProjectFile");
                askWriteProjectFileStub.resolves();
                await (0, functions_1.doSetup)(setup, emptyConfig, options);
                (0, chai_1.expect)(setup.config.functions[0]).to.deep.equal({
                    source: TEST_SOURCE_DEFAULT,
                    codebase: TEST_CODEBASE_DEFAULT,
                    ignore: ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log", "*.local"],
                    predeploy: ['npm --prefix "$RESOURCE_DIR" run lint'],
                    disallowLegacyRuntimeConfig: true,
                });
                (0, chai_1.expect)(askWriteProjectFileStub.getCalls().map((call) => call.args[0])).to.deep.equal([
                    `${TEST_SOURCE_DEFAULT}/package.json`,
                    `${TEST_SOURCE_DEFAULT}/.eslintrc.js`,
                    `${TEST_SOURCE_DEFAULT}/index.js`,
                    `${TEST_SOURCE_DEFAULT}/.gitignore`,
                ]);
            });
            it("creates a new typescript codebase with the correct configuration", async () => {
                const setup = { config: { functions: [] }, rcfile: {} };
                prompt.select.onFirstCall().resolves("typescript");
                prompt.confirm.onFirstCall().resolves(true);
                prompt.confirm.onSecondCall().resolves(false);
                askWriteProjectFileStub = sandbox.stub(emptyConfig, "askWriteProjectFile");
                askWriteProjectFileStub.resolves();
                await (0, functions_1.doSetup)(setup, emptyConfig, options);
                (0, chai_1.expect)(setup.config.functions[0]).to.deep.equal({
                    source: TEST_SOURCE_DEFAULT,
                    codebase: TEST_CODEBASE_DEFAULT,
                    ignore: ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log", "*.local"],
                    predeploy: [
                        'npm --prefix "$RESOURCE_DIR" run lint',
                        'npm --prefix "$RESOURCE_DIR" run build',
                    ],
                    disallowLegacyRuntimeConfig: true,
                });
                (0, chai_1.expect)(askWriteProjectFileStub.getCalls().map((call) => call.args[0])).to.deep.equal([
                    `${TEST_SOURCE_DEFAULT}/package.json`,
                    `${TEST_SOURCE_DEFAULT}/.eslintrc.js`,
                    `${TEST_SOURCE_DEFAULT}/tsconfig.dev.json`,
                    `${TEST_SOURCE_DEFAULT}/tsconfig.json`,
                    `${TEST_SOURCE_DEFAULT}/src/index.ts`,
                    `${TEST_SOURCE_DEFAULT}/.gitignore`,
                ]);
            });
        });
        describe("with an existing functions codebase in Firebase repository", () => {
            it("initializes a new codebase", async () => {
                const { setup, config } = createExistingTestSetupAndConfig();
                prompt.select.onFirstCall().resolves("new");
                prompt.input.onFirstCall().resolves("testcodebase2");
                prompt.input.onSecondCall().resolves("testsource2");
                prompt.select.onSecondCall().resolves("javascript");
                prompt.confirm.onFirstCall().resolves(true);
                prompt.confirm.onSecondCall().resolves(false);
                askWriteProjectFileStub = sandbox.stub(config, "askWriteProjectFile");
                askWriteProjectFileStub.resolves();
                await (0, functions_1.doSetup)(setup, config, options);
                (0, chai_1.expect)(setup.config.functions).to.deep.equal([
                    {
                        source: TEST_SOURCE_DEFAULT,
                        codebase: TEST_CODEBASE_DEFAULT,
                        ignore: [
                            "node_modules",
                            ".git",
                            "firebase-debug.log",
                            "firebase-debug.*.log",
                            "*.local",
                        ],
                        predeploy: ['npm --prefix "$RESOURCE_DIR" run lint'],
                    },
                    {
                        source: "testsource2",
                        codebase: "testcodebase2",
                        ignore: [
                            "node_modules",
                            ".git",
                            "firebase-debug.log",
                            "firebase-debug.*.log",
                            "*.local",
                        ],
                        predeploy: ['npm --prefix "$RESOURCE_DIR" run lint'],
                        disallowLegacyRuntimeConfig: true,
                    },
                ]);
                (0, chai_1.expect)(askWriteProjectFileStub.getCalls().map((call) => call.args[0])).to.deep.equal([
                    `testsource2/package.json`,
                    `testsource2/.eslintrc.js`,
                    `testsource2/index.js`,
                    `testsource2/.gitignore`,
                ]);
            });
            it("reinitializes an existing codebase", async () => {
                const { setup, config } = createExistingTestSetupAndConfig();
                prompt.select.onFirstCall().resolves("reinit");
                prompt.select.onSecondCall().resolves("javascript");
                prompt.confirm.onFirstCall().resolves(true);
                prompt.confirm.onSecondCall().resolves(false);
                askWriteProjectFileStub = sandbox.stub(config, "askWriteProjectFile");
                askWriteProjectFileStub.resolves();
                await (0, functions_1.doSetup)(setup, config, options);
                (0, chai_1.expect)(setup.config.functions).to.deep.equal([
                    {
                        source: TEST_SOURCE_DEFAULT,
                        codebase: TEST_CODEBASE_DEFAULT,
                        ignore: [
                            "node_modules",
                            ".git",
                            "firebase-debug.log",
                            "firebase-debug.*.log",
                            "*.local",
                        ],
                        predeploy: ['npm --prefix "$RESOURCE_DIR" run lint'],
                    },
                ]);
                (0, chai_1.expect)(askWriteProjectFileStub.getCalls().map((call) => call.args[0])).to.deep.equal([
                    `${TEST_SOURCE_DEFAULT}/package.json`,
                    `${TEST_SOURCE_DEFAULT}/.eslintrc.js`,
                    `${TEST_SOURCE_DEFAULT}/index.js`,
                    `${TEST_SOURCE_DEFAULT}/.gitignore`,
                ]);
            });
        });
    });
}).timeout(5000);
//# sourceMappingURL=functions.spec.js.map