"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const clc = require("colorette");
const api_1 = require("../api");
const error_1 = require("../error");
const deleteExperiment_1 = require("./deleteExperiment");
const interfaces_1 = require("./interfaces");
const PROJECT_ID = "12345679";
const EXPERIMENT_ID = "1";
describe("Remote Config Experiment Delete", () => {
    afterEach(() => {
        (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
        nock.cleanAll();
    });
    it("should delete an experiment successfully", async () => {
        nock((0, api_1.remoteConfigApiOrigin)())
            .delete(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments/${EXPERIMENT_ID}`)
            .reply(200);
        await (0, chai_1.expect)((0, deleteExperiment_1.deleteExperiment)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, EXPERIMENT_ID)).to.eventually.equal(clc.bold(`Successfully deleted experiment ${clc.yellow(EXPERIMENT_ID)}`));
    });
    it("should throw FirebaseError if experiment is running", async () => {
        const errorMessage = `Experiment ${EXPERIMENT_ID} is currently running and cannot be deleted. If you want to delete this experiment, stop it at https://console.firebase.google.com/project/${PROJECT_ID}/config/experiment/results/${EXPERIMENT_ID}`;
        nock((0, api_1.remoteConfigApiOrigin)())
            .delete(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments/${EXPERIMENT_ID}`)
            .reply(400, {
            error: {
                message: errorMessage,
            },
        });
        await (0, chai_1.expect)((0, deleteExperiment_1.deleteExperiment)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, EXPERIMENT_ID)).to.be.rejectedWith(error_1.FirebaseError, errorMessage);
    });
    it("should throw FirebaseError if an internal error occurred", async () => {
        nock((0, api_1.remoteConfigApiOrigin)())
            .delete(`/v1/projects/${PROJECT_ID}/namespaces/${interfaces_1.NAMESPACE_FIREBASE}/experiments/${EXPERIMENT_ID}`)
            .reply(500, {
            error: {
                message: "Internal server error",
            },
        });
        await (0, chai_1.expect)((0, deleteExperiment_1.deleteExperiment)(PROJECT_ID, interfaces_1.NAMESPACE_FIREBASE, EXPERIMENT_ID)).to.be.rejectedWith(error_1.FirebaseError, `Failed to delete Remote Config experiment with ID ${EXPERIMENT_ID} for project ${PROJECT_ID}. Error: Request to https://firebaseremoteconfig.googleapis.com/v1/projects/12345679/namespaces/firebase/experiments/1 had HTTP Error: 500, Internal server error`);
    });
});
//# sourceMappingURL=deleteExperiment.spec.js.map