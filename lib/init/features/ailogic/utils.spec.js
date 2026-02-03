"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const utils = require("./utils");
const apps = require("../../../management/apps");
const apps_1 = require("../../../management/apps");
const error_1 = require("../../../error");
describe("ailogic utils", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("getConfigFileName", () => {
        it("should return correct filename for iOS", () => {
            (0, chai_1.expect)(utils.getConfigFileName(apps_1.AppPlatform.IOS)).to.equal("GoogleService-Info.plist");
        });
        it("should return correct filename for Android", () => {
            (0, chai_1.expect)(utils.getConfigFileName(apps_1.AppPlatform.ANDROID)).to.equal("google-services.json");
        });
        it("should return correct filename for Web", () => {
            (0, chai_1.expect)(utils.getConfigFileName(apps_1.AppPlatform.WEB)).to.equal("firebase-config.json");
        });
        it("should throw error for unsupported platform", () => {
            (0, chai_1.expect)(() => utils.getConfigFileName("unsupported")).to.throw("Unsupported platform: unsupported");
        });
    });
    describe("parseAppId", () => {
        it("should parse valid app IDs and return AppInfo object", () => {
            const validAppIds = [
                {
                    appId: "1:123456789:ios:123456789abcdef",
                    expected: {
                        projectNumber: "123456789",
                        appId: "1:123456789:ios:123456789abcdef",
                        platform: apps_1.AppPlatform.IOS,
                    },
                },
                {
                    appId: "2:123456789:android:123456789abcdef",
                    expected: {
                        projectNumber: "123456789",
                        appId: "2:123456789:android:123456789abcdef",
                        platform: apps_1.AppPlatform.ANDROID,
                    },
                },
                {
                    appId: "2:123456789:web:123456789abcdef",
                    expected: {
                        projectNumber: "123456789",
                        appId: "2:123456789:web:123456789abcdef",
                        platform: apps_1.AppPlatform.WEB,
                    },
                },
                {
                    appId: "1:999999999:web:abcdef123456789",
                    expected: {
                        projectNumber: "999999999",
                        appId: "1:999999999:web:abcdef123456789",
                        platform: apps_1.AppPlatform.WEB,
                    },
                },
            ];
            validAppIds.forEach(({ appId, expected }) => {
                const result = utils.parseAppId(appId);
                (0, chai_1.expect)(result).to.deep.equal(expected);
            });
        });
        it("should throw error for invalid app ID formats", () => {
            const invalidAppIds = [
                "",
                ":",
                "1:",
                "2:123456789",
                "2:123456789:",
                "2:123456789:test:",
                "2:123456789:ios",
                "2:123456789:web:",
                "2:123456789:android:com_",
                "invalid-id",
                "1:abc:web:123456789abcdef",
                "1:123456789:flutter:123456789abcdef",
            ];
            invalidAppIds.forEach((appId) => {
                (0, chai_1.expect)(() => utils.parseAppId(appId)).to.throw(error_1.FirebaseError, /Invalid app ID format/);
            });
        });
    });
    describe("validateProjectNumberMatch", () => {
        it("should not throw when project numbers match", () => {
            const appInfo = {
                projectNumber: "123456789",
                appId: "1:123456789:web:abcdef",
                platform: apps_1.AppPlatform.WEB,
            };
            const projectInfo = {
                projectNumber: "123456789",
                projectId: "test-project",
                name: "projects/test-project",
                displayName: "Test Project",
            };
            (0, chai_1.expect)(() => utils.validateProjectNumberMatch(appInfo, projectInfo)).to.not.throw();
        });
        it("should throw when project numbers don't match", () => {
            const appInfo = {
                projectNumber: "123456789",
                appId: "1:123456789:web:abcdef",
                platform: apps_1.AppPlatform.WEB,
            };
            const projectInfo = {
                projectNumber: "987654321",
                projectId: "test-project",
                name: "projects/test-project",
                displayName: "Test Project",
            };
            (0, chai_1.expect)(() => utils.validateProjectNumberMatch(appInfo, projectInfo)).to.throw(error_1.FirebaseError, "App 1:123456789:web:abcdef belongs to project number 123456789 but current project has number 987654321.");
        });
    });
    describe("validateAppExists", () => {
        let listFirebaseAppsStub;
        beforeEach(() => {
            listFirebaseAppsStub = sandbox.stub(apps, "listFirebaseApps");
        });
        it("should not throw when app exists for web platform", async () => {
            const appInfo = {
                projectNumber: "123456789",
                appId: "1:123456789:web:abcdef",
                platform: apps_1.AppPlatform.WEB,
            };
            const mockApps = [
                { appId: "1:123456789:web:abcdef", displayName: "Test App", platform: apps_1.AppPlatform.WEB },
            ];
            listFirebaseAppsStub.resolves(mockApps);
            const result = await utils.validateAppExists(appInfo, "test-project");
            (0, chai_1.expect)(result).to.deep.equal(mockApps[0]);
            sinon.assert.calledWith(listFirebaseAppsStub, "test-project", apps_1.AppPlatform.WEB);
        });
        it("should not throw when app exists for ios platform", async () => {
            const appInfo = {
                projectNumber: "123456789",
                appId: "1:123456789:ios:abcdef",
                platform: apps_1.AppPlatform.IOS,
            };
            const mockApps = [
                { appId: "1:123456789:ios:abcdef", displayName: "Test iOS App", platform: apps_1.AppPlatform.IOS },
            ];
            listFirebaseAppsStub.resolves(mockApps);
            const result = await utils.validateAppExists(appInfo, "test-project");
            (0, chai_1.expect)(result).to.deep.equal(mockApps[0]);
            sinon.assert.calledWith(listFirebaseAppsStub, "test-project", apps_1.AppPlatform.IOS);
        });
        it("should not throw when app exists for android platform", async () => {
            const appInfo = {
                projectNumber: "123456789",
                appId: "1:123456789:android:abcdef",
                platform: apps_1.AppPlatform.ANDROID,
            };
            const mockApps = [
                {
                    appId: "1:123456789:android:abcdef",
                    displayName: "Test Android App",
                    platform: apps_1.AppPlatform.ANDROID,
                },
            ];
            listFirebaseAppsStub.resolves(mockApps);
            const result = await utils.validateAppExists(appInfo, "test-project");
            (0, chai_1.expect)(result).to.deep.equal(mockApps[0]);
            sinon.assert.calledWith(listFirebaseAppsStub, "test-project", apps_1.AppPlatform.ANDROID);
        });
        it("should throw when app does not exist", async () => {
            const appInfo = {
                projectNumber: "123456789",
                appId: "1:123456789:web:nonexistent",
                platform: apps_1.AppPlatform.WEB,
            };
            listFirebaseAppsStub.resolves([]);
            await (0, chai_1.expect)(utils.validateAppExists(appInfo, "test-project")).to.be.rejectedWith(error_1.FirebaseError, "App 1:123456789:web:nonexistent does not exist in project test-project.");
        });
    });
});
//# sourceMappingURL=utils.spec.js.map