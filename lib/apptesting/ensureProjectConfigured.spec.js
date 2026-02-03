"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const ensureApiEnabled = require("../ensureApiEnabled");
const iam = require("../gcp/iam");
const rm = require("../gcp/resourceManager");
const prompt = require("../prompt");
const utils = require("../utils");
const error_1 = require("../error");
const apptesting = require("./ensureProjectConfigured");
describe("ensureProjectConfigured", () => {
    const sandbox = sinon.createSandbox();
    let serviceAccountHasRolesStub;
    let confirmStub;
    let ensureApiEnabledStub;
    let createServiceAccountStub;
    let addServiceAccountToRolesStub;
    let logWarningStub;
    beforeEach(() => {
        serviceAccountHasRolesStub = sandbox.stub(rm, "serviceAccountHasRoles");
        confirmStub = sandbox.stub(prompt, "confirm");
        ensureApiEnabledStub = sandbox.stub(ensureApiEnabled, "ensure");
        createServiceAccountStub = sandbox.stub(iam, "createServiceAccount");
        addServiceAccountToRolesStub = sandbox.stub(rm, "addServiceAccountToRoles");
        logWarningStub = sandbox.stub(utils, "logWarning");
    });
    afterEach(() => {
        sandbox.verifyAndRestore();
    });
    const projectId = "test-project";
    const serviceAccount = "firebaseapptesting-test-runner@test-project.iam.gserviceaccount.com";
    const TEST_RUNNER_ROLE = "roles/firebaseapptesting.testRunner";
    it("should ensure all necessary APIs are enabled", async () => {
        serviceAccountHasRolesStub.resolves(true);
        ensureApiEnabledStub.resolves();
        await apptesting.ensureProjectConfigured(projectId);
        (0, chai_1.expect)(ensureApiEnabledStub).to.be.callCount(4);
        (0, chai_1.expect)(ensureApiEnabledStub).to.be.calledWith(projectId, "https://firebaseapptesting.googleapis.com", "Firebase App Testing", false);
        (0, chai_1.expect)(ensureApiEnabledStub).to.be.calledWith(projectId, "https://run.googleapis.com", "Cloud Run", false);
        (0, chai_1.expect)(ensureApiEnabledStub).to.be.calledWith(projectId, "https://storage.googleapis.com", "Cloud Storage", false);
        (0, chai_1.expect)(ensureApiEnabledStub).to.be.calledWith(projectId, "https://artifactregistry.googleapis.com", "Artifact Registry", false);
    });
    it("should do nothing if service account is already configured", async () => {
        ensureApiEnabledStub.resolves();
        serviceAccountHasRolesStub.resolves(true);
        await apptesting.ensureProjectConfigured(projectId);
        (0, chai_1.expect)(serviceAccountHasRolesStub).to.be.calledWith(projectId, serviceAccount, [TEST_RUNNER_ROLE], true);
        (0, chai_1.expect)(confirmStub).to.not.have.been.called;
        (0, chai_1.expect)(createServiceAccountStub).to.not.have.been.called;
        (0, chai_1.expect)(addServiceAccountToRolesStub).to.not.have.been.called;
    });
    it("should provision service account if user confirms", async () => {
        ensureApiEnabledStub.resolves();
        serviceAccountHasRolesStub.resolves(false);
        confirmStub.resolves(true);
        createServiceAccountStub.resolves();
        addServiceAccountToRolesStub.resolves();
        await apptesting.ensureProjectConfigured(projectId);
        (0, chai_1.expect)(serviceAccountHasRolesStub).to.be.calledWith(projectId, serviceAccount, [TEST_RUNNER_ROLE], true);
        (0, chai_1.expect)(confirmStub).to.be.calledOnce;
        (0, chai_1.expect)(createServiceAccountStub).to.be.calledWith(projectId, "firebaseapptesting-test-runner", sinon.match.string, sinon.match.string);
        (0, chai_1.expect)(addServiceAccountToRolesStub).to.be.calledWith(projectId, serviceAccount, [TEST_RUNNER_ROLE], true);
    });
    it("should throw error if user denies service account creation", async () => {
        ensureApiEnabledStub.resolves();
        serviceAccountHasRolesStub.resolves(false);
        confirmStub.resolves(false);
        await (0, chai_1.expect)(apptesting.ensureProjectConfigured(projectId)).to.be.rejectedWith(error_1.FirebaseError, /Firebase App Testing requires a service account/);
        (0, chai_1.expect)(confirmStub).to.be.calledOnce;
        (0, chai_1.expect)(createServiceAccountStub).to.not.have.been.called;
        (0, chai_1.expect)(addServiceAccountToRolesStub).to.not.have.been.called;
    });
    it("should handle service account already exists error", async () => {
        ensureApiEnabledStub.resolves();
        serviceAccountHasRolesStub.resolves(false);
        confirmStub.resolves(true);
        createServiceAccountStub.rejects(new error_1.FirebaseError("Already exists", { status: 409 }));
        addServiceAccountToRolesStub.resolves();
        await apptesting.ensureProjectConfigured(projectId);
        (0, chai_1.expect)(createServiceAccountStub).to.be.calledOnce;
        (0, chai_1.expect)(addServiceAccountToRolesStub).to.be.calledOnce;
    });
    it("should handle addServiceAccountToRoles 400 error", async () => {
        ensureApiEnabledStub.resolves();
        serviceAccountHasRolesStub.resolves(false);
        confirmStub.resolves(true);
        createServiceAccountStub.resolves();
        addServiceAccountToRolesStub.rejects(new error_1.FirebaseError("Bad request", { status: 400 }));
        await apptesting.ensureProjectConfigured(projectId);
        (0, chai_1.expect)(addServiceAccountToRolesStub).to.be.calledOnce;
        (0, chai_1.expect)(logWarningStub).to.be.calledWith(`Your App Testing runner service account, "${serviceAccount}", is still being provisioned in the background. If you encounter an error, please try again after a few moments.`);
    });
});
//# sourceMappingURL=ensureProjectConfigured.spec.js.map