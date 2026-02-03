"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const api_1 = require("../api");
const nock = require("nock");
const Table = require("cli-table3");
const util = require("util");
const rcRollout = require("./getRollout");
const interfaces_1 = require("./interfaces");
const error_1 = require("../error");
const PROJECT_ID = "1234567890";
const ROLLOUT_ID_1 = "rollout_1";
const ROLLOUT_ID_2 = "rollout_2";
const expectedRollout = {
    name: `projects/${PROJECT_ID}/namespaces/firebase/rollouts/${ROLLOUT_ID_1}`,
    definition: {
        displayName: "Rollout demo",
        description: "rollouts are fun!",
        service: "ROLLOUT_SERVICE_REMOTE_CONFIG",
        controlVariant: {
            name: "Control",
            weight: 1,
        },
        enabledVariant: {
            name: "Enabled",
            weight: 1,
        },
    },
    state: "DONE",
    startTime: "2025-01-01T00:00:00Z",
    endTime: "2025-01-31T23:59:59Z",
    createTime: "2025-01-01T00:00:00Z",
    lastUpdateTime: "2025-01-01T00:00:00Z",
    etag: "e1",
};
describe("Remote Config Rollout Get", () => {
    describe("getRollout", () => {
        afterEach(() => {
            (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
            nock.cleanAll();
        });
        it("should successfully retrieve a Remote Config rollout by ID", async () => {
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/firebase/rollouts/${ROLLOUT_ID_1}`)
                .reply(200, expectedRollout);
            const rolloutOne = await rcRollout.getRollout(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, ROLLOUT_ID_1);
            (0, chai_1.expect)(rolloutOne).to.deep.equal(expectedRollout);
        });
        it("should reject with a FirebaseError if the API call fails", async () => {
            nock((0, api_1.remoteConfigApiOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/namespaces/firebase/rollouts/${ROLLOUT_ID_2}`)
                .reply(404, {});
            const expectedError = `Failed to get Remote Config Rollout with ID ${ROLLOUT_ID_2} for project ${PROJECT_ID}.`;
            await (0, chai_1.expect)(rcRollout.getRollout(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, ROLLOUT_ID_2)).to.eventually.be.rejectedWith(error_1.FirebaseError, expectedError);
        });
    });
    describe("parseRollout", () => {
        it("should correctly parse and format an rollout result into a tabular format", () => {
            const resultTable = rcRollout.parseRolloutIntoTable(expectedRollout);
            const expectedTable = [
                ["Name", expectedRollout.name],
                ["Display Name", expectedRollout.definition.displayName],
                ["Description", expectedRollout.definition.description],
                ["State", expectedRollout.state],
                ["Create Time", expectedRollout.createTime],
                ["Start Time", expectedRollout.startTime],
                ["End Time", expectedRollout.endTime],
                ["Last Update Time", expectedRollout.lastUpdateTime],
                [
                    "Control Variant",
                    util.inspect(expectedRollout.definition.controlVariant, {
                        showHidden: false,
                        depth: null,
                    }),
                ],
                [
                    "Enabled Variant",
                    util.inspect(expectedRollout.definition.enabledVariant, {
                        showHidden: false,
                        depth: null,
                    }),
                ],
                ["ETag", expectedRollout.etag],
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
//# sourceMappingURL=getRollout.spec.js.map