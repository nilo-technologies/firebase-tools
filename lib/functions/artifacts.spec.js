"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const artifactregistry = require("../gcp/artifactregistry");
const artifacts = require("./artifacts");
describe("functions artifacts", () => {
    describe("makeRepoPath", () => {
        it("should construct a valid repo path", () => {
            const path = artifacts.makeRepoPath("my-project", "us-central1");
            (0, chai_1.expect)(path).to.equal("projects/my-project/locations/us-central1/repositories/gcf-artifacts");
        });
    });
    describe("findExistingPolicy", () => {
        it("should return undefined if repository has no cleanup policies", () => {
            const repo = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                format: "DOCKER",
                description: "Cloud Functions container artifacts",
                createTime: "",
                updateTime: "",
            };
            const policy = artifacts.findExistingPolicy(repo);
            (0, chai_1.expect)(policy).to.be.undefined;
        });
        it("should return undefined if policy doesn't exist", () => {
            const repo = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                format: "DOCKER",
                description: "Cloud Functions container artifacts",
                createTime: "",
                updateTime: "",
                cleanupPolicies: {
                    "other-policy": {
                        id: "other-policy",
                        action: "DELETE",
                        condition: {
                            tagState: "ANY",
                            olderThan: `${5 * 60 * 60 * 24}s`,
                        },
                    },
                },
            };
            const policy = artifacts.findExistingPolicy(repo);
            (0, chai_1.expect)(policy).to.be.undefined;
        });
        it("should return the policy if it exists", () => {
            const expectedPolicy = {
                id: artifacts.CLEANUP_POLICY_ID,
                action: "DELETE",
                condition: {
                    tagState: "ANY",
                    olderThan: `${5 * 60 * 60 * 24}s`,
                },
            };
            const repo = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                format: "DOCKER",
                description: "Cloud Functions container artifacts",
                createTime: "",
                updateTime: "",
                cleanupPolicies: {
                    [artifacts.CLEANUP_POLICY_ID]: expectedPolicy,
                },
            };
            const policy = artifacts.findExistingPolicy(repo);
            (0, chai_1.expect)(policy).to.deep.equal(expectedPolicy);
        });
    });
    describe("daysToSeconds", () => {
        it("should convert days to seconds with 's' suffix", () => {
            (0, chai_1.expect)(artifacts.daysToSeconds(1)).to.equal("86400s");
            (0, chai_1.expect)(artifacts.daysToSeconds(5)).to.equal("432000s");
            (0, chai_1.expect)(artifacts.daysToSeconds(30)).to.equal("2592000s");
        });
    });
    describe("parseDaysFromPolicy", () => {
        it("should correctly parse seconds into days", () => {
            (0, chai_1.expect)(artifacts.parseDaysFromPolicy("86400s")).to.equal(1);
            (0, chai_1.expect)(artifacts.parseDaysFromPolicy("432000s")).to.equal(5);
            (0, chai_1.expect)(artifacts.parseDaysFromPolicy("2592000s")).to.equal(30);
        });
        it("should return undefined for invalid formats", () => {
            (0, chai_1.expect)(artifacts.parseDaysFromPolicy("5d")).to.be.undefined;
            (0, chai_1.expect)(artifacts.parseDaysFromPolicy("invalid")).to.be.undefined;
            (0, chai_1.expect)(artifacts.parseDaysFromPolicy("")).to.be.undefined;
        });
    });
    describe("generateCleanupPolicy", () => {
        it("should generate a valid cleanup policy with the correct days", () => {
            const policy = artifacts.generateCleanupPolicy(7);
            (0, chai_1.expect)(policy).to.have.property(artifacts.CLEANUP_POLICY_ID);
            (0, chai_1.expect)(policy[artifacts.CLEANUP_POLICY_ID].id).to.equal(artifacts.CLEANUP_POLICY_ID);
            (0, chai_1.expect)(policy[artifacts.CLEANUP_POLICY_ID].action).to.equal("DELETE");
            (0, chai_1.expect)(policy[artifacts.CLEANUP_POLICY_ID].condition).to.deep.include({
                tagState: "ANY",
                olderThan: `${7 * 60 * 60 * 24}s`,
            });
        });
    });
    describe("updateRepository", () => {
        let sandbox;
        let updateRepositoryStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            updateRepositoryStub = sandbox.stub(artifactregistry, "updateRepository").resolves();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should call artifactregistry.updateRepository with the correct parameters", async () => {
            const repoUpdate = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                labels: { key: "value" },
            };
            await artifacts.updateRepository(repoUpdate);
            (0, chai_1.expect)(updateRepositoryStub).to.have.been.calledOnceWith(repoUpdate);
        });
        it("should handle 403 errors with a descriptive error message", async () => {
            const error = new Error("Permission denied");
            Object.assign(error, { status: 403 });
            updateRepositoryStub.rejects(error);
            const repoUpdate = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
            };
            try {
                await artifacts.updateRepository(repoUpdate);
                chai_1.expect.fail("Should have thrown an error");
            }
            catch (err) {
                (0, chai_1.expect)(err.message).to.include("You don't have permission to update this repository");
                (0, chai_1.expect)(err.message).to.include("Artifact Registry Administrator");
                (0, chai_1.expect)(err.exit).to.equal(1);
            }
        });
    });
    describe("optOutRepository", () => {
        let sandbox;
        let updateRepositoryStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            updateRepositoryStub = sandbox.stub(artifacts, "updateRepository").resolves();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should delete an existing cleanup policy and add the opt-out label", async () => {
            const repository = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                format: "DOCKER",
                description: "Cloud Functions container artifacts",
                createTime: "",
                updateTime: "",
                cleanupPolicies: {
                    [artifacts.CLEANUP_POLICY_ID]: {
                        id: artifacts.CLEANUP_POLICY_ID,
                        action: "DELETE",
                        condition: {
                            tagState: "ANY",
                            olderThan: `${3 * 60 * 60 * 24}s`,
                        },
                    },
                },
                labels: { existingLabel: "value" },
            };
            await artifacts.optOutRepository(repository);
            (0, chai_1.expect)(updateRepositoryStub).to.have.been.calledOnce;
            const updateArg = updateRepositoryStub.firstCall.args[0];
            (0, chai_1.expect)(updateArg.name).to.equal(repository.name);
            (0, chai_1.expect)(updateArg.labels).to.deep.include({
                existingLabel: "value",
                [artifacts.OPT_OUT_LABEL_KEY]: "true",
            });
            (0, chai_1.expect)(updateArg.cleanupPolicies).to.not.have.property(artifacts.CLEANUP_POLICY_ID);
        });
        it("should add the opt-out label even when no policy exists", async () => {
            const repository = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                format: "DOCKER",
                description: "Cloud Functions container artifacts",
                createTime: "",
                updateTime: "",
                labels: { existingLabel: "value" },
            };
            await artifacts.optOutRepository(repository);
            (0, chai_1.expect)(updateRepositoryStub).to.have.been.calledOnce;
            const updateArg = updateRepositoryStub.firstCall.args[0];
            (0, chai_1.expect)(updateArg.name).to.equal(repository.name);
            (0, chai_1.expect)(updateArg.labels).to.deep.include({
                existingLabel: "value",
                [artifacts.OPT_OUT_LABEL_KEY]: "true",
            });
        });
    });
    describe("setCleanupPolicy", () => {
        let sandbox;
        let updateRepositoryStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            updateRepositoryStub = sandbox.stub(artifacts, "updateRepository").resolves();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should set a cleanup policy with the specified days", async () => {
            const repository = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                format: "DOCKER",
                description: "Cloud Functions container artifacts",
                createTime: "",
                updateTime: "",
                labels: { existingLabel: "value" },
            };
            const daysToKeep = 7;
            await artifacts.setCleanupPolicy(repository, daysToKeep);
            (0, chai_1.expect)(updateRepositoryStub).to.have.been.calledOnce;
            const updateArg = updateRepositoryStub.firstCall.args[0];
            (0, chai_1.expect)(updateArg.name).to.equal(repository.name);
            (0, chai_1.expect)(updateArg.cleanupPolicies).to.have.property(artifacts.CLEANUP_POLICY_ID);
            (0, chai_1.expect)(updateArg.cleanupPolicies[artifacts.CLEANUP_POLICY_ID].condition.olderThan).to.equal(`${60 * 60 * 24 * 7}s`);
        });
        it("should preserve existing cleanup policies", async () => {
            const repository = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                format: "DOCKER",
                description: "Cloud Functions container artifacts",
                createTime: "",
                updateTime: "",
                cleanupPolicies: {
                    "other-policy": {
                        id: "other-policy",
                        action: "DELETE",
                        condition: {
                            tagState: "ANY",
                            olderThan: `${5 * 60 * 60 * 24}s`,
                        },
                    },
                },
                labels: { existingLabel: "value" },
            };
            const daysToKeep = 7;
            await artifacts.setCleanupPolicy(repository, daysToKeep);
            (0, chai_1.expect)(updateRepositoryStub).to.have.been.calledOnce;
            const updateArg = updateRepositoryStub.firstCall.args[0];
            (0, chai_1.expect)(updateArg.cleanupPolicies).to.have.property("other-policy");
            (0, chai_1.expect)(updateArg.cleanupPolicies).to.have.property(artifacts.CLEANUP_POLICY_ID);
        });
        it("should remove the opt-out label if it exists", async () => {
            const repository = {
                name: "projects/my-project/locations/us-central1/repositories/gcf-artifacts",
                format: "DOCKER",
                description: "Cloud Functions container artifacts",
                createTime: "",
                updateTime: "",
                labels: {
                    existingLabel: "value",
                    [artifacts.OPT_OUT_LABEL_KEY]: "true",
                },
            };
            const daysToKeep = 7;
            await artifacts.setCleanupPolicy(repository, daysToKeep);
            (0, chai_1.expect)(updateRepositoryStub).to.have.been.calledOnce;
            const updateArg = updateRepositoryStub.firstCall.args[0];
            (0, chai_1.expect)(updateArg.labels).to.have.property("existingLabel");
            (0, chai_1.expect)(updateArg.labels).to.not.have.property(artifacts.OPT_OUT_LABEL_KEY);
        });
    });
    describe("hasSameCleanupPolicy", () => {
        it("should return true if policy exists with same settings", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
                cleanupPolicies: {
                    [artifacts.CLEANUP_POLICY_ID]: {
                        id: artifacts.CLEANUP_POLICY_ID,
                        action: "DELETE",
                        condition: {
                            tagState: "ANY",
                            olderThan: `${5 * 60 * 60 * 24}s`,
                        },
                    },
                },
            };
            (0, chai_1.expect)(artifacts.hasSameCleanupPolicy(repo, 5)).to.be.true;
        });
        it("should return false if policy doesn't exist", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
            };
            (0, chai_1.expect)(artifacts.hasSameCleanupPolicy(repo, 5)).to.be.false;
        });
        it("should return false if policy exists with different days", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
                cleanupPolicies: {
                    [artifacts.CLEANUP_POLICY_ID]: {
                        id: artifacts.CLEANUP_POLICY_ID,
                        action: "DELETE",
                        condition: {
                            tagState: "ANY",
                            olderThan: `${3 * 60 * 60 * 24}s`,
                        },
                    },
                },
            };
            (0, chai_1.expect)(artifacts.hasSameCleanupPolicy(repo, 5)).to.be.false;
        });
        it("should return false if policy exists with different tag state", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
                cleanupPolicies: {
                    [artifacts.CLEANUP_POLICY_ID]: {
                        id: artifacts.CLEANUP_POLICY_ID,
                        action: "DELETE",
                        condition: {
                            tagState: "TAGGED",
                            olderThan: `${5 * 60 * 60 * 24}s`,
                        },
                    },
                },
            };
            (0, chai_1.expect)(artifacts.hasSameCleanupPolicy(repo, 5)).to.be.false;
        });
        it("should return false if policy exists without olderThan condition", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
                cleanupPolicies: {
                    [artifacts.CLEANUP_POLICY_ID]: {
                        id: artifacts.CLEANUP_POLICY_ID,
                        action: "DELETE",
                        condition: {
                            tagState: "ANY",
                            olderThan: "",
                        },
                    },
                },
            };
            (0, chai_1.expect)(artifacts.hasSameCleanupPolicy(repo, 5)).to.be.false;
        });
    });
    describe("hasCleanupOptOut", () => {
        it("should return true if the repository has the opt-out label set to true", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
                labels: {
                    [artifacts.OPT_OUT_LABEL_KEY]: "true",
                    "other-label": "value",
                },
            };
            (0, chai_1.expect)(artifacts.hasCleanupOptOut(repo)).to.be.true;
        });
        it("should return false if the repository has the opt-out label set to a different value", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
                labels: {
                    [artifacts.OPT_OUT_LABEL_KEY]: "false",
                    "other-label": "value",
                },
            };
            (0, chai_1.expect)(artifacts.hasCleanupOptOut(repo)).to.be.false;
        });
        it("should return false if the repository doesn't have the opt-out label", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
                labels: {
                    "other-label": "value",
                },
            };
            (0, chai_1.expect)(artifacts.hasCleanupOptOut(repo)).to.be.false;
        });
        it("should return false if the repository has no labels", () => {
            const repo = {
                name: "test-repo",
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
            };
            (0, chai_1.expect)(artifacts.hasCleanupOptOut(repo)).to.be.false;
        });
    });
    describe("getRepo", () => {
        const projectId = "my-project";
        let sandbox;
        let getRepositoryStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            getRepositoryStub = sandbox.stub(artifactregistry, "getRepository");
            artifacts.getRepoCache.clear();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should fetch and cache the repository when not cached", async () => {
            const repoPath = artifacts.makeRepoPath(projectId, "us-central1");
            const mockRepo = {
                name: repoPath,
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
            };
            getRepositoryStub.resolves(mockRepo);
            const result = await artifacts.getRepo(projectId, "us-central1");
            (0, chai_1.expect)(result).to.deep.equal(mockRepo);
            const cachedResult = await artifacts.getRepo(projectId, "us-central1");
            (0, chai_1.expect)(getRepositoryStub).to.have.been.calledOnce;
            (0, chai_1.expect)(cachedResult).to.deep.equal(mockRepo);
        });
        it("should fetch fresh repository when forceRefresh is true", async () => {
            const repoPath = artifacts.makeRepoPath(projectId, "us-central1");
            const mockRepo = {
                name: repoPath,
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
            };
            getRepositoryStub.resolves(mockRepo);
            const result = await artifacts.getRepo(projectId, "us-central1");
            (0, chai_1.expect)(getRepositoryStub).to.have.been.calledOnce;
            (0, chai_1.expect)(result).to.deep.equal(mockRepo);
            const cachedResult = await artifacts.getRepo(projectId, "us-central1", true);
            (0, chai_1.expect)(getRepositoryStub).to.have.been.calledTwice;
            (0, chai_1.expect)(cachedResult).to.deep.equal(mockRepo);
        });
    });
    describe("checkCleanupPolicy", () => {
        const projectId = "my-project";
        let sandbox;
        let getRepoStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            getRepoStub = sandbox.stub(artifacts, "getRepo");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return empty arrays when no locations are provided", async () => {
            const result = await artifacts.checkCleanupPolicy(projectId, []);
            (0, chai_1.expect)(result).to.deep.equal({ locationsToSetup: [], locationsWithErrors: [] });
            (0, chai_1.expect)(getRepoStub).not.to.have.been.called;
        });
        it("should identify locations that need cleanup policies", async () => {
            const locations = ["us-central1", "us-east1", "europe-west1"];
            const repos = {
                "us-central1": {
                    name: artifacts.makeRepoPath(projectId, "us-central1"),
                    format: "DOCKER",
                    description: "Repo with no policy or opt-out",
                    createTime: "",
                    updateTime: "",
                },
                "us-east1": {
                    name: artifacts.makeRepoPath(projectId, "us-east1"),
                    format: "DOCKER",
                    description: "Repo with policy",
                    createTime: "",
                    updateTime: "",
                    cleanupPolicies: {
                        [artifacts.CLEANUP_POLICY_ID]: {
                            id: artifacts.CLEANUP_POLICY_ID,
                            action: "DELETE",
                            condition: {
                                tagState: "ANY",
                                olderThan: "86400s",
                            },
                        },
                    },
                },
                "europe-west1": {
                    name: artifacts.makeRepoPath(projectId, "europe-west1"),
                    format: "DOCKER",
                    description: "Repo with other policies",
                    createTime: "",
                    updateTime: "",
                    cleanupPolicies: {
                        "other-policy": {
                            id: "other-policy",
                            action: "DELETE",
                            condition: {
                                tagState: "ANY",
                                olderThan: "86400s",
                            },
                        },
                    },
                },
            };
            getRepoStub.callsFake((projectId, location) => {
                return repos[location];
            });
            const result = await artifacts.checkCleanupPolicy(projectId, locations);
            (0, chai_1.expect)(result.locationsToSetup).to.deep.equal(["us-central1"]);
            (0, chai_1.expect)(result.locationsWithErrors).to.deep.equal([]);
        });
        it("should identify locations with opt-out", async () => {
            const locations = ["us-central1"];
            const repo = {
                name: artifacts.makeRepoPath(projectId, "us-central1"),
                format: "DOCKER",
                description: "Repo with opt-out",
                createTime: "",
                updateTime: "",
                labels: { [artifacts.OPT_OUT_LABEL_KEY]: "true" },
            };
            getRepoStub.resolves(repo);
            const result = await artifacts.checkCleanupPolicy(projectId, locations);
            (0, chai_1.expect)(result.locationsToSetup).to.deep.equal([]);
            (0, chai_1.expect)(result.locationsWithErrors).to.deep.equal([]);
        });
        it("should handle locations with errors", async () => {
            const locations = ["us-central1", "error-location"];
            getRepoStub.callsFake((projectId, location) => {
                if (location === "error-location") {
                    throw new Error("Test error");
                }
                return {
                    name: artifacts.makeRepoPath(projectId, location),
                    format: "DOCKER",
                    description: "Test repo",
                    createTime: "",
                    updateTime: "",
                };
            });
            const result = await artifacts.checkCleanupPolicy(projectId, locations);
            (0, chai_1.expect)(result.locationsToSetup).to.deep.equal(["us-central1"]);
            (0, chai_1.expect)(result.locationsWithErrors).to.deep.equal(["error-location"]);
        });
    });
    describe("setCleanupPolicies", () => {
        const projectId = "my-project";
        let sandbox;
        let getRepoStub;
        let setCleanupPolicyStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            getRepoStub = sandbox.stub(artifacts, "getRepo");
            setCleanupPolicyStub = sandbox.stub(artifacts, "setCleanupPolicy").resolves();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return empty arrays when no locations are provided", async () => {
            const result = await artifacts.setCleanupPolicies(projectId, [], 1);
            (0, chai_1.expect)(result).to.deep.equal({ locationsWithPolicy: [], locationsWithErrors: [] });
            (0, chai_1.expect)(getRepoStub).not.to.have.been.called;
        });
        it("should set cleanup policies for all provided locations", async () => {
            const locations = ["us-central1", "us-east1"];
            const daysToKeep = 7;
            const repos = {
                "us-central1": {
                    name: artifacts.makeRepoPath(projectId, "us-central1"),
                    format: "DOCKER",
                    description: "Test repo 1",
                    createTime: "",
                    updateTime: "",
                },
                "us-east1": {
                    name: artifacts.makeRepoPath(projectId, "us-east1"),
                    format: "DOCKER",
                    description: "Test repo 2",
                    createTime: "",
                    updateTime: "",
                },
            };
            getRepoStub.callsFake((projectId, location) => {
                return repos[location];
            });
            const result = await artifacts.setCleanupPolicies(projectId, locations, daysToKeep);
            (0, chai_1.expect)(result).to.deep.equal({
                locationsWithPolicy: ["us-central1", "us-east1"],
                locationsWithErrors: [],
            });
            (0, chai_1.expect)(setCleanupPolicyStub).to.have.been.calledTwice;
            (0, chai_1.expect)(setCleanupPolicyStub).to.have.been.calledWith(repos["us-central1"], daysToKeep);
            (0, chai_1.expect)(setCleanupPolicyStub).to.have.been.calledWith(repos["us-east1"], daysToKeep);
        });
        it("should handle errors when getting repositories", async () => {
            const locations = ["us-central1", "error-location"];
            const daysToKeep = 7;
            const repo = {
                name: artifacts.makeRepoPath(projectId, "us-central1"),
                format: "DOCKER",
                description: "Test repo",
                createTime: "",
                updateTime: "",
            };
            getRepoStub.callsFake((projectId, location) => {
                if (location === "error-location") {
                    throw new Error("Test error");
                }
                return repo;
            });
            const result = await artifacts.setCleanupPolicies(projectId, locations, daysToKeep);
            (0, chai_1.expect)(result).to.deep.equal({
                locationsWithPolicy: ["us-central1"],
                locationsWithErrors: ["error-location"],
            });
            (0, chai_1.expect)(setCleanupPolicyStub).to.have.been.calledOnce;
            (0, chai_1.expect)(setCleanupPolicyStub).to.have.been.calledWith(repo, daysToKeep);
        });
        it("should handle errors when applying cleanup policy to repository", async () => {
            const locations = ["us-central1", "us-east1"];
            const daysToKeep = 7;
            const repos = {
                "us-central1": {
                    name: artifacts.makeRepoPath(projectId, "us-central1"),
                    format: "DOCKER",
                    description: "Test repo 1",
                    createTime: "",
                    updateTime: "",
                },
                "us-east1": {
                    name: artifacts.makeRepoPath(projectId, "us-east1"),
                    format: "DOCKER",
                    description: "Test repo 2",
                    createTime: "",
                    updateTime: "",
                },
            };
            getRepoStub.callsFake((projectId, location) => {
                return repos[location];
            });
            setCleanupPolicyStub.callsFake((repo) => {
                if (repo.name.includes("us-east1")) {
                    throw new Error("Failed to set policy");
                }
            });
            const result = await artifacts.setCleanupPolicies(projectId, locations, daysToKeep);
            (0, chai_1.expect)(result).to.deep.equal({
                locationsWithPolicy: ["us-central1"],
                locationsWithErrors: ["us-east1"],
            });
            (0, chai_1.expect)(getRepoStub).to.have.been.calledTwice;
            (0, chai_1.expect)(setCleanupPolicyStub).to.have.been.calledTwice;
        });
    });
});
//# sourceMappingURL=artifacts.spec.js.map