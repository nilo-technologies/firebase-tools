"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const iam = require("../gcp/iam");
const displayExtensionInfo = require("./displayExtensionInfo");
const types_1 = require("./types");
const SPEC = {
    name: "test",
    displayName: "My Extension",
    description: "My extension's description",
    version: "1.0.0",
    license: "MIT",
    apis: [
        { apiName: "api1.googleapis.com", reason: "" },
        { apiName: "api2.googleapis.com", reason: "" },
    ],
    roles: [
        { role: "role1", reason: "" },
        { role: "role2", reason: "" },
    ],
    resources: [
        { name: "resource1", type: "firebaseextensions.v1beta.function", description: "desc" },
        { name: "resource2", type: "other", description: "" },
        {
            name: "taskResource",
            type: "firebaseextensions.v1beta.function",
            properties: {
                taskQueueTrigger: {},
            },
        },
    ],
    author: { authorName: "Tester", url: "firebase.google.com" },
    contributors: [{ authorName: "Tester 2" }],
    billingRequired: true,
    sourceUrl: "test.com",
    params: [
        {
            param: "secret",
            label: "Secret",
            type: types_1.ParamType.SECRET,
        },
    ],
    systemParams: [],
    events: [
        {
            type: "abc.def.my-event",
            description: "desc",
        },
    ],
    lifecycleEvents: [
        {
            stage: "ON_INSTALL",
            taskQueueTriggerFunction: "taskResource",
        },
    ],
};
const EXT_VERSION = {
    name: "publishers/pub/extensions/my-ext/versions/1.0.0",
    ref: "pub/my-ext@1.0.0",
    state: "PUBLISHED",
    spec: SPEC,
    hash: "abc123",
    sourceDownloadUri: "https://google.com",
    buildSourceUri: "https://github.com/pub/extensions/my-ext",
    listing: {
        state: "APPROVED",
    },
};
describe("displayExtensionInfo", () => {
    describe("displayExtInfo", () => {
        let getRoleStub;
        beforeEach(() => {
            getRoleStub = sinon.stub(iam, "getRole");
            getRoleStub.withArgs("role1").resolves({
                title: "Role 1",
                description: "a role",
            });
            getRoleStub.withArgs("role2").resolves({
                title: "Role 2",
                description: "a role",
            });
            getRoleStub.withArgs("cloudtasks.enqueuer").resolves({
                title: "Cloud Task Enqueuer",
                description: "Enqueue tasks",
            });
            getRoleStub.withArgs("secretmanager.secretAccessor").resolves({
                title: "Secret Accessor",
                description: "Access Secrets",
            });
        });
        afterEach(() => {
            getRoleStub.restore();
        });
        it("should display info during install", async () => {
            const loggedLines = await displayExtensionInfo.displayExtensionVersionInfo({ spec: SPEC });
            (0, chai_1.expect)(loggedLines[0]).to.include(SPEC.displayName);
            (0, chai_1.expect)(loggedLines[1]).to.include(SPEC.description);
            (0, chai_1.expect)(loggedLines[2]).to.include(SPEC.version);
            (0, chai_1.expect)(loggedLines[3]).to.include(SPEC.license);
            (0, chai_1.expect)(loggedLines[4]).to.include("resource1 (Cloud Function (1st gen))");
            (0, chai_1.expect)(loggedLines[4]).to.include("resource2 (other)");
            (0, chai_1.expect)(loggedLines[4]).to.include("taskResource (Cloud Function (1st gen))");
            (0, chai_1.expect)(loggedLines[4]).to.include("taskResource (Cloud Task queue)");
            (0, chai_1.expect)(loggedLines[4]).to.include("secret (Cloud Secret Manager secret)");
            (0, chai_1.expect)(loggedLines[5]).to.include("abc.def.my-event");
            (0, chai_1.expect)(loggedLines[6]).to.include("api1.googleapis.com");
            (0, chai_1.expect)(loggedLines[6]).to.include("api1.googleapis.com");
            (0, chai_1.expect)(loggedLines[6]).to.include("cloudtasks.googleapis.com");
            (0, chai_1.expect)(loggedLines[7]).to.include("Role 1");
            (0, chai_1.expect)(loggedLines[7]).to.include("Role 2");
            (0, chai_1.expect)(loggedLines[7]).to.include("Cloud Task Enqueuer");
        });
        it("should display additional information for a published extension", async () => {
            const loggedLines = await displayExtensionInfo.displayExtensionVersionInfo({
                spec: SPEC,
                extensionVersion: EXT_VERSION,
                latestApprovedVersion: "1.0.0",
                latestVersion: "1.0.0",
            });
            (0, chai_1.expect)(loggedLines[0]).to.include(SPEC.displayName);
            (0, chai_1.expect)(loggedLines[1]).to.include(SPEC.description);
            (0, chai_1.expect)(loggedLines[2]).to.include(SPEC.version);
            (0, chai_1.expect)(loggedLines[3]).to.include("Accepted");
            (0, chai_1.expect)(loggedLines[4]).to.include("View in Extensions Hub");
            (0, chai_1.expect)(loggedLines[5]).to.include(EXT_VERSION.buildSourceUri);
            (0, chai_1.expect)(loggedLines[6]).to.include(SPEC.license);
            (0, chai_1.expect)(loggedLines[7]).to.include("resource1 (Cloud Function (1st gen))");
            (0, chai_1.expect)(loggedLines[7]).to.include("resource2 (other)");
            (0, chai_1.expect)(loggedLines[7]).to.include("taskResource (Cloud Function (1st gen))");
            (0, chai_1.expect)(loggedLines[7]).to.include("taskResource (Cloud Task queue)");
            (0, chai_1.expect)(loggedLines[7]).to.include("secret (Cloud Secret Manager secret)");
            (0, chai_1.expect)(loggedLines[8]).to.include("abc.def.my-event");
            (0, chai_1.expect)(loggedLines[9]).to.include("api1.googleapis.com");
            (0, chai_1.expect)(loggedLines[9]).to.include("api1.googleapis.com");
            (0, chai_1.expect)(loggedLines[9]).to.include("cloudtasks.googleapis.com");
            (0, chai_1.expect)(loggedLines[10]).to.include("Role 1");
            (0, chai_1.expect)(loggedLines[10]).to.include("Role 2");
            (0, chai_1.expect)(loggedLines[10]).to.include("Cloud Task Enqueuer");
        });
    });
});
//# sourceMappingURL=displayExtensionInfo.spec.js.map