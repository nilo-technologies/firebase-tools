"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("./index");
describe("availableTools", () => {
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
    it("should return specific tools when enabledTools is provided", async () => {
        const tools = await (0, index_1.availableTools)(mockContext, [], [], ["firebase_login"]);
        (0, chai_1.expect)(tools).to.have.length(1);
        (0, chai_1.expect)(tools[0].mcp.name).to.equal("firebase_login");
    }).timeout(2000);
    it("should return core tools by default", async () => {
        const tools = await (0, index_1.availableTools)(mockContext, [], []);
        const loginTool = tools.find((t) => t.mcp.name === "firebase_login");
        (0, chai_1.expect)(loginTool).to.exist;
    }).timeout(2000);
    it("should include feature-specific tools when activeFeatures is provided", async () => {
        const tools = await (0, index_1.availableTools)(mockContext, ["firestore"]);
        const firestoreTool = tools.find((t) => t.mcp.name.startsWith("firestore_"));
        (0, chai_1.expect)(firestoreTool).to.exist;
    }).timeout(2000);
    it("should not include feature tools if no active features", async () => {
        const tools = await (0, index_1.availableTools)(mockContext, ["core"]);
        const firestoreTool = tools.find((t) => t.mcp.name.startsWith("firestore_"));
        (0, chai_1.expect)(firestoreTool).to.not.exist;
    }).timeout(2000);
    it("should fallback to detected features if activeFeatures is empty", async () => {
        const tools = await (0, index_1.availableTools)(mockContext, [], ["firestore"]);
        const firestoreTool = tools.find((t) => t.mcp.name.startsWith("firestore_"));
        (0, chai_1.expect)(firestoreTool).to.exist;
    });
});
//# sourceMappingURL=index.spec.js.map