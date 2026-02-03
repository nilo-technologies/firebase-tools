"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const k8s = require("./k8s");
describe("megabytes", () => {
    let Bytes;
    (function (Bytes) {
        Bytes[Bytes["KB"] = 1000] = "KB";
        Bytes[Bytes["MB"] = 1000000] = "MB";
        Bytes[Bytes["GB"] = 1000000000] = "GB";
        Bytes[Bytes["KiB"] = 1024] = "KiB";
        Bytes[Bytes["MiB"] = 1048576] = "MiB";
        Bytes[Bytes["GiB"] = 1073741824] = "GiB";
    })(Bytes || (Bytes = {}));
    it("Should handle decimal SI units", () => {
        (0, chai_1.expect)(k8s.mebibytes("1000k")).to.equal((1000 * Bytes.KB) / Bytes.MiB);
        (0, chai_1.expect)(k8s.mebibytes("1.5M")).to.equal((1.5 * Bytes.MB) / Bytes.MiB);
        (0, chai_1.expect)(k8s.mebibytes("1G")).to.equal(Bytes.GB / Bytes.MiB);
    });
    it("Should handle binary SI units", () => {
        (0, chai_1.expect)(k8s.mebibytes("1Mi")).to.equal(Bytes.MiB / Bytes.MiB);
        (0, chai_1.expect)(k8s.mebibytes("1Gi")).to.equal(Bytes.GiB / Bytes.MiB);
    });
    it("Should handle no unit", () => {
        (0, chai_1.expect)(k8s.mebibytes("100000")).to.equal(100000 / Bytes.MiB);
        (0, chai_1.expect)(k8s.mebibytes("1e9")).to.equal(1e9 / Bytes.MiB);
        (0, chai_1.expect)(k8s.mebibytes("1.5E6")).to.equal((1.5 * 1e6) / Bytes.MiB);
    });
});
//# sourceMappingURL=k8s.spec.js.map