"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const getDefaultHostingSite_1 = require("./getDefaultHostingSite");
const projectUtils = require("./projectUtils");
const projects = require("./management/projects");
const hostingApi = require("./hosting/api");
const api_1 = require("./hosting/api");
const PROJECT_ID = "test-project-id";
describe("getDefaultHostingSite", () => {
    let sandbox;
    let getFirebaseProjectStub;
    let listSitesStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(projectUtils, "needProjectId").returns(PROJECT_ID);
        getFirebaseProjectStub = sandbox.stub(projects, "getFirebaseProject");
        listSitesStub = sandbox.stub(hostingApi, "listSites");
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should return the default hosting site from project resources", async () => {
        const defaultSite = "my-default-site";
        getFirebaseProjectStub.resolves({
            resources: { hostingSite: defaultSite },
        });
        const site = await (0, getDefaultHostingSite_1.getDefaultHostingSite)({ projectId: PROJECT_ID });
        (0, chai_1.expect)(site).to.equal(defaultSite);
        (0, chai_1.expect)(getFirebaseProjectStub).to.have.been.calledWith(PROJECT_ID);
        (0, chai_1.expect)(listSitesStub).to.not.have.been.called;
    });
    it("should return the default hosting site from listSites if not in project resources", async () => {
        const defaultSite = "another-default-site";
        getFirebaseProjectStub.resolves({ resources: {} });
        listSitesStub.resolves([
            { name: `projects/${PROJECT_ID}/sites/other-site`, type: api_1.SiteType.USER_SITE },
            { name: `projects/${PROJECT_ID}/sites/${defaultSite}`, type: api_1.SiteType.DEFAULT_SITE },
        ]);
        const site = await (0, getDefaultHostingSite_1.getDefaultHostingSite)({ projectId: PROJECT_ID });
        (0, chai_1.expect)(site).to.equal(defaultSite);
        (0, chai_1.expect)(getFirebaseProjectStub).to.have.been.calledWith(PROJECT_ID);
        (0, chai_1.expect)(listSitesStub).to.have.been.calledWith(PROJECT_ID);
    });
    it("should throw an error if no default site is found", async () => {
        getFirebaseProjectStub.resolves({ resources: {} });
        listSitesStub.resolves([
            { name: `projects/${PROJECT_ID}/sites/other-site`, type: api_1.SiteType.USER_SITE },
        ]);
        await (0, chai_1.expect)((0, getDefaultHostingSite_1.getDefaultHostingSite)({ projectId: PROJECT_ID })).to.be.rejectedWith(getDefaultHostingSite_1.errNoDefaultSite);
        (0, chai_1.expect)(getFirebaseProjectStub).to.have.been.calledWith(PROJECT_ID);
        (0, chai_1.expect)(listSitesStub).to.have.been.calledWith(PROJECT_ID);
    });
    it("should throw an error if listSites returns no sites", async () => {
        getFirebaseProjectStub.resolves({ resources: {} });
        listSitesStub.resolves([]);
        await (0, chai_1.expect)((0, getDefaultHostingSite_1.getDefaultHostingSite)({ projectId: PROJECT_ID })).to.be.rejectedWith(getDefaultHostingSite_1.errNoDefaultSite);
    });
});
//# sourceMappingURL=getDefaultHostingSite.spec.js.map