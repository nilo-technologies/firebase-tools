"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const set_sms_region_policy_1 = require("./set_sms_region_policy");
const auth = require("../../../gcp/auth");
const util_1 = require("../../util");
describe("set_sms_region_policy tool", () => {
    const projectId = "test-project";
    const country_codes = ["us", "ca"];
    const upperCaseCountryCodes = ["US", "CA"];
    let setAllowSmsRegionPolicyStub;
    let setDenySmsRegionPolicyStub;
    beforeEach(() => {
        setAllowSmsRegionPolicyStub = sinon.stub(auth, "setAllowSmsRegionPolicy");
        setDenySmsRegionPolicyStub = sinon.stub(auth, "setDenySmsRegionPolicy");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should set an ALLOW policy", async () => {
        setAllowSmsRegionPolicyStub.resolves(true);
        const result = await set_sms_region_policy_1.set_sms_region_policy.fn({ policy_type: "ALLOW", country_codes }, {
            projectId,
        });
        (0, chai_1.expect)(setAllowSmsRegionPolicyStub).to.be.calledWith(projectId, upperCaseCountryCodes);
        (0, chai_1.expect)(setDenySmsRegionPolicyStub).to.not.be.called;
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(true));
    });
    it("should set a DENY policy", async () => {
        setDenySmsRegionPolicyStub.resolves(true);
        const result = await set_sms_region_policy_1.set_sms_region_policy.fn({ policy_type: "DENY", country_codes }, {
            projectId,
        });
        (0, chai_1.expect)(setDenySmsRegionPolicyStub).to.be.calledWith(projectId, upperCaseCountryCodes);
        (0, chai_1.expect)(setAllowSmsRegionPolicyStub).to.not.be.called;
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(true));
    });
});
//# sourceMappingURL=set_sms_region_policy.spec.js.map