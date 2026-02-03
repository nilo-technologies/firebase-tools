"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const clc = require("colorette");
const yaml = require("js-yaml");
const sdk_1 = require("./sdk");
const appUtils_1 = require("../../../appUtils");
const appUtils = require("../../../appUtils");
const createApp = require("./create_app");
const sinon = require("sinon");
const dataconnectEmulator_1 = require("../../../emulator/dataconnectEmulator");
const dcLoad = require("../../../dataconnect/load");
const fsutils = require("../../../fsutils");
const auth = require("../../../auth");
const utils = require("../../../utils");
const prompt = require("../../../prompt");
const expect = chai.expect;
describe("addSdkGenerateToConnectorYaml", () => {
    let connectorInfo;
    let connectorYaml;
    let app;
    beforeEach(() => {
        connectorInfo = {
            directory: "/users/test/project/dataconnect",
            connectorYaml: {
                connectorId: "test-connector",
            },
            connector: {},
        };
        connectorYaml = {
            connectorId: "test-connector",
        };
        app = {
            directory: "/users/test/project/app",
            platform: appUtils_1.Platform.WEB,
            frameworks: [],
        };
    });
    it("should add javascriptSdk for web platform", () => {
        (0, sdk_1.addSdkGenerateToConnectorYaml)(connectorInfo, connectorYaml, app);
        expect(connectorYaml.generate?.javascriptSdk).to.deep.equal([
            {
                outputDir: "../app/src/dataconnect-generated",
                package: "@dataconnect/generated",
                packageJsonDir: "../app",
                react: false,
                angular: false,
            },
        ]);
    });
    it("should add javascriptSdk with react for web platform", () => {
        app.frameworks = [appUtils_1.Framework.REACT];
        (0, sdk_1.addSdkGenerateToConnectorYaml)(connectorInfo, connectorYaml, app);
        expect(connectorYaml.generate?.javascriptSdk).to.deep.equal([
            {
                outputDir: "../app/src/dataconnect-generated",
                package: "@dataconnect/generated",
                packageJsonDir: "../app",
                react: true,
                angular: false,
            },
        ]);
    });
    it("should add dartSdk for flutter platform", () => {
        app.platform = appUtils_1.Platform.FLUTTER;
        (0, sdk_1.addSdkGenerateToConnectorYaml)(connectorInfo, connectorYaml, app);
        expect(connectorYaml.generate?.dartSdk).to.deep.equal([
            {
                outputDir: "../app/lib/dataconnect_generated",
                package: "dataconnect_generated/generated.dart",
            },
        ]);
    });
    it("should add kotlinSdk for android platform", () => {
        app.platform = appUtils_1.Platform.ANDROID;
        (0, sdk_1.addSdkGenerateToConnectorYaml)(connectorInfo, connectorYaml, app);
        expect(connectorYaml.generate?.kotlinSdk).to.deep.equal([
            {
                outputDir: "../app/src/main/kotlin",
                package: "com.google.firebase.dataconnect.generated",
            },
        ]);
    });
    it("should add swiftSdk for ios platform", () => {
        app.platform = appUtils_1.Platform.IOS;
        (0, sdk_1.addSdkGenerateToConnectorYaml)(connectorInfo, connectorYaml, app);
        expect(connectorYaml.generate?.swiftSdk).to.deep.equal([
            {
                outputDir: "../FirebaseDataConnectGenerated",
                package: "DataConnectGenerated",
            },
        ]);
    });
    it("should add adminSdk for admin node platform", () => {
        app.platform = appUtils_1.Platform.ADMIN_NODE;
        (0, sdk_1.addSdkGenerateToConnectorYaml)(connectorInfo, connectorYaml, app);
        expect(connectorYaml.generate?.adminNodeSdk).to.deep.equal([
            {
                outputDir: "../app/src/dataconnect-admin-generated",
                package: "@dataconnect/admin-generated",
                packageJsonDir: "../app",
            },
        ]);
    });
});
describe("chooseApp", () => {
    let detectAppsStub;
    let promptStub;
    beforeEach(() => {
        detectAppsStub = sinon.stub(appUtils, "detectApps");
        promptStub = sinon.stub(prompt, "checkbox");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should prompt user to choose from multiple apps", async () => {
        const apps = [
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT] },
            { platform: appUtils_1.Platform.ANDROID, directory: "android" },
        ];
        detectAppsStub.resolves(apps);
        promptStub.resolves([
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT] },
        ]);
        const selectedApps = await (0, sdk_1.chooseApp)();
        expect(selectedApps).to.deep.equal([apps[0]]);
        expect(promptStub.calledOnce).to.be.true;
    });
    it("should use app from environment variables", async () => {
        process.env[sdk_1.FDC_APP_FOLDER] = "web";
        process.env[sdk_1.FDC_SDK_PLATFORM_ENV] = "WEB";
        const apps = [
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT] },
            { platform: appUtils_1.Platform.ANDROID, directory: "android" },
        ];
        detectAppsStub.resolves(apps);
        const selectedApps = await (0, sdk_1.chooseApp)();
        expect(selectedApps).to.have.deep.members([apps[0]]);
        expect(promptStub.called).to.be.false;
        delete process.env[sdk_1.FDC_APP_FOLDER];
        delete process.env[sdk_1.FDC_SDK_PLATFORM_ENV];
    });
    it("should return a placeholder when no app matches environment variables", async () => {
        process.env[sdk_1.FDC_APP_FOLDER] = "web";
        process.env[sdk_1.FDC_SDK_PLATFORM_ENV] = "WEB";
        process.env[sdk_1.FDC_SDK_FRAMEWORKS_ENV] = "react,next";
        const apps = [
            { platform: appUtils_1.Platform.IOS, directory: "ios" },
            { platform: appUtils_1.Platform.ANDROID, directory: "android" },
        ];
        detectAppsStub.resolves(apps);
        const selectedApps = await (0, sdk_1.chooseApp)();
        expect(selectedApps).to.have.deep.members([
            {
                platform: appUtils_1.Platform.WEB,
                directory: "web",
                frameworks: ["react", "next"],
            },
        ]);
        expect(promptStub.called).to.be.false;
        delete process.env[sdk_1.FDC_APP_FOLDER];
        delete process.env[sdk_1.FDC_SDK_PLATFORM_ENV];
        delete process.env[sdk_1.FDC_SDK_FRAMEWORKS_ENV];
    });
    it("should return empty array when no apps are found", async () => {
        detectAppsStub.resolves([]);
        const selectedApps = await (0, sdk_1.chooseApp)();
        expect(selectedApps).to.be.empty;
        expect(promptStub.called).to.be.false;
    });
    it("should deduplicate apps with the same platform and directory", async () => {
        const apps = [
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT], appId: "app1" },
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT], appId: "app2" },
            { platform: appUtils_1.Platform.ANDROID, directory: "android" },
        ];
        const uniqueApps = [
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT] },
            { platform: appUtils_1.Platform.ANDROID, directory: "android" },
        ];
        detectAppsStub.resolves(apps);
        promptStub.resolves([
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT] },
        ]);
        const selectedApps = await (0, sdk_1.chooseApp)();
        expect(promptStub.callCount).to.equal(1);
        const promptCall = promptStub.getCall(0);
        const appsPassedToCheckbox = promptCall.args[0].choices.map((choice) => choice.value);
        expect(appsPassedToCheckbox).to.have.deep.members(uniqueApps);
        expect(selectedApps).to.deep.equal([
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT] },
        ]);
    });
});
describe("askQuestions", () => {
    let detectAppsStub;
    let selectStub;
    let createReactAppStub;
    let createNextAppStub;
    let createFlutterAppStub;
    let setup;
    beforeEach(() => {
        detectAppsStub = sinon.stub(appUtils, "detectApps");
        selectStub = sinon.stub(prompt, "select");
        createReactAppStub = sinon.stub(createApp, "createReactApp");
        createNextAppStub = sinon.stub(createApp, "createNextApp");
        createFlutterAppStub = sinon.stub(createApp, "createFlutterApp");
        setup = {
            config: {},
            rcfile: {},
            featureInfo: {
                dataconnectSdk: {
                    apps: [],
                },
            },
            instructions: [],
        };
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should call createReactApp when user chooses react", async () => {
        detectAppsStub.resolves([]);
        selectStub.resolves("react");
        createReactAppStub.resolves();
        await (0, sdk_1.askQuestions)(setup);
        expect(selectStub.calledOnce).to.be.true;
        expect(createReactAppStub.calledOnce).to.be.true;
        expect(createNextAppStub.called).to.be.false;
        expect(createFlutterAppStub.called).to.be.false;
    });
    it("should call createNextApp when user chooses next", async () => {
        detectAppsStub.resolves([]);
        selectStub.resolves("next");
        createNextAppStub.resolves();
        await (0, sdk_1.askQuestions)(setup);
        expect(selectStub.calledOnce).to.be.true;
        expect(createReactAppStub.called).to.be.false;
        expect(createNextAppStub.calledOnce).to.be.true;
        expect(createFlutterAppStub.called).to.be.false;
    });
    it("should call createFlutterApp when user chooses flutter", async () => {
        detectAppsStub.resolves([]);
        selectStub.resolves("flutter");
        createFlutterAppStub.resolves();
        await (0, sdk_1.askQuestions)(setup);
        expect(selectStub.calledOnce).to.be.true;
        expect(createReactAppStub.called).to.be.false;
        expect(createNextAppStub.called).to.be.false;
        expect(createFlutterAppStub.calledOnce).to.be.true;
    });
    it("should not prompt to create a new sample app if apps are found", async () => {
        const apps = [
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [appUtils_1.Framework.REACT] },
        ];
        detectAppsStub.resolves(apps);
        await (0, sdk_1.askQuestions)(setup);
        expect(selectStub.called).to.be.false;
        expect(createReactAppStub.called).to.be.false;
        expect(createNextAppStub.called).to.be.false;
        expect(createFlutterAppStub.called).to.be.false;
        expect(setup.featureInfo?.dataconnectSdk?.apps).to.deep.equal(apps);
    });
});
describe("actuate", () => {
    let setup;
    let config;
    let detectAppsStub;
    let loadAllStub;
    let dirExistsSyncStub;
    let writeProjectFileStub;
    let generateStub;
    let getGlobalDefaultAccountStub;
    let logLabeledBulletStub;
    let logLabeledSuccessStub;
    let logLabeledErrorStub;
    let logLabeledWarningStub;
    let logBulletStub;
    beforeEach(() => {
        detectAppsStub = sinon.stub(appUtils, "detectApps");
        loadAllStub = sinon.stub(dcLoad, "loadAll");
        dirExistsSyncStub = sinon.stub(fsutils, "dirExistsSync");
        writeProjectFileStub = sinon.stub();
        generateStub = sinon.stub(dataconnectEmulator_1.DataConnectEmulator, "generate");
        getGlobalDefaultAccountStub = sinon.stub(auth, "getGlobalDefaultAccount");
        logLabeledBulletStub = sinon.stub(utils, "logLabeledBullet");
        logLabeledSuccessStub = sinon.stub(utils, "logLabeledSuccess");
        logLabeledErrorStub = sinon.stub(utils, "logLabeledError");
        logLabeledWarningStub = sinon.stub(utils, "logLabeledWarning");
        logBulletStub = sinon.stub(utils, "logBullet");
        setup = {
            config: { projectDir: "/path/to/project" },
            rcfile: {},
            featureInfo: {
                dataconnectSdk: {
                    apps: [],
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
    it("should log a message and exit if no apps are found", async () => {
        detectAppsStub.resolves([]);
        await (0, sdk_1.actuate)(setup, config);
        expect(logLabeledBulletStub.calledWith("dataconnect", "No apps to setup Data Connect Generated SDKs")).to.be.true;
        expect(writeProjectFileStub.called).to.be.false;
        expect(generateStub.called).to.be.false;
    });
    it("should detect apps if none are provided in setup", async () => {
        const apps = [{ platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [] }];
        detectAppsStub.resolves(apps);
        loadAllStub.resolves([
            {
                connectorInfo: [
                    {
                        directory: "dataconnect",
                        connectorYaml: { connectorId: "test-connector" },
                    },
                ],
                dataConnectYaml: { location: "us-central1", serviceId: "test-service" },
            },
        ]);
        dirExistsSyncStub.returns(true);
        getGlobalDefaultAccountStub.resolves({ email: "test@google.com" });
        await (0, sdk_1.actuate)(setup, config);
        expect(writeProjectFileStub.calledOnce).to.be.true;
        expect(generateStub.calledOnce).to.be.true;
    });
    it("should set up SDKs for provided apps", async () => {
        const apps = [
            { platform: appUtils_1.Platform.WEB, directory: "webDir", frameworks: [] },
            { platform: appUtils_1.Platform.ANDROID, directory: "androidDir" },
            { platform: appUtils_1.Platform.IOS, directory: "iosDir" },
        ];
        setup.featureInfo?.dataconnectSdk?.apps.push(...apps);
        loadAllStub.resolves([
            {
                connectorInfo: [
                    {
                        directory: "dataconnect",
                        connectorYaml: { connectorId: "test-connector" },
                    },
                ],
                dataConnectYaml: { location: "us-central1", serviceId: "test-service" },
            },
        ]);
        dirExistsSyncStub.returns(true);
        getGlobalDefaultAccountStub.resolves({ email: "test@google.com" });
        await (0, sdk_1.actuate)(setup, config);
        expect(writeProjectFileStub.calledOnce).to.be.true;
        expect(generateStub.calledOnce).to.be.true;
        expect(logLabeledSuccessStub.calledOnce).to.be.true;
        expect(logLabeledSuccessStub.calledWith("dataconnect", `Installed generated SDKs for ${clc.bold("webDir (web), androidDir (android), iosDir (ios)")}`)).to.be.true;
    });
    it("should warn if an app directory does not exist", async () => {
        const apps = [{ platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [] }];
        setup.featureInfo?.dataconnectSdk?.apps.push(...apps);
        loadAllStub.resolves([
            {
                connectorInfo: [
                    {
                        directory: "dataconnect",
                        connectorYaml: { connectorId: "test-connector" },
                    },
                ],
                dataConnectYaml: { location: "us-central1", serviceId: "test-service" },
            },
        ]);
        dirExistsSyncStub.returns(false);
        getGlobalDefaultAccountStub.resolves({ email: "test@google.com" });
        await (0, sdk_1.actuate)(setup, config);
        expect(logLabeledWarningStub.calledWith("dataconnect", "App directory web does not exist")).to
            .be.true;
        expect(writeProjectFileStub.calledOnce).to.be.true;
        expect(generateStub.calledOnce).to.be.true;
    });
    it("should handle SDK generation failure", async () => {
        const apps = [{ platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [] }];
        setup.featureInfo?.dataconnectSdk?.apps.push(...apps);
        loadAllStub.resolves([
            {
                connectorInfo: [
                    {
                        directory: "dataconnect",
                        connectorYaml: { connectorId: "test-connector" },
                    },
                ],
                dataConnectYaml: { location: "us-central1", serviceId: "test-service" },
            },
        ]);
        dirExistsSyncStub.returns(true);
        getGlobalDefaultAccountStub.resolves({ email: "test@google.com" });
        generateStub.throws(new Error("SDK generation failed"));
        await (0, sdk_1.actuate)(setup, config);
        expect(writeProjectFileStub.calledOnce).to.be.true;
        expect(logLabeledErrorStub.calledWith("dataconnect", "Failed to generate Data Connect SDKs\nSDK generation failed")).to.be.true;
    });
    it("should log platform-specific instructions", async () => {
        const apps = [
            { platform: appUtils_1.Platform.IOS, directory: "ios" },
            { platform: appUtils_1.Platform.WEB, directory: "web-react", frameworks: [appUtils_1.Framework.REACT] },
            { platform: appUtils_1.Platform.WEB, directory: "web-angular", frameworks: [appUtils_1.Framework.ANGULAR] },
        ];
        setup.featureInfo?.dataconnectSdk?.apps.push(...apps);
        loadAllStub.resolves([
            {
                connectorInfo: [
                    {
                        directory: "dataconnect",
                        connectorYaml: { connectorId: "test-connector" },
                    },
                ],
                dataConnectYaml: { location: "us-central1", serviceId: "test-service" },
            },
        ]);
        dirExistsSyncStub.returns(true);
        getGlobalDefaultAccountStub.resolves({ email: "test@google.com" });
        await (0, sdk_1.actuate)(setup, config);
        expect(logBulletStub.calledWith(clc.bold("Please follow the instructions here to add your generated sdk to your XCode project:\n\thttps://firebase.google.com/docs/data-connect/ios-sdk#set-client"))).to.be.true;
        expect(logBulletStub.calledWith("Visit https://firebase.google.com/docs/data-connect/web-sdk#react for more information on how to set up React Generated SDKs for Firebase Data Connect")).to.be.true;
        expect(logBulletStub.calledWith("Run `ng add @angular/fire` to install angular sdk dependencies.\nVisit https://github.com/invertase/tanstack-query-firebase/tree/main/packages/angular for more information on how to set up Angular Generated SDKs for Firebase Data Connect")).to.be.true;
    });
    it("should deduplicate apps when writing connector.yaml", async () => {
        const apps = [
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [], appId: "app1" },
            { platform: appUtils_1.Platform.WEB, directory: "web", frameworks: [], appId: "app2" },
        ];
        setup.featureInfo?.dataconnectSdk?.apps.push(...apps);
        loadAllStub.resolves([
            {
                connectorInfo: [
                    {
                        directory: "dataconnect",
                        connectorYaml: { connectorId: "test-connector" },
                    },
                ],
                dataConnectYaml: { location: "us-central1", serviceId: "test-service" },
            },
        ]);
        dirExistsSyncStub.returns(true);
        getGlobalDefaultAccountStub.resolves({ email: "test@google.com" });
        await (0, sdk_1.actuate)(setup, config);
        const writtenYaml = writeProjectFileStub.getCall(0).args[1];
        const parsedYaml = yaml.load(writtenYaml);
        expect(parsedYaml.generate.javascriptSdk).to.have.lengthOf(1);
    });
});
//# sourceMappingURL=sdk.spec.js.map