"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const chai = require("chai");
const dataplaneClient_1 = require("./dataplaneClient");
chai.use(require("chai-as-promised"));
describe("dataplaneClient", () => {
    const servicePath = "projects/my-project/locations/us-central1/services/my-service";
    const connectorPath = `${servicePath}/connectors/my-connector`;
    afterEach(() => {
        nock.cleanAll();
    });
    describe("executeGraphQL", () => {
        it("should make a POST request to the executeGraphql endpoint", async () => {
            const requestBody = {
                query: "query { users { id } }",
            };
            const expectedResponse = { data: { users: [{ id: "1" }] } };
            nock("https://firebasedataconnect.googleapis.com")
                .post(`/v1/${servicePath}:executeGraphql`, (body) => body.query === requestBody.query)
                .reply(200, expectedResponse);
            const client = (0, dataplaneClient_1.dataconnectDataplaneClient)();
            const response = await (0, dataplaneClient_1.executeGraphQL)(client, servicePath, requestBody);
            (0, chai_1.expect)(response.body).to.deep.equal(expectedResponse);
        });
    });
    describe("executeGraphQLRead", () => {
        it("should make a POST request to the executeGraphqlRead endpoint", async () => {
            const requestBody = {
                query: "query { users { id } }",
            };
            const expectedResponse = { data: { users: [{ id: "1" }] } };
            nock("https://firebasedataconnect.googleapis.com")
                .post(`/v1/${servicePath}:executeGraphqlRead`, (body) => body.query === requestBody.query)
                .reply(200, expectedResponse);
            const client = (0, dataplaneClient_1.dataconnectDataplaneClient)();
            const response = await (0, dataplaneClient_1.executeGraphQLRead)(client, servicePath, requestBody);
            (0, chai_1.expect)(response.body).to.deep.equal(expectedResponse);
        });
    });
    describe("executeGraphQLQuery", () => {
        it("should make a POST request to the executeQuery endpoint", async () => {
            const requestBody = {
                operationName: "getUsers",
            };
            const expectedResponse = { data: { users: [{ id: "1" }] } };
            nock("https://firebasedataconnect.googleapis.com")
                .post(`/v1/${connectorPath}:executeQuery`, (body) => body.operationName === requestBody.operationName)
                .reply(200, expectedResponse);
            const client = (0, dataplaneClient_1.dataconnectDataplaneClient)();
            const response = await (0, dataplaneClient_1.executeGraphQLQuery)(client, connectorPath, requestBody);
            (0, chai_1.expect)(response.body).to.deep.equal(expectedResponse);
        });
    });
    describe("executeGraphQLMutation", () => {
        it("should make a POST request to the executeMutation endpoint", async () => {
            const requestBody = {
                operationName: "createUser",
            };
            const expectedResponse = { data: { createUser: { id: "1" } } };
            nock("https://firebasedataconnect.googleapis.com")
                .post(`/v1/${connectorPath}:executeMutation`, (body) => body.operationName === requestBody.operationName)
                .reply(200, expectedResponse);
            const client = (0, dataplaneClient_1.dataconnectDataplaneClient)();
            const response = await (0, dataplaneClient_1.executeGraphQLMutation)(client, connectorPath, requestBody);
            (0, chai_1.expect)(response.body).to.deep.equal(expectedResponse);
        });
    });
});
//# sourceMappingURL=dataplaneClient.spec.js.map