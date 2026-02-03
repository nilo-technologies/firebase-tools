"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const Table = require("cli-table3");
const api_1 = require("../api");
const error_1 = require("../error");
const interfaces_1 = require("./interfaces");
const listExperiments_1 = require("./listExperiments");
const PROJECT_ID = "1234567890";
const experiment1 = {
    name: `projects/${PROJECT_ID}/namespaces/firebase/experiments/78`,
    definition: {
        displayName: "Experiment One",
        service: "EXPERIMENT_SERVICE_REMOTE_CONFIG",
        description: "Description for Experiment One",
    },
    state: "RUNNING",
    startTime: "2025-01-01T00:00:00Z",
    endTime: "2025-01-31T23:59:59Z",
    lastUpdateTime: "2025-01-01T00:00:00Z",
    etag: "e1",
};
const experiment2 = {
    name: `projects/${PROJECT_ID}/namespaces/firebase/experiments/22`,
    definition: {
        displayName: "Experiment Two",
        service: "EXPERIMENT_SERVICE_REMOTE_CONFIG",
        description: "Description for Experiment Two",
    },
    state: "DRAFT",
    startTime: "2025-02-01T00:00:00Z",
    endTime: "2025-02-28T23:59:59Z",
    lastUpdateTime: "2025-02-01T00:00:00Z",
    etag: "e2",
};
const experiment3 = {
    name: `projects/1234${PROJECT_ID}567890/namespaces/firebase/experiments/43`,
    definition: {
        displayName: "Experiment Three",
        service: "EXPERIMENT_SERVICE_REMOTE_CONFIG",
        description: "Description for Experiment Three",
    },
    state: "STOPPED",
    startTime: "2025-03-01T00:00:00Z",
    endTime: "2025-03-31T23:59:59Z",
    lastUpdateTime: "2025-03-01T00:00:00Z",
    etag: "e3",
};
const experiment4 = {
    name: `projects/${PROJECT_ID}/namespaces/firebase/experiments/109`,
    definition: {
        displayName: "Experiment Four",
        service: "EXPERIMENT_SERVICE_REMOTE_CONFIG",
        description: "Description for Experiment Four",
    },
    state: "STOPPED",
    startTime: "2025-03-01T00:00:00Z",
    endTime: "2025-03-31T23:59:59Z",
    lastUpdateTime: "2025-03-01T00:00:00Z",
    etag: "e4",
};
describe("Remote Config Experiment List", () => {
    afterEach(() => {
        (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
        nock.cleanAll();
    });
    describe("listExperiments", () => {
        it("should list all experiments with default page size", async () => {
            const listExperimentOptions = {
                pageSize: interfaces_1.DEFAULT_PAGE_SIZE,
            };
            const expectedResultWithAllExperiments = {
                experiments: [experiment2, experiment3, experiment1, experiment4],
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments`)
                .query({ page_size: interfaces_1.DEFAULT_PAGE_SIZE })
                .reply(200, expectedResultWithAllExperiments);
            const result = await (0, listExperiments_1.listExperiments)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listExperimentOptions);
            (0, chai_1.expect)(result.experiments).to.deep.equal(expectedResultWithAllExperiments.experiments);
            (0, chai_1.expect)(result.nextPageToken).to.equal(expectedResultWithAllExperiments.nextPageToken);
        });
        it("should return paginated experiments when page size and page token are specified", async () => {
            const pageSize = "2";
            const pageToken = "NDM=";
            const listExperimentOptions = {
                pageSize,
                pageToken,
            };
            const expectedResultWithPageTokenAndPageSize = {
                experiments: [experiment3, experiment1],
                nextPageToken: "MTA5",
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments`)
                .query({ page_size: pageSize, page_token: pageToken })
                .reply(200, expectedResultWithPageTokenAndPageSize);
            const result = await (0, listExperiments_1.listExperiments)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listExperimentOptions);
            (0, chai_1.expect)(result.experiments).to.deep.equal(expectedResultWithPageTokenAndPageSize.experiments);
            (0, chai_1.expect)(result.nextPageToken).to.equal(expectedResultWithPageTokenAndPageSize.nextPageToken);
        });
        it("should filter and return an experiment from the list", async () => {
            const listExperimentOptions = {
                pageSize: interfaces_1.DEFAULT_PAGE_SIZE,
                filter: `projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments/43`,
            };
            const expectedResultWithFilter = {
                experiments: [experiment1],
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments`)
                .query({
                filter: `projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments/43`,
                page_size: interfaces_1.DEFAULT_PAGE_SIZE,
            })
                .reply(200, expectedResultWithFilter);
            const result = await (0, listExperiments_1.listExperiments)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listExperimentOptions);
            (0, chai_1.expect)(result.experiments).to.deep.equal(expectedResultWithFilter.experiments);
            (0, chai_1.expect)(result.nextPageToken).to.equal(expectedResultWithFilter.nextPageToken);
        });
        it("should return an empty object if filter is invalid", async () => {
            const listExperimentOptions = {
                pageSize: interfaces_1.DEFAULT_PAGE_SIZE,
                filter: `projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments/43`,
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments`)
                .query({ filter: `invalid-filter`, page_size: interfaces_1.DEFAULT_PAGE_SIZE })
                .reply(200, {});
            const result = await (0, listExperiments_1.listExperiments)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, {
                ...listExperimentOptions,
                filter: "invalid-filter",
            });
            (0, chai_1.expect)(result.experiments).to.deep.equal(undefined);
        });
        it("should reject with a FirebaseError if the API call fails", async () => {
            const listExperimentOptions = {
                pageSize: interfaces_1.DEFAULT_PAGE_SIZE,
            };
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments`)
                .query({ page_size: interfaces_1.DEFAULT_PAGE_SIZE })
                .reply(400, {});
            await (0, chai_1.expect)((0, listExperiments_1.listExperiments)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, listExperimentOptions)).to.eventually.be.rejectedWith(error_1.FirebaseError, `Failed to get Remote Config experiments for project ${PROJECT_ID}.`);
        });
    });
    describe("parseExperimentList", () => {
        it("should correctly parse and format a list of experiments into a tabular format.", () => {
            const allExperiments = [
                experiment2,
                experiment3,
                experiment1,
                experiment4,
            ];
            const resultTable = (0, listExperiments_1.parseExperimentList)(allExperiments);
            const expectedTable = new Table({
                head: [
                    "Experiment ID",
                    "Display Name",
                    "Service",
                    "Description",
                    "State",
                    "Start Time",
                    "End Time",
                    "Last Update Time",
                    "etag",
                ],
                style: { head: ["green"] },
            });
            expectedTable.push([
                experiment2.name.split("/").pop(),
                experiment2.definition.displayName,
                experiment2.definition.service,
                experiment2.definition.description,
                experiment2.state,
                experiment2.startTime,
                experiment2.endTime,
                experiment2.lastUpdateTime,
                experiment2.etag,
            ], [
                experiment3.name.split("/").pop(),
                experiment3.definition.displayName,
                experiment3.definition.service,
                experiment3.definition.description,
                experiment3.state,
                experiment3.startTime,
                experiment3.endTime,
                experiment3.lastUpdateTime,
                experiment3.etag,
            ], [
                experiment1.name.split("/").pop(),
                experiment1.definition.displayName,
                experiment1.definition.service,
                experiment1.definition.description,
                experiment1.state,
                experiment1.startTime,
                experiment1.endTime,
                experiment1.lastUpdateTime,
                experiment1.etag,
            ], [
                experiment4.name.split("/").pop(),
                experiment4.definition.displayName,
                experiment4.definition.service,
                experiment4.definition.description,
                experiment4.state,
                experiment4.startTime,
                experiment4.endTime,
                experiment4.lastUpdateTime,
                experiment4.etag,
            ]);
            (0, chai_1.expect)(resultTable).to.equal(expectedTable.toString());
        });
        it("should return a message if no experiments are found.", () => {
            const result = (0, listExperiments_1.parseExperimentList)([]);
            (0, chai_1.expect)(result).to.equal("\x1b[33mNo experiments found\x1b[0m");
        });
    });
});
//# sourceMappingURL=listExperiments.spec.js.map