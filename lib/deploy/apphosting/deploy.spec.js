"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const config_1 = require("../../config");
const gcs = require("../../gcp/storage");
const rc_1 = require("../../rc");
const deploy_1 = require("./deploy");
const util = require("./util");
const fs = require("fs");
const getProjectNumber = require("../../getProjectNumber");
const BASE_OPTS = {
    cwd: "/",
    configPath: "/",
    except: "",
    force: false,
    nonInteractive: false,
    debug: false,
    filteredTargets: [],
    rc: new rc_1.RC(),
};
function initializeContext() {
    return {
        backendConfigs: {
            foo: {
                backendId: "foo",
                rootDir: "/",
                ignore: [],
            },
            fooLocalBuild: {
                backendId: "fooLocalBuild",
                rootDir: "/",
                ignore: [],
                localBuild: true,
            },
        },
        backendLocations: { foo: "us-central1", fooLocalBuild: "us-central1" },
        backendStorageUris: {},
        backendLocalBuilds: {
            fooLocalBuild: {
                buildDir: "./nextjs/standalone",
                buildConfig: {},
                annotations: {},
            },
        },
    };
}
describe("apphosting", () => {
    let upsertBucketStub;
    let uploadObjectStub;
    let createArchiveStub;
    let createReadStreamStub;
    let getProjectNumberStub;
    beforeEach(() => {
        getProjectNumberStub = sinon
            .stub(getProjectNumber, "getProjectNumber")
            .throws("Unexpected getProjectNumber call");
        upsertBucketStub = sinon.stub(gcs, "upsertBucket").throws("Unexpected upsertBucket call");
        uploadObjectStub = sinon.stub(gcs, "uploadObject").throws("Unexpected uploadObject call");
        createArchiveStub = sinon.stub(util, "createArchive").throws("Unexpected createArchive call");
        createReadStreamStub = sinon
            .stub(fs, "createReadStream")
            .throws("Unexpected createReadStream call");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("deploy local source", () => {
        const opts = {
            ...BASE_OPTS,
            projectId: "my-project",
            only: "apphosting",
            config: new config_1.Config({
                apphosting: [
                    {
                        backendId: "foo",
                        rootDir: "/",
                        ignore: [],
                    },
                    {
                        backendId: "fooLocalBuild",
                        rootDir: "/",
                        ignore: [],
                        localBuild: true,
                    },
                ],
            }),
        };
        it("upserts regional GCS bucket", async () => {
            const context = initializeContext();
            const projectNumber = "000000000000";
            const location = "us-central1";
            const bucketName = `firebaseapphosting-sources-${projectNumber}-${location}`;
            getProjectNumberStub.resolves(projectNumber);
            upsertBucketStub.resolves(bucketName);
            createArchiveStub.onFirstCall().resolves("path/to/foo-1234.zip");
            createArchiveStub.onSecondCall().resolves("path/to/foo-local-build-1234.zip");
            uploadObjectStub.onFirstCall().resolves({
                bucket: bucketName,
                object: "foo-1234",
            });
            uploadObjectStub.onSecondCall().resolves({
                bucket: bucketName,
                object: "foo-local-build-1234",
            });
            createReadStreamStub.returns("stream");
            await (0, deploy_1.default)(context, opts);
            (0, chai_1.expect)(upsertBucketStub).to.be.calledWith({
                product: "apphosting",
                createMessage: `Creating Cloud Storage bucket in ${location} to store App Hosting source code uploads at ${bucketName}...`,
                projectId: "my-project",
                req: {
                    baseName: bucketName,
                    purposeLabel: `apphosting-source-${location}`,
                    location: location,
                    lifecycle: {
                        rule: [
                            {
                                action: { type: "Delete" },
                                condition: { age: 30 },
                            },
                        ],
                    },
                },
            });
            (0, chai_1.expect)(upsertBucketStub).to.be.calledWith({
                product: "apphosting",
                createMessage: "Creating Cloud Storage bucket in us-central1 to store App Hosting source code uploads at firebaseapphosting-sources-000000000000-us-central1...",
                projectId: "my-project",
                req: {
                    baseName: "firebaseapphosting-sources-000000000000-us-central1",
                    purposeLabel: `apphosting-source-${location}`,
                    location: "us-central1",
                    lifecycle: {
                        rule: [
                            {
                                action: { type: "Delete" },
                                condition: { age: 30 },
                            },
                        ],
                    },
                },
            });
            (0, chai_1.expect)(createArchiveStub).to.be.calledWithExactly(context.backendConfigs["fooLocalBuild"], process.cwd(), "./nextjs/standalone");
            (0, chai_1.expect)(uploadObjectStub).to.be.calledWithMatch(sinon.match.any, "firebaseapphosting-sources-000000000000-us-central1");
        });
        it("correctly creates and sets storage URIs", async () => {
            const context = initializeContext();
            const projectNumber = "000000000000";
            const location = "us-central1";
            const bucketName = `firebaseapphosting-sources-${projectNumber}-${location}`;
            getProjectNumberStub.resolves(projectNumber);
            upsertBucketStub.resolves(bucketName);
            createArchiveStub.onFirstCall().resolves("path/to/foo-1234.zip");
            createArchiveStub.onSecondCall().resolves("path/to/foo-local-build-1234.zip");
            uploadObjectStub.onFirstCall().resolves({
                bucket: bucketName,
                object: "foo-1234",
            });
            uploadObjectStub.onSecondCall().resolves({
                bucket: bucketName,
                object: "foo-local-build-1234",
            });
            createReadStreamStub.returns("stream");
            await (0, deploy_1.default)(context, opts);
            (0, chai_1.expect)(context.backendStorageUris["foo"]).to.equal(`gs://${bucketName}/foo-1234.zip`);
            (0, chai_1.expect)(context.backendStorageUris["fooLocalBuild"]).to.equal(`gs://${bucketName}/foo-local-build-1234.zip`);
        });
    });
});
//# sourceMappingURL=deploy.spec.js.map