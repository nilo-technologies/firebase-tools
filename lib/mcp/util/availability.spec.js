"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const availability_1 = require("./availability");
const util = require("../util");
const crashlytics = require("./crashlytics/availability");
const types_1 = require("../types");
describe("getDefaultFeatureAvailabilityCheck", () => {
    let sandbox;
    let checkFeatureActiveStub;
    const mockContext = () => ({
        projectId: "test-project",
        accountEmail: null,
        config: { projectDir: "/test-dir" },
        host: {},
        rc: {},
        firebaseCliCommand: "firebase",
        isBillingEnabled: false,
    });
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        checkFeatureActiveStub = sandbox.stub(util, "checkFeatureActive");
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should return a function that always returns true for 'core'", async () => {
        const coreCheck = (0, availability_1.getDefaultFeatureAvailabilityCheck)("core");
        const result = await coreCheck(mockContext());
        (0, chai_1.expect)(result).to.be.true;
        (0, chai_1.expect)(checkFeatureActiveStub.notCalled).to.be.true;
    });
    it("should return the isCrashlyticsAvailable function for 'crashlytics'", () => {
        const crashlyticsCheck = (0, availability_1.getDefaultFeatureAvailabilityCheck)("crashlytics");
        (0, chai_1.expect)(crashlyticsCheck).to.equal(crashlytics.isCrashlyticsAvailable);
    });
    const featuresThatUseCheckActive = types_1.SERVER_FEATURES.filter((f) => f !== "core" && f !== "crashlytics" && f !== "apptesting");
    for (const feature of featuresThatUseCheckActive) {
        it(`should return a function that calls checkFeatureActive for '${feature}'`, async () => {
            checkFeatureActiveStub.resolves(true);
            const check = (0, availability_1.getDefaultFeatureAvailabilityCheck)(feature);
            const result = await check(mockContext());
            (0, chai_1.expect)(checkFeatureActiveStub.calledOnceWith(feature, "test-project")).to.be.true;
            (0, chai_1.expect)(result).to.be.true;
            checkFeatureActiveStub.resetHistory();
        });
    }
});
//# sourceMappingURL=availability.spec.js.map