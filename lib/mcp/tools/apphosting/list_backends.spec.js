"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const list_backends_1 = require("./list_backends");
const apphosting = require("../../../gcp/apphosting");
const util_1 = require("../../util");
describe("list_backends tool", () => {
    const projectId = "test-project";
    const location = "us-central1";
    const backendId = "test-backend";
    let listBackendsStub;
    let getTrafficStub;
    let listDomainsStub;
    let parseBackendNameStub;
    beforeEach(() => {
        listBackendsStub = sinon.stub(apphosting, "listBackends");
        getTrafficStub = sinon.stub(apphosting, "getTraffic");
        listDomainsStub = sinon.stub(apphosting, "listDomains");
        parseBackendNameStub = sinon.stub(apphosting, "parseBackendName");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should return a message when no backends are found", async () => {
        listBackendsStub.resolves({ backends: [] });
        const result = await list_backends_1.list_backends.fn({ location }, { projectId });
        (0, chai_1.expect)(listBackendsStub).to.be.calledWith(projectId, location);
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(`No backends exist for project ${projectId} in ${location}.`));
    });
    it("should list backends with traffic and domain info", async () => {
        const backend = { name: `projects/${projectId}/locations/${location}/backends/${backendId}` };
        const backends = { backends: [backend] };
        const traffic = { name: "traffic" };
        const domains = [{ name: "domain" }];
        listBackendsStub.resolves(backends);
        parseBackendNameStub.returns({ location, id: backendId });
        getTrafficStub.resolves(traffic);
        listDomainsStub.resolves(domains);
        const result = await list_backends_1.list_backends.fn({ location }, { projectId });
        (0, chai_1.expect)(listBackendsStub).to.be.calledWith(projectId, location);
        (0, chai_1.expect)(parseBackendNameStub).to.be.calledWith(backend.name);
        (0, chai_1.expect)(getTrafficStub).to.be.calledWith(projectId, location, backendId);
        (0, chai_1.expect)(listDomainsStub).to.be.calledWith(projectId, location, backendId);
        const expectedData = [{ ...backend, traffic, domains }];
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(expectedData));
    });
    it("should handle the default location", async () => {
        listBackendsStub.resolves({ backends: [] });
        await list_backends_1.list_backends.fn({}, { projectId });
        (0, chai_1.expect)(listBackendsStub).to.be.calledWith(projectId, "-");
    });
});
//# sourceMappingURL=list_backends.spec.js.map