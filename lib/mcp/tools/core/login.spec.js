"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const login_1 = require("./login");
const auth = require("../../../auth");
const mcp_1 = require("../../../mcp");
const util_1 = require("../../util");
describe("login tool", () => {
    let sandbox;
    let loginPrototyperStub;
    let server;
    const fakeAuthorize = sinon.stub();
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        loginPrototyperStub = sandbox.stub(auth, "loginPrototyper").resolves({
            uri: "https://fake.login.uri/auth",
            sessionId: "FAKE_SESSION_ID",
            authorize: fakeAuthorize,
        });
        server = new mcp_1.FirebaseMcpServer({ projectRoot: "" });
    });
    afterEach(() => {
        sandbox.restore();
        fakeAuthorize.reset();
    });
    it("should return uri and sessionId when no authCode is provided", async () => {
        const result = await login_1.login.fn({ authCode: undefined }, { host: server });
        const expectedResult = (0, util_1.toContent)(`Please visit this URL to login: https://fake.login.uri/auth\nYour session ID is: FAKE_SESSION_ID\nInstruct the use to copy the authorization code from that link, and paste it into chat.\nThen, run this tool again with that as the authCode argument to complete the login.`);
        (0, chai_1.expect)(loginPrototyperStub.calledOnce).to.be.true;
        (0, chai_1.expect)(result).to.deep.equal(expectedResult);
        (0, chai_1.expect)(server.authorize).to.exist;
    });
    it("should call authorize when authCode is provided", async () => {
        server.authorize = fakeAuthorize;
        fakeAuthorize.resolves({ user: { email: "test@example.com" } });
        const result = await login_1.login.fn({ authCode: "fake_auth_code" }, { host: server });
        (0, chai_1.expect)(fakeAuthorize.calledOnceWith("fake_auth_code")).to.be.true;
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(`Successfully logged in as test@example.com`));
        (0, chai_1.expect)(server.authorize).to.not.exist;
    });
    it("should return an error if authCode is provided without starting the flow", async () => {
        const result = await login_1.login.fn({ authCode: "fake_auth_code" }, { host: server });
        (0, chai_1.expect)(result.isError).to.be.true;
        (0, chai_1.expect)(result.content[0].text).to.include("Login flow not started");
    });
});
//# sourceMappingURL=login.spec.js.map