"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const prompt = require("../prompt");
const poller = require("../operation-poller");
const devconnect = require("../gcp/devConnect");
const repo = require("./githubConnections");
const utils = require("../utils");
const srcUtils = require("../getProjectNumber");
const rm = require("../gcp/resourceManager");
const error_1 = require("../error");
const projectId = "projectId";
const location = "us-central1";
function mockConn(id) {
    return {
        name: `projects/${projectId}/locations/${location}/connections/${id}`,
        disabled: false,
        createTime: "0",
        updateTime: "1",
        installationState: {
            stage: "COMPLETE",
            message: "complete",
            actionUri: "https://google.com",
        },
        reconciling: false,
    };
}
function mockRepo(name) {
    return {
        name: `${name}`,
        cloneUri: `https://github.com/test/${name}.git`,
        createTime: "",
        updateTime: "",
        deleteTime: "",
        reconciling: false,
        uid: "",
    };
}
describe("githubConnections", () => {
    describe("parseConnectionName", () => {
        it("should parse valid connection name", () => {
            const connectionName = "projects/my-project/locations/us-central1/connections/my-conn";
            const expected = {
                projectId: "my-project",
                location: "us-central1",
                id: "my-conn",
            };
            (0, chai_1.expect)(repo.parseConnectionName(connectionName)).to.deep.equal(expected);
        });
        it("should return undefined for invalid", () => {
            (0, chai_1.expect)(repo.parseConnectionName("projects/my-project/locations/us-central1/connections/my-conn/repositories/repo")).to.be.undefined;
            (0, chai_1.expect)(repo.parseConnectionName("foobar")).to.be.undefined;
        });
    });
    describe("extractRepoSlugFromUri", () => {
        it("extracts repo from URI", () => {
            const cloneUri = "https://github.com/user/repo.git";
            const repoSlug = repo.extractRepoSlugFromUri(cloneUri);
            (0, chai_1.expect)(repoSlug).to.equal("user/repo");
        });
    });
    describe("generateRepositoryId", () => {
        it("extracts repo from URI", () => {
            const cloneUri = "https://github.com/user/repo.git";
            const repoSlug = repo.generateRepositoryId(cloneUri);
            (0, chai_1.expect)(repoSlug).to.equal("user-repo");
        });
    });
    describe("connect GitHub repo", () => {
        const sandbox = sinon.createSandbox();
        const knownConnectionId = "apphosting-github-conn-test123";
        let promptStub;
        let pollOperationStub;
        let getConnectionStub;
        let getRepositoryStub;
        let createConnectionStub;
        let serviceAccountHasRolesStub;
        let createRepositoryStub;
        let listAllLinkableGitRepositoriesStub;
        let getProjectNumberStub;
        let openInBrowserPopupStub;
        let listConnectionsStub;
        let fetchGitHubInstallationsStub;
        beforeEach(() => {
            promptStub = sandbox.stub(prompt);
            promptStub.input.throws("Unexpected input call");
            promptStub.search.throws("Unexpected search call");
            promptStub.confirm.throws("Unexpected confirm call");
            pollOperationStub = sandbox
                .stub(poller, "pollOperation")
                .throws("Unexpected pollOperation call");
            getConnectionStub = sandbox
                .stub(devconnect, "getConnection")
                .throws("Unexpected getConnection call");
            getRepositoryStub = sandbox
                .stub(devconnect, "getGitRepositoryLink")
                .throws("Unexpected getGitRepositoryLink call");
            createConnectionStub = sandbox
                .stub(devconnect, "createConnection")
                .throws("Unexpected createConnection call");
            serviceAccountHasRolesStub = sandbox.stub(rm, "serviceAccountHasRoles").resolves(true);
            createRepositoryStub = sandbox
                .stub(devconnect, "createGitRepositoryLink")
                .throws("Unexpected createGitRepositoryLink call");
            listAllLinkableGitRepositoriesStub = sandbox
                .stub(devconnect, "listAllLinkableGitRepositories")
                .throws("Unexpected listAllLinkableGitRepositories call");
            sandbox.stub(utils, "openInBrowser").resolves();
            openInBrowserPopupStub = sandbox
                .stub(utils, "openInBrowserPopup")
                .throws("Unexpected openInBrowserPopup call");
            getProjectNumberStub = sandbox
                .stub(srcUtils, "getProjectNumber")
                .throws("Unexpected getProjectNumber call");
            listConnectionsStub = sandbox
                .stub(devconnect, "listAllConnections")
                .throws("Unexpected listAllConnections call");
            fetchGitHubInstallationsStub = sandbox
                .stub(devconnect, "fetchGitHubInstallations")
                .throws("Unexpected fetchGitHubInstallations call");
            sandbox.stub(repo, "generateConnectionId").returns(knownConnectionId);
        });
        afterEach(() => {
            sandbox.verifyAndRestore();
        });
        const op = {
            name: `projects/${projectId}/locations/${location}/connections/${knownConnectionId}`,
            done: true,
        };
        const pendingConn = {
            name: `projects/${projectId}/locations/${location}/connections/${knownConnectionId}`,
            disabled: false,
            createTime: "0",
            updateTime: "1",
            installationState: {
                stage: "PENDING_USER_OAUTH",
                message: "pending",
                actionUri: "https://google.com",
            },
            reconciling: false,
        };
        const completeConn = {
            name: `projects/${projectId}/locations/${location}/connections/${knownConnectionId}`,
            disabled: false,
            createTime: "0",
            updateTime: "1",
            installationState: {
                stage: "COMPLETE",
                message: "complete",
                actionUri: "https://google.com",
            },
            reconciling: false,
            githubConfig: {
                authorizerCredential: {
                    oauthTokenSecretVersion: "secret",
                    username: "test-user",
                },
            },
        };
        const repos = {
            repositories: [
                {
                    name: "repo0",
                    remoteUri: "https://github.com/test/repo0.git",
                },
                {
                    name: "repo1",
                    remoteUri: "https://github.com/test/repo1.git",
                },
            ],
        };
        it("creates a connection if it doesn't exist", async () => {
            getConnectionStub.onFirstCall().rejects(new error_1.FirebaseError("error", { status: 404 }));
            getConnectionStub.onSecondCall().resolves(completeConn);
            createConnectionStub.resolves(op);
            pollOperationStub.resolves(pendingConn);
            promptStub.input.onFirstCall().resolves("any key");
            await repo.getOrCreateConnection(projectId, location, knownConnectionId);
            (0, chai_1.expect)(createConnectionStub).to.be.calledWith(projectId, location, knownConnectionId);
        });
        it("checks if secret manager admin role is granted for developer connect P4SA when creating an oauth connection", async () => {
            listConnectionsStub.returns([]);
            createConnectionStub.resolves(op);
            pollOperationStub.resolves(pendingConn);
            getConnectionStub.onFirstCall().resolves(completeConn);
            promptStub.input.resolves("any key");
            getProjectNumberStub.onFirstCall().resolves(projectId);
            openInBrowserPopupStub.resolves({ url: "", cleanup: sandbox.stub() });
            await repo.getOrCreateOauthConnection(projectId, location);
            (0, chai_1.expect)(serviceAccountHasRolesStub).to.be.calledWith(projectId, `service-${projectId}@gcp-sa-devconnect.iam.gserviceaccount.com`, ["roles/secretmanager.admin"], true);
        });
        it("creates repository if it doesn't exist", async () => {
            getConnectionStub.resolves(completeConn);
            listAllLinkableGitRepositoriesStub.resolves(repos.repositories);
            promptStub.search.onFirstCall().resolves(repos.repositories[0].remoteUri);
            getRepositoryStub.rejects(new error_1.FirebaseError("error", { status: 404 }));
            createRepositoryStub.resolves({ name: "op" });
            pollOperationStub.resolves(repos.repositories[0]);
            await repo.getOrCreateRepository(projectId, location, knownConnectionId, repos.repositories[0].remoteUri);
            (0, chai_1.expect)(createRepositoryStub).to.be.calledWith(projectId, location, knownConnectionId, "test-repo0", repos.repositories[0].remoteUri);
        });
        it("links a github repository without an existing oauth connection", async () => {
            listConnectionsStub.onFirstCall().resolves([]);
            createConnectionStub.onFirstCall().resolves({ name: "op" });
            pollOperationStub.onFirstCall().resolves(completeConn);
            getProjectNumberStub.onFirstCall().resolves(projectId);
            fetchGitHubInstallationsStub.resolves([
                {
                    id: "installationID",
                    name: "main-user",
                    type: "user",
                },
            ]);
            promptStub.search.onFirstCall().resolves("installationID");
            listConnectionsStub.onSecondCall().resolves([completeConn]);
            createConnectionStub.onSecondCall().resolves({ name: "op" });
            pollOperationStub.onSecondCall().resolves(pendingConn);
            promptStub.input.onFirstCall().resolves("enter");
            getConnectionStub.onFirstCall().resolves(completeConn);
            listAllLinkableGitRepositoriesStub.resolves(repos.repositories);
            promptStub.search.onSecondCall().resolves(repos.repositories[0].remoteUri);
            getConnectionStub.onSecondCall().resolves(completeConn);
            getRepositoryStub.rejects(new error_1.FirebaseError("error", { status: 404 }));
            createRepositoryStub.resolves({ name: "op" });
            pollOperationStub.resolves(repos.repositories[0]);
            const r = await repo.linkGitHubRepository(projectId, location);
            (0, chai_1.expect)(getConnectionStub).to.be.calledWith(projectId, location, knownConnectionId);
            (0, chai_1.expect)(createConnectionStub).to.be.calledWith(projectId, location, knownConnectionId);
            (0, chai_1.expect)(r).to.be.deep.equal(repos.repositories[0]);
        });
        it("links a github repository using an existing oauth connection", async () => {
            listConnectionsStub.onFirstCall().resolves([completeConn]);
            fetchGitHubInstallationsStub.resolves([
                {
                    id: "installationID",
                    name: "main-user",
                    type: "user",
                },
            ]);
            promptStub.search.onFirstCall().resolves("installationID");
            listConnectionsStub.onSecondCall().resolves([completeConn]);
            createConnectionStub.onFirstCall().resolves({ name: "op" });
            pollOperationStub.onFirstCall().resolves(completeConn);
            listAllLinkableGitRepositoriesStub.resolves(repos.repositories);
            promptStub.search.onSecondCall().resolves(repos.repositories[0].remoteUri);
            getConnectionStub.onFirstCall().resolves(completeConn);
            getRepositoryStub.rejects(new error_1.FirebaseError("error", { status: 404 }));
            createRepositoryStub.resolves({ name: "op" });
            pollOperationStub.onSecondCall().resolves(repos.repositories[0]);
            const r = await repo.linkGitHubRepository(projectId, location);
            (0, chai_1.expect)(getConnectionStub).to.be.calledWith(projectId, location, knownConnectionId);
            (0, chai_1.expect)(createConnectionStub).to.be.calledOnce;
            (0, chai_1.expect)(createConnectionStub).to.be.calledWith(projectId, location, knownConnectionId);
            (0, chai_1.expect)(r).to.be.deep.equal(repos.repositories[0]);
        });
        it("links a github repository with a new named connection", async () => {
            const namedConnectionId = `apphosting-named-${location}`;
            const namedCompleteConn = {
                name: `projects/${projectId}/locations/${location}/connections/${namedConnectionId}`,
                disabled: false,
                createTime: "0",
                updateTime: "1",
                installationState: {
                    stage: "COMPLETE",
                    message: "complete",
                    actionUri: "https://google.com",
                },
                reconciling: false,
            };
            getConnectionStub.onFirstCall().rejects(new error_1.FirebaseError("error", { status: 404 }));
            getConnectionStub.onSecondCall().resolves(completeConn);
            fetchGitHubInstallationsStub.resolves([
                {
                    id: "installationID",
                    name: "main-user",
                    type: "user",
                },
            ]);
            promptStub.search.onFirstCall().resolves("installationID");
            listConnectionsStub.resolves([completeConn]);
            createConnectionStub.onFirstCall().resolves({ name: "op" });
            pollOperationStub.onFirstCall().resolves(namedCompleteConn);
            listAllLinkableGitRepositoriesStub.resolves(repos.repositories);
            promptStub.search.onSecondCall().resolves(repos.repositories[0].remoteUri);
            getConnectionStub.onThirdCall().resolves(namedCompleteConn);
            getRepositoryStub.rejects(new error_1.FirebaseError("error", { status: 404 }));
            createRepositoryStub.resolves({ name: "op" });
            pollOperationStub.onSecondCall().resolves(repos.repositories[0]);
            const r = await repo.linkGitHubRepository(projectId, location, namedConnectionId);
            (0, chai_1.expect)(r).to.be.deep.equal(repos.repositories[0]);
            (0, chai_1.expect)(getConnectionStub).to.be.calledWith(projectId, location, namedConnectionId);
            (0, chai_1.expect)(createConnectionStub).to.be.calledWith(projectId, location, namedConnectionId, {
                appInstallationId: "installationID",
                authorizerCredential: completeConn.githubConfig.authorizerCredential,
            });
        });
        it("reuses an existing named connection to link github repo", async () => {
            const namedConnectionId = `apphosting-named-${location}`;
            const namedCompleteConn = {
                name: `projects/${projectId}/locations/${location}/connections/${namedConnectionId}`,
                disabled: false,
                createTime: "0",
                updateTime: "1",
                installationState: {
                    stage: "COMPLETE",
                    message: "complete",
                    actionUri: "https://google.com",
                },
                reconciling: false,
            };
            getConnectionStub.onFirstCall().resolves(namedCompleteConn);
            listAllLinkableGitRepositoriesStub.resolves(repos.repositories);
            promptStub.search.onFirstCall().resolves(repos.repositories[0].remoteUri);
            getConnectionStub.onSecondCall().resolves(namedCompleteConn);
            getRepositoryStub.rejects(new error_1.FirebaseError("error", { status: 404 }));
            createRepositoryStub.resolves({ name: "op" });
            pollOperationStub.resolves(repos.repositories[0]);
            const r = await repo.linkGitHubRepository(projectId, location, namedConnectionId);
            (0, chai_1.expect)(r).to.be.deep.equal(repos.repositories[0]);
            (0, chai_1.expect)(getConnectionStub).to.be.calledWith(projectId, location, namedConnectionId);
            (0, chai_1.expect)(getConnectionStub).to.not.be.calledWith(projectId, location, knownConnectionId);
            (0, chai_1.expect)(listConnectionsStub).to.not.be.called;
            (0, chai_1.expect)(createConnectionStub).to.not.be.called;
        });
        it("re-uses existing repository it already exists", async () => {
            getConnectionStub.resolves(completeConn);
            listAllLinkableGitRepositoriesStub.resolves(repos.repositories);
            promptStub.search.onFirstCall().resolves(repos.repositories[0].remoteUri);
            getRepositoryStub.resolves(repos.repositories[0]);
            const r = await repo.getOrCreateRepository(projectId, location, knownConnectionId, repos.repositories[0].remoteUri);
            (0, chai_1.expect)(r).to.be.deep.equal(repos.repositories[0]);
        });
    });
    describe("fetchRepositoryCloneUris", () => {
        const sandbox = sinon.createSandbox();
        let listAllLinkableGitRepositoriesStub;
        beforeEach(() => {
            listAllLinkableGitRepositoriesStub = sandbox
                .stub(devconnect, "listAllLinkableGitRepositories")
                .throws("Unexpected listAllLinkableGitRepositories call");
        });
        afterEach(() => {
            sandbox.verifyAndRestore();
        });
        it("should fetch all linkable repositories from multiple connections", async () => {
            const conn0 = mockConn("conn0");
            const repo0 = mockRepo("repo-0");
            const repo1 = mockRepo("repo-1");
            listAllLinkableGitRepositoriesStub.onFirstCall().resolves([repo0, repo1]);
            const repos = await repo.fetchRepositoryCloneUris(projectId, conn0);
            (0, chai_1.expect)(repos.length).to.equal(2);
            (0, chai_1.expect)(repos).to.deep.equal([repo0.cloneUri, repo1.cloneUri]);
        });
    });
    describe("listAppHostingConnections", () => {
        const sandbox = sinon.createSandbox();
        let listConnectionsStub;
        function extractId(name) {
            const parts = name.split("/");
            return parts.pop() ?? "";
        }
        beforeEach(() => {
            listConnectionsStub = sandbox
                .stub(devconnect, "listAllConnections")
                .throws("Unexpected listAllConnections call");
        });
        afterEach(() => {
            sandbox.verifyAndRestore();
        });
        it("filters out non-apphosting connections", async () => {
            listConnectionsStub.resolves([
                mockConn("apphosting-github-conn-baddcafe"),
                mockConn("hooray-conn"),
                mockConn("apphosting-github-conn-deadbeef"),
                mockConn("apphosting-github-oauth"),
            ]);
            const conns = await repo.listAppHostingConnections(projectId, location);
            (0, chai_1.expect)(conns).to.have.length(2);
            (0, chai_1.expect)(conns.map((c) => extractId(c.name))).to.include.members([
                "apphosting-github-conn-baddcafe",
                "apphosting-github-conn-deadbeef",
            ]);
        });
    });
    describe("listValidInstallations", () => {
        const sandbox = sinon.createSandbox();
        let fetchGitHubInstallationsStub;
        beforeEach(() => {
            fetchGitHubInstallationsStub = sandbox
                .stub(devconnect, "fetchGitHubInstallations")
                .throws("Unexpected fetchGitHubInstallations call");
        });
        afterEach(() => {
            sandbox.verifyAndRestore();
        });
        it("only lists organizations and authorizer github account", async () => {
            const conn = mockConn("1");
            conn.githubConfig = {
                authorizerCredential: {
                    oauthTokenSecretVersion: "blah",
                    username: "main-user",
                },
            };
            fetchGitHubInstallationsStub.resolves([
                {
                    id: "1",
                    name: "main-user",
                    type: "user",
                },
                {
                    id: "2",
                    name: "org-1",
                    type: "organization",
                },
                {
                    id: "3",
                    name: "org-3",
                    type: "organization",
                },
                {
                    id: "4",
                    name: "some-other-user",
                    type: "user",
                },
                {
                    id: "5",
                    name: "org-4",
                    type: "organization",
                },
            ]);
            const installations = await repo.listValidInstallations(projectId, location, conn);
            (0, chai_1.expect)(installations).to.deep.equal([
                {
                    id: "1",
                    name: "main-user",
                    type: "user",
                },
                {
                    id: "2",
                    name: "org-1",
                    type: "organization",
                },
                {
                    id: "3",
                    name: "org-3",
                    type: "organization",
                },
                {
                    id: "5",
                    name: "org-4",
                    type: "organization",
                },
            ]);
        });
    });
    describe("getConnectionForInstallation", () => {
        const sandbox = sinon.createSandbox();
        let listConnectionsStub;
        beforeEach(() => {
            listConnectionsStub = sandbox
                .stub(devconnect, "listAllConnections")
                .throws("Unexpected listAllConnections call");
        });
        afterEach(() => {
            sandbox.verifyAndRestore();
        });
        it("finds the matching connection for a given installation", async () => {
            const mockConn1 = mockConn("apphosting-github-conn-1");
            const mockConn2 = mockConn("apphosting-github-conn-2");
            const mockConn3 = mockConn("apphosting-github-conn-3");
            const mockConn4 = mockConn("random-conn");
            const installationToMatch = "installation-1";
            mockConn1.githubConfig = {
                appInstallationId: installationToMatch,
            };
            mockConn2.githubConfig = {
                appInstallationId: "installation-2",
            };
            mockConn3.githubConfig = {
                appInstallationId: "installation-3",
            };
            listConnectionsStub.onFirstCall().resolves([mockConn1, mockConn2, mockConn3, mockConn4]);
            const matchingConnection = await repo.getConnectionForInstallation(projectId, location, installationToMatch);
            (0, chai_1.expect)(matchingConnection).to.deep.equal(mockConn1);
        });
        it("returns null if there is no matching connection for a given installation", async () => {
            const mockConn1 = mockConn("apphosting-github-conn-1");
            const mockConn2 = mockConn("apphosting-github-conn-2");
            const installationToMatch = "random-installation";
            mockConn1.githubConfig = {
                appInstallationId: "installation-1",
            };
            mockConn2.githubConfig = {
                appInstallationId: "installation-2",
            };
            listConnectionsStub.onFirstCall().resolves([mockConn1, mockConn2]);
            const matchingConnection = await repo.getConnectionForInstallation(projectId, location, installationToMatch);
            (0, chai_1.expect)(matchingConnection).to.be.null;
        });
    });
    describe("ensureSecretManagerAdminGrant", () => {
        const sandbox = sinon.createSandbox();
        let confirmStub;
        let serviceAccountHasRolesStub;
        let addServiceAccountToRolesStub;
        let generateP4SAStub;
        beforeEach(() => {
            confirmStub = sandbox.stub(prompt, "confirm").throws("Unexpected confirm call");
            serviceAccountHasRolesStub = sandbox.stub(rm, "serviceAccountHasRoles");
            sandbox.stub(srcUtils, "getProjectNumber").resolves(projectId);
            addServiceAccountToRolesStub = sandbox.stub(rm, "addServiceAccountToRoles");
            generateP4SAStub = sandbox.stub(devconnect, "generateP4SA");
        });
        afterEach(() => {
            sandbox.verifyAndRestore();
        });
        it("does not prompt user if the developer connect P4SA already has secretmanager.admin permissions", async () => {
            serviceAccountHasRolesStub.resolves(true);
            await repo.ensureSecretManagerAdminGrant(projectId);
            (0, chai_1.expect)(serviceAccountHasRolesStub).calledWith(projectId, `service-${projectId}@gcp-sa-devconnect.iam.gserviceaccount.com`, ["roles/secretmanager.admin"]);
            (0, chai_1.expect)(confirmStub).to.not.be.called;
        });
        it("prompts user if the developer connect P4SA does not have secretmanager.admin permissions", async () => {
            serviceAccountHasRolesStub.resolves(false);
            confirmStub.resolves(true);
            addServiceAccountToRolesStub.resolves();
            await repo.ensureSecretManagerAdminGrant(projectId);
            (0, chai_1.expect)(serviceAccountHasRolesStub).calledWith(projectId, `service-${projectId}@gcp-sa-devconnect.iam.gserviceaccount.com`, ["roles/secretmanager.admin"]);
            (0, chai_1.expect)(confirmStub).to.be.called;
        });
        it("tries to generate developer connect P4SA if adding role throws an error", async () => {
            serviceAccountHasRolesStub.resolves(false);
            confirmStub.resolves(true);
            generateP4SAStub.resolves();
            addServiceAccountToRolesStub.onFirstCall().throws({ code: 400, status: 400 });
            addServiceAccountToRolesStub.onSecondCall().resolves();
            await repo.ensureSecretManagerAdminGrant(projectId);
            (0, chai_1.expect)(serviceAccountHasRolesStub).calledWith(projectId, `service-${projectId}@gcp-sa-devconnect.iam.gserviceaccount.com`, ["roles/secretmanager.admin"]).calledOnce;
            (0, chai_1.expect)(generateP4SAStub).calledOnce;
            (0, chai_1.expect)(confirmStub).to.be.called;
        });
    });
    describe("promptGitHubBranch", () => {
        const sandbox = sinon.createSandbox();
        let searchStub;
        let listAllBranchesStub;
        beforeEach(() => {
            searchStub = sandbox.stub(prompt, "search").throws("Unexpected search call");
            listAllBranchesStub = sandbox
                .stub(devconnect, "listAllBranches")
                .throws("Unexpected listAllBranches call");
        });
        afterEach(() => {
            sandbox.verifyAndRestore();
        });
        it("prompts user for branch", async () => {
            listAllBranchesStub.returns(new Set(["main", "test1"]));
            searchStub.onFirstCall().returns("main");
            const testRepoLink = {
                name: "test",
                cloneUri: "/test",
                createTime: "",
                updateTime: "",
                deleteTime: "",
                reconciling: false,
                uid: "",
            };
            await (0, chai_1.expect)(repo.promptGitHubBranch(testRepoLink)).to.eventually.equal("main");
        });
    });
});
//# sourceMappingURL=githubConnections.spec.js.map