"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const nock = require("nock");
const chaiAsPromised = require("chai-as-promised");
const notes_1 = require("./notes");
const error_1 = require("../error");
const api_1 = require("../api");
chai.use(chaiAsPromised);
const expect = chai.expect;
describe("notes", () => {
    const appId = "1:1234567890:android:abcdef1234567890";
    const requestProjectNumber = "1234567890";
    const issueId = "test-issue-id";
    const noteId = "test-note-id";
    const noteBody = "This is a test note.";
    afterEach(() => {
        nock.cleanAll();
    });
    describe("createNote", () => {
        it("should resolve with the response body on success", async () => {
            const mockResponse = { name: `notes/${noteId}`, body: noteBody };
            nock((0, api_1.crashlyticsApiOrigin)())
                .post(`/v1alpha/projects/${requestProjectNumber}/apps/${appId}/issues/${issueId}/notes`, {
                body: noteBody,
            })
                .reply(200, mockResponse);
            const result = await (0, notes_1.createNote)(appId, issueId, noteBody);
            expect(result).to.deep.equal(mockResponse);
            expect(nock.isDone()).to.be.true;
        });
        it("should throw a FirebaseError if the appId is invalid", async () => {
            const invalidAppId = "invalid-app-id";
            await expect((0, notes_1.createNote)(invalidAppId, issueId, noteBody)).to.be.rejectedWith(error_1.FirebaseError, "Unable to get the projectId from the AppId.");
        });
    });
    describe("deleteNote", () => {
        it("should resolve on success", async () => {
            nock((0, api_1.crashlyticsApiOrigin)())
                .delete(`/v1alpha/projects/${requestProjectNumber}/apps/${appId}/issues/${issueId}/notes/${noteId}`)
                .reply(200, {});
            await (0, notes_1.deleteNote)(appId, issueId, noteId);
            expect(nock.isDone()).to.be.true;
        });
        it("should throw a FirebaseError if the appId is invalid", async () => {
            const invalidAppId = "invalid-app-id";
            await expect((0, notes_1.deleteNote)(invalidAppId, issueId, noteId)).to.be.rejectedWith(error_1.FirebaseError, "Unable to get the projectId from the AppId.");
        });
    });
    describe("listNotes", () => {
        it("should resolve with the response body on success", async () => {
            const mockResponse = { notes: [{ name: "note1", body: "a note" }] };
            const pageSize = 10;
            nock((0, api_1.crashlyticsApiOrigin)())
                .get(`/v1alpha/projects/${requestProjectNumber}/apps/${appId}/issues/${issueId}/notes`)
                .query({
                page_size: `${pageSize}`,
            })
                .reply(200, mockResponse);
            const result = await (0, notes_1.listNotes)(appId, issueId, pageSize);
            expect(result).to.deep.equal(mockResponse.notes);
            expect(nock.isDone()).to.be.true;
        });
        it("should throw a FirebaseError if the appId is invalid", async () => {
            const invalidAppId = "invalid-app-id";
            const pageSize = 10;
            await expect((0, notes_1.listNotes)(invalidAppId, issueId, pageSize)).to.be.rejectedWith(error_1.FirebaseError, "Unable to get the projectId from the AppId.");
        });
    });
});
//# sourceMappingURL=notes.spec.js.map