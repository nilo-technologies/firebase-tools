"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const prompt_1 = require("./prompt");
const availability = require("./util/availability");
describe("prompt", () => {
    let sandbox;
    let getDefaultFeatureAvailabilityCheckStub;
    const mockContext = {};
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getDefaultFeatureAvailabilityCheckStub = sandbox.stub(availability, "getDefaultFeatureAvailabilityCheck");
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should create a prompt with the correct shape and properties", () => {
        const testFn = async () => [];
        const testPrompt = (0, prompt_1.prompt)("core", {
            name: "test_prompt",
            description: "A test prompt",
        }, testFn);
        (0, chai_1.expect)(testPrompt.mcp.name).to.equal("test_prompt");
        (0, chai_1.expect)(testPrompt.mcp.description).to.equal("A test prompt");
        (0, chai_1.expect)(testPrompt.fn).to.equal(testFn);
    });
    it("should use the default availability check for the feature if none is provided", async () => {
        const fakeDefaultCheck = sandbox.stub().returns(true);
        getDefaultFeatureAvailabilityCheckStub.withArgs("core").returns(fakeDefaultCheck);
        const testPrompt = (0, prompt_1.prompt)("core", { name: "test_prompt" }, async () => []);
        const isAvailable = await testPrompt.isAvailable(mockContext);
        (0, chai_1.expect)(isAvailable).to.be.true;
        (0, chai_1.expect)(fakeDefaultCheck.called).to.be.true;
        (0, chai_1.expect)(getDefaultFeatureAvailabilityCheckStub.calledOnceWith("core")).to.be.true;
    });
    it("should override the default and use the provided availability check", async () => {
        const fakeDefaultCheck = sandbox.stub().returns(true);
        const overrideCheck = sandbox.stub().returns(false);
        getDefaultFeatureAvailabilityCheckStub.withArgs("core").returns(fakeDefaultCheck);
        const testPrompt = (0, prompt_1.prompt)("core", {
            name: "test_prompt",
        }, async () => [], overrideCheck);
        const isAvailable = await testPrompt.isAvailable(mockContext);
        (0, chai_1.expect)(isAvailable).to.be.false;
        (0, chai_1.expect)(fakeDefaultCheck.notCalled).to.be.true;
        (0, chai_1.expect)(overrideCheck.called).to.be.true;
        (0, chai_1.expect)(getDefaultFeatureAvailabilityCheckStub.notCalled).to.be.true;
    });
});
//# sourceMappingURL=prompt.spec.js.map