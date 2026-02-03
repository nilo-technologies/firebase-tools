"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const yaml = require("yaml");
const path = require("path");
const fsImport = require("../fsutils");
const csmImport = require("../gcp/secretManager");
const promptImport = require("../prompt");
const dialogs = require("./secrets/dialogs");
const config = require("./config");
const yaml_1 = require("./yaml");
const error_1 = require("../error");
describe("config", () => {
    describe("discoverBackendRoot", () => {
        let fs;
        beforeEach(() => {
            fs = sinon.stub(fsImport);
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("finds apphosting.yaml at cwd", () => {
            fs.listFiles.withArgs("/parent/cwd").returns(["apphosting.yaml"]);
            (0, chai_1.expect)(config.discoverBackendRoot("/parent/cwd")).equals("/parent/cwd");
        });
        it("finds apphosting.yaml in a parent directory", () => {
            fs.listFiles.withArgs("/parent/cwd").returns(["random_file.txt"]);
            fs.listFiles.withArgs("/parent").returns(["apphosting.yaml"]);
            (0, chai_1.expect)(config.discoverBackendRoot("/parent/cwd")).equals("/parent");
        });
        it("returns null if it finds firebase.json without finding apphosting.yaml", () => {
            fs.listFiles.withArgs("/parent/cwd").returns([]);
            fs.listFiles.withArgs("/parent").returns(["firebase.json"]);
            (0, chai_1.expect)(config.discoverBackendRoot("/parent/cwd")).equals(null);
        });
        it("returns if it reaches the fs root", () => {
            fs.listFiles.withArgs("/parent/cwd").returns([]);
            fs.listFiles.withArgs("/parent").returns(["random_file.txt"]);
            fs.listFiles.withArgs("/").returns([]);
            (0, chai_1.expect)(config.discoverBackendRoot("/parent/cwd")).equals(null);
        });
        it("discovers backend root from any apphosting yaml file", () => {
            fs.listFiles.withArgs("/parent/cwd").returns(["apphosting.staging.yaml"]);
            (0, chai_1.expect)(config.discoverBackendRoot("/parent/cwd")).equals("/parent/cwd");
        });
    });
    describe("get/setEnv", () => {
        it("sets new envs", () => {
            const doc = new yaml.Document();
            const env = {
                variable: "VARIABLE",
                value: "value",
            };
            config.upsertEnv(doc, env);
            const envAgain = config.findEnv(doc, env.variable);
            (0, chai_1.expect)(envAgain).deep.equals(env);
            const envs = doc.get("env");
            (0, chai_1.expect)(envs.toJSON()).to.deep.equal([env]);
        });
        it("overwrites envs", () => {
            const doc = new yaml.Document();
            const env = {
                variable: "VARIABLE",
                value: "value",
            };
            const newEnv = {
                variable: env.variable,
                secret: "my-secret",
            };
            config.upsertEnv(doc, env);
            config.upsertEnv(doc, newEnv);
            (0, chai_1.expect)(config.findEnv(doc, env.variable)).to.deep.equal(newEnv);
        });
        it("Preserves comments", () => {
            const rawDoc = `
# Run config
runConfig:
  # Reserve capacity
  minInstances: 1

env:
  # Publicly available
  - variable: NEXT_PUBLIC_BUCKET
    value: mybucket.appspot.com
`.trim();
            const expectedAmendments = `
  - variable: GOOGLE_API_KEY
    secret: api-key
`;
            const doc = yaml.parseDocument(rawDoc);
            config.upsertEnv(doc, {
                variable: "GOOGLE_API_KEY",
                secret: "api-key",
            });
            (0, chai_1.expect)(doc.toString()).to.equal(rawDoc + expectedAmendments);
        });
    });
    describe("maybeAddSecretToYaml", () => {
        let prompt;
        let discoverBackendRoot;
        let load;
        let findEnv;
        let upsertEnv;
        let store;
        let envVarForSecret;
        beforeEach(() => {
            prompt = sinon.stub(promptImport);
            discoverBackendRoot = sinon.stub(config, "discoverBackendRoot");
            load = sinon.stub(config, "load");
            findEnv = sinon.stub(config, "findEnv");
            upsertEnv = sinon.stub(config, "upsertEnv");
            store = sinon.stub(config, "store");
            envVarForSecret = sinon.stub(dialogs, "envVarForSecret");
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("noops if the env already exists", async () => {
            const doc = yaml.parseDocument("{}");
            discoverBackendRoot.returns("CWD");
            load.returns(doc);
            findEnv.withArgs(doc, "SECRET").returns({ variable: "SECRET", secret: "SECRET" });
            await config.maybeAddSecretToYaml("SECRET");
            (0, chai_1.expect)(discoverBackendRoot).to.have.been.called;
            (0, chai_1.expect)(load).to.have.been.calledWith("CWD/apphosting.yaml");
            (0, chai_1.expect)(prompt.confirm).to.not.have.been.called;
            (0, chai_1.expect)(prompt.input).to.not.have.been.called;
        });
        it("inserts into an existing doc", async () => {
            const doc = yaml.parseDocument("{}");
            discoverBackendRoot.returns("CWD");
            load.withArgs(path.join("CWD", "apphosting.yaml")).returns(doc);
            findEnv.withArgs(doc, "SECRET").returns(undefined);
            prompt.confirm.resolves(true);
            envVarForSecret.resolves("SECRET_VARIABLE");
            await config.maybeAddSecretToYaml("SECRET");
            (0, chai_1.expect)(discoverBackendRoot).to.have.been.called;
            (0, chai_1.expect)(load).to.have.been.calledWith("CWD/apphosting.yaml");
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWithMatch({
                message: "Would you like to add this secret to apphosting.yaml?",
                default: true,
            });
            (0, chai_1.expect)(envVarForSecret).to.have.been.calledWith("SECRET");
            (0, chai_1.expect)(upsertEnv).to.have.been.calledWithMatch(doc, {
                variable: "SECRET_VARIABLE",
                secret: "SECRET",
            });
            (0, chai_1.expect)(store).to.have.been.calledWithMatch(path.join("CWD", "apphosting.yaml"), doc);
            (0, chai_1.expect)(prompt.input).to.not.have.been.called;
        });
        it("inserts into an new doc", async () => {
            const doc = new yaml.Document();
            discoverBackendRoot.returns(null);
            findEnv.withArgs(doc, "SECRET").returns(undefined);
            prompt.confirm.resolves(true);
            prompt.input.resolves("CWD");
            envVarForSecret.resolves("SECRET_VARIABLE");
            await config.maybeAddSecretToYaml("SECRET");
            (0, chai_1.expect)(discoverBackendRoot).to.have.been.called;
            (0, chai_1.expect)(load).to.not.have.been.called;
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWithMatch({
                message: "Would you like to add this secret to apphosting.yaml?",
                default: true,
            });
            (0, chai_1.expect)(prompt.input).to.have.been.calledWithMatch({
                message: "It looks like you don't have an apphosting.yaml yet. Where would you like to store it?",
                default: process.cwd(),
            });
            (0, chai_1.expect)(envVarForSecret).to.have.been.calledWith("SECRET");
            (0, chai_1.expect)(upsertEnv).to.have.been.calledWithMatch(doc, {
                variable: "SECRET_VARIABLE",
                secret: "SECRET",
            });
            (0, chai_1.expect)(store).to.have.been.calledWithMatch(path.join("CWD", "apphosting.yaml"), doc);
        });
    });
    describe("listAppHostingFilesInPath", () => {
        let fs;
        beforeEach(() => {
            fs = sinon.stub(fsImport);
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("only returns valid App Hosting YAML files", () => {
            fs.listFiles
                .withArgs("/parent/cwd")
                .returns([
                "test1.js",
                "test2.js",
                "apphosting.yaml",
                "test4.js",
                "apphosting.staging.yaml",
            ]);
            const apphostingYamls = config.listAppHostingFilesInPath("/parent/cwd");
            (0, chai_1.expect)(apphostingYamls).to.deep.equal([
                "/parent/cwd/apphosting.yaml",
                "/parent/cwd/apphosting.staging.yaml",
            ]);
        });
    });
    describe("maybeGenerateEmulatorsYaml", () => {
        let discoverBackendRoot;
        let overrideChosenEnv;
        let loadFromFile;
        let store;
        let fs;
        let prompt;
        const existingYaml = yaml_1.AppHostingYamlConfig.empty();
        existingYaml.env = {
            VAR: { value: "value" },
            API_KEY: { secret: "api-key" },
            API_KEY2: { secret: "api-key2" },
        };
        beforeEach(() => {
            discoverBackendRoot = sinon.stub(config, "discoverBackendRoot");
            overrideChosenEnv = sinon.stub(config, "overrideChosenEnv");
            store = sinon.stub(config, "store");
            loadFromFile = sinon.stub(yaml_1.AppHostingYamlConfig, "loadFromFile");
            fs = sinon.stub(fsImport);
            prompt = sinon.stub(promptImport);
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("noops if emulators.yaml already exists", async () => {
            discoverBackendRoot.withArgs("/project").returns("/project");
            fs.fileExistsSync.withArgs(`/project/${config.APPHOSTING_EMULATORS_YAML_FILE}`).returns(true);
            await config.maybeGenerateEmulatorYaml("projectId", "/project");
            (0, chai_1.expect)(prompt.confirm).to.not.have.been.called;
            (0, chai_1.expect)(store).to.not.have.been.called;
        });
        it("returns existing config even if the user does not create apphosting.emulator.yaml", async () => {
            discoverBackendRoot.withArgs("/project").returns("/project");
            fs.fileExistsSync
                .withArgs(`/project/${config.APPHOSTING_EMULATORS_YAML_FILE}`)
                .returns(false);
            prompt.confirm.resolves(false);
            loadFromFile.resolves(existingYaml);
            await (0, chai_1.expect)(config.maybeGenerateEmulatorYaml("projectId", "/project")).to.eventually.deep.equal((0, yaml_1.toEnvList)(existingYaml.env));
        });
        it("returns overwritten config", async () => {
            discoverBackendRoot.withArgs("/project").returns("/project");
            fs.fileExistsSync
                .withArgs(`/project/${config.APPHOSTING_EMULATORS_YAML_FILE}`)
                .returns(false);
            loadFromFile.resolves(existingYaml);
            prompt.confirm.resolves(true);
            overrideChosenEnv.resolves({
                API_KEY2: { secret: "test-api-key2" },
            });
            store.resolves();
            await (0, chai_1.expect)(config.maybeGenerateEmulatorYaml("projectId", "/project")).to.eventually.deep.equal([
                { variable: "VAR", value: "value" },
                { variable: "API_KEY", secret: "api-key" },
                { variable: "API_KEY2", secret: "test-api-key2" },
            ]);
            (0, chai_1.expect)(overrideChosenEnv.firstCall.args[1]).to.deep.equal({
                VAR: { value: "value" },
                API_KEY: { secret: "api-key" },
                API_KEY2: { secret: "api-key2" },
            });
            (0, chai_1.expect)(store).to.have.been.called;
            const emulatorYaml = store.firstCall.args[1];
            (0, chai_1.expect)(emulatorYaml.toJSON()).to.deep.equal({
                env: [{ variable: "API_KEY2", secret: "test-api-key2" }],
            });
        });
    });
    describe("overrideChosenEnv", () => {
        let csm;
        let prompt;
        beforeEach(() => {
            csm = sinon.stub(csmImport);
            prompt = sinon.stub(promptImport);
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("noops with no envs", async () => {
            await (0, chai_1.expect)(config.overrideChosenEnv(undefined, {})).to.eventually.deep.equal({});
            (0, chai_1.expect)(promptImport.checkbox).to.not.have.been.called;
            (0, chai_1.expect)(csmImport.getSecret).to.not.have.been.called;
        });
        it("noops with no selected envs", async () => {
            const originalEnv = {
                VARIABLE: { value: "value" },
                API_KEY: { secret: "api-key" },
            };
            prompt.checkbox.onFirstCall().resolves([]);
            await (0, chai_1.expect)(config.overrideChosenEnv(undefined, originalEnv)).to.eventually.deep.equal({});
            (0, chai_1.expect)(prompt.checkbox).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.secretExists).to.not.have.been.called;
        });
        it("can override plaintext values", async () => {
            const originalEnv = {
                VARIABLE: { variable: "VARIABLE", value: "value" },
                VARIABLE2: { variable: "VARIABLE2", value: "value2" },
            };
            prompt.checkbox.onFirstCall().resolves(["VARIABLE2"]);
            prompt.input.onFirstCall().resolves("new-value2");
            await (0, chai_1.expect)(config.overrideChosenEnv(undefined, originalEnv)).to.eventually.deep.equal({
                VARIABLE2: { variable: "VARIABLE2", value: "new-value2" },
            });
            (0, chai_1.expect)(prompt.checkbox).to.have.been.calledOnce;
            (0, chai_1.expect)(prompt.input).to.have.been.calledOnce;
            (0, chai_1.expect)(csmImport.secretExists).to.not.have.been.called;
        });
        it("throws when trying to overwrite secrets without knowing the project", async () => {
            const originalEnv = {
                API_KEY: { variable: "API_KEY", secret: "api-key" },
            };
            prompt.checkbox.onFirstCall().resolves(["API_KEY"]);
            await (0, chai_1.expect)(config.overrideChosenEnv(undefined, originalEnv)).to.be.rejectedWith(error_1.FirebaseError, /Need a project ID to overwrite a secret./);
        });
        it("can create new secrets", async () => {
            const originalEnv = {
                API_KEY: { variable: "API_KEY", secret: "api-key" },
            };
            prompt.checkbox.onFirstCall().resolves(["API_KEY"]);
            prompt.input.onFirstCall().resolves("test-api-key");
            csm.secretExists.withArgs("project", "test-api-key").resolves(false);
            prompt.password.onFirstCall().resolves("plaintext secret value");
            await (0, chai_1.expect)(config.overrideChosenEnv("project", originalEnv)).to.eventually.deep.equal({
                API_KEY: { variable: "API_KEY", secret: "test-api-key" },
            });
            (0, chai_1.expect)(prompt.checkbox).to.have.been.calledOnce;
            (0, chai_1.expect)(prompt.input).to.have.been.calledOnce;
            (0, chai_1.expect)(prompt.password).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.secretExists).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.createSecret).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.addVersion).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.addVersion.getCall(0).args[2]).to.equal("plaintext secret value");
        });
        it("can create new secrets after warning about reuse", async () => {
            const originalEnv = {
                API_KEY: { variable: "API_KEY", secret: "api-key" },
            };
            prompt.checkbox.onFirstCall().resolves(["API_KEY"]);
            prompt.input.onFirstCall().resolves("test-api-key");
            csm.secretExists.withArgs("project", "test-api-key").resolves(true);
            prompt.select.onFirstCall().resolves("pick-new");
            prompt.input.onSecondCall().resolves("test-api-key2");
            prompt.password.resolves("plaintext secret value");
            await (0, chai_1.expect)(config.overrideChosenEnv("project", originalEnv)).to.eventually.deep.equal({
                API_KEY: { variable: "API_KEY", secret: "test-api-key2" },
            });
            (0, chai_1.expect)(prompt.checkbox).to.have.been.calledOnce;
            (0, chai_1.expect)(prompt.input).to.have.been.calledTwice;
            (0, chai_1.expect)(prompt.select).to.have.been.calledOnce;
            (0, chai_1.expect)(prompt.password).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.secretExists).to.have.been.calledTwice;
            (0, chai_1.expect)(csm.createSecret).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.addVersion).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.addVersion.getCall(0).args[2]).to.equal("plaintext secret value");
        });
        it("can reuse secrets", async () => {
            const originalEnv = {
                API_KEY: { variable: "API_KEY", secret: "api-key" },
            };
            prompt.checkbox.onFirstCall().resolves(["API_KEY"]);
            prompt.input.onFirstCall().resolves("test-api-key");
            csm.secretExists.withArgs("project", "test-api-key").resolves(true);
            prompt.select.onFirstCall().resolves("reuse");
            await (0, chai_1.expect)(config.overrideChosenEnv("project", originalEnv)).to.eventually.deep.equal({
                API_KEY: { variable: "API_KEY", secret: "test-api-key" },
            });
            (0, chai_1.expect)(prompt.checkbox).to.have.been.calledOnce;
            (0, chai_1.expect)(prompt.input).to.have.been.calledOnce;
            (0, chai_1.expect)(prompt.select).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.secretExists).to.have.been.calledOnce;
            (0, chai_1.expect)(csm.createSecret).to.not.have.been.called;
            (0, chai_1.expect)(csm.addVersion).to.not.have.been.called;
        });
        it("suggests test key names", () => {
            (0, chai_1.expect)(config.suggestedTestKeyName("GOOGLE_GENAI_API_KEY")).to.equal("test-google-genai-api-key");
        });
    });
});
//# sourceMappingURL=config.spec.js.map