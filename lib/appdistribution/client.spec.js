"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = require("path");
const fs = require("fs-extra");
const nock = require("nock");
const node_fs_1 = require("node:fs");
const sinon = require("sinon");
const tmp = require("tmp");
const client_1 = require("./client");
const api_1 = require("../api");
const distribution_1 = require("./distribution");
const error_1 = require("../error");
tmp.setGracefulCleanup();
describe("distribution", () => {
    const tempdir = tmp.dirSync();
    const projectName = "projects/123456789";
    const appName = `${projectName}/apps/1:123456789:ios:abc123def456`;
    const groupName = `${projectName}/groups/my-group`;
    const binaryFile = (0, path_1.join)(tempdir.name, "app.ipa");
    fs.ensureFileSync(binaryFile);
    const mockDistribution = new distribution_1.Distribution(binaryFile);
    const appDistributionClient = new client_1.AppDistributionClient();
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.useFakeTimers();
    });
    afterEach(() => {
        sandbox.restore();
    });
    after(() => {
        (0, node_fs_1.rmSync)(tempdir.name, { recursive: true });
    });
    describe("addTesters", () => {
        const emails = ["a@foo.com", "b@foo.com"];
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1/${projectName}/testers:batchAdd`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.addTesters(projectName, emails)).to.be.rejectedWith(error_1.FirebaseError, "Failed to add testers");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)()).post(`/v1/${projectName}/testers:batchAdd`).reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.addTesters(projectName, emails)).to.be.eventually
                .fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("deleteTesters", () => {
        const emails = ["a@foo.com", "b@foo.com"];
        const mockResponse = { emails: emails };
        it("should throw error if delete fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1/${projectName}/testers:batchRemove`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.removeTesters(projectName, emails)).to.be.rejectedWith(error_1.FirebaseError, "Failed to remove testers");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1/${projectName}/testers:batchRemove`)
                .reply(200, mockResponse);
            await (0, chai_1.expect)(appDistributionClient.removeTesters(projectName, emails)).to.eventually.deep.eq(mockResponse);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listTesters", () => {
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .get(`/v1/${projectName}/testers`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.listTesters(projectName)).to.be.rejectedWith(error_1.FirebaseError, "Client request failed to list testers");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with array of testers when request succeeds - no filter", async () => {
            const testerListing = [
                {
                    name: "tester_1",
                    displayName: "Tester 1",
                    groups: [],
                    lastActivityTime: new Date("2024-08-27T02:37:19.539865Z"),
                },
                {
                    name: "tester_2",
                    displayName: "Tester 2",
                    groups: [`${projectName}/groups/beta-team`, `${projectName}/groups/alpha-team`],
                    lastActivityTime: new Date("2024-08-26T02:37:19Z"),
                },
            ];
            nock((0, api_1.appDistributionOrigin)()).get(`/v1/${projectName}/testers`).reply(200, {
                testers: testerListing,
            });
            await (0, chai_1.expect)(appDistributionClient.listTesters(projectName)).to.eventually.deep.eq([
                {
                    name: "tester_1",
                    displayName: "Tester 1",
                    groups: [],
                    lastActivityTime: new Date("2024-08-27T02:37:19.539865Z"),
                },
                {
                    name: "tester_2",
                    displayName: "Tester 2",
                    groups: [`${projectName}/groups/beta-team`, `${projectName}/groups/alpha-team`],
                    lastActivityTime: new Date("2024-08-26T02:37:19Z"),
                },
            ]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds - with filter", async () => {
            const testerListing = [
                {
                    name: "tester_2",
                    displayName: "Tester 2",
                    groups: [`${projectName}/groups/beta-team`],
                    lastActivityTime: new Date("2024-08-26T02:37:19Z"),
                },
            ];
            const filterQuery = encodeURI(`groups=${projectName}/groups/beta-team`);
            nock((0, api_1.appDistributionOrigin)())
                .get(`/v1/${projectName}/testers?filter=${filterQuery}`)
                .reply(200, {
                testers: testerListing,
            });
            await (0, chai_1.expect)(appDistributionClient.listTesters(projectName, "beta-team")).to.eventually.deep.eq([
                {
                    name: "tester_2",
                    displayName: "Tester 2",
                    groups: [`${projectName}/groups/beta-team`],
                    lastActivityTime: new Date("2024-08-26T02:37:19Z"),
                },
            ]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should gracefully handle no testers", async () => {
            nock((0, api_1.appDistributionOrigin)()).get(`/v1/${projectName}/testers`).reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.listTesters(projectName)).to.eventually.deep.eq([]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("uploadRelease", () => {
        it("should throw error if upload fails", async () => {
            nock((0, api_1.appDistributionOrigin)()).post(`/upload/v1/${appName}/releases:upload`).reply(400, {});
            await (0, chai_1.expect)(appDistributionClient.uploadRelease(appName, mockDistribution)).to.be.rejected;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return token if upload succeeds", async () => {
            const fakeOperation = "fake-operation-name";
            nock((0, api_1.appDistributionOrigin)())
                .post(`/upload/v1/${appName}/releases:upload`)
                .reply(200, { name: fakeOperation });
            await (0, chai_1.expect)(appDistributionClient.uploadRelease(appName, mockDistribution)).to.be.eventually.eq(fakeOperation);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateReleaseNotes", () => {
        const releaseName = `${appName}/releases/fake-release-id`;
        it("should return immediately when no release notes are specified", async () => {
            await (0, chai_1.expect)(appDistributionClient.updateReleaseNotes(releaseName, "")).to.eventually.be
                .fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw error when request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .patch(`/v1/${releaseName}?updateMask=release_notes.text`)
                .reply(400, {});
            await (0, chai_1.expect)(appDistributionClient.updateReleaseNotes(releaseName, "release notes")).to.be.rejectedWith(error_1.FirebaseError, "failed to update release notes");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .patch(`/v1/${releaseName}?updateMask=release_notes.text`)
                .reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.updateReleaseNotes(releaseName, "release notes")).to
                .eventually.be.fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("distribute", () => {
        const releaseName = `${appName}/releases/fake-release-id`;
        it("should return immediately when testers and groups are empty", async () => {
            await (0, chai_1.expect)(appDistributionClient.distribute(releaseName)).to.eventually.be.fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)()).post(`/v1/${releaseName}:distribute`).reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.distribute(releaseName, ["tester1"], ["group1"])).to.be
                .fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        describe("when request fails", () => {
            let testers;
            let groups;
            beforeEach(() => {
                testers = ["tester1"];
                groups = ["group1"];
            });
            it("should throw invalid testers error when status code is FAILED_PRECONDITION ", async () => {
                nock((0, api_1.appDistributionOrigin)())
                    .post(`/v1/${releaseName}:distribute`, {
                    testerEmails: testers,
                    groupAliases: groups,
                })
                    .reply(412, { error: { status: "FAILED_PRECONDITION" } });
                await (0, chai_1.expect)(appDistributionClient.distribute(releaseName, testers, groups)).to.be.rejectedWith(error_1.FirebaseError, "failed to distribute to testers/groups: invalid testers");
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
            it("should throw invalid groups error when status code is INVALID_ARGUMENT", async () => {
                nock((0, api_1.appDistributionOrigin)())
                    .post(`/v1/${releaseName}:distribute`, {
                    testerEmails: testers,
                    groupAliases: groups,
                })
                    .reply(412, { error: { status: "INVALID_ARGUMENT" } });
                await (0, chai_1.expect)(appDistributionClient.distribute(releaseName, testers, groups)).to.be.rejectedWith(error_1.FirebaseError, "failed to distribute to testers/groups: invalid groups");
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
            it("should throw default error", async () => {
                nock((0, api_1.appDistributionOrigin)())
                    .post(`/v1/${releaseName}:distribute`, {
                    testerEmails: testers,
                    groupAliases: groups,
                })
                    .reply(400, {});
                await (0, chai_1.expect)(appDistributionClient.distribute(releaseName, ["tester1"], ["group1"])).to.be.rejectedWith(error_1.FirebaseError, "failed to distribute to testers/groups");
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
        });
    });
    describe("createGroup", () => {
        const mockResponse = { name: groupName, displayName: "My Group" };
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1/${projectName}/groups`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.createGroup(projectName, "My Group")).to.be.rejectedWith(error_1.FirebaseError, "Failed to create group");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)()).post(`/v1/${projectName}/groups`).reply(200, mockResponse);
            await (0, chai_1.expect)(appDistributionClient.createGroup(projectName, "My Group")).to.eventually.deep.eq(mockResponse);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request with alias succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1/${projectName}/groups?groupId=my-group`)
                .reply(200, mockResponse);
            await (0, chai_1.expect)(appDistributionClient.createGroup(projectName, "My Group", "my-group")).to.eventually.deep.eq(mockResponse);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("deleteGroup", () => {
        it("should throw error if delete fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .delete(`/v1/${groupName}`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.deleteGroup(groupName)).to.be.rejectedWith(error_1.FirebaseError, "Failed to delete group");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)()).delete(`/v1/${groupName}`).reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.deleteGroup(groupName)).to.be.eventually.fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("addTestersToGroup", () => {
        const emails = ["a@foo.com", "b@foo.com"];
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1/${groupName}:batchJoin`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.addTestersToGroup(groupName, emails)).to.be.rejectedWith(error_1.FirebaseError, "Failed to add testers to group");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)()).post(`/v1/${groupName}:batchJoin`).reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.addTestersToGroup(groupName, emails)).to.be.eventually
                .fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("removeTestersFromGroup", () => {
        const emails = ["a@foo.com", "b@foo.com"];
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1/${groupName}:batchLeave`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.removeTestersFromGroup(groupName, emails)).to.be.rejectedWith(error_1.FirebaseError, "Failed to remove testers from group");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)()).post(`/v1/${groupName}:batchLeave`).reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.removeTestersFromGroup(groupName, emails)).to.be.eventually
                .fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listGroups", () => {
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .get(`/v1/${projectName}/groups`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.listGroups(projectName)).to.be.rejectedWith(error_1.FirebaseError, "Client failed to list groups");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with array of groups when request succeeds", async () => {
            const groups = [
                {
                    name: "group_1",
                    displayName: "Group 1",
                    testerCount: 5,
                    releaseCount: 2,
                    inviteLinkCount: 10,
                },
                {
                    name: "group_2",
                    displayName: "Group 2",
                },
            ];
            nock((0, api_1.appDistributionOrigin)()).get(`/v1/${projectName}/groups`).reply(200, {
                groups: groups,
            });
            await (0, chai_1.expect)(appDistributionClient.listGroups(projectName)).to.eventually.deep.eq(groups);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createReleaseTest", () => {
        const releaseName = `${appName}/releases/fake-release-id`;
        const mockDevices = [
            {
                model: "husky",
                version: "34",
                orientation: "portrait",
                locale: "en-US",
            },
            {
                model: "bluejay",
                version: "32",
                orientation: "landscape",
                locale: "es",
            },
        ];
        const mockReleaseTest = {
            name: `${releaseName}/tests/fake-test-id`,
            devices: mockDevices,
            state: "IN_PROGRESS",
        };
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1alpha/${releaseName}/tests`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.createReleaseTest(releaseName, mockDevices)).to.be.rejectedWith(error_1.FirebaseError, "Failed to create release test");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with ReleaseTest when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1alpha/${releaseName}/tests`)
                .reply(200, mockReleaseTest);
            await (0, chai_1.expect)(appDistributionClient.createReleaseTest(releaseName, mockDevices)).to.be.eventually.deep.eq(mockReleaseTest);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getReleaseTest", () => {
        const releaseTestName = `${appName}/releases/fake-release-id/tests/fake-test-id`;
        const mockDevices = [
            {
                model: "husky",
                version: "34",
                orientation: "portrait",
                locale: "en-US",
            },
            {
                model: "bluejay",
                version: "32",
                orientation: "landscape",
                locale: "es",
            },
        ];
        const mockReleaseTest = {
            name: releaseTestName,
            devices: mockDevices,
            state: "IN_PROGRESS",
        };
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .get(`/v1alpha/${releaseTestName}`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.getReleaseTest(releaseTestName)).to.be.rejected;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with ReleaseTest when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)()).get(`/v1alpha/${releaseTestName}`).reply(200, mockReleaseTest);
            await (0, chai_1.expect)(appDistributionClient.getReleaseTest(releaseTestName)).to.be.eventually.deep.eq(mockReleaseTest);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listTestCases", () => {
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .get(`/v1alpha/${appName}/testCases`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.listTestCases(appName)).to.be.rejectedWith(error_1.FirebaseError, "Client failed to list test cases");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with array of test cases when request succeeds", async () => {
            const testCases = [
                {
                    name: `${appName}/testCases/tc_1`,
                    displayName: "Test Case 1",
                    aiInstructions: {
                        steps: [
                            {
                                goal: "Win at all costs",
                            },
                        ],
                    },
                },
                {
                    name: `${appName}/testCases/tc_2`,
                    displayName: "Test Case 2",
                    aiInstructions: { steps: [] },
                },
            ];
            nock((0, api_1.appDistributionOrigin)()).get(`/v1alpha/${appName}/testCases`).reply(200, {
                testCases: testCases,
            });
            await (0, chai_1.expect)(appDistributionClient.listTestCases(appName)).to.eventually.deep.eq(testCases);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createTestCase", () => {
        const mockTestCase = { displayName: "Case", aiInstructions: { steps: [] } };
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1alpha/${appName}/testCases`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.createTestCase(appName, mockTestCase)).to.be.rejectedWith(error_1.FirebaseError, "Failed to create test case");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with TestCase when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)()).post(`/v1alpha/${appName}/testCases`).reply(200, mockTestCase);
            await (0, chai_1.expect)(appDistributionClient.createTestCase(appName, mockTestCase)).to.be.eventually.deep.eq(mockTestCase);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("batchUpsertTestCases", () => {
        const mockTestCase = { displayName: "Case", aiInstructions: { steps: [] } };
        it("should throw error if request fails", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1alpha/${appName}/testCases:batchUpdate`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.batchUpsertTestCases(appName, [mockTestCase])).to.be.rejectedWith(error_1.FirebaseError, "Failed to upsert test cases");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with TestCase when request succeeds", async () => {
            nock((0, api_1.appDistributionOrigin)())
                .post(`/v1alpha/${appName}/testCases:batchUpdate`)
                .reply(200, { testCases: [mockTestCase] });
            await (0, chai_1.expect)(appDistributionClient.batchUpsertTestCases(appName, [mockTestCase])).to.be.eventually.deep.eq([mockTestCase]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=client.spec.js.map