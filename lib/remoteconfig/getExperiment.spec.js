"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const api_1 = require("../api");
const nock = require("nock");
const Table = require("cli-table3");
const util = require("util");
const rcExperiment = require("./getExperiment");
const interfaces_1 = require("./interfaces");
const error_1 = require("../error");
const PROJECT_ID = "1234567890";
const EXPERIMENT_ID_1 = "1";
const EXPERIMENT_ID_2 = "2";
const expectedExperimentResult = {
    name: "projects/1234567890/namespaces/firebase/experiments/1",
    definition: {
        displayName: "param_one",
        service: "EXPERIMENT_SERVICE_REMOTE_CONFIG",
        objectives: {
            activationEvent: {},
            eventObjectives: [
                {
                    isPrimary: true,
                    systemObjectiveDetails: {
                        objective: "total_revenue",
                    },
                },
                {
                    systemObjectiveDetails: {
                        objective: "retention_7",
                    },
                },
                {
                    customObjectiveDetails: {
                        event: "app_exception",
                        countType: "NO_EVENT_USERS",
                    },
                },
            ],
        },
        variants: [
            {
                name: "Baseline",
                weight: 1,
            },
            {
                name: "Variant A",
                weight: 1,
            },
        ],
    },
    state: "PENDING",
    startTime: "1970-01-01T00:00:00Z",
    endTime: "1970-01-01T00:00:00Z",
    lastUpdateTime: "2025-07-25T08:24:30.682Z",
    etag: "e1",
};
describe("Remote Config Experiment Get", () => {
    describe("getExperiment", () => {
        afterEach(() => {
            (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
            nock.cleanAll();
        });
        it("should successfully retrieve a Remote Config experiment by ID", async () => {
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/firebase/experiments/${EXPERIMENT_ID_1}`)
                .reply(200, expectedExperimentResult);
            const experimentOne = await rcExperiment.getExperiment(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, EXPERIMENT_ID_1);
            (0, chai_1.expect)(experimentOne).to.deep.equal(expectedExperimentResult);
        });
        it("should reject with a FirebaseError if the API call fails", async () => {
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/firebase/experiments/${EXPERIMENT_ID_2}`)
                .reply(404, {});
            await (0, chai_1.expect)(rcExperiment.getExperiment(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, EXPERIMENT_ID_2)).to.eventually.be.rejectedWith(error_1.FirebaseError, `Failed to get Remote Config experiment with ID 2 for project 1234567890.`);
        });
    });
    describe("parseExperiment", () => {
        it("should correctly parse and format an experiment result into a tabular format", () => {
            const resultTable = rcExperiment.parseExperiment(expectedExperimentResult);
            const expectedTable = [
                ["Name", expectedExperimentResult.name],
                ["Display Name", expectedExperimentResult.definition.displayName],
                ["Service", expectedExperimentResult.definition.service],
                [
                    "Objectives",
                    util.inspect(expectedExperimentResult.definition.objectives, {
                        showHidden: false,
                        depth: null,
                    }),
                ],
                [
                    "Variants",
                    util.inspect(expectedExperimentResult.definition.variants, {
                        showHidden: false,
                        depth: null,
                    }),
                ],
                ["State", expectedExperimentResult.state],
                ["Start Time", expectedExperimentResult.startTime],
                ["End Time", expectedExperimentResult.endTime],
                ["Last Update Time", expectedExperimentResult.lastUpdateTime],
                ["etag", expectedExperimentResult.etag],
            ];
            const expectedTableString = new Table({
                head: ["Entry Name", "Value"],
                style: { head: ["green"] },
            });
            expectedTableString.push(...expectedTable);
            (0, chai_1.expect)(resultTable).to.equal(expectedTableString.toString());
        });
    });
});
//# sourceMappingURL=getExperiment.spec.js.map