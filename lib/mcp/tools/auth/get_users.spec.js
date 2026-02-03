"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const get_users_1 = require("./get_users");
const auth = require("../../../gcp/auth");
const util_1 = require("../../util");
describe("get_users tool", () => {
    const projectId = "test-project";
    const users = [
        { uid: "uid1", email: "user1@example.com", passwordHash: "hash", salt: "salt" },
        { uid: "uid2", email: "user2@example.com", passwordHash: "hash", salt: "salt" },
    ];
    const prunedUsers = [
        { uid: "uid1", email: "user1@example.com" },
        { uid: "uid2", email: "user2@example.com" },
    ];
    let findUserStub;
    let listUsersStub;
    beforeEach(() => {
        findUserStub = sinon.stub(auth, "findUser");
        listUsersStub = sinon.stub(auth, "listUsers");
    });
    afterEach(() => {
        sinon.restore();
    });
    context("when no identifiers are provided", () => {
        it("should list all users", async () => {
            listUsersStub.resolves(users);
            const result = await get_users_1.get_users.fn({}, { projectId });
            (0, chai_1.expect)(listUsersStub).to.be.calledWith(projectId, 100);
            (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(prunedUsers));
        });
    });
    context("when uids are provided", () => {
        it("should get users by uid", async () => {
            findUserStub.onFirstCall().resolves(users[0]);
            findUserStub.onSecondCall().resolves(users[1]);
            const result = await get_users_1.get_users.fn({ uids: ["uid1", "uid2"] }, { projectId });
            (0, chai_1.expect)(findUserStub).to.be.calledWith(projectId, undefined, undefined, "uid1");
            (0, chai_1.expect)(findUserStub).to.be.calledWith(projectId, undefined, undefined, "uid2");
            (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(prunedUsers));
        });
        it("should handle not found users", async () => {
            findUserStub.onFirstCall().resolves(users[0]);
            findUserStub.onSecondCall().rejects(new Error("User not found"));
            const result = await get_users_1.get_users.fn({ uids: ["uid1", "uid2"] }, { projectId });
            (0, chai_1.expect)(findUserStub).to.be.calledWith(projectId, undefined, undefined, "uid1");
            (0, chai_1.expect)(findUserStub).to.be.calledWith(projectId, undefined, undefined, "uid2");
            (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)([prunedUsers[0]]));
        });
    });
    context("when emails are provided", () => {
        it("should get users by email", async () => {
            findUserStub.onFirstCall().resolves(users[0]);
            findUserStub.onSecondCall().resolves(users[1]);
            const result = await get_users_1.get_users.fn({ emails: ["user1@example.com", "user2@example.com"] }, {
                projectId,
            });
            (0, chai_1.expect)(findUserStub).to.be.calledWith(projectId, "user1@example.com", undefined, undefined);
            (0, chai_1.expect)(findUserStub).to.be.calledWith(projectId, "user2@example.com", undefined, undefined);
            (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(prunedUsers));
        });
    });
    context("when phone_numbers are provided", () => {
        it("should get users by phone number", async () => {
            findUserStub.onFirstCall().resolves(users[0]);
            findUserStub.onSecondCall().resolves(users[1]);
            const result = await get_users_1.get_users.fn({ phone_numbers: ["+11111111111", "+22222222222"] }, {
                projectId,
            });
            (0, chai_1.expect)(findUserStub).to.be.calledWith(projectId, undefined, "+11111111111", undefined);
            (0, chai_1.expect)(findUserStub).to.be.calledWith(projectId, undefined, "+22222222222", undefined);
            (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(prunedUsers));
        });
    });
});
//# sourceMappingURL=get_users.spec.js.map