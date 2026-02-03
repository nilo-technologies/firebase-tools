"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const backend = require("./backend");
const deploy = require("./deploy");
const gcs = require("../../gcp/storage");
const gcfv2 = require("../../gcp/cloudfunctionsv2");
const experiments = require("../../experiments");
describe("deploy", () => {
    const ENDPOINT_BASE = {
        platform: "gcfv2",
        id: "id",
        region: "region",
        project: "project",
        entryPoint: "entry",
        runtime: "nodejs16",
    };
    const ENDPOINT = {
        ...ENDPOINT_BASE,
        httpsTrigger: {},
    };
    const CONTEXT = {
        projectId: "project",
    };
    describe("shouldUploadBeSkipped", () => {
        let endpoint1InWantBackend;
        let endpoint2InWantBackend;
        let endpoint1InHaveBackend;
        let endpoint2InHaveBackend;
        let wantBackend;
        let haveBackend;
        beforeEach(() => {
            endpoint1InWantBackend = {
                ...ENDPOINT,
                id: "endpoint1",
                platform: "gcfv1",
                codebase: "backend1",
            };
            endpoint2InWantBackend = {
                ...ENDPOINT,
                id: "endpoint2",
                platform: "gcfv1",
                codebase: "backend1",
            };
            endpoint1InHaveBackend = {
                ...ENDPOINT,
                id: "endpoint1",
                platform: "gcfv2",
                codebase: "backend2",
            };
            endpoint2InHaveBackend = {
                ...ENDPOINT,
                id: "endpoint2",
                platform: "gcfv2",
                codebase: "backend2",
            };
            wantBackend = backend.of(endpoint1InWantBackend, endpoint2InWantBackend);
            haveBackend = backend.of(endpoint1InHaveBackend, endpoint2InHaveBackend);
        });
        it("should skip if all endpoints are identical and ACTIVE", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            endpoint1InHaveBackend.state = "ACTIVE";
            endpoint2InHaveBackend.state = "ACTIVE";
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.true;
        });
        it("should not skip if hashes don't match", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = "No_match";
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should not skip if haveBackend is missing", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            wantBackend = backend.of(endpoint1InWantBackend, endpoint2InWantBackend);
            haveBackend = backend.of(endpoint1InHaveBackend);
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should not skip if wantBackend is missing", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            wantBackend = backend.of(endpoint1InWantBackend);
            haveBackend = backend.of(endpoint1InHaveBackend, endpoint2InHaveBackend);
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should not skip if endpoint filter is specified", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            const result = deploy.shouldUploadBeSkipped({ ...CONTEXT, filters: [{ idChunks: ["foobar"] }] }, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should not skip if state is not ACTIVE", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            endpoint1InHaveBackend.state = "ACTIVE";
            endpoint2InHaveBackend.state = "FAILED";
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
    });
    describe("uploadSourceV2", () => {
        let gcsUploadStub;
        let gcsUpsertBucketStub;
        let gcfv2GenerateUploadUrlStub;
        let createReadStreamStub;
        let experimentEnabled;
        const SOURCE = {
            functionsSourceV2: "source.zip",
            functionsSourceV2Hash: "source-hash",
        };
        before(() => {
            experimentEnabled = experiments.isEnabled("runfunctions");
        });
        after(() => experiments.setEnabled("runfunctions", experimentEnabled));
        beforeEach(() => {
            gcsUploadStub = sinon.stub(gcs, "upload").resolves({ generation: "1" });
            gcsUpsertBucketStub = sinon.stub(gcs, "upsertBucket");
            gcfv2GenerateUploadUrlStub = sinon.stub(gcfv2, "generateUploadUrl").resolves({
                uploadUrl: "https://storage.googleapis.com/upload/url",
                storageSource: {
                    bucket: "gcf-sources-123-us-central1",
                    object: "source-hash.zip",
                },
            });
            createReadStreamStub = sinon.stub(deploy, "createReadStream").returns("stream");
        });
        afterEach(() => {
            sinon.restore();
        });
        describe("with runfunctions experiment enabled", () => {
            const PROJECT_NUMBER = "123456";
            const BUCKET_NAME = `firebase-functions-src-${PROJECT_NUMBER}`;
            before(() => experiments.setEnabled("runfunctions", true));
            it("should call gcs.upsertBucket and gcs.upload for gcfv2 functions", async () => {
                const wantBackend = backend.of({ ...ENDPOINT, platform: "gcfv2" });
                gcsUpsertBucketStub.resolves(BUCKET_NAME);
                await deploy.uploadSourceV2("project", PROJECT_NUMBER, SOURCE, wantBackend);
                (0, chai_1.expect)(gcsUpsertBucketStub).to.be.calledOnceWith({
                    product: "functions",
                    projectId: "project",
                    createMessage: `Creating Cloud Storage bucket in region to store Functions source code uploads at ${BUCKET_NAME}...`,
                    req: {
                        baseName: BUCKET_NAME,
                        location: "region",
                        purposeLabel: "functions-source-region",
                        lifecycle: { rule: [{ action: { type: "Delete" }, condition: { age: 1 } }] },
                    },
                });
                (0, chai_1.expect)(createReadStreamStub).to.be.calledOnceWith("source.zip");
                (0, chai_1.expect)(gcsUploadStub).to.be.calledOnceWith({ file: "source.zip", stream: "stream" }, `${BUCKET_NAME}/source-hash.zip`, undefined, true);
                (0, chai_1.expect)(gcfv2GenerateUploadUrlStub).not.to.be.called;
            });
            it("should call gcs.upsertBucket and gcs.upload for run functions", async () => {
                const wantBackend = backend.of({ ...ENDPOINT, platform: "run" });
                gcsUpsertBucketStub.resolves(BUCKET_NAME);
                await deploy.uploadSourceV2("project", PROJECT_NUMBER, SOURCE, wantBackend);
                (0, chai_1.expect)(gcsUpsertBucketStub).to.be.calledOnceWith({
                    product: "functions",
                    projectId: "project",
                    createMessage: `Creating Cloud Storage bucket in region to store Functions source code uploads at ${BUCKET_NAME}...`,
                    req: {
                        baseName: BUCKET_NAME,
                        location: "region",
                        purposeLabel: "functions-source-region",
                        lifecycle: { rule: [{ action: { type: "Delete" }, condition: { age: 1 } }] },
                    },
                });
                (0, chai_1.expect)(createReadStreamStub).to.be.calledOnceWith("source.zip");
                (0, chai_1.expect)(gcsUploadStub).to.be.calledOnceWith({ file: "source.zip", stream: "stream" }, `${BUCKET_NAME}/source-hash.zip`, undefined, true);
                (0, chai_1.expect)(gcfv2GenerateUploadUrlStub).not.to.be.called;
            });
        });
        context("with runfunctions experiment disabled", () => {
            before(() => experiments.setEnabled("runfunctions", false));
            it("should call gcfv2.generateUploadUrl and gcs.upload", async () => {
                const wantBackend = backend.of({ ...ENDPOINT, platform: "gcfv2" });
                await deploy.uploadSourceV2("project", "123456", SOURCE, wantBackend);
                (0, chai_1.expect)(gcfv2GenerateUploadUrlStub).to.be.calledOnceWith("project", "region");
                (0, chai_1.expect)(createReadStreamStub).to.be.calledOnceWith("source.zip");
                (0, chai_1.expect)(gcsUploadStub).to.be.calledOnceWith({ file: "source.zip", stream: "stream" }, "https://storage.googleapis.com/upload/url", undefined, true);
                (0, chai_1.expect)(gcsUpsertBucketStub).not.to.be.called;
            });
        });
    });
});
//# sourceMappingURL=deploy.spec.js.map