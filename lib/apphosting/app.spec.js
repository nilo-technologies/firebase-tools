"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const apps = require("../management/apps");
const sinon = require("sinon");
const chai_1 = require("chai");
const error_1 = require("../error");
describe("app", () => {
    const projectId = "projectId";
    const backendId = "backendId";
    let listFirebaseApps;
    describe("getOrCreateWebApp", () => {
        let createWebApp;
        beforeEach(() => {
            createWebApp = sinon.stub(apps, "createWebApp");
            listFirebaseApps = sinon.stub(apps, "listFirebaseApps");
        });
        afterEach(() => {
            createWebApp.restore();
            listFirebaseApps.restore();
        });
        it("should create an app with backendId if no web apps exist yet", async () => {
            listFirebaseApps.returns(Promise.resolve([]));
            createWebApp.returns({ displayName: backendId, appId: "appId" });
            await app_1.webApps.getOrCreateWebApp(projectId, null, backendId);
            (0, chai_1.expect)(createWebApp).calledWith(projectId, { displayName: backendId });
        });
        it("throws error if given webApp doesn't exist in project", async () => {
            listFirebaseApps.returns(Promise.resolve([
                { displayName: "testWebApp", appId: "testWebAppId", platform: apps.AppPlatform.WEB },
            ]));
            await (0, chai_1.expect)(app_1.webApps.getOrCreateWebApp(projectId, "nonExistentWebApp", backendId)).to.be.rejectedWith(error_1.FirebaseError, "The web app 'nonExistentWebApp' does not exist in project projectId");
        });
        it("returns undefined if user has reached the app limit for their project", async () => {
            listFirebaseApps.returns(Promise.resolve([]));
            createWebApp.throws({ original: { status: 429 } });
            const app = await app_1.webApps.getOrCreateWebApp(projectId, null, backendId);
            (0, chai_1.expect)(app).equal(undefined);
        });
    });
    describe("generateWebAppName", () => {
        beforeEach(() => {
            listFirebaseApps = sinon.stub(apps, "listFirebaseApps");
        });
        afterEach(() => {
            listFirebaseApps.restore();
        });
        it("returns backendId if no such web app already exists", async () => {
            listFirebaseApps.returns(Promise.resolve([]));
            const appName = await app_1.webApps.generateWebAppName(projectId, backendId);
            (0, chai_1.expect)(appName).equal(backendId);
        });
        it("returns backendId as appName with a unique id if app with backendId already exists", async () => {
            listFirebaseApps.returns(Promise.resolve([{ displayName: backendId, appId: "1234" }]));
            const appName = await app_1.webApps.generateWebAppName(projectId, backendId);
            (0, chai_1.expect)(appName).equal(`${backendId}_1`);
        });
        it("returns appropriate unique id if app with backendId already exists", async () => {
            listFirebaseApps.returns(Promise.resolve([
                { displayName: backendId, appId: "1234" },
                { displayName: `${backendId}_1`, appId: "1234" },
                { displayName: `${backendId}_2`, appId: "1234" },
            ]));
            const appName = await app_1.webApps.generateWebAppName(projectId, backendId);
            (0, chai_1.expect)(appName).equal(`${backendId}_3`);
        });
    });
});
//# sourceMappingURL=app.spec.js.map