"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const nock = require("nock");
const api_1 = require("../../api");
const pollUtils = require("../../operation-poller");
const provision_1 = require("./provision");
const error_1 = require("../../error");
const apps_1 = require("../apps");
const BUNDLE_ID = "com.example.testapp";
const PACKAGE_NAME = "com.example.androidapp";
const WEB_APP_ID = "web-app-123";
const PROJECT_DISPLAY_NAME = "Test Project";
const REQUEST_ID = "test-request-id-123";
const LOCATION = "us-central1";
const OPERATION_RESOURCE_NAME = "operations/provision.123456789";
const APP_RESOURCE = "projects/test-project/apps/123456789";
const CONFIG_DATA = "base64-encoded-config-data";
const CONFIG_MIME_TYPE = "application/json";
describe("Provision module", () => {
    let sandbox;
    let pollOperationStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        pollOperationStub = sandbox.stub(pollUtils, "pollOperation");
        pollOperationStub.throws("Unexpected poll call");
        nock.disableNetConnect();
    });
    afterEach(() => {
        sandbox.restore();
        nock.enableNetConnect();
        nock.cleanAll();
    });
    describe("buildAppNamespace", () => {
        it("should return appId when provided (takes precedence)", () => {
            const appWithAppId = {
                platform: apps_1.AppPlatform.IOS,
                bundleId: BUNDLE_ID,
                appId: "1:123456789:ios:abcdef123456",
            };
            const result = (0, provision_1.buildAppNamespace)(appWithAppId);
            (0, chai_1.expect)(result).to.equal("1:123456789:ios:abcdef123456");
        });
        it("should return bundleId for iOS apps", () => {
            const iosApp = {
                platform: apps_1.AppPlatform.IOS,
                bundleId: BUNDLE_ID,
            };
            const result = (0, provision_1.buildAppNamespace)(iosApp);
            (0, chai_1.expect)(result).to.equal(BUNDLE_ID);
        });
        it("should return packageName for Android apps", () => {
            const androidApp = {
                platform: apps_1.AppPlatform.ANDROID,
                packageName: PACKAGE_NAME,
            };
            const result = (0, provision_1.buildAppNamespace)(androidApp);
            (0, chai_1.expect)(result).to.equal(PACKAGE_NAME);
        });
        it("should return webAppId for Web apps", () => {
            const webApp = {
                platform: apps_1.AppPlatform.WEB,
                webAppId: WEB_APP_ID,
            };
            const result = (0, provision_1.buildAppNamespace)(webApp);
            (0, chai_1.expect)(result).to.equal(WEB_APP_ID);
        });
        it("should throw error for unsupported platform", () => {
            const unsupportedApp = {
                platform: "UNSUPPORTED",
                bundleId: BUNDLE_ID,
            };
            (0, chai_1.expect)(() => (0, provision_1.buildAppNamespace)(unsupportedApp)).to.throw("Unsupported platform");
        });
        it("should throw error when iOS bundleId is empty", () => {
            const iosApp = {
                platform: apps_1.AppPlatform.IOS,
                bundleId: "",
            };
            (0, chai_1.expect)(() => (0, provision_1.buildAppNamespace)(iosApp)).to.throw("App namespace cannot be empty");
        });
        it("should throw error when Android packageName is empty", () => {
            const androidApp = {
                platform: apps_1.AppPlatform.ANDROID,
                packageName: "",
            };
            (0, chai_1.expect)(() => (0, provision_1.buildAppNamespace)(androidApp)).to.throw("App namespace cannot be empty");
        });
        it("should throw error when Web webAppId is empty", () => {
            const webApp = {
                platform: apps_1.AppPlatform.WEB,
                webAppId: "",
            };
            (0, chai_1.expect)(() => (0, provision_1.buildAppNamespace)(webApp)).to.throw("App namespace cannot be empty");
        });
        it("should throw error when iOS bundleId is missing", () => {
            const iosApp = {
                platform: apps_1.AppPlatform.IOS,
            };
            (0, chai_1.expect)(() => (0, provision_1.buildAppNamespace)(iosApp)).to.throw("App namespace cannot be empty");
        });
        it("should throw error when Android packageName is missing", () => {
            const androidApp = {
                platform: apps_1.AppPlatform.ANDROID,
            };
            (0, chai_1.expect)(() => (0, provision_1.buildAppNamespace)(androidApp)).to.throw("App namespace cannot be empty");
        });
        it("should throw error when Web webAppId is missing", () => {
            const webApp = {
                platform: apps_1.AppPlatform.WEB,
            };
            (0, chai_1.expect)(() => (0, provision_1.buildAppNamespace)(webApp)).to.throw("App namespace cannot be empty");
        });
        it("should fall back to bundleId when appId is empty string", () => {
            const appWithEmptyId = {
                platform: apps_1.AppPlatform.IOS,
                bundleId: BUNDLE_ID,
                appId: "",
            };
            const result = (0, provision_1.buildAppNamespace)(appWithEmptyId);
            (0, chai_1.expect)(result).to.equal(BUNDLE_ID);
        });
    });
    describe("buildParentString", () => {
        it("should format existing project parent correctly", () => {
            const parent = {
                type: "existing_project",
                projectId: "my-project-123",
            };
            const result = (0, provision_1.buildParentString)(parent);
            (0, chai_1.expect)(result).to.equal("projects/my-project-123");
        });
        it("should format organization parent correctly", () => {
            const parent = {
                type: "organization",
                organizationId: "123456789",
            };
            const result = (0, provision_1.buildParentString)(parent);
            (0, chai_1.expect)(result).to.equal("organizations/123456789");
        });
        it("should format folder parent correctly", () => {
            const parent = {
                type: "folder",
                folderId: "987654321",
            };
            const result = (0, provision_1.buildParentString)(parent);
            (0, chai_1.expect)(result).to.equal("folders/987654321");
        });
        it("should throw error for unsupported parent type", () => {
            const unsupportedParent = {
                type: "invalid",
                projectId: "test",
            };
            (0, chai_1.expect)(() => (0, provision_1.buildParentString)(unsupportedParent)).to.throw("Unsupported parent type");
        });
    });
    describe("buildProvisionRequest", () => {
        it("should build basic request with minimal options", () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
            };
            const result = (0, provision_1.buildProvisionRequest)(options);
            (0, chai_1.expect)(result).to.deep.equal({
                appNamespace: WEB_APP_ID,
                displayName: PROJECT_DISPLAY_NAME,
                webInput: {},
            });
        });
        it("should include parent when specified", () => {
            const options = {
                project: {
                    displayName: PROJECT_DISPLAY_NAME,
                    parent: { type: "existing_project", projectId: "my-project-123" },
                },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
            };
            const result = (0, provision_1.buildProvisionRequest)(options);
            (0, chai_1.expect)(result).to.deep.include({
                appNamespace: WEB_APP_ID,
                displayName: PROJECT_DISPLAY_NAME,
                parent: "projects/my-project-123",
                webInput: {},
            });
        });
        it("should include location when specified", () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
                features: { location: LOCATION },
            };
            const result = (0, provision_1.buildProvisionRequest)(options);
            (0, chai_1.expect)(result).to.deep.include({
                appNamespace: WEB_APP_ID,
                displayName: PROJECT_DISPLAY_NAME,
                location: LOCATION,
                webInput: {},
            });
        });
        it("should include requestId when specified", () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
                requestId: REQUEST_ID,
            };
            const result = (0, provision_1.buildProvisionRequest)(options);
            (0, chai_1.expect)(result).to.deep.include({
                appNamespace: WEB_APP_ID,
                displayName: PROJECT_DISPLAY_NAME,
                requestId: REQUEST_ID,
                webInput: {},
            });
        });
        it("should build iOS-specific request correctly", () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: {
                    platform: apps_1.AppPlatform.IOS,
                    bundleId: BUNDLE_ID,
                    appStoreId: "12345",
                    teamId: "TEAM123",
                    displayName: PROJECT_DISPLAY_NAME,
                },
            };
            const result = (0, provision_1.buildProvisionRequest)(options);
            (0, chai_1.expect)(result).to.deep.equal({
                appNamespace: BUNDLE_ID,
                displayName: PROJECT_DISPLAY_NAME,
                appleInput: {
                    appStoreId: "12345",
                    teamId: "TEAM123",
                },
            });
        });
        it("should build Android-specific request correctly", () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: {
                    platform: apps_1.AppPlatform.ANDROID,
                    packageName: PACKAGE_NAME,
                    sha1Hashes: ["sha1hash1", "sha1hash2"],
                    sha256Hashes: ["sha256hash1"],
                    displayName: PROJECT_DISPLAY_NAME,
                },
            };
            const result = (0, provision_1.buildProvisionRequest)(options);
            (0, chai_1.expect)(result).to.deep.equal({
                appNamespace: PACKAGE_NAME,
                displayName: PROJECT_DISPLAY_NAME,
                androidInput: {
                    sha1Hashes: ["sha1hash1", "sha1hash2"],
                    sha256Hashes: ["sha256hash1"],
                },
            });
        });
        it("should build Web-specific request correctly", () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
            };
            const result = (0, provision_1.buildProvisionRequest)(options);
            (0, chai_1.expect)(result).to.deep.equal({
                appNamespace: WEB_APP_ID,
                displayName: PROJECT_DISPLAY_NAME,
                webInput: {},
            });
        });
        it("should include AI features when specified", () => {
            const aiFeatures = { enableAiLogic: true, model: "gemini-pro" };
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
                features: { firebaseAiLogicInput: aiFeatures },
            };
            const result = (0, provision_1.buildProvisionRequest)(options);
            (0, chai_1.expect)(result).to.deep.include({
                appNamespace: WEB_APP_ID,
                displayName: PROJECT_DISPLAY_NAME,
                firebaseAiLogicInput: aiFeatures,
                webInput: {},
            });
        });
    });
    describe("provisionFirebaseApp - Success Cases", () => {
        const mockResponse = {
            configMimeType: CONFIG_MIME_TYPE,
            configData: CONFIG_DATA,
            appResource: APP_RESOURCE,
        };
        it("should provision iOS app successfully", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.IOS, bundleId: BUNDLE_ID },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
            (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        });
        it("should provision Android app successfully", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.ANDROID, packageName: PACKAGE_NAME },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
            (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        });
        it("should provision Web app successfully", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
            (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        });
        it("should provision with existing project parent", async () => {
            const options = {
                project: {
                    displayName: PROJECT_DISPLAY_NAME,
                    parent: { type: "existing_project", projectId: "parent-project-123" },
                },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.parent).to.equal("projects/parent-project-123");
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should provision with organization parent", async () => {
            const options = {
                project: {
                    displayName: PROJECT_DISPLAY_NAME,
                    parent: { type: "organization", organizationId: "987654321" },
                },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.parent).to.equal("organizations/987654321");
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should provision with folder parent", async () => {
            const options = {
                project: {
                    displayName: PROJECT_DISPLAY_NAME,
                    parent: { type: "folder", folderId: "123456789" },
                },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.parent).to.equal("folders/123456789");
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should provision with requestId for idempotency", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
                requestId: REQUEST_ID,
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.requestId).to.equal(REQUEST_ID);
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should provision with custom location", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
                features: { location: LOCATION },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.location).to.equal(LOCATION);
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should provision with AI features enabled", async () => {
            const aiFeatures = { enableAiLogic: true, model: "gemini-pro" };
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
                features: { firebaseAiLogicInput: aiFeatures },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.firebaseAiLogicInput).to.deep.equal(aiFeatures);
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should provision with all optional iOS fields", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: {
                    platform: apps_1.AppPlatform.IOS,
                    bundleId: BUNDLE_ID,
                    appStoreId: "12345",
                    teamId: "TEAM123",
                },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.appleInput).to.deep.equal({
                    appStoreId: "12345",
                    teamId: "TEAM123",
                });
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should provision with all optional Android fields", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: {
                    platform: apps_1.AppPlatform.ANDROID,
                    packageName: PACKAGE_NAME,
                    sha1Hashes: ["sha1hash1", "sha1hash2"],
                    sha256Hashes: ["sha256hash1"],
                },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.androidInput).to.deep.equal({
                    sha1Hashes: ["sha1hash1", "sha1hash2"],
                    sha256Hashes: ["sha256hash1"],
                });
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
    });
    describe("provisionFirebaseApp - Request ID Behavior", () => {
        const mockResponse = {
            configMimeType: CONFIG_MIME_TYPE,
            configData: CONFIG_DATA,
            appResource: APP_RESOURCE,
        };
        const baseOptions = {
            project: { displayName: PROJECT_DISPLAY_NAME },
            app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
        };
        it("should work without requestId (undefined)", async () => {
            const options = { ...baseOptions };
            (0, chai_1.expect)(options.requestId).to.be.undefined;
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body).to.not.have.property("requestId");
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should work with empty requestId", async () => {
            const options = {
                ...baseOptions,
                requestId: "",
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body).to.not.have.property("requestId");
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should work with valid requestId", async () => {
            const options = {
                ...baseOptions,
                requestId: REQUEST_ID,
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.requestId).to.equal(REQUEST_ID);
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should pass requestId to API when provided", async () => {
            const customRequestId = "custom-request-12345";
            const options = {
                ...baseOptions,
                requestId: customRequestId,
            };
            let actualRequestBody;
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, (uri, requestBody) => {
                actualRequestBody = requestBody;
                return { name: OPERATION_RESOURCE_NAME };
            });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(actualRequestBody.requestId).to.equal(customRequestId);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should not include requestId in request when omitted", async () => {
            const options = { ...baseOptions };
            delete options.requestId;
            let actualRequestBody;
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, (uri, requestBody) => {
                actualRequestBody = requestBody;
                return { name: OPERATION_RESOURCE_NAME };
            });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(actualRequestBody).to.not.have.property("requestId");
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
    });
    describe("provisionFirebaseApp - Error Cases", () => {
        const baseOptions = {
            project: { displayName: PROJECT_DISPLAY_NAME },
            app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
        };
        it("should reject if API call fails with 404", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(404, { error: { message: "Project not found" } });
            pollOperationStub.onFirstCall().throws("Polling should not be called on API failure");
            try {
                await (0, provision_1.provisionFirebaseApp)(baseOptions);
                chai_1.expect.fail("Expected function to throw");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(error.message).to.include("Failed to provision Firebase app");
                (0, chai_1.expect)(pollOperationStub.notCalled).to.be.true;
            }
        });
        it("should reject if API call fails with 403", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(403, { error: { message: "Permission denied" } });
            pollOperationStub.onFirstCall().throws("Polling should not be called on API failure");
            try {
                await (0, provision_1.provisionFirebaseApp)(baseOptions);
                chai_1.expect.fail("Expected function to throw");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(error.message).to.include("Failed to provision Firebase app");
                (0, chai_1.expect)(pollOperationStub.notCalled).to.be.true;
            }
        });
        it("should reject if API call fails with 500", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(500, { error: { message: "Internal server error" } });
            pollOperationStub.onFirstCall().throws("Polling should not be called on API failure");
            try {
                await (0, provision_1.provisionFirebaseApp)(baseOptions);
                chai_1.expect.fail("Expected function to throw");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(error.message).to.include("Failed to provision Firebase app");
                (0, chai_1.expect)(pollOperationStub.notCalled).to.be.true;
            }
        });
        it("should reject if polling operation fails", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            const pollingError = new Error("Polling operation failed");
            pollOperationStub.onFirstCall().rejects(pollingError);
            try {
                await (0, provision_1.provisionFirebaseApp)(baseOptions);
                chai_1.expect.fail("Expected function to throw");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(error.message).to.include("Failed to provision Firebase app");
                (0, chai_1.expect)(error.message).to.include("Polling operation failed");
                (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
            }
        });
        it("should reject if polling operation times out", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            const timeoutError = new Error("Operation timed out");
            timeoutError.name = "TIMEOUT";
            pollOperationStub.onFirstCall().rejects(timeoutError);
            try {
                await (0, provision_1.provisionFirebaseApp)(baseOptions);
                chai_1.expect.fail("Expected function to throw");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(error.message).to.include("Failed to provision Firebase app");
                (0, chai_1.expect)(error.message).to.include("Operation timed out");
                (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
            }
        });
        it("should wrap unknown errors properly", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .replyWithError("Unexpected network error");
            try {
                await (0, provision_1.provisionFirebaseApp)(baseOptions);
                chai_1.expect.fail("Expected function to throw");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(error.message).to.include("Failed to provision Firebase app");
                (0, chai_1.expect)(error.message).to.include("Failed to make request");
                (0, chai_1.expect)(pollOperationStub.notCalled).to.be.true;
            }
        });
        it("should preserve original error information", async () => {
            const originalError = new Error("Original error message");
            originalError.name = "CustomError";
            originalError.code = "CUSTOM_CODE";
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().rejects(originalError);
            try {
                await (0, provision_1.provisionFirebaseApp)(baseOptions);
                chai_1.expect.fail("Expected function to throw");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(error.message).to.include("Failed to provision Firebase app");
                (0, chai_1.expect)(error.message).to.include("Original error message");
                const firebaseError = error;
                (0, chai_1.expect)(firebaseError.original).to.equal(originalError);
                (0, chai_1.expect)(firebaseError.exit).to.equal(2);
            }
        });
    });
    describe("Platform-Specific Validation", () => {
        const mockResponse = {
            configMimeType: CONFIG_MIME_TYPE,
            configData: CONFIG_DATA,
            appResource: APP_RESOURCE,
        };
        it("should require bundleId for iOS apps", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.IOS, bundleId: BUNDLE_ID },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.appNamespace).to.equal(BUNDLE_ID);
                (0, chai_1.expect)(body.appleInput).to.exist;
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should require packageName for Android apps", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.ANDROID, packageName: PACKAGE_NAME },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.appNamespace).to.equal(PACKAGE_NAME);
                (0, chai_1.expect)(body.androidInput).to.exist;
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should require webAppId for Web apps", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.appNamespace).to.equal(WEB_APP_ID);
                (0, chai_1.expect)(body.webInput).to.exist;
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should accept optional appStoreId for iOS", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: {
                    platform: apps_1.AppPlatform.IOS,
                    bundleId: BUNDLE_ID,
                    appStoreId: "123456789",
                },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.appleInput.appStoreId).to.equal("123456789");
                (0, chai_1.expect)(body.appleInput).to.not.have.property("teamId");
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should accept optional teamId for iOS", async () => {
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: {
                    platform: apps_1.AppPlatform.IOS,
                    bundleId: BUNDLE_ID,
                    teamId: "TEAM123",
                },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.appleInput.teamId).to.equal("TEAM123");
                (0, chai_1.expect)(body.appleInput).to.not.have.property("appStoreId");
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should accept optional SHA hashes for Android", async () => {
            const sha1Hashes = ["sha1hash1", "sha1hash2"];
            const sha256Hashes = ["sha256hash1"];
            const options = {
                project: { displayName: PROJECT_DISPLAY_NAME },
                app: {
                    platform: apps_1.AppPlatform.ANDROID,
                    packageName: PACKAGE_NAME,
                    sha1Hashes,
                    sha256Hashes,
                },
            };
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp", (body) => {
                (0, chai_1.expect)(body.androidInput).to.deep.equal({
                    sha1Hashes,
                    sha256Hashes,
                });
                return true;
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(options);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
    });
    describe("API Integration", () => {
        const mockResponse = {
            configMimeType: CONFIG_MIME_TYPE,
            configData: CONFIG_DATA,
            appResource: APP_RESOURCE,
        };
        const baseOptions = {
            project: { displayName: PROJECT_DISPLAY_NAME },
            app: { platform: apps_1.AppPlatform.WEB, webAppId: WEB_APP_ID, displayName: PROJECT_DISPLAY_NAME },
        };
        it("should call correct API endpoint", async () => {
            let actualApiEndpoint;
            nock((0, api_1.firebaseApiOrigin)())
                .post((uri) => {
                actualApiEndpoint = uri;
                return uri === "/v1alpha/firebase:provisionFirebaseApp";
            })
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(baseOptions);
            (0, chai_1.expect)(actualApiEndpoint).to.equal("/v1alpha/firebase:provisionFirebaseApp");
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should use correct API version (v1alpha)", async () => {
            const scope = nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(baseOptions);
            (0, chai_1.expect)(scope.isDone()).to.be.true;
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should poll with correct API version (v1beta1)", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().callsFake(async (options) => {
                (0, chai_1.expect)(options.apiOrigin).to.equal((0, api_1.firebaseApiOrigin)());
                (0, chai_1.expect)(options.apiVersion).to.equal("v1beta1");
                (0, chai_1.expect)(options.operationResourceName).to.equal(OPERATION_RESOURCE_NAME);
                (0, chai_1.expect)(options.pollerName).to.equal("Provision Firebase App Poller");
                return mockResponse;
            });
            const result = await (0, provision_1.provisionFirebaseApp)(baseOptions);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
            (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        });
        it("should pass correct request body structure", async () => {
            let actualRequestBody;
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, (uri, requestBody) => {
                actualRequestBody = requestBody;
                return { name: OPERATION_RESOURCE_NAME };
            });
            pollOperationStub.onFirstCall().resolves(mockResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(baseOptions);
            (0, chai_1.expect)(actualRequestBody).to.have.property("appNamespace", WEB_APP_ID);
            (0, chai_1.expect)(actualRequestBody).to.have.property("displayName", PROJECT_DISPLAY_NAME);
            (0, chai_1.expect)(actualRequestBody).to.have.property("webInput");
            (0, chai_1.expect)(actualRequestBody.webInput).to.deep.equal({});
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
        });
        it("should handle LRO polling correctly", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            pollOperationStub.onFirstCall().callsFake(async (options) => {
                (0, chai_1.expect)(options).to.deep.include({
                    pollerName: "Provision Firebase App Poller",
                    apiOrigin: (0, api_1.firebaseApiOrigin)(),
                    apiVersion: "v1beta1",
                    operationResourceName: OPERATION_RESOURCE_NAME,
                });
                return mockResponse;
            });
            const result = await (0, provision_1.provisionFirebaseApp)(baseOptions);
            (0, chai_1.expect)(result).to.deep.equal(mockResponse);
            (0, chai_1.expect)(pollOperationStub.calledOnce).to.be.true;
        });
        it("should return correct response type", async () => {
            nock((0, api_1.firebaseApiOrigin)())
                .post("/v1alpha/firebase:provisionFirebaseApp")
                .reply(200, { name: OPERATION_RESOURCE_NAME });
            const expectedResponse = {
                configMimeType: "application/json",
                configData: "eyJ0ZXN0IjoiZGF0YSJ9",
                appResource: "projects/test-project-123/apps/web-app-456",
            };
            pollOperationStub.onFirstCall().resolves(expectedResponse);
            const result = await (0, provision_1.provisionFirebaseApp)(baseOptions);
            (0, chai_1.expect)(result).to.have.property("configMimeType");
            (0, chai_1.expect)(result).to.have.property("configData");
            (0, chai_1.expect)(result).to.have.property("appResource");
            (0, chai_1.expect)(typeof result.configMimeType).to.equal("string");
            (0, chai_1.expect)(typeof result.configData).to.equal("string");
            (0, chai_1.expect)(typeof result.appResource).to.equal("string");
            (0, chai_1.expect)(result).to.deep.equal(expectedResponse);
        });
    });
});
//# sourceMappingURL=provision.spec.js.map