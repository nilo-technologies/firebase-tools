"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const secrets = require(".");
const gcb = require("../../gcp/cloudbuild");
const gce = require("../../gcp/computeEngine");
const gcsmImport = require("../../gcp/secretManager");
const utilsImport = require("../../utils");
const promptImport = require("../../prompt");
const error_1 = require("../../error");
describe("secrets", () => {
    let gcsm;
    let utils;
    let prompt;
    beforeEach(() => {
        gcsm = sinon.stub(gcsmImport);
        utils = sinon.stub(utilsImport);
        prompt = sinon.stub(promptImport);
        gcsm.isFunctionsManaged.restore();
        gcsm.labels.restore();
        gcsm.getIamPolicy.throws("Unexpected getIamPolicy call");
        gcsm.setIamPolicy.throws("Unexpected setIamPolicy call");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("serviceAccountsForbackend", () => {
        it("uses explicit account", async () => {
            const backend = {
                serviceAccount: "sa",
            };
            (0, chai_1.expect)(await secrets.serviceAccountsForBackend("number", backend)).to.deep.equal({
                buildServiceAccount: "sa",
                runServiceAccount: "sa",
            });
        });
        it("has a fallback for legacy SAs", async () => {
            const backend = {};
            (0, chai_1.expect)(await secrets.serviceAccountsForBackend("number", backend)).to.deep.equal({
                buildServiceAccount: gcb.getDefaultServiceAccount("number"),
                runServiceAccount: await gce.getDefaultServiceAccount("number"),
            });
        });
    });
    describe("upsertSecret", () => {
        it("errors if a user tries to change replication policies (was global)", async () => {
            gcsm.getSecret.withArgs("project", "secret").resolves({
                name: "secret",
                projectId: "project",
                labels: gcsm.labels("apphosting"),
                replication: {
                    automatic: {},
                },
            });
            await (0, chai_1.expect)(secrets.upsertSecret("project", "secret", "us-central1")).to.eventually.equal(null);
            (0, chai_1.expect)(utils.logLabeledError).to.have.been.calledWith("apphosting", "Secret replication policies cannot be changed after creation");
        });
        it("errors if a user tries to change replication policies (was another region)", async () => {
            gcsm.getSecret.withArgs("project", "secret").resolves({
                name: "secret",
                projectId: "project",
                labels: gcsm.labels("apphosting"),
                replication: {
                    userManaged: {
                        replicas: [
                            {
                                location: "us-west1",
                            },
                        ],
                    },
                },
            });
            await (0, chai_1.expect)(secrets.upsertSecret("project", "secret", "us-central1")).to.eventually.equal(null);
            (0, chai_1.expect)(utils.logLabeledError).to.have.been.calledWith("apphosting", "Secret replication policies cannot be changed after creation");
        });
        it("noops if a secret already exists (location set)", async () => {
            gcsm.getSecret.withArgs("project", "secret").resolves({
                name: "secret",
                projectId: "project",
                labels: gcsm.labels("apphosting"),
                replication: {
                    userManaged: {
                        replicas: [
                            {
                                location: "us-central1",
                            },
                        ],
                    },
                },
            });
            await (0, chai_1.expect)(secrets.upsertSecret("project", "secret", "us-central1")).to.eventually.equal(false);
            (0, chai_1.expect)(utils.logLabeledError).to.not.have.been.called;
        });
        it("noops if a secret already exists (automatic replication)", async () => {
            gcsm.getSecret.withArgs("project", "secret").resolves({
                name: "secret",
                projectId: "project",
                labels: gcsm.labels("apphosting"),
                replication: {
                    automatic: {},
                },
            });
            await (0, chai_1.expect)(secrets.upsertSecret("project", "secret")).to.eventually.equal(false);
            (0, chai_1.expect)(utils.logLabeledError).to.not.have.been.called;
        });
        it("confirms before erasing functions garbage collection (choose yes)", async () => {
            gcsm.getSecret.withArgs("project", "secret").resolves({
                name: "secret",
                projectId: "project",
                labels: gcsm.labels("functions"),
                replication: {
                    automatic: {},
                },
            });
            prompt.confirm.resolves(true);
            await (0, chai_1.expect)(secrets.upsertSecret("project", "secret")).to.eventually.equal(false);
            (0, chai_1.expect)(utils.logLabeledWarning).to.have.been.calledWith("apphosting", "Cloud Functions for Firebase currently manages versions of secret. " +
                "Continuing will disable automatic deletion of old versions.");
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWithMatch({
                message: "Do you wish to continue?",
                default: false,
            });
            (0, chai_1.expect)(gcsm.patchSecret).to.have.been.calledWithMatch("project", "secret", {});
        });
        it("confirms before erasing functions garbage collection (choose no)", async () => {
            gcsm.getSecret.withArgs("project", "secret").resolves({
                name: "secret",
                projectId: "project",
                labels: gcsm.labels("functions"),
                replication: {
                    automatic: {},
                },
            });
            prompt.confirm.resolves(false);
            await (0, chai_1.expect)(secrets.upsertSecret("project", "secret")).to.eventually.equal(null);
            (0, chai_1.expect)(utils.logLabeledWarning).to.have.been.calledWith("apphosting", "Cloud Functions for Firebase currently manages versions of secret. " +
                "Continuing will disable automatic deletion of old versions.");
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWithMatch({
                message: "Do you wish to continue?",
                default: false,
            });
            (0, chai_1.expect)(gcsm.patchSecret).to.not.have.been.called;
        });
        it("Creates a secret if none exists", async () => {
            gcsm.getSecret.withArgs("project", "secret").rejects({ status: 404 });
            await (0, chai_1.expect)(secrets.upsertSecret("project", "secret")).to.eventually.equal(true);
            (0, chai_1.expect)(gcsm.createSecret).to.have.been.calledWithMatch("project", "secret", gcsm.labels("apphosting"), undefined);
        });
    });
    describe("toMulti", () => {
        it("handles different service accounts", () => {
            (0, chai_1.expect)(secrets.toMulti({ buildServiceAccount: "buildSA", runServiceAccount: "computeSA" })).to.deep.equal({
                buildServiceAccounts: ["buildSA"],
                runServiceAccounts: ["computeSA"],
            });
        });
        it("handles the same service account", () => {
            (0, chai_1.expect)(secrets.toMulti({ buildServiceAccount: "explicitSA", runServiceAccount: "explicitSA" })).to.deep.equal({
                buildServiceAccounts: ["explicitSA"],
                runServiceAccounts: [],
            });
        });
    });
    describe("grantSecretAccess", () => {
        const secret = {
            name: "secret",
            projectId: "projectId",
        };
        const existingPolicy = {
            version: 1,
            etag: "tag",
            bindings: [
                {
                    role: "roles/viewer",
                    members: ["serviceAccount:existingSA"],
                },
            ],
        };
        it("should grant access to the appropriate service accounts", async () => {
            gcsm.getIamPolicy.resolves(existingPolicy);
            gcsm.setIamPolicy.resolves();
            await secrets.grantSecretAccess(secret.projectId, "12345", secret.name, {
                buildServiceAccounts: ["buildSA"],
                runServiceAccounts: ["computeSA"],
            });
            const newBindings = [
                {
                    role: "roles/viewer",
                    members: [`serviceAccount:existingSA`],
                },
                {
                    role: "roles/secretmanager.secretAccessor",
                    members: ["serviceAccount:buildSA", "serviceAccount:computeSA"],
                },
                {
                    role: "roles/secretmanager.viewer",
                    members: ["serviceAccount:buildSA"],
                },
                {
                    role: "roles/secretmanager.secretVersionManager",
                    members: [
                        "serviceAccount:service-12345@gcp-sa-firebaseapphosting.iam.gserviceaccount.com",
                    ],
                },
            ];
            (0, chai_1.expect)(gcsm.getIamPolicy).to.be.calledWithMatch(secret);
            (0, chai_1.expect)(gcsm.setIamPolicy).to.be.calledWithMatch(secret, newBindings);
        });
    });
    describe("grantEmailsSecretAccess", () => {
        const secret = {
            projectId: "projectId",
            name: "secret",
        };
        const secret2 = {
            projectId: "projectId",
            name: "secret2",
        };
        const existingPolicy = {
            version: 1,
            etag: "tag",
            bindings: [
                {
                    role: "roles/viewer",
                    members: ["serviceAccount:existingSA"],
                },
            ],
        };
        it("should brute force its way to success", async () => {
            gcsm.getIamPolicy.resolves(existingPolicy);
            gcsm.setIamPolicy
                .onFirstCall()
                .rejects(new error_1.FirebaseError('Principal mygroup@mydomain.com is of type "group". The principal should appear as "group:mygroup@mydomain.com"'));
            gcsm.setIamPolicy.onSecondCall().resolves();
            await secrets.grantEmailsSecretAccess(secret.projectId, [secret.name], ["user@mydomain.com", "mygroup@mydomain.com"]);
            (0, chai_1.expect)(gcsm.getIamPolicy).to.be.calledWithMatch(secret);
            (0, chai_1.expect)(gcsm.setIamPolicy.firstCall).to.be.calledWithMatch(secret, [
                {
                    role: "roles/viewer",
                    members: ["serviceAccount:existingSA"],
                },
                {
                    role: "roles/secretmanager.secretAccessor",
                    members: ["user:user@mydomain.com", "user:mygroup@mydomain.com"],
                },
            ]);
            (0, chai_1.expect)(gcsm.setIamPolicy.secondCall).to.be.calledWithMatch(secret, [
                {
                    role: "roles/viewer",
                    members: ["serviceAccount:existingSA"],
                },
                {
                    role: "roles/secretmanager.secretAccessor",
                    members: ["user:user@mydomain.com", "group:mygroup@mydomain.com"],
                },
            ]);
        });
        it("Should remember what it learns while brute forcing across multiple secrets", async () => {
            gcsm.getIamPolicy.resolves(existingPolicy);
            gcsm.setIamPolicy
                .onFirstCall()
                .rejects(new error_1.FirebaseError('Principal mygroup@mydomain.com is of type "group". The principal should appear as "group:mygroup@mydomain.com"'));
            gcsm.setIamPolicy.onSecondCall().resolves();
            gcsm.setIamPolicy.onThirdCall().resolves();
            await secrets.grantEmailsSecretAccess(secret.projectId, [secret.name, secret2.name], ["user@mydomain.com", "mygroup@mydomain.com"]);
            (0, chai_1.expect)(gcsm.getIamPolicy).to.be.calledWithMatch(secret);
            (0, chai_1.expect)(gcsm.setIamPolicy).to.be.calledThrice;
            (0, chai_1.expect)(gcsm.setIamPolicy.firstCall).to.be.calledWithMatch(secret, [
                {
                    role: "roles/viewer",
                    members: ["serviceAccount:existingSA"],
                },
                {
                    role: "roles/secretmanager.secretAccessor",
                    members: ["user:user@mydomain.com", "user:mygroup@mydomain.com"],
                },
            ]);
            (0, chai_1.expect)(gcsm.setIamPolicy.secondCall).to.be.calledWithMatch(secret, [
                {
                    role: "roles/viewer",
                    members: ["serviceAccount:existingSA"],
                },
                {
                    role: "roles/secretmanager.secretAccessor",
                    members: ["user:user@mydomain.com", "group:mygroup@mydomain.com"],
                },
            ]);
            (0, chai_1.expect)(gcsm.setIamPolicy.thirdCall).to.be.calledWithMatch(secret2, [
                {
                    role: "roles/viewer",
                    members: ["serviceAccount:existingSA"],
                },
                {
                    role: "roles/secretmanager.secretAccessor",
                    members: ["user:user@mydomain.com", "group:mygroup@mydomain.com"],
                },
            ]);
        });
        it("Should fail if the error is not specifically a principal type error", async () => {
            gcsm.getIamPolicy.resolves(existingPolicy);
            gcsm.setIamPolicy.rejects(new error_1.FirebaseError("Some other error"));
            await (0, chai_1.expect)(secrets.grantEmailsSecretAccess(secret.projectId, [secret.name], ["user@mydomain.com"])).to.eventually.be.rejectedWith(/Failed to set IAM bindings/);
        });
    });
    describe("fetchSecrets", () => {
        const projectId = "randomProject";
        it("correctly attempts to fetch secret and it's version", async () => {
            const secretSource = [
                {
                    variable: "PINNED_API_KEY",
                    secret: "myApiKeySecret@5",
                },
            ];
            gcsm.accessSecretVersion.returns(Promise.resolve("some-value"));
            await secrets.fetchSecrets(projectId, secretSource);
            (0, chai_1.expect)(gcsm.accessSecretVersion).calledOnce;
            (0, chai_1.expect)(gcsm.accessSecretVersion).calledWithExactly(projectId, "myApiKeySecret", "5");
        });
        it("fetches latest version if version not explicitely provided", async () => {
            const secretSource = [
                {
                    variable: "VERBOSE_API_KEY",
                    secret: "projects/test-project/secrets/secretID",
                },
            ];
            gcsm.accessSecretVersion.returns(Promise.resolve("some-value"));
            await secrets.fetchSecrets(projectId, secretSource);
            (0, chai_1.expect)(gcsm.accessSecretVersion).calledOnce;
            (0, chai_1.expect)(gcsm.accessSecretVersion).calledWithExactly(projectId, "projects/test-project/secrets/secretID", "latest");
        });
    });
});
//# sourceMappingURL=index.spec.js.map