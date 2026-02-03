"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const portUtils = require("../portUtils");
const spawn = require("../../init/spawn");
const serve = require("./serve");
const constants_1 = require("../constants");
const utils = require("./developmentServer");
const configsImport = require("./config");
const projectPathImport = require("../../projectPath");
const yaml_1 = require("../../apphosting/yaml");
const emulatorRegistry = require("../registry");
const emulatorEnvs = require("../env");
const secrets = require("../../gcp/secretManager");
const error_1 = require("../../error");
describe("serve", () => {
    let checkListenableStub;
    let wrapSpawnStub;
    let spawnWithCommandStringStub;
    let detectPackageManagerStartCommandStub;
    let configsStub;
    let resolveProjectPathStub;
    let listRunningWithInfoStub;
    let setEnvVarsForEmulatorsStub;
    let accessSecretVersionStub;
    beforeEach(() => {
        checkListenableStub = sinon.stub(portUtils, "checkListenable");
        wrapSpawnStub = sinon.stub(spawn, "wrapSpawn");
        spawnWithCommandStringStub = sinon.stub(spawn, "spawnWithCommandString");
        detectPackageManagerStartCommandStub = sinon.stub(utils, "detectPackageManagerStartCommand");
        configsStub = sinon.stub(configsImport);
        resolveProjectPathStub = sinon.stub(projectPathImport, "resolveProjectPath");
        listRunningWithInfoStub = sinon.stub(emulatorRegistry.EmulatorRegistry, "listRunningWithInfo");
        setEnvVarsForEmulatorsStub = sinon.stub(emulatorEnvs, "setEnvVarsForEmulators");
        resolveProjectPathStub.returns("");
        detectPackageManagerStartCommandStub.returns("npm run dev");
        accessSecretVersionStub = sinon.stub(secrets, "accessSecretVersion");
    });
    afterEach(() => {
        wrapSpawnStub.restore();
        detectPackageManagerStartCommandStub.restore();
        checkListenableStub.restore();
        sinon.verifyAndRestore();
    });
    describe("start", () => {
        beforeEach(() => {
            listRunningWithInfoStub.returns([]);
            spawnWithCommandStringStub.resolves();
        });
        it("should use user-provided port if one is defined", async () => {
            checkListenableStub.onFirstCall().returns(true);
            configsStub.getLocalAppHostingConfiguration.resolves(yaml_1.AppHostingYamlConfig.empty());
            const res = await serve.start({ port: 9999 });
            (0, chai_1.expect)(res.port).to.equal(9999);
        });
        it("should only select an available port to serve", async () => {
            checkListenableStub.onFirstCall().returns(false);
            checkListenableStub.onSecondCall().returns(false);
            checkListenableStub.onThirdCall().returns(true);
            configsStub.getLocalAppHostingConfiguration.resolves(yaml_1.AppHostingYamlConfig.empty());
            const res = await serve.start();
            (0, chai_1.expect)(res.port).to.equal(constants_1.DEFAULT_PORTS.apphosting + 2);
        });
        it("should run the custom start command if one is provided", async () => {
            const startCommand = "custom test command";
            checkListenableStub.onFirstCall().returns(true);
            configsStub.getLocalAppHostingConfiguration.resolves(yaml_1.AppHostingYamlConfig.empty());
            await serve.start({ startCommand });
            (0, chai_1.expect)(spawnWithCommandStringStub).to.be.called;
            (0, chai_1.expect)(spawnWithCommandStringStub.getCall(0).args[0]).to.eq(startCommand);
        });
        it("should append --port if an ng serve command is detected", async () => {
            const startCommand = "ng serve --verbose";
            checkListenableStub.onFirstCall().returns(true);
            configsStub.getLocalAppHostingConfiguration.resolves(yaml_1.AppHostingYamlConfig.empty());
            await serve.start({ startCommand });
            (0, chai_1.expect)(spawnWithCommandStringStub).to.be.called;
            (0, chai_1.expect)(spawnWithCommandStringStub.getCall(0).args[0]).to.eq(startCommand + " --port 5002");
        });
        it("should reject the custom command if a port is specified", async () => {
            const startCommand = "ng serve --port 5004";
            checkListenableStub.onFirstCall().returns(true);
            configsStub.getLocalAppHostingConfiguration.resolves(yaml_1.AppHostingYamlConfig.empty());
            await (0, chai_1.expect)(serve.start({ startCommand })).to.be.rejectedWith(error_1.FirebaseError, /Specifying a port in the start command is not supported by the apphosting emulator/);
            (0, chai_1.expect)(spawnWithCommandStringStub).to.not.be.called;
        });
        it("Should pass plaintext environment variables", async () => {
            const yaml = yaml_1.AppHostingYamlConfig.empty();
            yaml.env["FOO"] = { value: "BAR" };
            checkListenableStub.onFirstCall().returns(true);
            configsStub.getLocalAppHostingConfiguration.resolves(yaml);
            await serve.start();
            (0, chai_1.expect)(accessSecretVersionStub).to.not.be.called;
            (0, chai_1.expect)(spawnWithCommandStringStub).to.be.called;
            (0, chai_1.expect)(spawnWithCommandStringStub.getCall(0).args[2]).to.deep.include({ FOO: "BAR" });
        });
        describe("secret env vars", () => {
            it("Should resolve full secrets without projectId", async () => {
                const yaml = yaml_1.AppHostingYamlConfig.empty();
                yaml.env["FOO"] = { secret: "projects/p/secrets/s" };
                checkListenableStub.onFirstCall().returns(true);
                configsStub.getLocalAppHostingConfiguration.resolves(yaml);
                accessSecretVersionStub.withArgs("p", "s", "latest").resolves("BAR");
                await serve.start();
                (0, chai_1.expect)(accessSecretVersionStub).to.be.calledWith("p", "s", "latest");
                (0, chai_1.expect)(spawnWithCommandStringStub).to.be.called;
                (0, chai_1.expect)(spawnWithCommandStringStub.getCall(0).args[2]).to.deep.include({ FOO: "BAR" });
            });
            it("Should resolve full secrets versions without projectId", async () => {
                const yaml = yaml_1.AppHostingYamlConfig.empty();
                yaml.env["FOO"] = { secret: "projects/p/secrets/s/versions/1" };
                checkListenableStub.onFirstCall().returns(true);
                configsStub.getLocalAppHostingConfiguration.resolves(yaml);
                accessSecretVersionStub.withArgs("p", "s", "1").resolves("BAR");
                await serve.start();
                (0, chai_1.expect)(accessSecretVersionStub).to.be.calledWith("p", "s", "1");
                (0, chai_1.expect)(spawnWithCommandStringStub).to.be.called;
                (0, chai_1.expect)(spawnWithCommandStringStub.getCall(0).args[2]).to.deep.include({ FOO: "BAR" });
            });
            it("Should handle secret IDs if project is provided", async () => {
                const yaml = yaml_1.AppHostingYamlConfig.empty();
                yaml.env["FOO"] = { secret: "s" };
                checkListenableStub.onFirstCall().returns(true);
                configsStub.getLocalAppHostingConfiguration.resolves(yaml);
                accessSecretVersionStub.withArgs("p", "s", "latest").resolves("BAR");
                await serve.start({ projectId: "p" });
                (0, chai_1.expect)(accessSecretVersionStub).to.be.calledWith("p", "s", "latest");
                (0, chai_1.expect)(spawnWithCommandStringStub).to.be.called;
                (0, chai_1.expect)(spawnWithCommandStringStub.getCall(0).args[2]).to.deep.include({ FOO: "BAR" });
            });
            it("Should allow explicit versions", async () => {
                const yaml = yaml_1.AppHostingYamlConfig.empty();
                yaml.env["FOO"] = { secret: "s@1" };
                checkListenableStub.onFirstCall().returns(true);
                configsStub.getLocalAppHostingConfiguration.resolves(yaml);
                accessSecretVersionStub.withArgs("p", "s", "1").resolves("BAR");
                await serve.start({ projectId: "p" });
                (0, chai_1.expect)(accessSecretVersionStub).to.be.calledWith("p", "s", "1");
                (0, chai_1.expect)(spawnWithCommandStringStub).to.be.called;
                (0, chai_1.expect)(spawnWithCommandStringStub.getCall(0).args[2]).to.deep.include({ FOO: "BAR" });
            });
            it("Should have a clear error if project ID is required but not present", async () => {
                const yaml = yaml_1.AppHostingYamlConfig.empty();
                yaml.env["FOO"] = { secret: "s" };
                checkListenableStub.onFirstCall().returns(true);
                configsStub.getLocalAppHostingConfiguration.resolves(yaml);
                await (0, chai_1.expect)(serve.start()).to.be.rejectedWith(error_1.FirebaseError, /Cannot load secret s without a project. Please use .*firebase use.* or pass the --project flag/);
                (0, chai_1.expect)(accessSecretVersionStub).to.not.be.called;
                (0, chai_1.expect)(spawnWithCommandStringStub).to.not.be.called;
            });
        });
    });
    describe("getEmulatorEnvs", () => {
        it("should omit apphosting emulator", () => {
            listRunningWithInfoStub.returns([{ name: "apphosting" }, { name: "functions" }]);
            serve.getEmulatorEnvs();
            (0, chai_1.expect)(setEnvVarsForEmulatorsStub).to.be.calledWith({}, [{ name: "functions" }]);
        });
    });
});
//# sourceMappingURL=serve.spec.js.map