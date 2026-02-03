"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fetch_logs_1 = require("./fetch_logs");
const apphosting = require("../../../gcp/apphosting");
const run = require("../../../gcp/run");
const cloudlogging = require("../../../gcp/cloudlogging");
const error_1 = require("../../../error");
const util_1 = require("../../util");
describe("fetch_logs tool", () => {
    const projectId = "test-project";
    const location = "us-central1";
    const backendId = "test-backend";
    let getBackendStub;
    let getTrafficStub;
    let listBuildsStub;
    let fetchServiceLogsStub;
    let listEntriesStub;
    beforeEach(() => {
        getBackendStub = sinon.stub(apphosting, "getBackend");
        getTrafficStub = sinon.stub(apphosting, "getTraffic");
        listBuildsStub = sinon.stub(apphosting, "listBuilds");
        fetchServiceLogsStub = sinon.stub(run, "fetchServiceLogs");
        listEntriesStub = sinon.stub(cloudlogging, "listEntries");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should return message if backendId is not specified", async () => {
        const result = await fetch_logs_1.fetch_logs.fn({}, { projectId });
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)("backendId must be specified."));
    });
    context("when buildLogs is false", () => {
        it("should fetch service logs successfully", async () => {
            const backend = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}`,
                managedResources: [
                    {
                        runService: {
                            service: `projects/${projectId}/locations/${location}/services/service-id`,
                        },
                    },
                ],
            };
            const traffic = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}/traffic`,
            };
            const logs = ["log entry 1", "log entry 2"];
            getBackendStub.resolves(backend);
            getTrafficStub.resolves(traffic);
            fetchServiceLogsStub.resolves(logs);
            const result = await fetch_logs_1.fetch_logs.fn({ backendId, location }, { projectId });
            (0, chai_1.expect)(getBackendStub).to.be.calledWith(projectId, location, backendId);
            (0, chai_1.expect)(getTrafficStub).to.be.calledWith(projectId, location, backendId);
            (0, chai_1.expect)(fetchServiceLogsStub).to.be.calledWith(projectId, "service-id");
            (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(logs));
        });
        it("should throw FirebaseError if service name cannot be determined", async () => {
            const backend = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}`,
                managedResources: [],
            };
            const traffic = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}/traffic`,
            };
            getBackendStub.resolves(backend);
            getTrafficStub.resolves(traffic);
            await (0, chai_1.expect)(fetch_logs_1.fetch_logs.fn({ backendId, location }, { projectId })).to.be.rejectedWith(error_1.FirebaseError, "Unable to get service name from managedResources.");
        });
    });
    context("when buildLogs is true", () => {
        const buildLogsUri = `https://console.cloud.google.com/build/region=${location}/12345`;
        const build = { createTime: new Date().toISOString(), buildLogsUri };
        const builds = { builds: [build] };
        it("should fetch build logs successfully", async () => {
            const backend = { name: `projects/${projectId}/locations/${location}/backends/${backendId}` };
            const traffic = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}/traffic`,
            };
            const logEntries = [{ textPayload: "build log 1" }];
            getBackendStub.resolves(backend);
            getTrafficStub.resolves(traffic);
            listBuildsStub.resolves(builds);
            listEntriesStub.resolves({ entries: logEntries });
            const result = await fetch_logs_1.fetch_logs.fn({ buildLogs: true, backendId, location }, {
                projectId,
            });
            (0, chai_1.expect)(listBuildsStub).to.be.calledWith(projectId, location, backendId);
            (0, chai_1.expect)(listEntriesStub).to.be.calledOnce;
            (0, chai_1.expect)(listEntriesStub.args[0][1]).to.include('resource.labels.build_id="12345"');
            (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(logEntries));
        });
        it("should return 'No logs found.' if no build logs are available", async () => {
            const backend = { name: `projects/${projectId}/locations/${location}/backends/${backendId}` };
            const traffic = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}/traffic`,
            };
            getBackendStub.resolves(backend);
            getTrafficStub.resolves(traffic);
            listBuildsStub.resolves(builds);
            listEntriesStub.resolves({ entries: [] });
            const result = await fetch_logs_1.fetch_logs.fn({ buildLogs: true, backendId, location }, {
                projectId,
            });
            (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)("No logs found."));
        });
        it("should throw FirebaseError if build ID cannot be determined from buildLogsUri", async () => {
            const buildWithInvalidUri = {
                createTime: new Date().toISOString(),
                buildLogsUri: "invalid-uri",
            };
            const buildsWithInvalidUri = { builds: [buildWithInvalidUri] };
            const backend = { name: `projects/${projectId}/locations/${location}/backends/${backendId}` };
            const traffic = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}/traffic`,
            };
            getBackendStub.resolves(backend);
            getTrafficStub.resolves(traffic);
            listBuildsStub.resolves(buildsWithInvalidUri);
            await (0, chai_1.expect)(fetch_logs_1.fetch_logs.fn({ buildLogs: true, backendId, location }, { projectId })).to.be.rejectedWith(error_1.FirebaseError, "Unable to determine the build ID.");
        });
    });
});
//# sourceMappingURL=fetch_logs.spec.js.map