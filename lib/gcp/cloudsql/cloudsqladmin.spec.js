"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const sqladmin = require("../../gcp/cloudsql/cloudsqladmin");
const iam = require("../../gcp/iam");
const api_1 = require("../../api");
const operationPoller = require("../../operation-poller");
const config_1 = require("../../config");
const rc_1 = require("../../rc");
const PROJECT_ID = "test-project";
const INSTANCE_ID = "test-instance";
const DATABASE_ID = "test-database";
const USERNAME = "test-user";
const API_VERSION = "v1";
const options = {
    project: PROJECT_ID,
    auth: true,
    cwd: "",
    configPath: "",
    only: "",
    except: "",
    config: new config_1.Config({}, { projectDir: "", cwd: "" }),
    filteredTargets: [],
    force: false,
    nonInteractive: false,
    debug: false,
    rc: new rc_1.RC(),
};
describe("cloudsqladmin", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
        nock.cleanAll();
    });
    describe("iamUserIsCSQLAdmin", () => {
        it("should return true if user has required permissions", async () => {
            sandbox.stub(iam, "testIamPermissions").resolves({ allowed: [], missing: [], passed: true });
            const result = await sqladmin.iamUserIsCSQLAdmin(options);
            (0, chai_1.expect)(result).to.be.true;
        });
        it("should return false if user does not have required permissions", async () => {
            sandbox
                .stub(iam, "testIamPermissions")
                .resolves({ allowed: [], missing: ["p1"], passed: false });
            const result = await sqladmin.iamUserIsCSQLAdmin(options);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should return false on IAM error", async () => {
            sandbox.stub(iam, "testIamPermissions").rejects(new Error("IAM error"));
            const result = await sqladmin.iamUserIsCSQLAdmin(options);
            (0, chai_1.expect)(result).to.be.false;
        });
    });
    describe("listInstances", () => {
        it("should return a list of instances on success", async () => {
            const instances = [{ name: INSTANCE_ID }];
            nock((0, api_1.cloudSQLAdminOrigin)())
                .get(`/${API_VERSION}/projects/${PROJECT_ID}/instances`)
                .reply(200, { items: instances });
            const result = await sqladmin.listInstances(PROJECT_ID);
            (0, chai_1.expect)(result).to.deep.equal(instances);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should handle allowlist error", async () => {
            nock((0, api_1.cloudSQLAdminOrigin)())
                .post(`/${API_VERSION}/projects/${PROJECT_ID}/instances`)
                .reply(400, {
                error: {
                    message: "Not allowed to set system label: firebase-data-connect",
                },
            });
            await (0, chai_1.expect)(sqladmin.createInstance({
                projectId: PROJECT_ID,
                location: "us-central",
                instanceId: INSTANCE_ID,
                enableGoogleMlIntegration: false,
                freeTrialLabel: "nt",
            })).to.be.rejectedWith("Cloud SQL free trial instances are not yet available in us-central");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getInstance", () => {
        it("should return an instance on success", async () => {
            const instance = { name: INSTANCE_ID, state: "RUNNABLE" };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .get(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}`)
                .reply(200, instance);
            const result = await sqladmin.getInstance(PROJECT_ID, INSTANCE_ID);
            (0, chai_1.expect)(result).to.deep.equal(instance);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should update an instance with google ml integration", async () => {
            const instance = {
                name: INSTANCE_ID,
                project: PROJECT_ID,
                settings: { databaseFlags: [] },
            };
            const op = { name: "op-name", status: "DONE" };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .patch(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}`)
                .reply(200, op);
            sandbox.stub(operationPoller, "pollOperation").resolves(instance);
            const result = await sqladmin.updateInstanceForDataConnect(instance, true);
            (0, chai_1.expect)(result).to.deep.equal(instance);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw if instance is in a failed state", async () => {
            const instance = { name: INSTANCE_ID, state: "FAILED" };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .get(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}`)
                .reply(200, instance);
            await (0, chai_1.expect)(sqladmin.getInstance(PROJECT_ID, INSTANCE_ID)).to.be.rejected;
        });
    });
    describe("instanceConsoleLink", () => {
        it("should return the correct console link", () => {
            const link = sqladmin.instanceConsoleLink(PROJECT_ID, INSTANCE_ID);
            (0, chai_1.expect)(link).to.equal(`https://console.cloud.google.com/sql/instances/${INSTANCE_ID}/overview?project=${PROJECT_ID}`);
        });
    });
    describe("createInstance", () => {
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
            nock.cleanAll();
        });
        it("should create an paid instance", async () => {
            nock((0, api_1.cloudSQLAdminOrigin)())
                .post(`/${API_VERSION}/projects/${PROJECT_ID}/instances`)
                .reply(200, {});
            await sqladmin.createInstance({
                projectId: PROJECT_ID,
                location: "us-central",
                instanceId: INSTANCE_ID,
                enableGoogleMlIntegration: false,
                freeTrialLabel: "nt",
            });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should create a free instance.", async () => {
            nock((0, api_1.cloudSQLAdminOrigin)())
                .post(`/${API_VERSION}/projects/${PROJECT_ID}/instances`)
                .reply(200, {});
            await sqladmin.createInstance({
                projectId: PROJECT_ID,
                location: "us-central",
                instanceId: INSTANCE_ID,
                enableGoogleMlIntegration: false,
                freeTrialLabel: "ft",
            });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateInstanceForDataConnect", () => {
        it("should update an instance", async () => {
            const instance = {
                name: INSTANCE_ID,
                project: PROJECT_ID,
                settings: { databaseFlags: [] },
            };
            const op = { name: "op-name", status: "DONE" };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .patch(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}`)
                .reply(200, op);
            sandbox.stub(operationPoller, "pollOperation").resolves(instance);
            const result = await sqladmin.updateInstanceForDataConnect(instance, false);
            (0, chai_1.expect)(result).to.deep.equal(instance);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("Databases", () => {
        it("should list databases", async () => {
            const databases = [{ name: DATABASE_ID }];
            nock((0, api_1.cloudSQLAdminOrigin)())
                .get(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/databases`)
                .reply(200, { items: databases });
            const result = await sqladmin.listDatabases(PROJECT_ID, INSTANCE_ID);
            (0, chai_1.expect)(result).to.deep.equal(databases);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should get a database", async () => {
            const database = { name: DATABASE_ID };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .get(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/databases/${DATABASE_ID}`)
                .reply(200, database);
            const result = await sqladmin.getDatabase(PROJECT_ID, INSTANCE_ID, DATABASE_ID);
            (0, chai_1.expect)(result).to.deep.equal(database);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should create a database", async () => {
            const op = { name: "op-name", status: "DONE" };
            const database = { name: DATABASE_ID };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .post(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/databases`)
                .reply(200, op);
            sandbox.stub(operationPoller, "pollOperation").resolves(database);
            const result = await sqladmin.createDatabase(PROJECT_ID, INSTANCE_ID, DATABASE_ID);
            (0, chai_1.expect)(result).to.deep.equal(database);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should delete a database", async () => {
            const database = { name: DATABASE_ID };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .delete(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/databases/${DATABASE_ID}`)
                .reply(200, database);
            const result = await sqladmin.deleteDatabase(PROJECT_ID, INSTANCE_ID, DATABASE_ID);
            (0, chai_1.expect)(result).to.deep.equal(database);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("Users", () => {
        it("should create a user", async () => {
            const op = { name: "op-name", status: "DONE" };
            const user = { name: USERNAME };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .post(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/users`)
                .reply(200, op);
            sandbox.stub(operationPoller, "pollOperation").resolves(user);
            const result = await sqladmin.createUser(PROJECT_ID, INSTANCE_ID, "BUILT_IN", USERNAME);
            (0, chai_1.expect)(result).to.deep.equal(user);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should retry creating a user if built-in role is not ready", async () => {
            const op = { name: "op-name", status: "DONE" };
            const user = { name: USERNAME };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .post(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/users`)
                .reply(400, {
                error: {
                    message: "cloudsqliamuser",
                },
            });
            nock((0, api_1.cloudSQLAdminOrigin)())
                .post(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/users`)
                .reply(200, op);
            sandbox.stub(operationPoller, "pollOperation").resolves(user);
            const result = await sqladmin.createUser(PROJECT_ID, INSTANCE_ID, "BUILT_IN", USERNAME, undefined, 1);
            (0, chai_1.expect)(result).to.deep.equal(user);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should get a user", async () => {
            const user = { name: USERNAME };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .get(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/users/${USERNAME}`)
                .reply(200, user);
            const result = await sqladmin.getUser(PROJECT_ID, INSTANCE_ID, USERNAME);
            (0, chai_1.expect)(result).to.deep.equal(user);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should delete a user", async () => {
            const user = { name: USERNAME };
            nock((0, api_1.cloudSQLAdminOrigin)())
                .delete(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/users?name=${USERNAME}`)
                .reply(200, user);
            const result = await sqladmin.deleteUser(PROJECT_ID, INSTANCE_ID, USERNAME);
            (0, chai_1.expect)(result).to.deep.equal(user);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should list users", async () => {
            const users = [{ name: USERNAME }];
            nock((0, api_1.cloudSQLAdminOrigin)())
                .get(`/${API_VERSION}/projects/${PROJECT_ID}/instances/${INSTANCE_ID}/users`)
                .reply(200, { items: users });
            const result = await sqladmin.listUsers(PROJECT_ID, INSTANCE_ID);
            (0, chai_1.expect)(result).to.deep.equal(users);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=cloudsqladmin.spec.js.map