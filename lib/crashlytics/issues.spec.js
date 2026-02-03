"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const nock = require("nock");
const chaiAsPromised = require("chai-as-promised");
const issues_1 = require("./issues");
const types_1 = require("./types");
const error_1 = require("../error");
const api_1 = require("../api");
chai.use(chaiAsPromised);
const expect = chai.expect;
describe("issues", () => {
    const appId = "1:1234567890:android:abcdef1234567890";
    const requestProjectNumber = "1234567890";
    const issueId = "test_issue_id";
    afterEach(() => {
        nock.cleanAll();
    });
    describe("getIssue", () => {
        afterEach(() => {
            nock.cleanAll();
        });
        it("should resolve with the response body on success", async () => {
            const mockResponse = { id: issueId, title: "Crash" };
            nock((0, api_1.crashlyticsApiOrigin)())
                .get(`/v1alpha/projects/${requestProjectNumber}/apps/${appId}/issues/${issueId}`)
                .reply(200, mockResponse);
            const result = await (0, issues_1.getIssue)(appId, issueId);
            expect(result).to.deep.equal(mockResponse);
            expect(nock.isDone()).to.be.true;
        });
        it("should throw a FirebaseError if the appId is invalid", async () => {
            const invalidAppId = "invalid-app-id";
            await expect((0, issues_1.getIssue)(invalidAppId, issueId)).to.be.rejectedWith(error_1.FirebaseError, "Unable to get the projectId from the AppId.");
        });
    });
    describe("updateIssue", () => {
        it("should resolve with the updated issue on success", async () => {
            const state = types_1.State.CLOSED;
            const mockResponse = {
                id: issueId,
                state: state,
            };
            nock((0, api_1.crashlyticsApiOrigin)())
                .patch(`/v1alpha/projects/${requestProjectNumber}/apps/${appId}/issues/${issueId}`, {
                state,
            })
                .query({ updateMask: "state" })
                .reply(200, mockResponse);
            const result = await (0, issues_1.updateIssue)(appId, issueId, state);
            expect(result).to.deep.equal(mockResponse);
            expect(nock.isDone()).to.be.true;
        });
        it("should throw a FirebaseError if the appId is invalid", async () => {
            const invalidAppId = "invalid-app-id";
            await expect((0, issues_1.updateIssue)(invalidAppId, issueId, types_1.State.CLOSED)).to.be.rejectedWith(error_1.FirebaseError, "Unable to get the projectId from the AppId.");
        });
    });
});
//# sourceMappingURL=issues.spec.js.map