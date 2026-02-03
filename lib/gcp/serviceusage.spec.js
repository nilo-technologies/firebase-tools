"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const serviceUsage = require("./serviceusage");
const poller = require("../operation-poller");
describe("serviceusage", () => {
    let postStub;
    let pollerStub;
    const projectNumber = "projectNumber";
    const service = "service";
    const prefix = "prefix";
    beforeEach(() => {
        postStub = sinon.stub(serviceUsage.apiClient, "post").throws("unexpected post call");
        pollerStub = sinon.stub(poller, "pollOperation").throws("unexpected pollOperation call");
    });
    afterEach(() => {
        postStub.restore();
        pollerStub.restore();
    });
    describe("generateServiceIdentityAndPoll", () => {
        it("does not poll if generateServiceIdentity responds with a completed operation", async () => {
            postStub.onFirstCall().resolves({ body: { done: true } });
            await serviceUsage.generateServiceIdentityAndPoll(projectNumber, service, prefix);
            (0, chai_1.expect)(pollerStub).to.not.be.called;
        });
    });
});
//# sourceMappingURL=serviceusage.spec.js.map