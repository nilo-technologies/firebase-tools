"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const resourceManager = require("../gcp/resourceManager");
const pn = require("../getProjectNumber");
const diagnose = require("./diagnose");
const extensionsApi = require("./extensionsApi");
const prompt = require("../prompt");
const GOOD_BINDING = {
    role: "roles/firebasemods.serviceAgent",
    members: ["serviceAccount:service-123456@gcp-sa-firebasemods.iam.gserviceaccount.com"],
};
describe("diagnose", () => {
    let getIamStub;
    let setIamStub;
    let getProjectNumberStub;
    let confirmStub;
    let listInstancesStub;
    beforeEach(() => {
        getIamStub = sinon
            .stub(resourceManager, "getIamPolicy")
            .throws("unexpected call to resourceManager.getIamStub");
        setIamStub = sinon
            .stub(resourceManager, "setIamPolicy")
            .throws("unexpected call to resourceManager.setIamPolicy");
        getProjectNumberStub = sinon
            .stub(pn, "getProjectNumber")
            .throws("unexpected call to pn.getProjectNumber");
        confirmStub = sinon.stub(prompt, "confirm").throws("unexpected call to prompt.confirm");
        listInstancesStub = sinon
            .stub(extensionsApi, "listInstances")
            .throws("unexpected call to extensionsApi.listInstances");
        getProjectNumberStub.resolves(123456);
        listInstancesStub.resolves([]);
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("should succeed when IAM policy is correct (no fix)", async () => {
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [GOOD_BINDING],
        });
        confirmStub.resolves(false);
        (0, chai_1.expect)(await diagnose.diagnose("project_id")).to.be.true;
        (0, chai_1.expect)(getIamStub).to.have.been.calledWith("project_id");
        (0, chai_1.expect)(setIamStub).to.not.have.been.called;
    });
    it("should fail when project IAM policy missing extensions service agent (no fix)", async () => {
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [],
        });
        confirmStub.resolves(false);
        (0, chai_1.expect)(await diagnose.diagnose("project_id")).to.be.false;
        (0, chai_1.expect)(getIamStub).to.have.been.calledWith("project_id");
        (0, chai_1.expect)(setIamStub).to.not.have.been.called;
    });
    it("should fix the project IAM policy by adding missing bindings", async () => {
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [],
        });
        setIamStub.resolves();
        confirmStub.resolves(true);
        (0, chai_1.expect)(await diagnose.diagnose("project_id")).to.be.true;
        (0, chai_1.expect)(getIamStub).to.have.been.calledWith("project_id");
        (0, chai_1.expect)(setIamStub).to.have.been.calledWith("project_id", {
            etag: "etag",
            version: 3,
            bindings: [GOOD_BINDING],
        }, "bindings");
    });
});
//# sourceMappingURL=diagnose.spec.js.map