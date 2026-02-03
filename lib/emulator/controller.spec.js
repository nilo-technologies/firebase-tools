"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const registry_1 = require("./registry");
const chai_1 = require("chai");
const fakeEmulator_1 = require("./testing/fakeEmulator");
const controller_1 = require("./controller");
function createMockOptions(only, configValues) {
    const config = {
        get: (key) => configValues[key],
        has: (key) => !!configValues[key],
        src: {
            emulators: configValues,
            functions: configValues.functions,
        },
    };
    return {
        only,
        config,
        project: "test-project",
    };
}
describe("EmulatorController", () => {
    afterEach(async () => {
        await registry_1.EmulatorRegistry.stopAll();
    });
    it("should start and stop an emulator", async () => {
        const name = types_1.Emulators.FUNCTIONS;
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.false;
        const fake = await fakeEmulator_1.FakeEmulator.create(name);
        await registry_1.EmulatorRegistry.start(fake);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.true;
        (0, chai_1.expect)(registry_1.EmulatorRegistry.getInfo(name).port).to.eql(fake.getInfo().port);
    });
    describe("shouldStart", () => {
        it("should start the hub if a project is specified", () => {
            const options = { project: "test-project" };
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.HUB)).to.be.true;
        });
        it("should start the hub even if no project is specified", () => {
            const options = {};
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.HUB)).to.be.true;
        });
        it("should start the UI if options.ui is true", () => {
            const options = createMockOptions(undefined, {});
            options.ui = true;
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.UI)).to.be.true;
        });
        it("should start the UI if a project is specified and a UI-supported emulator is running", () => {
            const options = createMockOptions("firestore", { firestore: {} });
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.UI)).to.be.true;
        });
        it("should start the UI even if no project is specified", () => {
            const options = createMockOptions("firestore", { firestore: {} });
            delete options.project;
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.UI)).to.be.true;
        });
        it("should not start the UI if no UI-supported emulator is running", () => {
            const options = createMockOptions(undefined, {});
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.UI)).to.be.false;
        });
        it("should start an emulator if it's in the only string", () => {
            const options = createMockOptions("functions,hosting", {
                functions: { source: "functions" },
                hosting: {},
            });
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.FUNCTIONS)).to.be.true;
        });
        it("should not start an emulator if it's not in the only string", () => {
            const options = createMockOptions("functions", {
                functions: { source: "functions" },
                hosting: {},
            });
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.HOSTING)).to.be.false;
        });
        it("should not start an emulator if it's in the only string but has no config", () => {
            const options = createMockOptions("hosting,functions", {
                hosting: {},
            });
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.FUNCTIONS)).to.be.false;
        });
        it("should not start functions emulator if source directory is not configured", () => {
            const options = createMockOptions("functions", {
                functions: {},
            });
            (0, chai_1.expect)((0, controller_1.shouldStart)(options, types_1.Emulators.FUNCTIONS)).to.be.false;
        });
    });
}).timeout(2000);
//# sourceMappingURL=controller.spec.js.map