"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const artifactRegistry = require("./artifactregistry");
const api_1 = require("../api");
const api = require("../ensureApiEnabled");
const API_VERSION = "v1";
const PROJECT_ID = "test-project";
const REGION = "us-central1";
const REPO = "test-repo";
const REPO_NAME = `projects/${PROJECT_ID}/locations/${REGION}/repositories/${REPO}`;
describe("artifactRegistry", () => {
    afterEach(() => {
        nock.cleanAll();
    });
    describe("getRepository", () => {
        it("should resolve with a repository object on success", async () => {
            const repository = {
                name: REPO_NAME,
                format: "DOCKER",
                description: "test repo",
                createTime: "2022-01-01T00:00:00Z",
                updateTime: "2022-01-01T00:00:00Z",
            };
            nock((0, api_1.artifactRegistryDomain)()).get(`/${API_VERSION}/${REPO_NAME}`).reply(200, repository);
            const result = await artifactRegistry.getRepository(REPO_NAME);
            (0, chai_1.expect)(result).to.deep.equal(repository);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.artifactRegistryDomain)())
                .get(`/${API_VERSION}/${REPO_NAME}`)
                .reply(404, { error: { message: "Not Found" } });
            await (0, chai_1.expect)(artifactRegistry.getRepository(REPO_NAME)).to.be.rejectedWith("Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("deletePackage", () => {
        const PKG_NAME = `${REPO_NAME}/packages/test-pkg`;
        it("should resolve with an operation object on success", async () => {
            const operation = {
                name: `projects/${PROJECT_ID}/locations/${REGION}/operations/test-op`,
                done: true,
            };
            nock((0, api_1.artifactRegistryDomain)()).delete(`/${API_VERSION}/${PKG_NAME}`).reply(200, operation);
            const result = await artifactRegistry.deletePackage(PKG_NAME);
            (0, chai_1.expect)(result).to.deep.equal(operation);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.artifactRegistryDomain)())
                .delete(`/${API_VERSION}/${PKG_NAME}`)
                .reply(403, { error: { message: "Permission Denied" } });
            await (0, chai_1.expect)(artifactRegistry.deletePackage(PKG_NAME)).to.be.rejectedWith("Permission Denied");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateRepository", () => {
        it("should send a patch request with update mask if one is present", async () => {
            const repo = {
                name: REPO_NAME,
                labels: {
                    foo: "bar",
                },
            };
            const resultRepo = {
                ...repo,
                format: "DOCKER",
                description: "test repo",
                createTime: "2022-01-01T00:00:00Z",
                updateTime: "2022-01-01T00:00:00Z",
            };
            nock((0, api_1.artifactRegistryDomain)())
                .patch(`/${API_VERSION}/${REPO_NAME}?updateMask=name,labels`)
                .reply(200, resultRepo);
            const result = await artifactRegistry.updateRepository(repo);
            (0, chai_1.expect)(result).to.deep.equal(resultRepo);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should send a patch request if only name is present", async () => {
            const repo = {
                name: REPO_NAME,
            };
            const resultRepo = {
                ...repo,
                format: "DOCKER",
                description: "test repo",
                createTime: "2022-01-01T00:00:00Z",
                updateTime: "2022-01-01T00:00:00Z",
            };
            nock((0, api_1.artifactRegistryDomain)())
                .patch(`/${API_VERSION}/${REPO_NAME}?updateMask=name`)
                .reply(200, resultRepo);
            const result = await artifactRegistry.updateRepository(repo);
            (0, chai_1.expect)(result).to.deep.equal(resultRepo);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("ensureApiEnabled", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should call the ensure api", async () => {
            const ensureApiStub = sandbox.stub(api, "ensure").resolves();
            await artifactRegistry.ensureApiEnabled(PROJECT_ID);
            (0, chai_1.expect)(ensureApiStub).to.have.been.calledWith(PROJECT_ID, "https://artifactregistry.googleapis.com", "artifactregistry", true);
        });
    });
});
//# sourceMappingURL=artifactregistry.spec.js.map