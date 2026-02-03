"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const secretManager = require("../gcp/secretManager");
const gcf = require("../gcp/cloudfunctions");
const secrets = require("./secrets");
const utils = require("../utils");
const prompt = require("../prompt");
const poller = require("../operation-poller");
const error_1 = require("../error");
const secrets_1 = require("./secrets");
const ENDPOINT = {
    id: "id",
    region: "region",
    project: "project",
    entryPoint: "id",
    runtime: "nodejs16",
    platform: "gcfv1",
    httpsTrigger: {},
};
describe("functions/secret", () => {
    const options = { force: false };
    describe("ensureValidKey", () => {
        let warnStub;
        let confirmStub;
        beforeEach(() => {
            warnStub = sinon.stub(utils, "logWarning").resolves(undefined);
            confirmStub = sinon.stub(prompt, "confirm").resolves(true);
        });
        afterEach(() => {
            warnStub.restore();
            confirmStub.restore();
        });
        it("returns the original key if it follows convention", async () => {
            (0, chai_1.expect)(await secrets.ensureValidKey("MY_SECRET_KEY", options)).to.equal("MY_SECRET_KEY");
            (0, chai_1.expect)(warnStub).to.not.have.been.called;
        });
        it("returns the transformed key (with warning) if with dashes", async () => {
            (0, chai_1.expect)(await secrets.ensureValidKey("MY-SECRET-KEY", options)).to.equal("MY_SECRET_KEY");
            (0, chai_1.expect)(warnStub).to.have.been.calledOnce;
        });
        it("returns the transformed key (with warning) if with periods", async () => {
            (0, chai_1.expect)(await secrets.ensureValidKey("MY.SECRET.KEY", options)).to.equal("MY_SECRET_KEY");
            (0, chai_1.expect)(warnStub).to.have.been.calledOnce;
        });
        it("returns the transformed key (with warning) if with lower cases", async () => {
            (0, chai_1.expect)(await secrets.ensureValidKey("my_secret_key", options)).to.equal("MY_SECRET_KEY");
            (0, chai_1.expect)(warnStub).to.have.been.calledOnce;
        });
        it("returns the transformed key (with warning) if camelCased", async () => {
            (0, chai_1.expect)(await secrets.ensureValidKey("mySecretKey", options)).to.equal("MY_SECRET_KEY");
            (0, chai_1.expect)(warnStub).to.have.been.calledOnce;
        });
        it("throws error if given non-conventional key w/ forced option", async () => {
            await (0, chai_1.expect)(secrets.ensureValidKey("throwError", { ...options, force: true })).to.be.rejectedWith(error_1.FirebaseError);
        });
        it("throws error if given reserved key", async () => {
            await (0, chai_1.expect)(secrets.ensureValidKey("FIREBASE_CONFIG", options)).to.be.rejectedWith(error_1.FirebaseError);
        });
    });
    describe("ensureSecret", () => {
        const secret = {
            projectId: "project-id",
            name: "MY_SECRET",
            labels: secretManager.labels("functions"),
            replication: {},
        };
        let sandbox;
        let getStub;
        let createStub;
        let patchStub;
        let confirmStub;
        let warnStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            getStub = sandbox.stub(secretManager, "getSecret").rejects("Unexpected call");
            createStub = sandbox.stub(secretManager, "createSecret").rejects("Unexpected call");
            patchStub = sandbox.stub(secretManager, "patchSecret").rejects("Unexpected call");
            confirmStub = sandbox.stub(prompt, "confirm").resolves(true);
            warnStub = sandbox.stub(utils, "logWarning").resolves(undefined);
        });
        afterEach(() => {
            sandbox.verifyAndRestore();
        });
        it("returns existing secret if we have one", async () => {
            getStub.resolves(secret);
            await (0, chai_1.expect)(secrets.ensureSecret("project-id", "MY_SECRET", options)).to.eventually.deep.equal(secret);
            (0, chai_1.expect)(getStub).to.have.been.calledOnce;
        });
        it("prompt user to have Firebase manage the secret if not managed by Firebase", async () => {
            getStub.resolves({ ...secret, labels: [] });
            patchStub.resolves(secret);
            confirmStub.resolves(true);
            await (0, chai_1.expect)(secrets.ensureSecret("project-id", "MY_SECRET", options)).to.eventually.deep.equal(secret);
            (0, chai_1.expect)(warnStub).to.have.been.calledOnce;
            (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
        });
        it("does not prompt user to have Firebase manage the secret if already managed by Firebase", async () => {
            getStub.resolves({ ...secret, labels: secretManager.labels() });
            patchStub.resolves(secret);
            await (0, chai_1.expect)(secrets.ensureSecret("project-id", "MY_SECRET", options)).to.eventually.deep.equal(secret);
            (0, chai_1.expect)(warnStub).not.to.have.been.calledOnce;
            (0, chai_1.expect)(confirmStub).not.to.have.been.calledOnce;
        });
        it("creates a new secret if it doesn't exists", async () => {
            getStub.rejects({ status: 404 });
            createStub.resolves(secret);
            await (0, chai_1.expect)(secrets.ensureSecret("project-id", "MY_SECRET", options)).to.eventually.deep.equal(secret);
        });
        it("throws if it cannot reach Secret Manager", async () => {
            getStub.rejects({ status: 500 });
            await (0, chai_1.expect)(secrets.ensureSecret("project-id", "MY_SECRET", options)).to.eventually.be
                .rejected;
        });
    });
    describe("of", () => {
        function makeSecret(name, version) {
            return {
                projectId: "project",
                key: name,
                secret: name,
                version: version ?? "1",
            };
        }
        it("returns empty list given empty list", () => {
            (0, chai_1.expect)(secrets.of([])).to.be.empty;
        });
        it("collects all secret environment variables", () => {
            const secret1 = makeSecret("SECRET1");
            const secret2 = makeSecret("SECRET2");
            const secret3 = makeSecret("SECRET3");
            const endpoints = [
                {
                    ...ENDPOINT,
                    secretEnvironmentVariables: [secret1],
                },
                ENDPOINT,
                {
                    ...ENDPOINT,
                    secretEnvironmentVariables: [secret2, secret3],
                },
            ];
            (0, chai_1.expect)(secrets.of(endpoints)).to.have.members([secret1, secret2, secret3]);
            (0, chai_1.expect)(secrets.of(endpoints)).to.have.length(3);
        });
    });
    describe("getSecretVersions", () => {
        function makeSecret(name, version) {
            const secret = {
                projectId: "project",
                key: name,
                secret: name,
            };
            if (version) {
                secret.version = version;
            }
            return secret;
        }
        it("returns object mapping secrets and their versions", () => {
            const secret1 = makeSecret("SECRET1", "1");
            const secret2 = makeSecret("SECRET2", "100");
            const secret3 = makeSecret("SECRET3", "2");
            const endpoint = {
                ...ENDPOINT,
                secretEnvironmentVariables: [secret1, secret2, secret3],
            };
            (0, chai_1.expect)(secrets.getSecretVersions(endpoint)).to.deep.eq({
                [secret1.secret]: secret1.version,
                [secret2.secret]: secret2.version,
                [secret3.secret]: secret3.version,
            });
        });
    });
    describe("pruneSecrets", () => {
        let listSecretsStub;
        let listSecretVersionsStub;
        let getSecretVersionStub;
        const secret1 = {
            projectId: "project",
            name: "MY_SECRET1",
            labels: {},
            replication: {},
        };
        const secretVersion11 = {
            secret: secret1,
            versionId: "1",
            createTime: "2024-03-28T19:43:26",
        };
        const secretVersion12 = {
            secret: secret1,
            versionId: "2",
            createTime: "2024-03-28T19:43:26",
        };
        const secret2 = {
            projectId: "project",
            name: "MY_SECRET2",
            labels: {},
            replication: {},
        };
        const secretVersion21 = {
            secret: secret2,
            versionId: "1",
            createTime: "2024-03-28T19:43:26",
        };
        function toSecretEnvVar(sv) {
            return {
                projectId: "project",
                version: sv.versionId,
                secret: sv.secret.name,
                key: sv.secret.name,
            };
        }
        beforeEach(() => {
            listSecretsStub = sinon.stub(secretManager, "listSecrets").rejects("Unexpected call");
            listSecretVersionsStub = sinon
                .stub(secretManager, "listSecretVersions")
                .rejects("Unexpected call");
            getSecretVersionStub = sinon
                .stub(secretManager, "getSecretVersion")
                .rejects("Unexpected call");
        });
        afterEach(() => {
            listSecretsStub.restore();
            listSecretVersionsStub.restore();
            getSecretVersionStub.restore();
        });
        it("returns nothing if unused", async () => {
            listSecretsStub.resolves([]);
            await (0, chai_1.expect)(secrets.pruneSecrets({ projectId: "project", projectNumber: "12345" }, [])).to.eventually.deep.equal([]);
        });
        it("returns all secrets given no endpoints", async () => {
            listSecretsStub.resolves([secret1, secret2]);
            listSecretVersionsStub.onFirstCall().resolves([secretVersion11, secretVersion12]);
            listSecretVersionsStub.onSecondCall().resolves([secretVersion21]);
            const pruned = await secrets.pruneSecrets({ projectId: "project", projectNumber: "12345" }, []);
            (0, chai_1.expect)(pruned).to.have.deep.members([secretVersion11, secretVersion12, secretVersion21].map(toSecretEnvVar));
            (0, chai_1.expect)(pruned).to.have.length(3);
        });
        it("does not include secret version in use", async () => {
            listSecretsStub.resolves([secret1, secret2]);
            listSecretVersionsStub.onFirstCall().resolves([secretVersion11, secretVersion12]);
            listSecretVersionsStub.onSecondCall().resolves([secretVersion21]);
            const pruned = await secrets.pruneSecrets({ projectId: "project", projectNumber: "12345" }, [
                { ...ENDPOINT, secretEnvironmentVariables: [toSecretEnvVar(secretVersion12)] },
            ]);
            (0, chai_1.expect)(pruned).to.have.deep.members([secretVersion11, secretVersion21].map(toSecretEnvVar));
            (0, chai_1.expect)(pruned).to.have.length(2);
        });
        it("resolves 'latest' secrets and properly prunes it", async () => {
            listSecretsStub.resolves([secret1, secret2]);
            listSecretVersionsStub.onFirstCall().resolves([secretVersion11, secretVersion12]);
            listSecretVersionsStub.onSecondCall().resolves([secretVersion21]);
            getSecretVersionStub.resolves(secretVersion12);
            const pruned = await secrets.pruneSecrets({ projectId: "project", projectNumber: "12345" }, [
                {
                    ...ENDPOINT,
                    secretEnvironmentVariables: [{ ...toSecretEnvVar(secretVersion12), version: "latest" }],
                },
            ]);
            (0, chai_1.expect)(pruned).to.have.deep.members([secretVersion11, secretVersion21].map(toSecretEnvVar));
            (0, chai_1.expect)(pruned).to.have.length(2);
        });
    });
    describe("inUse", () => {
        const projectId = "project";
        const projectNumber = "12345";
        const secret = {
            projectId,
            name: "MY_SECRET",
            labels: {},
            replication: {},
        };
        it("returns true if secret is in use", () => {
            (0, chai_1.expect)(secrets.inUse({ projectId, projectNumber }, secret, {
                ...ENDPOINT,
                secretEnvironmentVariables: [
                    { projectId, key: secret.name, secret: secret.name, version: "1" },
                ],
            })).to.be.true;
        });
        it("returns true if secret is in use by project number", () => {
            (0, chai_1.expect)(secrets.inUse({ projectId, projectNumber }, secret, {
                ...ENDPOINT,
                secretEnvironmentVariables: [
                    { projectId: projectNumber, key: secret.name, secret: secret.name, version: "1" },
                ],
            })).to.be.true;
        });
        it("returns false if secret is not in use", () => {
            (0, chai_1.expect)(secrets.inUse({ projectId, projectNumber }, secret, ENDPOINT)).to.be.false;
        });
        it("returns false if secret of same name from another project is in use", () => {
            (0, chai_1.expect)(secrets.inUse({ projectId, projectNumber }, secret, {
                ...ENDPOINT,
                secretEnvironmentVariables: [
                    { projectId: "another-project", key: secret.name, secret: secret.name, version: "1" },
                ],
            })).to.be.false;
        });
    });
    describe("versionInUse", () => {
        const projectId = "project";
        const projectNumber = "12345";
        const sv = {
            versionId: "5",
            secret: {
                projectId,
                name: "MY_SECRET",
                labels: {},
                replication: {},
            },
            createTime: "2024-03-28T19:43:26",
        };
        it("returns true if secret version is in use", () => {
            (0, chai_1.expect)(secrets.versionInUse({ projectId, projectNumber }, sv, {
                ...ENDPOINT,
                secretEnvironmentVariables: [
                    { projectId, key: sv.secret.name, secret: sv.secret.name, version: "5" },
                ],
            })).to.be.true;
        });
        it("returns true if secret version is in use by project number", () => {
            (0, chai_1.expect)(secrets.versionInUse({ projectId, projectNumber }, sv, {
                ...ENDPOINT,
                secretEnvironmentVariables: [
                    { projectId: projectNumber, key: sv.secret.name, secret: sv.secret.name, version: "5" },
                ],
            })).to.be.true;
        });
        it("returns false if secret version is not in use", () => {
            (0, chai_1.expect)(secrets.versionInUse({ projectId, projectNumber }, sv, ENDPOINT)).to.be.false;
        });
        it("returns false if a different version of the secret is in use", () => {
            (0, chai_1.expect)(secrets.versionInUse({ projectId, projectNumber }, sv, {
                ...ENDPOINT,
                secretEnvironmentVariables: [
                    { projectId, key: sv.secret.name, secret: sv.secret.name, version: "1" },
                ],
            })).to.be.false;
        });
    });
    describe("pruneAndDestroySecrets", () => {
        let pruneSecretsStub;
        let destroySecretVersionStub;
        const projectId = "projectId";
        const projectNumber = "12345";
        const secret0 = {
            projectId,
            key: "MY_SECRET",
            secret: "MY_SECRET",
            version: "1",
        };
        const secret1 = {
            projectId,
            key: "MY_SECRET",
            secret: "MY_SECRET",
            version: "1",
        };
        beforeEach(() => {
            pruneSecretsStub = sinon.stub(secrets, "pruneSecrets").rejects("Unexpected call");
            destroySecretVersionStub = sinon
                .stub(secretManager, "destroySecretVersion")
                .rejects("Unexpected call");
        });
        afterEach(() => {
            pruneSecretsStub.restore();
            destroySecretVersionStub.restore();
        });
        it("destroys pruned secrets", async () => {
            pruneSecretsStub.resolves([secret1]);
            destroySecretVersionStub.resolves();
            await (0, chai_1.expect)(secrets.pruneAndDestroySecrets({ projectId, projectNumber }, [
                {
                    ...ENDPOINT,
                    secretEnvironmentVariables: [secret0],
                },
                {
                    ...ENDPOINT,
                    secretEnvironmentVariables: [secret1],
                },
            ])).to.eventually.deep.equal({ erred: [], destroyed: [secret1] });
        });
        it("collects errors", async () => {
            pruneSecretsStub.resolves([secret0, secret1]);
            destroySecretVersionStub.onFirstCall().resolves();
            destroySecretVersionStub.onSecondCall().rejects({ message: "an error" });
            await (0, chai_1.expect)(secrets.pruneAndDestroySecrets({ projectId, projectNumber }, [
                {
                    ...ENDPOINT,
                    secretEnvironmentVariables: [secret0],
                },
                {
                    ...ENDPOINT,
                    secretEnvironmentVariables: [secret1],
                },
            ])).to.eventually.deep.equal({ erred: [{ message: "an error" }], destroyed: [secret0] });
        });
    });
    describe("updateEndpointsSecret", () => {
        const projectId = "project";
        const projectNumber = "12345";
        const secretVersion = {
            secret: {
                projectId,
                name: "MY_SECRET",
                labels: {},
                replication: {},
            },
            versionId: "2",
            createTime: "2024-03-28T19:43:26",
        };
        let gcfMock;
        let pollerStub;
        beforeEach(() => {
            gcfMock = sinon.mock(gcf);
            pollerStub = sinon.stub(poller, "pollOperation").rejects("Unexpected call");
        });
        afterEach(() => {
            gcfMock.verify();
            gcfMock.restore();
            pollerStub.restore();
        });
        it("returns early if secret is not in use", async () => {
            const endpoint = {
                ...ENDPOINT,
                secretEnvironmentVariables: [],
            };
            gcfMock.expects("updateFunction").never();
            await (0, secrets_1.updateEndpointSecret)({ projectId, projectNumber }, secretVersion, endpoint);
        });
        it("updates function with the version of the given secret", async () => {
            const sev = {
                projectId: projectNumber,
                secret: secretVersion.secret.name,
                key: secretVersion.secret.name,
                version: "1",
            };
            const endpoint = {
                ...ENDPOINT,
                secretEnvironmentVariables: [sev],
            };
            const fn = {
                name: `projects/${endpoint.project}/locations/${endpoint.region}/functions/${endpoint.id}`,
                runtime: endpoint.runtime,
                entryPoint: endpoint.entryPoint,
                secretEnvironmentVariables: [{ ...sev, version: "2" }],
            };
            pollerStub.resolves({ ...fn, httpsTrigger: {} });
            gcfMock.expects("updateFunction").once().withArgs(fn).resolves({});
            await (0, secrets_1.updateEndpointSecret)({ projectId, projectNumber }, secretVersion, endpoint);
        });
    });
});
//# sourceMappingURL=secrets.spec.js.map