"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const api_1 = require("../api");
const nock = require("nock");
const Table = require("cli-table3");
const listRollouts_1 = require("./listRollouts");
const interfaces_1 = require("./interfaces");
const error_1 = require("../error");
const PROJECT_ID = "1234567890";
const rollout1 = {
    name: `projects/${PROJECT_ID}/namespaces/firebase/rollouts/rollout_78`,
    definition: {
        displayName: "Rollout One",
        description: "Description for Rollout One",
        service: "ROLLOUT_SERVICE_REMOTE_CONFIG",
        controlVariant: { name: "Control", weight: 1 },
        enabledVariant: { name: "Enabled", weight: 1 },
    },
    state: "RUNNING",
    startTime: "2025-01-01T00:00:00Z",
    endTime: "2025-01-31T23:59:59Z",
    createTime: "2025-01-01T00:00:00Z",
    lastUpdateTime: "2025-01-01T00:00:00Z",
    etag: "e1",
};
const rollout2 = {
    name: `projects/${PROJECT_ID}/namespaces/firebase/rollouts/rollout_22`,
    definition: {
        displayName: "Rollout Two",
        description: "Description for Rollout Two",
        service: "ROLLOUT_SERVICE_REMOTE_CONFIG",
        controlVariant: { name: "Control", weight: 1 },
        enabledVariant: { name: "Enabled", weight: 1 },
    },
    state: "DRAFT",
    startTime: "2025-02-01T00:00:00Z",
    endTime: "2025-02-28T23:59:59Z",
    createTime: "2025-02-01T00:00:00Z",
    lastUpdateTime: "2025-02-01T00:00:00Z",
    etag: "e2",
};
const rollout3 = {
    name: `projects/${PROJECT_ID}/namespaces/firebase/rollouts/rollout_43`,
    definition: {
        displayName: "Rollout Three",
        description: "Description for Rollout Three",
        service: "ROLLOUT_SERVICE_REMOTE_CONFIG",
        controlVariant: { name: "Control", weight: 1 },
        enabledVariant: { name: "Enabled", weight: 1 },
    },
    state: "STOPPED",
    startTime: "2025-03-01T00:00:00Z",
    endTime: "2025-03-31T23:59:59Z",
    createTime: "2025-03-01T00:00:00Z",
    lastUpdateTime: "2025-03-01T00:00:00Z",
    etag: "e3",
};
const rollout4 = {
    name: `projects/${PROJECT_ID}/namespaces/firebase/rollouts/rollout_109`,
    definition: {
        displayName: "Rollout Four",
        description: "Description for Rollout Four",
        service: "ROLLOUT_SERVICE_REMOTE_CONFIG",
        controlVariant: { name: "Control", weight: 1 },
        enabledVariant: { name: "Enabled", weight: 1 },
    },
    state: "STOPPED",
    startTime: "2025-03-01T00:00:00Z",
    endTime: "2025-03-31T23:59:59Z",
    createTime: "2025-03-01T00:00:00Z",
    lastUpdateTime: "2025-03-01T00:00:00Z",
    etag: "e3",
};
describe("Remote Config Rollout List", () => {
    afterEach(() => {
        (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
        nock.cleanAll();
    });
    describe("listRollouts", () => {
        it("should list all rollouts with default page size", async () => {
            const listRolloutOptions = {
                pageSize: interfaces_1.DEFAULT_PAGE_SIZE,
            };
            const expectedResultWithAllRollouts = {
                rollouts: [rollout1, rollout2, rollout3, rollout4],
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts`)
                .query({ page_size: interfaces_1.DEFAULT_PAGE_SIZE })
                .reply(200, expectedResultWithAllRollouts);
            const result = await (0, listRollouts_1.listRollouts)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listRolloutOptions);
            (0, chai_1.expect)(result.rollouts).to.deep.equal(expectedResultWithAllRollouts.rollouts);
            (0, chai_1.expect)(result.nextPageToken).to.equal(expectedResultWithAllRollouts.nextPageToken);
        });
        it("should return paginated rollouts when page size and page token are specified", async () => {
            const pageSize = "2";
            const pageToken = "NDM=";
            const listRolloutOptions = {
                pageSize,
                pageToken,
            };
            const expectedResultWithPageTokenAndPageSize = {
                rollouts: [rollout3, rollout1],
                nextPageToken: "MTA5",
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts`)
                .query({ page_size: pageSize, page_token: pageToken })
                .reply(200, expectedResultWithPageTokenAndPageSize);
            const result = await (0, listRollouts_1.listRollouts)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listRolloutOptions);
            (0, chai_1.expect)(result.rollouts).to.deep.equal(expectedResultWithPageTokenAndPageSize.rollouts);
            (0, chai_1.expect)(result.nextPageToken).to.equal(expectedResultWithPageTokenAndPageSize.nextPageToken);
        });
        it("should filter and return a rollout from the list", async () => {
            const listRolloutOptions = {
                pageSize: interfaces_1.DEFAULT_PAGE_SIZE,
                filter: `projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts/rollout_43`,
            };
            const expectedResultWithFilter = {
                rollouts: [rollout3],
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts`)
                .query({
                filter: `projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts/rollout_43`,
                page_size: interfaces_1.DEFAULT_PAGE_SIZE,
            })
                .reply(200, expectedResultWithFilter);
            const result = await (0, listRollouts_1.listRollouts)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listRolloutOptions);
            (0, chai_1.expect)(result.rollouts).to.deep.equal(expectedResultWithFilter.rollouts);
            (0, chai_1.expect)(result.nextPageToken).to.equal(expectedResultWithFilter.nextPageToken);
        });
        it("should return an empty object if filter is invalid", async () => {
            const listRolloutOptions = {
                pageSize: interfaces_1.DEFAULT_PAGE_SIZE,
                filter: `invalid-filter`,
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts`)
                .query({ filter: `invalid-filter`, page_size: interfaces_1.DEFAULT_PAGE_SIZE })
                .reply(200, {});
            const result = await (0, listRollouts_1.listRollouts)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listRolloutOptions);
            (0, chai_1.expect)(result.rollouts).to.deep.equal(undefined);
        });
        it("should reject with a FirebaseError if the API call fails", async () => {
            const listRolloutOptions = {
                pageSize: interfaces_1.DEFAULT_PAGE_SIZE,
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts`)
                .query({ page_size: interfaces_1.DEFAULT_PAGE_SIZE })
                .reply(400, {});
            await (0, chai_1.expect)((0, listRollouts_1.listRollouts)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listRolloutOptions)).to.eventually.be.rejectedWith(error_1.FirebaseError, `Failed to get Remote Config rollouts for project ${PROJECT_ID}.`);
        });
    });
    describe("parseRolloutList", () => {
        it("should correctly parse and format a list of rollouts into a tabular format.", () => {
            const allRollouts = [rollout2, rollout3, rollout1, rollout4];
            const resultTable = (0, listRollouts_1.parseRolloutList)(allRollouts);
            const expectedTable = new Table({
                head: [
                    "Rollout ID",
                    "Display Name",
                    "Service",
                    "Description",
                    "State",
                    "Start Time",
                    "End Time",
                    "Last Update Time",
                    "ETag",
                ],
                style: { head: ["green"] },
            });
            expectedTable.push([
                rollout2.name.split("/").pop(),
                rollout2.definition.displayName,
                rollout2.definition.service,
                rollout2.definition.description,
                rollout2.state,
                rollout2.startTime,
                rollout2.endTime,
                rollout2.lastUpdateTime,
                rollout2.etag,
            ], [
                rollout3.name.split("/").pop(),
                rollout3.definition.displayName,
                rollout3.definition.service,
                rollout3.definition.description,
                rollout3.state,
                rollout3.startTime,
                rollout3.endTime,
                rollout3.lastUpdateTime,
                rollout3.etag,
            ], [
                rollout1.name.split("/").pop(),
                rollout1.definition.displayName,
                rollout1.definition.service,
                rollout1.definition.description,
                rollout1.state,
                rollout1.startTime,
                rollout1.endTime,
                rollout1.lastUpdateTime,
                rollout1.etag,
            ], [
                rollout4.name.split("/").pop(),
                rollout4.definition.displayName,
                rollout4.definition.service,
                rollout4.definition.description,
                rollout4.state,
                rollout4.startTime,
                rollout4.endTime,
                rollout4.lastUpdateTime,
                rollout4.etag,
            ]);
            (0, chai_1.expect)(resultTable).to.equal(expectedTable.toString());
        });
        it("should return a message if no rollouts are found.", () => {
            const result = (0, listRollouts_1.parseRolloutList)([]);
            (0, chai_1.expect)(result).to.equal("\x1b[33mNo rollouts found.\x1b[0m");
        });
    });
});
//# sourceMappingURL=listRollouts.spec.js.map