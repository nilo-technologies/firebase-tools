"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const _ = require("lodash");
const sinon = require("sinon");
const configstore_1 = require("../../configstore");
const project_1 = require("./project");
const projectManager = require("../../management/projects");
const config_1 = require("../../config");
const promptImport = require("../../prompt");
const requireAuthImport = require("../../requireAuth");
const TEST_FIREBASE_PROJECT = {
    projectId: "my-project-123",
    projectNumber: "123456789",
    displayName: "my-project",
    name: "projects/my-project",
    resources: {
        hostingSite: "my-project",
        realtimeDatabaseInstance: "my-project",
        storageBucket: "my-project.appspot.com",
        locationId: "us-central",
    },
};
describe("project", () => {
    const sandbox = sinon.createSandbox();
    let getProjectStub;
    let createFirebaseProjectStub;
    let getOrPromptProjectStub;
    let addFirebaseProjectStub;
    let promptAvailableProjectIdStub;
    let prompt;
    let configstoreSetStub;
    let emptyConfig;
    beforeEach(() => {
        sandbox.stub(requireAuthImport, "requireAuth").resolves();
        getProjectStub = sandbox.stub(projectManager, "getFirebaseProject");
        createFirebaseProjectStub = sandbox.stub(projectManager, "createFirebaseProjectAndLog");
        getOrPromptProjectStub = sandbox.stub(projectManager, "getOrPromptProject");
        addFirebaseProjectStub = sandbox.stub(projectManager, "addFirebaseToCloudProjectAndLog");
        promptAvailableProjectIdStub = sandbox.stub(projectManager, "promptAvailableProjectId");
        prompt = sandbox.stub(promptImport);
        prompt.select.rejects("Unexpected select call");
        prompt.input.rejects("Unexpected inptu call");
        prompt.confirm.rejects("Unexpected confirm call");
        configstoreSetStub = sandbox.stub(configstore_1.configstore, "set").throws("Unexpected configstore set");
        emptyConfig = new config_1.Config("{}", {});
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("doSetup", () => {
        describe('with "Use an existing project" option', () => {
            it("should set up the correct properties in the project", async () => {
                const options = { project: "my-project" };
                const setup = { config: {}, rcfile: {} };
                getProjectStub.onFirstCall().resolves(TEST_FIREBASE_PROJECT);
                prompt.select.onFirstCall().resolves("Use an existing project");
                getOrPromptProjectStub.onFirstCall().resolves(TEST_FIREBASE_PROJECT);
                configstoreSetStub.onFirstCall().resolves();
                await (0, project_1.doSetup)(setup, emptyConfig, options);
                (0, chai_1.expect)(_.get(setup, "projectId")).to.deep.equal("my-project-123");
                (0, chai_1.expect)(_.get(setup, "instance")).to.deep.equal("my-project");
                (0, chai_1.expect)(_.get(setup, "projectLocation")).to.deep.equal("us-central");
                (0, chai_1.expect)(_.get(setup.rcfile, "projects.default")).to.deep.equal("my-project-123");
                (0, chai_1.expect)(prompt.select).to.not.be.called;
                (0, chai_1.expect)(getOrPromptProjectStub).to.not.be.called;
            });
        });
        describe('with "Create a new project" option', () => {
            it("should create a new project and set up the correct properties", async () => {
                const options = {};
                const setup = { config: {}, rcfile: {} };
                prompt.select.onFirstCall().resolves("Create a new project");
                prompt.input.onFirstCall().resolves("my-project-123");
                prompt.input.onSecondCall().resolves("my-project");
                createFirebaseProjectStub.resolves(TEST_FIREBASE_PROJECT);
                configstoreSetStub.onFirstCall().resolves();
                await (0, project_1.doSetup)(setup, emptyConfig, options);
                (0, chai_1.expect)(_.get(setup, "projectId")).to.deep.equal("my-project-123");
                (0, chai_1.expect)(_.get(setup, "instance")).to.deep.equal("my-project");
                (0, chai_1.expect)(_.get(setup, "projectLocation")).to.deep.equal("us-central");
                (0, chai_1.expect)(_.get(setup.rcfile, "projects.default")).to.deep.equal("my-project-123");
                (0, chai_1.expect)(prompt.select).to.be.calledOnce;
                (0, chai_1.expect)(prompt.input).to.be.calledTwice;
                (0, chai_1.expect)(createFirebaseProjectStub).to.be.calledOnceWith("my-project-123", {
                    displayName: "my-project",
                });
            });
        });
        describe('with "Add Firebase resources to GCP project" option', () => {
            it("should add firebase resources and set up the correct properties", async () => {
                const options = {};
                const setup = { config: {}, rcfile: {} };
                prompt.select
                    .onFirstCall()
                    .resolves("Add Firebase to an existing Google Cloud Platform project");
                promptAvailableProjectIdStub.onFirstCall().resolves("my-project-123");
                addFirebaseProjectStub.onFirstCall().resolves(TEST_FIREBASE_PROJECT);
                configstoreSetStub.onFirstCall().resolves();
                await (0, project_1.doSetup)(setup, emptyConfig, options);
                (0, chai_1.expect)(_.get(setup, "projectId")).to.deep.equal("my-project-123");
                (0, chai_1.expect)(_.get(setup, "instance")).to.deep.equal("my-project");
                (0, chai_1.expect)(_.get(setup, "projectLocation")).to.deep.equal("us-central");
                (0, chai_1.expect)(_.get(setup.rcfile, "projects.default")).to.deep.equal("my-project-123");
                (0, chai_1.expect)(prompt.select).to.be.calledOnce;
                (0, chai_1.expect)(promptAvailableProjectIdStub).to.be.calledOnce;
                (0, chai_1.expect)(addFirebaseProjectStub).to.be.calledOnceWith("my-project-123");
            });
        });
        describe(`with "Don't set up a default project" option`, () => {
            it("should set up the correct properties when not choosing a project", async () => {
                const options = {};
                const setup = { config: {}, rcfile: {} };
                prompt.select.resolves("Don't set up a default project");
                await (0, project_1.doSetup)(setup, emptyConfig, options);
                (0, chai_1.expect)(setup).to.deep.equal({ config: {}, rcfile: {}, project: {} });
                (0, chai_1.expect)(prompt.select).to.be.calledOnce;
            });
        });
        describe("with defined .firebaserc file", () => {
            let options;
            let setup;
            beforeEach(() => {
                options = {};
                setup = { config: {}, rcfile: { projects: { default: "my-project-123" } } };
                getProjectStub.onFirstCall().resolves(TEST_FIREBASE_PROJECT);
                configstoreSetStub.onFirstCall().resolves();
            });
            it("should not prompt", async () => {
                await (0, project_1.doSetup)(setup, emptyConfig, options);
                (0, chai_1.expect)(prompt.select).to.be.not.called;
                (0, chai_1.expect)(prompt.input).to.be.not.called;
            });
            it("should set project location even if .firebaserc is already set up", async () => {
                await (0, project_1.doSetup)(setup, emptyConfig, options);
                (0, chai_1.expect)(_.get(setup, "projectId")).to.equal("my-project-123");
                (0, chai_1.expect)(_.get(setup, "projectLocation")).to.equal("us-central");
                (0, chai_1.expect)(getProjectStub).to.be.calledOnceWith("my-project-123");
            });
        });
    });
});
//# sourceMappingURL=project.spec.js.map