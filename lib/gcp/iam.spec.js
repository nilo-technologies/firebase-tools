"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("../api");
const iam = require("./iam");
const BINDING = {
    role: "some/role",
    members: ["someuser"],
};
describe("iam", () => {
    describe("mergeBindings", () => {
        it("should not update the policy when the bindings are present", () => {
            const policy = {
                etag: "etag",
                version: 3,
                bindings: [BINDING],
            };
            const updated = iam.mergeBindings(policy, [BINDING]);
            (0, chai_1.expect)(updated).to.be.false;
            (0, chai_1.expect)(policy.bindings).to.deep.equal([BINDING]);
        });
        it("should update the members of a binding in the policy", () => {
            const policy = {
                etag: "etag",
                version: 3,
                bindings: [BINDING],
            };
            const updated = iam.mergeBindings(policy, [{ role: "some/role", members: ["newuser"] }]);
            (0, chai_1.expect)(updated).to.be.true;
            (0, chai_1.expect)(policy.bindings).to.deep.equal([
                {
                    role: "some/role",
                    members: ["someuser", "newuser"],
                },
            ]);
        });
        it("should add a new binding to the policy", () => {
            const policy = {
                etag: "etag",
                version: 3,
                bindings: [],
            };
            const updated = iam.mergeBindings(policy, [BINDING]);
            (0, chai_1.expect)(updated).to.be.true;
            (0, chai_1.expect)(policy.bindings).to.deep.equal([BINDING]);
        });
    });
    describe("testIamPermissions", () => {
        const tests = [
            {
                desc: "should pass if we have all permissions",
                permissionsToCheck: ["foo", "bar"],
                permissionsToReturn: ["foo", "bar"],
                wantAllowedPermissions: ["foo", "bar"].sort(),
                wantedPassed: true,
            },
            {
                desc: "should fail if we don't have all permissions",
                permissionsToCheck: ["foo", "bar"],
                permissionsToReturn: ["foo"],
                wantAllowedPermissions: ["foo"].sort(),
                wantMissingPermissions: ["bar"].sort(),
                wantedPassed: false,
            },
        ];
        for (const t of tests) {
            it(t.desc, async () => {
                nock((0, api_1.resourceManagerOrigin)())
                    .post(`/v1/projects/foo:testIamPermissions`)
                    .matchHeader("x-goog-user-project", "foo")
                    .reply(200, { permissions: t.permissionsToReturn });
                const res = await iam.testIamPermissions("foo", t.permissionsToCheck);
                (0, chai_1.expect)(res.allowed).to.deep.equal(t.wantAllowedPermissions);
                (0, chai_1.expect)(res.missing).to.deep.equal(t.wantMissingPermissions || []);
                (0, chai_1.expect)(res.passed).to.equal(t.wantedPassed);
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
        }
    });
});
//# sourceMappingURL=iam.spec.js.map