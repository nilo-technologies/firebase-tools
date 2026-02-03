"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const firestore_bulkdelete_1 = require("./firestore-bulkdelete");
const fsi = require("../firestore/api");
const error_1 = require("../error");
const requireAuthModule = require("../requireAuth");
describe("firestore:bulkdelete", () => {
    const PROJECT = "test-project";
    const DATABASE = "test-database";
    const COLLECTION_IDS = ["collection1", "collection2"];
    let command;
    let firestoreApiStub;
    let requireAuthStub;
    beforeEach(() => {
        command = firestore_bulkdelete_1.command;
        firestoreApiStub = sinon.createStubInstance(fsi.FirestoreApi);
        requireAuthStub = sinon.stub(requireAuthModule, "requireAuth");
        sinon.stub(fsi, "FirestoreApi").returns(firestoreApiStub);
        requireAuthStub.resolves("a@b.com");
    });
    afterEach(() => {
        sinon.restore();
    });
    const mockResponse = (name) => {
        return {
            name,
        };
    };
    it("should throw an error if collection-ids is not provided", async () => {
        const options = {
            project: PROJECT,
        };
        await (0, chai_1.expect)(command.runner()(options)).to.be.rejectedWith(error_1.FirebaseError, "Missing required flag --collection-ids=[comma separated list of collection groups]");
    });
    it("should call bulkDeleteDocuments with the correct parameters", async () => {
        const options = {
            project: PROJECT,
            collectionIds: COLLECTION_IDS.join(","),
            force: true,
            json: true,
        };
        const expectedResponse = mockResponse("test-operation");
        firestoreApiStub.bulkDeleteDocuments.resolves(expectedResponse);
        const result = await command.runner()(options);
        (0, chai_1.expect)(result).to.deep.equal(expectedResponse);
        (0, chai_1.expect)(firestoreApiStub.bulkDeleteDocuments.calledOnceWith(PROJECT, "(default)", COLLECTION_IDS)).to.be.true;
    });
    it("should call bulkDeleteDocuments with the correct database", async () => {
        const options = {
            project: PROJECT,
            database: DATABASE,
            collectionIds: COLLECTION_IDS.join(","),
            force: true,
            json: true,
        };
        const expectedResponse = mockResponse("test-operation");
        firestoreApiStub.bulkDeleteDocuments.resolves(expectedResponse);
        const result = await command.runner()(options);
        (0, chai_1.expect)(result).to.deep.equal(expectedResponse);
        (0, chai_1.expect)(firestoreApiStub.bulkDeleteDocuments.calledOnceWith(PROJECT, DATABASE, COLLECTION_IDS))
            .to.be.true;
    });
    it("should throw an error if the API call fails", async () => {
        const options = {
            project: PROJECT,
            collectionIds: COLLECTION_IDS.join(","),
            force: true,
        };
        const apiError = new Error("API Error");
        firestoreApiStub.bulkDeleteDocuments.rejects(apiError);
        await (0, chai_1.expect)(command.runner()(options)).to.be.rejectedWith(apiError);
    });
});
//# sourceMappingURL=firestore-bulkdelete.spec.js.map