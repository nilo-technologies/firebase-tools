"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("../api");
const error_1 = require("../error");
const interfaces_1 = require("./interfaces");
const clc = require("colorette");
const deleteRollout_1 = require("./deleteRollout");
const PROJECT_ID = "12345679";
const ROLLOUT_ID = "rollout_1";
describe("Remote Config Rollout Delete", () => {
    afterEach(() => {
        (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
        nock.cleanAll();
    });
    it("should delete an rollout successfully", async () => {
        nock((0, api_1.remoteConfigApiOrigin)())
            .delete(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts/${ROLLOUT_ID}`)
            .reply(200);
        await (0, chai_1.expect)((0, deleteRollout_1.deleteRollout)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, ROLLOUT_ID)).to.eventually.equal(clc.bold(`Successfully deleted rollout ${clc.yellow(ROLLOUT_ID)}`));
    });
    it("should throw FirebaseError if rollout is running", async () => {
        const errorMessage = `Rollout ${ROLLOUT_ID} is currently running and cannot be deleted. If you want to delete this rollout, stop it at https://console.firebase.google.com/project/${PROJECT_ID}/config/env/firebase/rollout/${ROLLOUT_ID}`;
        nock((0, api_1.remoteConfigApiOrigin)())
            .delete(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts/${ROLLOUT_ID}`)
            .reply(400, {
            error: {
                message: errorMessage,
            },
        });
        await (0, chai_1.expect)((0, deleteRollout_1.deleteRollout)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, ROLLOUT_ID)).to.be.rejectedWith(error_1.FirebaseError, errorMessage);
    });
    it("should throw FirebaseError if an internal error occurred", async () => {
        nock((0, api_1.remoteConfigApiOrigin)())
            .delete(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/rollouts/${ROLLOUT_ID}`)
            .reply(500, {
            error: {
                message: "Internal server error",
            },
        });
        const expectedErrorMessage = `Failed to delete Remote Config rollout with ID ${ROLLOUT_ID} for project ${PROJECT_ID}. Error: Request to https://firebaseremoteconfig.googleapis.com/v1/projects/12345679/namespaces/firebase/rollouts/${ROLLOUT_ID} had HTTP Error: 500, Internal server error`;
        await (0, chai_1.expect)((0, deleteRollout_1.deleteRollout)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, ROLLOUT_ID)).to.be.rejectedWith(error_1.FirebaseError, expectedErrorMessage);
    });
});
//# sourceMappingURL=deleteRollout.spec.js.map