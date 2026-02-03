"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const util = require("./util");
describe("Database name parsing", () => {
    it("should parse a database other than (default) correctly", () => {
        const name = "projects/myproject/databases/named-db";
        (0, chai_1.expect)(util.parseDatabaseName(name)).to.eql({
            projectId: "myproject",
            databaseId: "named-db",
        });
    });
    it("should parse the (default) database name correctly", () => {
        const name = "projects/myproject/databases/(default)";
        (0, chai_1.expect)(util.parseDatabaseName(name)).to.eql({
            projectId: "myproject",
            databaseId: "(default)",
        });
    });
    it("should work even if the name has a trailing slash", () => {
        const name = "projects/myproject/databases/with-trailing-slash/";
        (0, chai_1.expect)(util.parseDatabaseName(name)).to.eql({
            projectId: "myproject",
            databaseId: "with-trailing-slash",
        });
    });
});
describe("IndexNameParsing", () => {
    it("should parse an index name correctly", () => {
        const name = "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123/";
        (0, chai_1.expect)(util.parseIndexName(name)).to.eql({
            projectId: "myproject",
            databaseId: "(default)",
            collectionGroupId: "collection",
            indexId: "abc123",
        });
    });
    it("should parse a field name correctly", () => {
        const name = "/projects/myproject/databases/(default)/collectionGroups/collection/fields/abc123/";
        (0, chai_1.expect)(util.parseFieldName(name)).to.eql({
            projectId: "myproject",
            databaseId: "(default)",
            collectionGroupId: "collection",
            fieldPath: "abc123",
        });
    });
    it("should parse an index name from a named database correctly", () => {
        const name = "/projects/myproject/databases/named-db/collectionGroups/collection/indexes/abc123/";
        (0, chai_1.expect)(util.parseIndexName(name)).to.eql({
            projectId: "myproject",
            databaseId: "named-db",
            collectionGroupId: "collection",
            indexId: "abc123",
        });
    });
    it("should parse a field name from a named database correctly", () => {
        const name = "/projects/myproject/databases/named-db/collectionGroups/collection/fields/abc123/";
        (0, chai_1.expect)(util.parseFieldName(name)).to.eql({
            projectId: "myproject",
            databaseId: "named-db",
            collectionGroupId: "collection",
            fieldPath: "abc123",
        });
    });
});
describe("Get current minute", () => {
    it("should be a string in ISO 8601 format with no second or millisecond component", () => {
        const currentMinuteString = util.getCurrentMinuteAsIsoString();
        (0, chai_1.expect)(currentMinuteString.endsWith("Z")).to.eql(true);
        const asDate = new Date(Date.parse(currentMinuteString));
        (0, chai_1.expect)(asDate.getSeconds()).to.eql(0);
        (0, chai_1.expect)(asDate.getMilliseconds()).to.eql(0);
    });
});
//# sourceMappingURL=util.spec.js.map