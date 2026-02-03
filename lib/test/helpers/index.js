"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAuth = mockAuth;
const auth = require("../../auth");
function mockAuth(sandbox) {
    const authMock = sandbox.mock(auth);
    authMock.expects("getAccessToken").atLeast(1).resolves({ access_token: "an_access_token" });
}
//# sourceMappingURL=index.js.map