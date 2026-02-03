"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const auth = require("./auth");
const api_1 = require("../api");
const PROJECT_ID = "test-project";
describe("auth", () => {
    afterEach(() => {
        nock.cleanAll();
    });
    describe("getAuthDomains", () => {
        it("should resolve with auth domains on success", async () => {
            const authDomains = ["domain1.com", "domain2.com"];
            nock((0, api_1.identityOrigin)())
                .get(`/admin/v2/projects/${PROJECT_ID}/config`)
                .reply(200, { authorizedDomains: authDomains });
            const result = await auth.getAuthDomains(PROJECT_ID);
            (0, chai_1.expect)(result).to.deep.equal(authDomains);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.identityOrigin)())
                .get(`/admin/v2/projects/${PROJECT_ID}/config`)
                .reply(404, { error: { message: "Not Found" } });
            await (0, chai_1.expect)(auth.getAuthDomains(PROJECT_ID)).to.be.rejectedWith("Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateAuthDomains", () => {
        const authDomains = ["domain1.com", "domain2.com"];
        it("should resolve with auth domains on success", async () => {
            nock((0, api_1.identityOrigin)())
                .patch(`/admin/v2/projects/${PROJECT_ID}/config?update_mask=authorizedDomains`, {
                authorizedDomains: authDomains,
            })
                .reply(200, { authorizedDomains: authDomains });
            const result = await auth.updateAuthDomains(PROJECT_ID, authDomains);
            (0, chai_1.expect)(result).to.deep.equal(authDomains);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.identityOrigin)())
                .patch(`/admin/v2/projects/${PROJECT_ID}/config?update_mask=authorizedDomains`, {
                authorizedDomains: authDomains,
            })
                .reply(404, { error: { message: "Not Found" } });
            await (0, chai_1.expect)(auth.updateAuthDomains(PROJECT_ID, authDomains)).to.be.rejectedWith("Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("findUser", () => {
        const userInfo = { localId: "test-uid", email: "test@test.com" };
        const expectedUserInfo = { uid: "test-uid", email: "test@test.com" };
        it("should resolve with user info on success (email)", async () => {
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`, {
                expression: [{ email: "test@test.com" }],
                limit: "1",
            })
                .reply(200, { userInfo: [userInfo] });
            const result = await auth.findUser(PROJECT_ID, "test@test.com");
            (0, chai_1.expect)(result).to.deep.equal(expectedUserInfo);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with user info on success (phone)", async () => {
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`, {
                expression: [{ phoneNumber: "+11234567890" }],
                limit: "1",
            })
                .reply(200, { userInfo: [userInfo] });
            const result = await auth.findUser(PROJECT_ID, undefined, "+11234567890");
            (0, chai_1.expect)(result).to.deep.equal(expectedUserInfo);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with user info on success (uid)", async () => {
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`, {
                expression: [{ userId: "test-uid" }],
                limit: "1",
            })
                .reply(200, { userInfo: [userInfo] });
            const result = await auth.findUser(PROJECT_ID, undefined, undefined, "test-uid");
            (0, chai_1.expect)(result).to.deep.equal(expectedUserInfo);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if no user is found", async () => {
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`, {
                expression: [{ email: "test@test.com" }],
                limit: "1",
            })
                .reply(200, {});
            await (0, chai_1.expect)(auth.findUser(PROJECT_ID, "test@test.com")).to.be.rejectedWith("No users found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listUsers", () => {
        const userInfo1 = { localId: "test-uid1", email: "test1@test.com" };
        const userInfo2 = { localId: "test-uid2", email: "test2@test.com" };
        const expectedUserInfo1 = { uid: "test-uid1", email: "test1@test.com" };
        const expectedUserInfo2 = { uid: "test-uid2", email: "test2@test.com" };
        it("should resolve with a list of users on success", async () => {
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`, {
                offset: "0",
                limit: "2",
            })
                .reply(200, {
                recordsCount: "2",
                userInfo: [userInfo1, userInfo2],
            });
            const result = await auth.listUsers(PROJECT_ID, 2);
            (0, chai_1.expect)(result).to.deep.equal([expectedUserInfo1, expectedUserInfo2]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should handle pagination correctly", async () => {
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`, {
                offset: "0",
                limit: "500",
            })
                .reply(200, {
                recordsCount: "1",
                userInfo: [userInfo1],
            });
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`, {
                offset: "1",
                limit: "500",
            })
                .reply(200, {
                recordsCount: "1",
                userInfo: [userInfo2],
            });
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`, {
                offset: "2",
                limit: "500",
            })
                .reply(200, {
                recordsCount: "0",
            });
            const result = await auth.listUsers(PROJECT_ID, 1000);
            (0, chai_1.expect)(result).to.deep.equal([expectedUserInfo1, expectedUserInfo2]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("disableUser", () => {
        it("should resolve with true on success", async () => {
            nock((0, api_1.identityOrigin)())
                .post("/v1/accounts:update", {
                disableUser: true,
                targetProjectId: PROJECT_ID,
                localId: "test-uid",
            })
                .reply(200, {});
            const result = await auth.toggleUserEnablement(PROJECT_ID, "test-uid", true);
            (0, chai_1.expect)(result).to.be.true;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.identityOrigin)())
                .post("/v1/accounts:update", {
                disableUser: true,
                targetProjectId: PROJECT_ID,
                localId: "test-uid",
            })
                .reply(404, { error: { message: "Not Found" } });
            await (0, chai_1.expect)(auth.toggleUserEnablement(PROJECT_ID, "test-uid", true)).to.be.rejectedWith("Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("setCustomClaim", () => {
        const uid = "test-uid";
        const claim = { admin: true };
        const userInfo = {
            localId: uid,
            email: "test@test.com",
            customAttributes: "",
        };
        const updatedUserInfo = {
            uid: uid,
            email: "test@test.com",
            customAttributes: JSON.stringify(claim),
        };
        it("should resolve with updated user info on success (overwrite)", async () => {
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`)
                .reply(200, { userInfo: [userInfo] });
            nock((0, api_1.identityOrigin)())
                .post("/v1/accounts:update", {
                customAttributes: JSON.stringify(claim),
                targetProjectId: PROJECT_ID,
                localId: uid,
            })
                .reply(200, {});
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`)
                .reply(200, { userInfo: [{ ...userInfo, uid, customAttributes: JSON.stringify(claim) }] });
            const result = await auth.setCustomClaim(PROJECT_ID, uid, claim);
            (0, chai_1.expect)(result).to.deep.equal(updatedUserInfo);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with updated user info on success (merge)", async () => {
            const existingClaim = { role: "user" };
            const mergedClaim = { ...existingClaim, ...claim };
            const userInfoWithClaim = { ...userInfo, customAttributes: JSON.stringify(existingClaim) };
            const updatedUserInfoWithMergedClaim = {
                uid: uid,
                email: "test@test.com",
                customAttributes: JSON.stringify(mergedClaim),
            };
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`)
                .reply(200, { userInfo: [userInfoWithClaim] });
            nock((0, api_1.identityOrigin)())
                .post("/v1/accounts:update", {
                customAttributes: JSON.stringify(mergedClaim),
                targetProjectId: PROJECT_ID,
                localId: uid,
            })
                .reply(200, {});
            nock((0, api_1.identityOrigin)())
                .post(`/v1/projects/${PROJECT_ID}/accounts:query`)
                .reply(200, {
                userInfo: [{ ...userInfo, uid, customAttributes: JSON.stringify(mergedClaim) }],
            });
            const result = await auth.setCustomClaim(PROJECT_ID, uid, claim, {
                merge: true,
            });
            (0, chai_1.expect)(result).to.deep.equal(updatedUserInfoWithMergedClaim);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("setAllowSmsRegionPolicy", () => {
        const countryCodes = ["US", "CA"];
        it("should resolve with true on success", async () => {
            nock((0, api_1.identityOrigin)())
                .patch(`/admin/v2/projects/${PROJECT_ID}/config?updateMask=sms_region_config`, {
                sms_region_config: {
                    allowlist_only: {
                        allowed_regions: countryCodes,
                    },
                },
            })
                .reply(200, {});
            const result = await auth.setAllowSmsRegionPolicy(PROJECT_ID, countryCodes);
            (0, chai_1.expect)(result).to.be.true;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.identityOrigin)())
                .patch(`/admin/v2/projects/${PROJECT_ID}/config?updateMask=sms_region_config`, {
                sms_region_config: {
                    allowlist_only: {
                        allowed_regions: countryCodes,
                    },
                },
            })
                .reply(400, { error: { message: "Bad Request" } });
            await (0, chai_1.expect)(auth.setAllowSmsRegionPolicy(PROJECT_ID, countryCodes)).to.be.rejectedWith("Bad Request");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("setDenySmsRegionPolicy", () => {
        const countryCodes = ["US", "CA"];
        it("should resolve with true on success", async () => {
            nock((0, api_1.identityOrigin)())
                .patch(`/admin/v2/projects/${PROJECT_ID}/config?updateMask=sms_region_config`, {
                sms_region_config: {
                    allow_by_default: {
                        disallowed_regions: countryCodes,
                    },
                },
            })
                .reply(200, {});
            const result = await auth.setDenySmsRegionPolicy(PROJECT_ID, countryCodes);
            (0, chai_1.expect)(result).to.be.true;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.identityOrigin)())
                .patch(`/admin/v2/projects/${PROJECT_ID}/config?updateMask=sms_region_config`, {
                sms_region_config: {
                    allow_by_default: {
                        disallowed_regions: countryCodes,
                    },
                },
            })
                .reply(400, { error: { message: "Bad Request" } });
            await (0, chai_1.expect)(auth.setDenySmsRegionPolicy(PROJECT_ID, countryCodes)).to.be.rejectedWith("Bad Request");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=auth.spec.js.map