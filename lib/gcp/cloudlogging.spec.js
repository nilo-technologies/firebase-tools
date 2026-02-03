"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const cloudlogging = require("./cloudlogging");
const error_1 = require("../error");
const api_1 = require("../api");
describe("cloudlogging", () => {
    before(() => {
        nock.disableNetConnect();
    });
    after(() => {
        nock.enableNetConnect();
    });
    afterEach(() => {
        nock.cleanAll();
    });
    describe("listEntries", () => {
        it("should resolve with a list of log entries on success", async () => {
            const entries = [{ logName: "log1" }, { logName: "log2" }];
            nock((0, api_1.cloudloggingOrigin)()).post("/v2/entries:list").reply(200, { entries });
            await (0, chai_1.expect)(cloudlogging.listEntries("project", "filter", 10, "desc")).to.eventually.deep.equal({ entries, nextPageToken: undefined });
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.cloudloggingOrigin)()).post("/v2/entries:list").reply(404, { error: "not found" });
            await (0, chai_1.expect)(cloudlogging.listEntries("project", "filter", 10, "desc")).to.be.rejectedWith(error_1.FirebaseError, "Failed to retrieve log entries from Google Cloud.");
        });
        it("should include nextPageToken when provided", async () => {
            const entries = [{ logName: "log1" }];
            nock((0, api_1.cloudloggingOrigin)())
                .post("/v2/entries:list", (body) => {
                (0, chai_1.expect)(body.pageToken).to.equal("token");
                return true;
            })
                .reply(200, { entries, nextPageToken: "next" });
            await (0, chai_1.expect)(cloudlogging.listEntries("project", "filter", 10, "asc", "token")).to.eventually.deep.equal({
                entries,
                nextPageToken: "next",
            });
        });
    });
});
//# sourceMappingURL=cloudlogging.spec.js.map