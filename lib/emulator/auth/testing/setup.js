"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_ID = void 0;
exports.describeAuthEmulator = describeAuthEmulator;
const sinon_1 = require("sinon");
const supertest = require("supertest");
const server_1 = require("../server");
const __1 = require("..");
exports.PROJECT_ID = "example";
function describeAuthEmulator(title, fn, singleProjectMode = __1.SingleProjectMode.NO_WARNING) {
    return describe(`Auth Emulator: ${title}`, function () {
        this.timeout(20000);
        let authApp;
        beforeEach("setup or reuse auth server", async () => {
            authApp = await createOrReuseApp(singleProjectMode);
        });
        let clock;
        beforeEach(() => {
            clock = (0, sinon_1.useFakeTimers)();
        });
        afterEach(() => clock.restore());
        return fn.call(this, { authApi: () => supertest(authApp), getClock: () => clock });
    });
}
const cachedAuthAppMap = new Map();
const projectStateForId = new Map();
async function createOrReuseApp(singleProjectMode) {
    let cachedAuthApp = cachedAuthAppMap.get(singleProjectMode);
    if (cachedAuthApp === undefined) {
        cachedAuthApp = await (0, server_1.createApp)(exports.PROJECT_ID, singleProjectMode, projectStateForId);
        cachedAuthAppMap.set(singleProjectMode, cachedAuthApp);
    }
    projectStateForId.clear();
    return cachedAuthApp;
}
//# sourceMappingURL=setup.js.map