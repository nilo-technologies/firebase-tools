"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const filters_1 = require("./filters");
describe("getResourceFilters", () => {
    const cases = [
        {
            desc: "No filter",
        },
        {
            desc: "Product level",
            input: "dataconnect",
        },
        {
            desc: "Service level",
            input: "dataconnect:my-service",
            output: [
                {
                    serviceId: "my-service",
                    fullService: true,
                },
            ],
        },
        {
            desc: "Connector level",
            input: "dataconnect:my-service:my-connector",
            output: [
                {
                    serviceId: "my-service",
                    connectorId: "my-connector",
                },
            ],
        },
        {
            desc: "Schema only",
            input: "dataconnect:my-service:schema",
            output: [
                {
                    serviceId: "my-service",
                    schemaOnly: true,
                },
            ],
        },
        {
            desc: "Multiple filters",
            input: "dataconnect:my-service:schema,dataconnect:my-other-service:my-connector,dataconnect:my-other-service",
            output: [
                {
                    serviceId: "my-service",
                    schemaOnly: true,
                },
                {
                    serviceId: "my-other-service",
                    connectorId: "my-connector",
                },
                {
                    serviceId: "my-other-service",
                    fullService: true,
                },
            ],
        },
        {
            desc: "Invalid filter",
            input: "dataconnect:service:conn:schema",
            expectErr: true,
        },
    ];
    for (const c of cases) {
        it(c.desc, () => {
            try {
                (0, chai_1.expect)((0, filters_1.getResourceFilters)({ only: c.input })).to.deep.equal(c.output);
            }
            catch (err) {
                (0, chai_1.expect)(c.expectErr, `Unexepcted error ${err}`).to.be.true;
            }
        });
    }
});
//# sourceMappingURL=filters.spec.js.map