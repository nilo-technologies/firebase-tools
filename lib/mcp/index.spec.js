"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const index_1 = require("./index");
const requireAuthModule = require("../requireAuth");
describe("FirebaseMcpServer.getAuthenticatedUser", () => {
    let server;
    let requireAuthStub;
    beforeEach(() => {
        sinon.stub(index_1.FirebaseMcpServer.prototype, "detectProjectRoot").resolves("/test/project");
        sinon.stub(index_1.FirebaseMcpServer.prototype, "detectActiveFeatures").resolves([]);
        server = new index_1.FirebaseMcpServer({});
        sinon.stub(server, "resolveOptions").resolves({});
        requireAuthStub = sinon.stub(requireAuthModule, "requireAuth");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should return email when authenticated user is present", async () => {
        const testEmail = "test@example.com";
        requireAuthStub.resolves(testEmail);
        const result = await server.getAuthenticatedUser();
        (0, chai_1.expect)(result).to.equal(testEmail);
        (0, chai_1.expect)(requireAuthStub.calledOnce).to.be.true;
    });
    it("should return null when no user and skipAutoAuth is true", async () => {
        requireAuthStub.resolves(null);
        const result = await server.getAuthenticatedUser(true);
        (0, chai_1.expect)(result).to.be.null;
        (0, chai_1.expect)(requireAuthStub.calledOnce).to.be.true;
    });
    it("should return 'Application Default Credentials' when no user and skipAutoAuth is false", async () => {
        requireAuthStub.resolves(null);
        const result = await server.getAuthenticatedUser(false);
        (0, chai_1.expect)(result).to.equal("Application Default Credentials");
        (0, chai_1.expect)(requireAuthStub.calledOnce).to.be.true;
    });
    it("should return null when requireAuth throws an error", async () => {
        requireAuthStub.rejects(new Error("Auth failed"));
        const result = await server.getAuthenticatedUser();
        (0, chai_1.expect)(result).to.be.null;
        (0, chai_1.expect)(requireAuthStub.calledOnce).to.be.true;
    });
});
//# sourceMappingURL=index.spec.js.map