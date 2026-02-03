"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const config_1 = require("../../config");
const apphosting_1 = require("./apphosting");
describe("apphosting", () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("upsertAppHostingConfig", () => {
        it("creates App Hosting section in firebase.json if no previous config exists", () => {
            const config = new config_1.Config({}, { projectDir: "test", cwd: "test" });
            const backendConfig = {
                backendId: "my-backend",
                rootDir: "/",
                ignore: [],
            };
            (0, apphosting_1.upsertAppHostingConfig)(backendConfig, config);
            (0, chai_1.expect)(config.src.apphosting).to.deep.equal(backendConfig);
        });
        it("converts App Hosting config into array when going from one backend to two", () => {
            const existingBackendConfig = {
                backendId: "my-backend",
                rootDir: "/",
                ignore: [],
            };
            const config = new config_1.Config({ apphosting: existingBackendConfig }, { projectDir: "test", cwd: "test" });
            const newBackendConfig = {
                backendId: "my-backend-1",
                rootDir: "/",
                ignore: [],
            };
            (0, apphosting_1.upsertAppHostingConfig)(newBackendConfig, config);
            (0, chai_1.expect)(config.src.apphosting).to.deep.equal([existingBackendConfig, newBackendConfig]);
        });
        it("appends backend config to array if there is already an array", () => {
            const appHostingConfig = [
                {
                    backendId: "my-backend-0",
                    rootDir: "/",
                    ignore: [],
                },
                {
                    backendId: "my-backend-1",
                    rootDir: "/",
                    ignore: [],
                },
            ];
            const config = new config_1.Config({ apphosting: appHostingConfig }, { projectDir: "test", cwd: "test" });
            const newBackendConfig = {
                backendId: "my-backend-2",
                rootDir: "/",
                ignore: [],
            };
            (0, apphosting_1.upsertAppHostingConfig)(newBackendConfig, config);
            (0, chai_1.expect)(config.src.apphosting).to.deep.equal([...appHostingConfig, newBackendConfig]);
        });
    });
}).timeout(5000);
//# sourceMappingURL=apphosting.spec.js.map