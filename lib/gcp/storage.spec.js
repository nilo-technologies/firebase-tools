"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const storage = require("./storage");
const utils = require("../utils");
const error_1 = require("../error");
describe("storage", () => {
    describe("upsertBucket", () => {
        let listBucketsStub;
        let createBucketStub;
        let patchBucketStub;
        let logLabeledBulletStub;
        let logLabeledWarningStub;
        let randomStringStub;
        const PROJECT_ID = "test-project";
        const BUCKET_LIFECYCLE = { rule: [{ action: { type: "Delete" }, condition: { age: 30 } }] };
        const BASE_BUCKET_NAME = "test-bucket";
        const PURPOSE_LABEL = "test-purpose";
        beforeEach(() => {
            listBucketsStub = sinon.stub(storage, "listBuckets");
            createBucketStub = sinon.stub(storage, "createBucket");
            patchBucketStub = sinon.stub(storage, "patchBucket");
            logLabeledBulletStub = sinon.stub(utils, "logLabeledBullet");
            logLabeledWarningStub = sinon.stub(utils, "logLabeledWarning");
            randomStringStub = sinon.stub(storage, "randomString").returns("abcdef");
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should return existing bucket name if a bucket with the purpose label is found", async () => {
            const bucketName = "existing-bucket";
            listBucketsStub.resolves([
                { name: bucketName, labels: { [PURPOSE_LABEL]: "true" } },
                { name: "another-bucket", labels: {} },
            ]);
            const result = await storage.upsertBucket({
                product: "test",
                createMessage: "Creating bucket",
                projectId: PROJECT_ID,
                req: {
                    baseName: BASE_BUCKET_NAME,
                    location: "us-central1",
                    purposeLabel: PURPOSE_LABEL,
                    lifecycle: BUCKET_LIFECYCLE,
                },
            });
            (0, chai_1.expect)(result).to.equal(bucketName);
            (0, chai_1.expect)(listBucketsStub).to.be.calledOnceWith(PROJECT_ID);
            (0, chai_1.expect)(createBucketStub).to.not.be.called;
        });
        it("should patch an existing bucket if it does not have a purpose label", async () => {
            const bucketName = "existing-unmanaged-bucket";
            listBucketsStub.resolves([{ name: bucketName, labels: {} }]);
            const result = await storage.upsertBucket({
                product: "test",
                createMessage: "Creating bucket",
                projectId: PROJECT_ID,
                req: {
                    baseName: bucketName,
                    location: "us-central1",
                    purposeLabel: PURPOSE_LABEL,
                    lifecycle: BUCKET_LIFECYCLE,
                },
            });
            (0, chai_1.expect)(result).to.equal(bucketName);
            (0, chai_1.expect)(listBucketsStub).to.be.calledOnceWith(PROJECT_ID);
            (0, chai_1.expect)(patchBucketStub).to.be.calledOnceWith(bucketName, {
                labels: { [PURPOSE_LABEL]: "true" },
            });
            (0, chai_1.expect)(createBucketStub).to.not.be.called;
        });
        it("should create a new bucket if no bucket with the purpose label is found", async () => {
            listBucketsStub.resolves([{ name: "another-bucket", labels: {} }]);
            createBucketStub.resolves({ name: BASE_BUCKET_NAME });
            const result = await storage.upsertBucket({
                product: "test",
                createMessage: "Creating bucket",
                projectId: PROJECT_ID,
                req: {
                    baseName: BASE_BUCKET_NAME,
                    location: "us-central1",
                    purposeLabel: PURPOSE_LABEL,
                    lifecycle: BUCKET_LIFECYCLE,
                },
            });
            (0, chai_1.expect)(result).to.equal(BASE_BUCKET_NAME);
            (0, chai_1.expect)(listBucketsStub).to.be.calledOnceWith(PROJECT_ID);
            (0, chai_1.expect)(createBucketStub).to.be.calledOnceWith(PROJECT_ID, {
                name: BASE_BUCKET_NAME,
                location: "us-central1",
                lifecycle: BUCKET_LIFECYCLE,
                labels: { [PURPOSE_LABEL]: "true" },
            }, true);
            (0, chai_1.expect)(logLabeledBulletStub).to.be.calledOnce;
        });
        it("should handle listBuckets failure", async () => {
            const error = new error_1.FirebaseError("Failed to list buckets");
            listBucketsStub.rejects(error);
            await (0, chai_1.expect)(storage.upsertBucket({
                product: "test",
                createMessage: "Creating bucket",
                projectId: PROJECT_ID,
                req: {
                    baseName: BASE_BUCKET_NAME,
                    location: "us-central1",
                    purposeLabel: PURPOSE_LABEL,
                    lifecycle: BUCKET_LIFECYCLE,
                },
            })).to.be.rejectedWith(error);
            (0, chai_1.expect)(listBucketsStub).to.be.calledOnceWith(PROJECT_ID);
            (0, chai_1.expect)(createBucketStub).to.not.be.called;
        });
        it("should retry with a new name on createBucket conflict", async () => {
            const conflictError = new error_1.FirebaseError("Conflict", { original: { status: 409 } });
            const randomSuffix = "abcdef";
            const newBucketName = `${BASE_BUCKET_NAME}-${randomSuffix}`;
            listBucketsStub.resolves([]);
            createBucketStub.onFirstCall().rejects(conflictError);
            createBucketStub.onSecondCall().resolves({ name: newBucketName });
            const result = await storage.upsertBucket({
                product: "test",
                createMessage: "Creating bucket",
                projectId: PROJECT_ID,
                req: {
                    baseName: BASE_BUCKET_NAME,
                    location: "us-central1",
                    purposeLabel: PURPOSE_LABEL,
                    lifecycle: BUCKET_LIFECYCLE,
                },
            });
            (0, chai_1.expect)(result).to.equal(newBucketName);
            (0, chai_1.expect)(createBucketStub).to.be.calledTwice;
            (0, chai_1.expect)(createBucketStub.firstCall.args[1].name).to.equal(BASE_BUCKET_NAME);
            (0, chai_1.expect)(createBucketStub.secondCall.args[1].name).to.equal(newBucketName);
            (0, chai_1.expect)(randomStringStub).to.be.calledOnceWith(6);
        });
        it("should error out after 5 createBucket conflicts", async () => {
            const conflictError = new error_1.FirebaseError("Conflict", { original: { status: 409 } });
            listBucketsStub.resolves([]);
            createBucketStub.rejects(conflictError);
            await (0, chai_1.expect)(storage.upsertBucket({
                product: "test",
                createMessage: "Creating bucket",
                projectId: PROJECT_ID,
                req: {
                    baseName: BASE_BUCKET_NAME,
                    location: "us-central1",
                    purposeLabel: PURPOSE_LABEL,
                    lifecycle: BUCKET_LIFECYCLE,
                },
            })).to.be.rejectedWith("Failed to create a unique Cloud Storage bucket name after 5 attempts.");
            (0, chai_1.expect)(createBucketStub.callCount).to.equal(5);
        });
        it("should handle permission errors on createBucket", async () => {
            const permError = new error_1.FirebaseError("Permission denied", {
                original: { status: 403 },
            });
            listBucketsStub.resolves([]);
            createBucketStub.rejects(permError);
            await (0, chai_1.expect)(storage.upsertBucket({
                product: "test",
                createMessage: "Creating bucket",
                projectId: PROJECT_ID,
                req: {
                    baseName: BASE_BUCKET_NAME,
                    location: "us-central1",
                    purposeLabel: PURPOSE_LABEL,
                    lifecycle: BUCKET_LIFECYCLE,
                },
            })).to.be.rejectedWith(permError);
            (0, chai_1.expect)(logLabeledWarningStub).to.be.calledOnce;
            (0, chai_1.expect)(createBucketStub).to.be.calledOnce;
        });
        it("should forward unexpected errors from createBucket", async () => {
            const unexpectedError = new error_1.FirebaseError("Unexpected error", {
                original: { status: 500 },
            });
            listBucketsStub.resolves([]);
            createBucketStub.rejects(unexpectedError);
            await (0, chai_1.expect)(storage.upsertBucket({
                product: "test",
                createMessage: "Creating bucket",
                projectId: PROJECT_ID,
                req: {
                    baseName: BASE_BUCKET_NAME,
                    location: "us-central1",
                    purposeLabel: PURPOSE_LABEL,
                    lifecycle: BUCKET_LIFECYCLE,
                },
            })).to.be.rejectedWith(unexpectedError);
            (0, chai_1.expect)(logLabeledWarningStub).to.not.be.called;
            (0, chai_1.expect)(createBucketStub).to.be.calledOnce;
        });
    });
});
//# sourceMappingURL=storage.spec.js.map