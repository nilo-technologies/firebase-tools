"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const localFunction_1 = require("./localFunction");
const EMULATED_TRIGGER = {
    id: "fn",
    region: "us-central1",
    platform: "gcfv1",
    availableMemoryMb: 1024,
    entryPoint: "test-resource",
    name: "test-resource",
    timeoutSeconds: 3,
};
describe("constructAuth", () => {
    const lf = new localFunction_1.default(EMULATED_TRIGGER, {}, {});
    describe("#_constructAuth", () => {
        it("warn if opts.auth and opts.authType are conflicting", () => {
            (0, chai_1.expect)(() => {
                return lf.constructAuth({ uid: "something" }, "UNAUTHENTICATED");
            }).to.throw("incompatible");
            (0, chai_1.expect)(() => {
                return lf.constructAuth({ admin: false, uid: "something" }, "ADMIN");
            }).to.throw("incompatible");
        });
        it("construct the correct auth for admin users", () => {
            (0, chai_1.expect)(lf.constructAuth(undefined, "ADMIN")).to.deep.equal({ admin: true });
        });
        it("construct the correct auth for unauthenticated users", () => {
            (0, chai_1.expect)(lf.constructAuth(undefined, "UNAUTHENTICATED")).to.deep.equal({
                admin: false,
            });
        });
        it("construct the correct auth for authenticated users", () => {
            (0, chai_1.expect)(lf.constructAuth(undefined, "USER")).to.deep.equal({
                admin: false,
                variable: { uid: "", token: {} },
            });
            (0, chai_1.expect)(lf.constructAuth({ uid: "11" }, "USER")).to.deep.equal({
                admin: false,
                variable: { uid: "11", token: {} },
            });
        });
        it("leaves auth untouched if it already follows wire format", () => {
            const auth = { admin: false, variable: { uid: "something" } };
            (0, chai_1.expect)(lf.constructAuth(auth)).to.deep.equal(auth);
        });
    });
});
describe("makeFirestoreValue", () => {
    const lf = new localFunction_1.default(EMULATED_TRIGGER, {}, {});
    it("returns {} when there is no data", () => {
        (0, chai_1.expect)(lf.makeFirestoreValue()).to.deep.equal({});
        (0, chai_1.expect)(lf.makeFirestoreValue(null)).to.deep.equal({});
        (0, chai_1.expect)(lf.makeFirestoreValue({})).to.deep.equal({});
    });
    it("throws error when data is not key-value pairs", () => {
        (0, chai_1.expect)(() => {
            return lf.makeFirestoreValue("string");
        }).to.throw(Error);
    });
});
//# sourceMappingURL=localFunction.spec.js.map