"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const zod_1 = require("zod");
const tool_1 = require("./tool");
const availability = require("./util/availability");
describe("tool", () => {
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
    it("should create a tool with the correct shape and properties", () => {
        const testFn = async () => ({ content: [] });
        const testTool = (0, tool_1.tool)("core", {
            name: "test_tool",
            description: "A test tool",
            inputSchema: zod_1.z.object({}),
        }, testFn);
        (0, chai_1.expect)(testTool.mcp.name).to.equal("test_tool");
        (0, chai_1.expect)(testTool.mcp.description).to.equal("A test tool");
        (0, chai_1.expect)(testTool.fn).to.equal(testFn);
    });
    it("should use the default availability check for the feature if none is provided", async () => {
        const fakeDefaultCheck = sandbox.stub().returns(true);
        getDefaultFeatureAvailabilityCheckStub.withArgs("core").returns(fakeDefaultCheck);
        const testTool = (0, tool_1.tool)("core", { name: "test_tool", inputSchema: zod_1.z.object({}) }, async () => ({
            content: [],
        }));
        const isAvailable = await testTool.isAvailable(mockContext);
        (0, chai_1.expect)(isAvailable).to.be.true;
        (0, chai_1.expect)(fakeDefaultCheck.called).to.be.true;
        (0, chai_1.expect)(getDefaultFeatureAvailabilityCheckStub.calledOnceWith("core")).to.be.true;
    });
    it("should override the default and use the provided availability check", async () => {
        const fakeDefaultCheck = sandbox.stub().returns(true);
        const overrideCheck = sandbox.stub().returns(false);
        getDefaultFeatureAvailabilityCheckStub.withArgs("core").returns(fakeDefaultCheck);
        const testTool = (0, tool_1.tool)("core", {
            name: "test_tool",
            inputSchema: zod_1.z.object({}),
            isAvailable: overrideCheck,
        }, async () => ({ content: [] }));
        const isAvailable = await testTool.isAvailable(mockContext);
        (0, chai_1.expect)(isAvailable).to.be.false;
        (0, chai_1.expect)(fakeDefaultCheck.notCalled).to.be.true;
        (0, chai_1.expect)(overrideCheck.called).to.be.true;
        (0, chai_1.expect)(getDefaultFeatureAvailabilityCheckStub.notCalled).to.be.true;
    });
});
//# sourceMappingURL=tool.spec.js.map