"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const dataconnect = require("./dataconnect");
const projectNumber = "123456789";
const endpoint = {
    id: "endpoint",
    region: "us-central1",
    project: projectNumber,
    eventTrigger: {
        retry: false,
        eventType: "google.firebase.dataconnect.connector.v1.mutationExecuted",
        eventFilters: {},
        eventFilterPathPatterns: {},
    },
    entryPoint: "endpoint",
    platform: "gcfv2",
    runtime: "nodejs16",
};
describe("ensureDatabaseTriggerRegion", () => {
    it("should set the trigger location to the function region", async () => {
        const ep = { ...endpoint };
        await dataconnect.ensureDataConnectTriggerRegion(ep);
        (0, chai_1.expect)(ep.eventTrigger.region).to.eq("us-central1");
    });
    it("should not error if the trigger location is already set correctly", async () => {
        const ep = { ...endpoint };
        ep.eventTrigger.region = "us-central1";
        await dataconnect.ensureDataConnectTriggerRegion(ep);
        (0, chai_1.expect)(ep.eventTrigger.region).to.eq("us-central1");
    });
    it("should error if the trigger location is set incorrectly", () => {
        const ep = { ...endpoint };
        ep.eventTrigger.region = "us-west1";
        (0, chai_1.expect)(() => dataconnect.ensureDataConnectTriggerRegion(ep)).to.throw("The Firebase Data Connect trigger location must match the function region.");
    });
});
describe("getDataConnectP4SA", () => {
    let originalEnv;
    beforeEach(() => {
        originalEnv = { ...process.env };
    });
    afterEach(() => {
        process.env = originalEnv;
    });
    it("should return the correct service account for autopush", async () => {
        process.env.FIREBASE_DATACONNECT_URL =
            "https://autopush-firebasedataconnect.sandbox.googleapis.com";
        const p4sa = dataconnect.getDataConnectP4SA(projectNumber);
        (0, chai_1.expect)(p4sa).to.equal(`service-${projectNumber}@gcp-sa-autopush-dataconnect.iam.gserviceaccount.com`);
    });
    it("should return the correct service account for staging", async () => {
        process.env.FIREBASE_DATACONNECT_URL =
            "https://staging-firebasedataconnect.sandbox.googleapis.com";
        const p4sa = dataconnect.getDataConnectP4SA(projectNumber);
        (0, chai_1.expect)(p4sa).to.equal(`service-${projectNumber}@gcp-sa-staging-dataconnect.iam.gserviceaccount.com`);
    });
    it("should return the correct service account for prod", async () => {
        const p4sa = dataconnect.getDataConnectP4SA(projectNumber);
        (0, chai_1.expect)(p4sa).to.equal(`service-${projectNumber}@gcp-sa-firebasedataconnect.iam.gserviceaccount.com`);
    });
});
//# sourceMappingURL=dataconnect.spec.js.map