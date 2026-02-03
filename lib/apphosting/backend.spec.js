"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const promptImport = require("../prompt");
const apphosting = require("../gcp/apphosting");
const iam = require("../gcp/iam");
const resourceManager = require("../gcp/resourceManager");
const poller = require("../operation-poller");
const backend_1 = require("./backend");
const deploymentTool = require("../deploymentTool");
const error_1 = require("../error");
describe("apphosting setup functions", () => {
    const projectId = "projectId";
    const location = "us-central1";
    const backendId = "backendId";
    let promptStub;
    let pollOperationStub;
    let createBackendStub;
    let listBackendsStub;
    let deleteBackendStub;
    let updateTrafficStub;
    let listLocationsStub;
    let createServiceAccountStub;
    let addServiceAccountToRolesStub;
    let testResourceIamPermissionsStub;
    beforeEach(() => {
        promptStub = sinon.stub(promptImport);
        promptStub.input.throws("Unexpected input call");
        promptStub.confirm.throws("Unexpected confirm call");
        promptStub.select.throws("Unexpected select call");
        promptStub.checkbox.throws("Unepxected checkbox call");
        pollOperationStub = sinon.stub(poller, "pollOperation").throws("Unexpected pollOperation call");
        createBackendStub = sinon
            .stub(apphosting, "createBackend")
            .throws("Unexpected createBackend call");
        listBackendsStub = sinon
            .stub(apphosting, "listBackends")
            .throws("Unexpected listBackends call");
        deleteBackendStub = sinon
            .stub(apphosting, "deleteBackend")
            .throws("Unexpected deleteBackend call");
        updateTrafficStub = sinon
            .stub(apphosting, "updateTraffic")
            .throws("Unexpected updateTraffic call");
        listLocationsStub = sinon
            .stub(apphosting, "listLocations")
            .throws("Unexpected listLocations call");
        createServiceAccountStub = sinon
            .stub(iam, "createServiceAccount")
            .throws("Unexpected createServiceAccount call");
        addServiceAccountToRolesStub = sinon
            .stub(resourceManager, "addServiceAccountToRoles")
            .throws("Unexpected addServiceAccountToRoles call");
        testResourceIamPermissionsStub = sinon
            .stub(iam, "testResourceIamPermissions")
            .throws("Unexpected testResourceIamPermissions call");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("createBackend", () => {
        const webAppId = "webAppId";
        const op = {
            name: `projects/${projectId}/locations/${location}/backends/${backendId}`,
            done: true,
        };
        const completeBackend = {
            name: `projects/${projectId}/locations/${location}/backends/${backendId}`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const cloudBuildConnRepo = {
            name: `projects/${projectId}/locations/${location}/connections/framework-${location}/repositories/repoId`,
            cloneUri: "cloneUri",
            createTime: "0",
            updateTime: "1",
            deleteTime: "2",
            reconciling: true,
            uid: "1",
        };
        it("should create a new backend", async () => {
            createBackendStub.resolves(op);
            pollOperationStub.resolves(completeBackend);
            await (0, backend_1.createBackend)(projectId, location, backendId, "custom-service-account", cloudBuildConnRepo, webAppId);
            const backendInput = {
                servingLocality: "GLOBAL_ACCESS",
                codebase: {
                    repository: cloudBuildConnRepo.name,
                    rootDirectory: "/",
                },
                labels: deploymentTool.labels(),
                serviceAccount: "custom-service-account",
                appId: webAppId,
            };
            (0, chai_1.expect)(createBackendStub).to.be.calledWith(projectId, location, backendInput);
        });
        it("should set default rollout policy to 100% all at once", async () => {
            const completeTraffic = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}/traffic`,
                current: { splits: [] },
                reconciling: false,
                createTime: "0",
                updateTime: "1",
                etag: "",
                uid: "",
            };
            updateTrafficStub.resolves(op);
            pollOperationStub.resolves(completeTraffic);
            await (0, backend_1.setDefaultTrafficPolicy)(projectId, location, backendId, "main");
            (0, chai_1.expect)(updateTrafficStub).to.be.calledWith(projectId, location, backendId, {
                rolloutPolicy: {
                    codebaseBranch: "main",
                },
            });
        });
    });
    describe("ensureAppHostingComputeServiceAccount", () => {
        const serviceAccount = "hello@example.com";
        it("should succeed if the user has permissions for the service account", async () => {
            testResourceIamPermissionsStub.resolves();
            createServiceAccountStub.resolves();
            addServiceAccountToRolesStub.resolves();
            await (0, chai_1.expect)((0, backend_1.ensureAppHostingComputeServiceAccount)(projectId, serviceAccount)).to.be
                .fulfilled;
            (0, chai_1.expect)(testResourceIamPermissionsStub).to.be.calledOnce;
        });
        it("should still add permissions even if the service account already exists", async () => {
            testResourceIamPermissionsStub.resolves();
            createServiceAccountStub.rejects(new error_1.FirebaseError("error occurred", { status: 409 }));
            addServiceAccountToRolesStub.resolves();
            await (0, chai_1.expect)((0, backend_1.ensureAppHostingComputeServiceAccount)(projectId, serviceAccount)).to.be
                .fulfilled;
            (0, chai_1.expect)(addServiceAccountToRolesStub).to.be.calledOnce;
        });
        it("should succeed if the user can create the service account when it does not exist", async () => {
            testResourceIamPermissionsStub.rejects(new error_1.FirebaseError("Permission denied", { status: 404 }));
            createServiceAccountStub.resolves();
            addServiceAccountToRolesStub.resolves();
            await (0, chai_1.expect)((0, backend_1.ensureAppHostingComputeServiceAccount)(projectId, serviceAccount)).to.be
                .fulfilled;
            (0, chai_1.expect)(testResourceIamPermissionsStub).to.be.calledOnce;
            (0, chai_1.expect)(createServiceAccountStub).to.be.calledOnce;
            (0, chai_1.expect)(addServiceAccountToRolesStub).to.be.calledOnce;
        });
        it("should throw an error if the user does not have permissions", async () => {
            testResourceIamPermissionsStub.rejects(new error_1.FirebaseError("Permission denied", { status: 403 }));
            await (0, chai_1.expect)((0, backend_1.ensureAppHostingComputeServiceAccount)(projectId, serviceAccount)).to.be.rejectedWith(/Failed to create backend due to missing delegation permissions/);
            (0, chai_1.expect)(testResourceIamPermissionsStub).to.be.calledOnce;
            (0, chai_1.expect)(createServiceAccountStub).to.not.be.called;
            (0, chai_1.expect)(addServiceAccountToRolesStub).to.not.be.called;
        });
        it("should throw the error if the user cannot create the service account", async () => {
            testResourceIamPermissionsStub.rejects(new error_1.FirebaseError("Permission denied", { status: 404 }));
            createServiceAccountStub.rejects(new error_1.FirebaseError("failed to create SA"));
            await (0, chai_1.expect)((0, backend_1.ensureAppHostingComputeServiceAccount)(projectId, serviceAccount)).to.be.rejectedWith("failed to create SA");
            (0, chai_1.expect)(testResourceIamPermissionsStub).to.be.calledOnce;
            (0, chai_1.expect)(createServiceAccountStub).to.be.calledOnce;
            (0, chai_1.expect)(addServiceAccountToRolesStub).to.not.be.called;
        });
        it("should throw an unexpected error", async () => {
            testResourceIamPermissionsStub.rejects(new error_1.FirebaseError("Unexpected error", { status: 500 }));
            await (0, chai_1.expect)((0, backend_1.ensureAppHostingComputeServiceAccount)(projectId, serviceAccount)).to.be.rejectedWith("Unexpected error");
            (0, chai_1.expect)(testResourceIamPermissionsStub).to.be.calledOnce;
            (0, chai_1.expect)(createServiceAccountStub).to.not.be.called;
            (0, chai_1.expect)(addServiceAccountToRolesStub).to.not.be.called;
        });
    });
    describe("deleteBackendAndPoll", () => {
        it("should delete a backend", async () => {
            const op = {
                name: `projects/${projectId}/locations/${location}/backends/${backendId}`,
                done: true,
            };
            deleteBackendStub.resolves(op);
            pollOperationStub.resolves();
            await (0, backend_1.deleteBackendAndPoll)(projectId, location, backendId);
            (0, chai_1.expect)(deleteBackendStub).to.be.calledWith(projectId, location, backendId);
        });
    });
    describe("promptLocation", () => {
        const supportedLocations = [
            { name: "us-central1", locationId: "us-central1" },
            { name: "us-west1", locationId: "us-west1" },
        ];
        beforeEach(() => {
            listLocationsStub.returns(supportedLocations);
            promptStub.select.resolves(supportedLocations[0].locationId);
        });
        it("returns a location selection", async () => {
            const location = await (0, backend_1.promptLocation)(projectId, "");
            (0, chai_1.expect)(location).to.be.eq("us-central1");
        });
        it("uses a default location prompt if none is provided", async () => {
            await (0, backend_1.promptLocation)(projectId);
            (0, chai_1.expect)(promptStub.select).to.be.calledWith({
                default: "us-central1",
                message: "Please select a location:",
                choices: ["us-central1", "us-west1"],
            });
        });
        it("skips the prompt if there's only 1 valid location choice", async () => {
            listLocationsStub.returns(supportedLocations.slice(0, 1));
            await (0, chai_1.expect)((0, backend_1.promptLocation)(projectId, "Custom location prompt:")).to.eventually.equal(supportedLocations[0].locationId);
            (0, chai_1.expect)(promptStub.select).to.not.be.called;
        });
    });
    describe("chooseBackends", () => {
        const backendChickenAsia = {
            name: `projects/${projectId}/locations/asia-east1/backends/chicken`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const backendChickenEurope = {
            name: `projects/${projectId}/locations/europe-west4/backends/chicken`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const backendChickenUS = {
            name: `projects/${projectId}/locations/us-central1/backends/chicken`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const backendCow = {
            name: `projects/${projectId}/locations/asia-east1/backends/cow`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const allBackends = [backendChickenAsia, backendChickenEurope, backendChickenUS, backendCow];
        it("returns backend if only one is found", async () => {
            listBackendsStub.resolves({
                backends: allBackends,
            });
            await (0, chai_1.expect)((0, backend_1.chooseBackends)(projectId, "cow", "")).to.eventually.deep.equal([
                backendCow,
            ]);
        });
        it("throws if --force is used when multiple backends are found", async () => {
            listBackendsStub.resolves({
                backends: allBackends,
            });
            await (0, chai_1.expect)((0, backend_1.chooseBackends)(projectId, "chicken", "", true)).to.be.rejectedWith("Force cannot be used because multiple backends were found with ID chicken.");
        });
        it("throws if no backend is found", async () => {
            listBackendsStub.resolves({
                backends: allBackends,
            });
            await (0, chai_1.expect)((0, backend_1.chooseBackends)(projectId, "farmer", "")).to.be.rejectedWith('No backend named "farmer" found.');
        });
        it("lets user choose backends when more than one share a name", async () => {
            listBackendsStub.resolves({
                backends: allBackends,
            });
            promptStub.checkbox.resolves(["chicken(asia-east1)", "chicken(europe-west4)"]);
            await (0, chai_1.expect)((0, backend_1.chooseBackends)(projectId, "chicken", "")).to.eventually.deep.equal([backendChickenAsia, backendChickenEurope]);
        });
    });
    describe("getBackendForAmbiguousLocation", () => {
        const backendFoo = {
            name: `projects/${projectId}/locations/${location}/backends/foo`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const backendFooOtherRegion = {
            name: `projects/${projectId}/locations/otherRegion/backends/foo`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const backendBar = {
            name: `projects/${projectId}/locations/${location}/backends/bar`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        it("throws if there are no matching backends", async () => {
            listBackendsStub.resolves({ backends: [] });
            await (0, chai_1.expect)((0, backend_1.getBackendForAmbiguousLocation)(projectId, "baz", "")).to.be.rejectedWith(/No backend named "baz" found./);
        });
        it("returns unambiguous backend", async () => {
            listBackendsStub.resolves({ backends: [backendFoo, backendBar] });
            await (0, chai_1.expect)((0, backend_1.getBackendForAmbiguousLocation)(projectId, "foo", "")).to.eventually.equal(backendFoo);
        });
        it("prompts for location if backend is ambiguous", async () => {
            listBackendsStub.resolves({ backends: [backendFoo, backendFooOtherRegion, backendBar] });
            promptStub.select.resolves(location);
            await (0, chai_1.expect)((0, backend_1.getBackendForAmbiguousLocation)(projectId, "foo", "Please select the location of the backend you'd like to delete:")).to.eventually.equal(backendFoo);
            (0, chai_1.expect)(promptStub.select).to.be.calledWith({
                message: "Please select the location of the backend you'd like to delete:",
                choices: [location, "otherRegion"],
            });
        });
    });
    describe("getBackend", () => {
        const backendChickenAsia = {
            name: `projects/${projectId}/locations/asia-east1/backends/chicken`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const backendChickenEurope = {
            name: `projects/${projectId}/locations/europe-west4/backends/chicken`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const backendCow = {
            name: `projects/${projectId}/locations/us-central1/backends/cow`,
            labels: {},
            createTime: "0",
            updateTime: "1",
            uri: "https://placeholder.com",
        };
        const allBackends = [backendChickenAsia, backendChickenEurope, backendCow];
        it("throws if more than one backend is found", async () => {
            listBackendsStub.resolves({ backends: allBackends });
            await (0, chai_1.expect)((0, backend_1.getBackend)(projectId, "chicken")).to.be.rejectedWith("You have multiple backends with the same chicken ID in regions: " +
                "asia-east1, europe-west4. " +
                "This is not allowed until we can support more locations. " +
                "Please delete and recreate any backends that share an ID with another backend.");
        });
        it("throws if no backend is found", async () => {
            listBackendsStub.resolves({ backends: allBackends });
            await (0, chai_1.expect)((0, backend_1.getBackend)(projectId, "farmer")).to.be.rejectedWith("No backend named farmer found.");
        });
        it("returns backend", async () => {
            listBackendsStub.resolves({ backends: allBackends });
            await (0, chai_1.expect)((0, backend_1.getBackend)(projectId, "cow")).to.eventually.equal(backendCow);
        });
    });
});
//# sourceMappingURL=backend.spec.js.map