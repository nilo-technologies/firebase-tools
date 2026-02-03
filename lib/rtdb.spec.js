"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const apiv2 = require("./apiv2");
const apiv2_1 = require("./apiv2");
const rtdb = require("./rtdb");
const management = require("./management/database");
const utils = require("./utils");
const error_1 = require("./error");
const node_fetch_1 = require("node-fetch");
const expect = chai.expect;
chai.use(sinonChai);
const PROJECT_ID = "the-best-project-o-ever";
const DATABASE_INSTANCE = "the-best-instance";
describe("rtdb", () => {
    let sinonSandbox;
    let client;
    beforeEach(() => {
        sinonSandbox = sinon.createSandbox();
        client = new apiv2_1.Client({ urlPrefix: "https://firebaseio.com", auth: true });
    });
    afterEach(() => {
        sinonSandbox.restore();
    });
    describe("updateRulesWithClient", () => {
        it("should resolve on success", async () => {
            const request = sinonSandbox.stub(client, "request").resolves({
                body: {},
                status: 200,
                response: new node_fetch_1.Response(),
            });
            const rules = { rules: { ".read": true } };
            await rtdb.updateRulesWithClient(client, rules);
            expect(request).to.be.calledOnceWith({
                method: "PUT",
                path: ".settings/rules.json",
                queryParams: {},
                body: rules,
                resolveOnHTTPError: true,
            });
        });
        it("should resolve on success with dryRun", async () => {
            const request = sinonSandbox.stub(client, "request").resolves({
                body: {},
                status: 200,
                response: new node_fetch_1.Response(),
            });
            const rules = { rules: { ".read": true } };
            await rtdb.updateRulesWithClient(client, rules, { dryRun: true });
            expect(request).to.be.calledOnceWith({
                method: "PUT",
                path: ".settings/rules.json",
                queryParams: { dryRun: "true" },
                body: rules,
                resolveOnHTTPError: true,
            });
        });
        it("should reject with a FirebaseError on 400", async () => {
            const request = sinonSandbox.stub(client, "request").resolves({
                body: { error: "Syntax error" },
                status: 400,
                response: new node_fetch_1.Response(),
            });
            const rules = { rules: { ".read": true } };
            await expect(rtdb.updateRulesWithClient(client, rules)).to.be.rejectedWith(error_1.FirebaseError, "Syntax error in database rules");
            expect(request).to.be.calledOnce;
        });
        it("should reject with a FirebaseError on >400", async () => {
            const request = sinonSandbox.stub(client, "request").resolves({
                body: {},
                status: 500,
                response: new node_fetch_1.Response(),
            });
            const rules = { rules: { ".read": true } };
            await expect(rtdb.updateRulesWithClient(client, rules)).to.be.rejectedWith(error_1.FirebaseError, "Unexpected error while deploying database rules.");
            expect(request).to.be.calledOnce;
        });
    });
    describe("updateRules", () => {
        it("should call updateRulesWithClient with the correct params", async () => {
            const mockRequest = sinon.stub().resolves({
                body: {},
                status: 200,
                response: new node_fetch_1.Response(),
            });
            const clientStub = sinonSandbox.stub(apiv2, "Client").returns({
                request: mockRequest,
            });
            const populateInstanceDetails = sinonSandbox
                .stub(management, "populateInstanceDetails")
                .onFirstCall()
                .callsFake(async (options) => {
                options.instanceDetails = {
                    name: DATABASE_INSTANCE,
                    project: PROJECT_ID,
                    databaseUrl: "https://firebaseio.com",
                    type: "DEFAULT_DATABASE",
                    state: "ACTIVE",
                };
            });
            const getDatabaseUrl = sinonSandbox
                .stub(utils, "getDatabaseUrl")
                .returns("https://firebaseio.com");
            const rules = { rules: { ".read": true } };
            await rtdb.updateRules(PROJECT_ID, DATABASE_INSTANCE, rules);
            expect(populateInstanceDetails).to.be.calledOnce;
            expect(getDatabaseUrl).to.be.calledOnce;
            expect(clientStub).to.be.calledOnceWith({ urlPrefix: "https://firebaseio.com" });
            expect(mockRequest).to.be.calledOnceWith({
                method: "PUT",
                path: ".settings/rules.json",
                queryParams: {},
                body: rules,
                resolveOnHTTPError: true,
            });
        });
        it("should throw an error if populateInstanceDetails fails", async () => {
            sinonSandbox.stub(management, "populateInstanceDetails").resolves();
            const rules = { rules: { ".read": true } };
            await expect(rtdb.updateRules(PROJECT_ID, DATABASE_INSTANCE, rules)).to.be.rejectedWith(error_1.FirebaseError, "Could not get instance details");
        });
    });
});
//# sourceMappingURL=rtdb.spec.js.map