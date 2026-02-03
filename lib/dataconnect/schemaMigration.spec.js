"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const schemaMigration_1 = require("./schemaMigration");
describe("serviceNameFromSchema", () => {
    it("main schema", () => {
        const schema = {
            name: "projects/project-id/locations/us-central1/services/service-id/schemas/main",
            datasources: [],
            source: {},
        };
        const serviceName = (0, schemaMigration_1.serviceNameFromSchema)(schema);
        (0, chai_1.expect)(serviceName).to.equal("projects/project-id/locations/us-central1/services/service-id");
    });
    it("secondary schema", () => {
        const schema = {
            name: "projects/project-id/locations/us-central1/services/service-id/schemas/schema-id",
            datasources: [],
            source: {},
        };
        const serviceName = (0, schemaMigration_1.serviceNameFromSchema)(schema);
        (0, chai_1.expect)(serviceName).to.equal("projects/project-id/locations/us-central1/services/service-id");
    });
    it("service named schemas", () => {
        const schema = {
            name: "projects/project-id/locations/us-central1/services/schemas/schemas/schema-id",
            datasources: [],
            source: {},
        };
        const serviceName = (0, schemaMigration_1.serviceNameFromSchema)(schema);
        (0, chai_1.expect)(serviceName).to.equal("projects/project-id/locations/us-central1/services/schemas");
    });
    it("schema named schemas", () => {
        const schema = {
            name: "projects/project-id/locations/us-central1/services/service-id/schemas/schemas",
            datasources: [],
            source: {},
        };
        const serviceName = (0, schemaMigration_1.serviceNameFromSchema)(schema);
        (0, chai_1.expect)(serviceName).to.equal("projects/project-id/locations/us-central1/services/service-id");
    });
});
//# sourceMappingURL=schemaMigration.spec.js.map