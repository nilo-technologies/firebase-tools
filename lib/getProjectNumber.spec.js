"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const getProjectNumber_1 = require("./getProjectNumber");
const projectUtils = require("./projectUtils");
const projects = require("./management/projects");
const PROJECT_ID = "test-project-id";
const PROJECT_NUMBER = "123456789";
describe("getProjectNumber", () => {
    let sandbox;
    let needProjectIdStub;
    let getProjectStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        needProjectIdStub = sandbox.stub(projectUtils, "needProjectId").returns(PROJECT_ID);
        getProjectStub = sandbox.stub(projects, "getProject");
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should return project number from options if it exists", async () => {
        const options = { projectNumber: PROJECT_NUMBER };
        const projectNumber = await (0, getProjectNumber_1.getProjectNumber)(options);
        (0, chai_1.expect)(projectNumber).to.equal(PROJECT_NUMBER);
        (0, chai_1.expect)(needProjectIdStub).to.not.have.been.called;
        (0, chai_1.expect)(getProjectStub).to.not.have.been.called;
    });
    it("should fetch project number if not in options", async () => {
        const options = { projectId: PROJECT_ID };
        getProjectStub.resolves({ projectNumber: PROJECT_NUMBER });
        const projectNumber = await (0, getProjectNumber_1.getProjectNumber)(options);
        (0, chai_1.expect)(projectNumber).to.equal(PROJECT_NUMBER);
        (0, chai_1.expect)(needProjectIdStub).to.have.been.calledWith(options);
        (0, chai_1.expect)(getProjectStub).to.have.been.calledWith(PROJECT_ID);
        (0, chai_1.expect)(options.projectNumber).to.equal(PROJECT_NUMBER);
    });
});
//# sourceMappingURL=getProjectNumber.spec.js.map