"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const logout_1 = require("./logout");
const auth = require("../../../auth");
const util_1 = require("../../util");
describe("logout tool", () => {
    let sandbox;
    let getAllAccountsStub;
    let getGlobalDefaultAccountStub;
    let getAdditionalAccountsStub;
    let setGlobalDefaultAccountStub;
    let logoutStub;
    const fakeAccount1 = {
        user: { email: "test1@example.com" },
        tokens: {
            refresh_token: "token1",
            access_token: "atok1",
            id_token: "idtok1",
            expires_at: 3600,
        },
    };
    const fakeAccount2 = {
        user: { email: "test2@example.com" },
        tokens: {
            refresh_token: "token2",
            access_token: "atok2",
            id_token: "idtok2",
            expires_at: 3600,
        },
    };
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getAllAccountsStub = sandbox.stub(auth, "getAllAccounts");
        getGlobalDefaultAccountStub = sandbox.stub(auth, "getGlobalDefaultAccount");
        getAdditionalAccountsStub = sandbox.stub(auth, "getAdditionalAccounts");
        setGlobalDefaultAccountStub = sandbox.stub(auth, "setGlobalDefaultAccount");
        logoutStub = sandbox.stub(auth, "logout").resolves();
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should inform if no user is logged in", async () => {
        getAllAccountsStub.returns([]);
        const result = await logout_1.logout.fn({ email: undefined }, {});
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)("No need to log out, not logged in"));
    });
    it("should log out a single user", async () => {
        getAllAccountsStub.returns([fakeAccount1]);
        getGlobalDefaultAccountStub.returns(fakeAccount1);
        getAdditionalAccountsStub.returns([]);
        const result = await logout_1.logout.fn({ email: undefined }, {});
        (0, chai_1.expect)(logoutStub.calledOnceWith("token1")).to.be.true;
        (0, chai_1.expect)(result.content[0].text).to.include("Logged out from test1@example.com");
    });
    it("should log out a specific user by email", async () => {
        getAllAccountsStub.returns([fakeAccount1, fakeAccount2]);
        getGlobalDefaultAccountStub.returns(fakeAccount1);
        getAdditionalAccountsStub.returns([fakeAccount2]);
        const result = await logout_1.logout.fn({ email: "test2@example.com" }, {});
        (0, chai_1.expect)(logoutStub.calledOnceWith("token2")).to.be.true;
        (0, chai_1.expect)(logoutStub.callCount).to.equal(1);
        (0, chai_1.expect)(result.content[0].text).to.include("Logged out from test2@example.com");
    });
    it("should log out all users if no email is provided", async () => {
        getAllAccountsStub.returns([fakeAccount1, fakeAccount2]);
        getGlobalDefaultAccountStub.returns(fakeAccount1);
        getAdditionalAccountsStub.returns([fakeAccount2]);
        await logout_1.logout.fn({ email: undefined }, {});
        (0, chai_1.expect)(logoutStub.calledTwice).to.be.true;
        (0, chai_1.expect)(logoutStub.calledWith("token1")).to.be.true;
        (0, chai_1.expect)(logoutStub.calledWith("token2")).to.be.true;
    });
    it("should set a new default user when logging out the default", async () => {
        getAllAccountsStub.returns([fakeAccount1, fakeAccount2]);
        getGlobalDefaultAccountStub.returns(fakeAccount1);
        getAdditionalAccountsStub.returns([fakeAccount2]);
        await logout_1.logout.fn({ email: "test1@example.com" }, {});
        (0, chai_1.expect)(setGlobalDefaultAccountStub.calledOnceWith(fakeAccount2)).to.be.true;
    });
});
//# sourceMappingURL=logout.spec.js.map