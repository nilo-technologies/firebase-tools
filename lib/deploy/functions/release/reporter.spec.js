"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const logger_1 = require("../../../logger");
const reporter = require("./reporter");
const track = require("../../../track");
const events = require("../../../functions/events");
const ENDPOINT_BASE = {
    platform: "gcfv1",
    id: "id",
    region: "region",
    project: "project",
    entryPoint: "id",
    runtime: "nodejs16",
};
const ENDPOINT = { ...ENDPOINT_BASE, httpsTrigger: {} };
describe("reporter", () => {
    describe("triggerTag", () => {
        it("detects v1.https", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                httpsTrigger: {},
            })).to.equal("v1.https");
        });
        it("detects v2.https", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                platform: "gcfv2",
                httpsTrigger: {},
            })).to.equal("v2.https");
        });
        it("detects v1.callable", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                httpsTrigger: {},
                labels: {
                    "deployment-callable": "true",
                },
            })).to.equal("v1.callable");
        });
        it("detects v2.callable", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                platform: "gcfv2",
                httpsTrigger: {},
                labels: {
                    "deployment-callable": "true",
                },
            })).to.equal("v2.callable");
        });
        it("detects v1.scheduled", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                scheduleTrigger: {},
            })).to.equal("v1.scheduled");
        });
        it("detects v2.scheduled", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                platform: "gcfv2",
                scheduleTrigger: {},
            })).to.equal("v2.scheduled");
        });
        it("detects v1.blocking", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                blockingTrigger: { eventType: events.v1.BEFORE_CREATE_EVENT },
            })).to.equal("v1.blocking");
        });
        it("detects v2.blocking", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                platform: "gcfv2",
                blockingTrigger: { eventType: events.v1.BEFORE_CREATE_EVENT },
            })).to.equal("v2.blocking");
        });
        it("detects others", () => {
            (0, chai_1.expect)(reporter.triggerTag({
                ...ENDPOINT_BASE,
                platform: "gcfv2",
                eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    eventFilters: {},
                    retry: false,
                },
            })).to.equal("google.pubsub.topic.publish");
        });
    });
    describe("logAndTrackDeployStats", () => {
        let trackGA4Stub;
        let debugStub;
        beforeEach(() => {
            trackGA4Stub = sinon.stub(track, "trackGA4");
            debugStub = sinon.stub(logger_1.logger, "debug");
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("tracks global summaries", async () => {
            const summary = {
                totalTime: 2000,
                results: [
                    {
                        endpoint: { ...ENDPOINT, codebase: "codebase0" },
                        durationMs: 2000,
                    },
                    {
                        endpoint: { ...ENDPOINT, codebase: "codebase1" },
                        durationMs: 1000,
                        error: new reporter.DeploymentError({ ...ENDPOINT, codebase: "codebase1" }, "update", undefined),
                    },
                    {
                        endpoint: { ...ENDPOINT, codebase: "codebase1" },
                        durationMs: 0,
                        error: new reporter.AbortedDeploymentError({ ...ENDPOINT, codebase: "codebase1" }),
                    },
                ],
            };
            const context = {
                projectId: "id",
                codebaseDeployEvents: {
                    codebase0: {
                        params: "none",
                        fn_deploy_num_successes: 0,
                        fn_deploy_num_canceled: 0,
                        fn_deploy_num_failures: 0,
                        fn_deploy_num_skipped: 0,
                    },
                    codebase1: {
                        params: "none",
                        fn_deploy_num_successes: 0,
                        fn_deploy_num_canceled: 0,
                        fn_deploy_num_failures: 0,
                        fn_deploy_num_skipped: 0,
                    },
                },
            };
            await reporter.logAndTrackDeployStats(summary, context);
            (0, chai_1.expect)(trackGA4Stub).to.have.been.calledWith("function_deploy", {
                platform: "gcfv1",
                trigger_type: "https",
                region: "region",
                runtime: "nodejs16",
                status: "success",
                duration: 2000,
            });
            (0, chai_1.expect)(trackGA4Stub).to.have.been.calledWith("function_deploy", {
                platform: "gcfv1",
                trigger_type: "https",
                region: "region",
                runtime: "nodejs16",
                status: "failure",
                duration: 1000,
            });
            (0, chai_1.expect)(trackGA4Stub).to.have.been.calledWith("function_deploy", {
                platform: "gcfv1",
                trigger_type: "https",
                region: "region",
                runtime: "nodejs16",
                status: "aborted",
                duration: 0,
            });
            (0, chai_1.expect)(trackGA4Stub).to.have.been.calledWith("codebase_deploy", {
                params: "none",
                fn_deploy_num_successes: 1,
                fn_deploy_num_canceled: 0,
                fn_deploy_num_failures: 0,
                fn_deploy_num_skipped: 0,
            });
            (0, chai_1.expect)(trackGA4Stub).to.have.been.calledWith("codebase_deploy", {
                params: "none",
                fn_deploy_num_successes: 0,
                fn_deploy_num_canceled: 1,
                fn_deploy_num_failures: 1,
                fn_deploy_num_skipped: 0,
            });
            (0, chai_1.expect)(trackGA4Stub).to.have.been.calledWith("function_deploy_group", {
                codebase_deploy_count: "2",
                fn_deploy_num_successes: 1,
                fn_deploy_num_canceled: 1,
                fn_deploy_num_failures: 1,
                has_runtime_config: "false",
            });
            (0, chai_1.expect)(debugStub).to.have.been.calledWith("Average Function Deployment time: 1500");
        });
    });
    describe("printErrors", () => {
        let infoStub;
        beforeEach(() => {
            infoStub = sinon.stub(logger_1.logger, "info");
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("does nothing if there are no errors", () => {
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: ENDPOINT,
                        durationMs: 1000,
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.not.have.been.called;
        });
        it("only prints summaries for non-aborted errors", () => {
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: { ...ENDPOINT, id: "failedCreate" },
                        durationMs: 1000,
                        error: new reporter.DeploymentError(ENDPOINT, "create", undefined),
                    },
                    {
                        endpoint: { ...ENDPOINT, id: "abortedDelete" },
                        durationMs: 0,
                        error: new reporter.AbortedDeploymentError(ENDPOINT),
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch(/Functions deploy had errors.*failedCreate/s);
            (0, chai_1.expect)(infoStub).to.not.have.been.calledWithMatch(/Functions deploy had errors.*abortedDelete/s);
        });
        it("prints IAM errors", () => {
            const explicit = {
                ...ENDPOINT,
                httpsTrigger: {
                    invoker: ["public"],
                },
            };
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: explicit,
                        durationMs: 1000,
                        error: new reporter.DeploymentError(explicit, "set invoker", undefined),
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch("Unable to set the invoker for the IAM policy");
            (0, chai_1.expect)(infoStub).to.not.have.been.calledWithMatch("One or more functions were being implicitly made publicly available");
            infoStub.resetHistory();
            summary.results[0].endpoint = ENDPOINT;
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch("Unable to set the invoker for the IAM policy");
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch("One or more functions were being implicitly made publicly available");
        });
        it("prints quota errors", () => {
            const rawError = new Error("Quota exceeded");
            rawError.status = 429;
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: ENDPOINT,
                        durationMs: 1000,
                        error: new reporter.DeploymentError(ENDPOINT, "create", rawError),
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch("Exceeded maximum retries while deploying functions.");
        });
        it("prints aborted errors", () => {
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: { ...ENDPOINT, id: "failedCreate" },
                        durationMs: 1000,
                        error: new reporter.DeploymentError(ENDPOINT, "create", undefined),
                    },
                    {
                        endpoint: { ...ENDPOINT, id: "abortedDelete" },
                        durationMs: 1000,
                        error: new reporter.AbortedDeploymentError(ENDPOINT),
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch(/the following functions were not deleted.*abortedDelete/s);
            (0, chai_1.expect)(infoStub).to.not.have.been.calledWith(/the following functions were not deleted.*failedCreate/s);
        });
    });
});
//# sourceMappingURL=reporter.spec.js.map