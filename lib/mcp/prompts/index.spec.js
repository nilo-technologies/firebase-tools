"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const index_1 = require("./index");
const availabilityUtil = require("../util/availability");
describe("availablePrompts", () => {
    let sandbox;
    let getDefaultFeatureAvailabilityCheckStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getDefaultFeatureAvailabilityCheckStub = sandbox.stub(availabilityUtil, "getDefaultFeatureAvailabilityCheck");
        getDefaultFeatureAvailabilityCheckStub.withArgs("crashlytics").returns(async () => false);
        getDefaultFeatureAvailabilityCheckStub.callThrough();
    });
    afterEach(() => {
        sandbox.restore();
    });
    const mockContext = {
        projectId: "test-project",
        accountEmail: "test@example.com",
        config: {},
        host: {
            logger: {
                debug: () => void 0,
                info: () => void 0,
                warn: () => void 0,
                error: () => void 0,
            },
        },
        rc: {},
        firebaseCliCommand: "firebase",
        isBillingEnabled: true,
    };
    it("should return core prompts by default", async () => {
        const prompts = await (0, index_1.availablePrompts)(mockContext, [], []);
        const corePrompt = prompts.find((p) => p.mcp._meta?.feature === "core");
        (0, chai_1.expect)(corePrompt).to.exist;
    });
    it("should include feature-specific prompts when activeFeatures is provided", async () => {
        const prompts = await (0, index_1.availablePrompts)(mockContext, ["crashlytics"]);
        const features = [...new Set(prompts.map((p) => p.mcp._meta?.feature))];
        (0, chai_1.expect)(features).to.have.members(["core", "crashlytics"]);
        (0, chai_1.expect)(getDefaultFeatureAvailabilityCheckStub.called).to.be.false;
    });
    it("should not include feature prompts if not in activeFeatures", async () => {
        const prompts = await (0, index_1.availablePrompts)(mockContext, [], []);
        const crashPrompt = prompts.find((p) => p.mcp._meta?.feature === "crashlytics");
        (0, chai_1.expect)(crashPrompt).to.not.exist;
    });
    it("should fallback to detectedFeatures if activeFeatures is empty", async () => {
        getDefaultFeatureAvailabilityCheckStub.withArgs("crashlytics").returns(async () => true);
        const prompts = await (0, index_1.availablePrompts)(mockContext, [], ["crashlytics"]);
        const features = [...new Set(prompts.map((p) => p.mcp._meta?.feature))];
        (0, chai_1.expect)(features).to.have.members(["core", "crashlytics"]);
        (0, chai_1.expect)(getDefaultFeatureAvailabilityCheckStub.called).to.be.true;
    });
});
//# sourceMappingURL=index.spec.js.map