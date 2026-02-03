"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const update_user_1 = require("./update_user");
const auth = require("../../../gcp/auth");
const util = require("../../util");
describe("update_user tool", () => {
    const projectId = "test-project";
    let setCustomClaimsStub;
    let toggleuserEnablementStub;
    let mcpErrorStub;
    beforeEach(() => {
        setCustomClaimsStub = sinon.stub(auth, "setCustomClaim");
        toggleuserEnablementStub = sinon.stub(auth, "toggleUserEnablement");
        mcpErrorStub = sinon.stub(util, "mcpError");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should disable a user", async () => {
        toggleuserEnablementStub.resolves(true);
        const result = await update_user_1.update_user.fn({ uid: "123", disabled: true }, {
            projectId,
        });
        (0, chai_1.expect)(result).to.deep.equal({
            content: [
                {
                    text: "Successfully updated user 123. User disabled.",
                    type: "text",
                },
            ],
        });
        (0, chai_1.expect)(toggleuserEnablementStub).to.have.been.calledWith(projectId, "123", true);
        (0, chai_1.expect)(setCustomClaimsStub).to.not.have.been.called;
    });
    it("should enable a user", async () => {
        toggleuserEnablementStub.resolves(true);
        const result = await update_user_1.update_user.fn({ uid: "123", disabled: false }, {
            projectId,
        });
        (0, chai_1.expect)(result).to.deep.equal({
            content: [
                {
                    text: "Successfully updated user 123. User enabled.",
                    type: "text",
                },
            ],
        });
        (0, chai_1.expect)(toggleuserEnablementStub).to.have.been.calledWith(projectId, "123", false);
        (0, chai_1.expect)(setCustomClaimsStub).to.not.have.been.called;
    });
    it("should set a custom claim", async () => {
        setCustomClaimsStub.resolves({ uid: "123", customClaims: { admin: true } });
        const result = await update_user_1.update_user.fn({
            uid: "123",
            claim: { key: "admin", value: true },
        }, {
            projectId,
        });
        (0, chai_1.expect)(result).to.deep.equal({
            content: [
                {
                    text: "Successfully updated user 123. Claim 'admin' set.",
                    type: "text",
                },
            ],
        });
        (0, chai_1.expect)(setCustomClaimsStub).to.have.been.calledWith(projectId, "123", { admin: true });
        (0, chai_1.expect)(toggleuserEnablementStub).to.not.have.been.called;
    });
    it("should fail to set a custom claim and disable a user", async () => {
        setCustomClaimsStub.resolves({ uid: "123", customClaims: { admin: true } });
        toggleuserEnablementStub.resolves(true);
        await update_user_1.update_user.fn({
            uid: "123",
            claim: { key: "admin", value: true },
            disabled: true,
        }, {
            projectId,
        });
        (0, chai_1.expect)(mcpErrorStub).to.be.calledWith("Can only enable/disable a user or set a claim, not both.");
    });
});
//# sourceMappingURL=update_user.spec.js.map