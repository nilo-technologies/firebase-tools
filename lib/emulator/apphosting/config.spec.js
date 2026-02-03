"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const config_1 = require("./config");
const configImport = require("../../apphosting/config");
const yaml_1 = require("../../apphosting/yaml");
const error_1 = require("../../error");
describe("environments", () => {
    let loadAppHostingYamlStub;
    let listAppHostingFilesInPathStub;
    const apphostingYamlEnvOne = {
        randomEnvOne: { value: "ENV_ONE_FROM_CONFIG_ONE" },
        randomEnvTwo: { value: "ENV_TWO_FROM_CONFIG_ONE" },
        randomSecretOne: { secret: "SECRET_ONE_FROM_CONFIG_ONE" },
        randomSecretTwo: { secret: "SECRET_TWO_FROM_CONFIG_ONE" },
        randomSecretThree: { secret: "SECRET_THREE_FROM_CONFIG_ONE" },
    };
    const apphostingYamlEnvTwo = {
        randomEnvOne: { value: "ENV_ONE_FROM_CONFIG_TWO" },
        randomEnvTwo: { value: "ENV_TWO_FROM_CONFIG_TWO" },
        randomEnvFour: { value: "ENV_FOUR_FROM_CONFIG_TWO" },
        randomSecretOne: { secret: "SECRET_ONE_FROM_CONFIG_TWO" },
        randomSecretFour: { secret: "SECRET_FOUR_FROM_CONFIG_TWO" },
    };
    const apphostingYamlSecretToPlaintext = {
        randomSecretOne: { value: "RANDOM_SECRET_ONE_PLAINTEXT" },
        randomSecretTwo: { value: "RANDOM_SECRET_TWO_PLAINTEXT" },
        randomSecretThree: { value: "RANDOM_SECRET_THREE_PLAINTEXT" },
        randomSecretFour: { value: "RANDOM_SECRET_FOUR_PLAINTEXT" },
    };
    const apphostingYamlConfigOne = yaml_1.AppHostingYamlConfig.empty();
    apphostingYamlConfigOne.env = { ...apphostingYamlEnvOne };
    const apphostingYamlConfigTwo = yaml_1.AppHostingYamlConfig.empty();
    apphostingYamlConfigTwo.env = { ...apphostingYamlEnvTwo };
    const apphostingYamlConfigSecretsToPlaintext = yaml_1.AppHostingYamlConfig.empty();
    apphostingYamlConfigSecretsToPlaintext.env = { ...apphostingYamlSecretToPlaintext };
    beforeEach(() => {
        loadAppHostingYamlStub = sinon.stub(yaml_1.AppHostingYamlConfig, "loadFromFile");
        listAppHostingFilesInPathStub = sinon.stub(configImport, "listAppHostingFilesInPath");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("getLocalAppHostingConfiguration", () => {
        it("should return an empty config if no base or local apphosting yaml files found", async () => {
            listAppHostingFilesInPathStub.returns([]);
            const apphostingConfig = await (0, config_1.getLocalAppHostingConfiguration)("./");
            (0, chai_1.expect)(apphostingConfig.env).to.deep.equal({});
        });
        it("should return local config if only local config found", async () => {
            listAppHostingFilesInPathStub.returns(["/parent/apphosting.local.yaml"]);
            loadAppHostingYamlStub.onFirstCall().returns(apphostingYamlConfigOne);
            const apphostingConfig = await (0, config_1.getLocalAppHostingConfiguration)("./");
            (0, chai_1.expect)(apphostingConfig.env).to.deep.equal(apphostingYamlEnvOne);
        });
        it("should return base config if only base config found", async () => {
            listAppHostingFilesInPathStub.returns(["/parent/apphosting.yaml"]);
            loadAppHostingYamlStub.onFirstCall().returns(apphostingYamlConfigOne);
            const apphostingConfig = await (0, config_1.getLocalAppHostingConfiguration)("./");
            (0, chai_1.expect)(apphostingConfig.env).to.deep.equal(apphostingYamlEnvOne);
        });
        it("should combine apphosting yaml files according to precedence", async () => {
            listAppHostingFilesInPathStub.returns([
                "/parent/cwd/apphosting.yaml",
                "/parent/apphosting.local.yaml",
            ]);
            loadAppHostingYamlStub
                .withArgs("/parent/cwd/apphosting.yaml")
                .returns(apphostingYamlConfigOne);
            loadAppHostingYamlStub
                .withArgs("/parent/apphosting.local.yaml")
                .returns(apphostingYamlConfigSecretsToPlaintext);
            const apphostingConfig = await (0, config_1.getLocalAppHostingConfiguration)("./");
            (0, chai_1.expect)(apphostingConfig.env).to.deep.equal({
                ...apphostingYamlEnvOne,
                ...apphostingYamlSecretToPlaintext,
            });
        });
        it("should allow merging all three file types", async () => {
            listAppHostingFilesInPathStub.returns([
                "/parent/cwd/apphosting.yaml",
                "/parent/cwd/apphosting.emulator.yaml",
                "/parent/apphosting.local.yaml",
            ]);
            loadAppHostingYamlStub
                .withArgs("/parent/cwd/apphosting.yaml")
                .returns(apphostingYamlConfigOne);
            loadAppHostingYamlStub
                .withArgs("/parent/cwd/apphosting.emulator.yaml")
                .returns(apphostingYamlConfigTwo);
            loadAppHostingYamlStub
                .withArgs("/parent/apphosting.local.yaml")
                .returns(apphostingYamlConfigSecretsToPlaintext);
            const apphostingConfig = await (0, config_1.getLocalAppHostingConfiguration)("./");
            (0, chai_1.expect)(apphostingConfig.env).to.deep.equal({
                ...apphostingYamlEnvOne,
                ...apphostingYamlEnvTwo,
                ...apphostingYamlSecretToPlaintext,
            });
        });
        it("Should not allow apphosting.emulator.yaml to convert secrets to plaintext", async () => {
            listAppHostingFilesInPathStub.returns([
                "/parent/cwd/apphosting.yaml",
                "/parent/cwd/apphosting.emulator.yaml",
            ]);
            loadAppHostingYamlStub
                .withArgs("/parent/cwd/apphosting.yaml")
                .returns(apphostingYamlConfigOne);
            loadAppHostingYamlStub
                .withArgs("/parent/cwd/apphosting.emulator.yaml")
                .returns(apphostingYamlConfigSecretsToPlaintext);
            await (0, chai_1.expect)((0, config_1.getLocalAppHostingConfiguration)("./")).to.be.rejectedWith(error_1.FirebaseError);
        });
    });
});
//# sourceMappingURL=config.spec.js.map