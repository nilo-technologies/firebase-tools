"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const names = require("./names");
describe("names.ts", () => {
    describe("parseServiceName", () => {
        const cases = [
            {
                desc: "should parse a well formed service name, and convert back",
                input: "projects/proj/locations/us-central1/services/serve",
                want: {
                    projectId: "proj",
                    location: "us-central1",
                    serviceId: "serve",
                },
            },
            {
                desc: "should error on an invalid service name",
                input: "projects/proj/locations/us-central1/functions/funky",
                want: {
                    error: true,
                },
            },
        ];
        for (const c of cases) {
            it(c.desc, () => {
                try {
                    const got = names.parseServiceName(c.input);
                    (0, chai_1.expect)(got.projectId).to.equal(c.want.projectId);
                    (0, chai_1.expect)(got.location).to.equal(c.want.location);
                    (0, chai_1.expect)(got.serviceId).to.equal(c.want.serviceId);
                    (0, chai_1.expect)(got.toString()).to.equal(c.input);
                }
                catch (err) {
                    (0, chai_1.expect)(c.want.error, `Unexpected error: ${err}`).to.be.true;
                }
            });
        }
    });
    describe("parseConnectorName", () => {
        const cases = [
            {
                desc: "should parse a well formed service name, and convert back",
                input: "projects/proj/locations/us-central1/services/serve/connectors/connect",
                want: {
                    projectId: "proj",
                    location: "us-central1",
                    serviceId: "serve",
                    connectorId: "connect",
                },
            },
            {
                desc: "should error on an invalid connector name",
                input: "projects/proj/locations/us-central1/functions/funky",
                want: {
                    error: true,
                },
            },
        ];
        for (const c of cases) {
            it(c.desc, () => {
                try {
                    const got = names.parseConnectorName(c.input);
                    (0, chai_1.expect)(got.projectId).to.equal(c.want.projectId);
                    (0, chai_1.expect)(got.location).to.equal(c.want.location);
                    (0, chai_1.expect)(got.serviceId).to.equal(c.want.serviceId);
                    (0, chai_1.expect)(got.connectorId).to.equal(c.want.connectorId);
                    (0, chai_1.expect)(got.toString()).to.equal(c.input);
                }
                catch (err) {
                    (0, chai_1.expect)(c.want.error, `Unexpected error: ${err}`).to.be.true;
                }
            });
        }
    });
});
//# sourceMappingURL=names.spec.js.map