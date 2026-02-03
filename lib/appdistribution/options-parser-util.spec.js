"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const options_parser_util_1 = require("./options-parser-util");
const error_1 = require("../error");
const fs = require("fs-extra");
const node_fs_1 = require("node:fs");
const tmp = require("tmp");
const path_1 = require("path");
tmp.setGracefulCleanup();
describe("options-parser-util", () => {
    const tempdir = tmp.dirSync();
    const passwordFile = (0, path_1.join)(tempdir.name, "password.txt");
    fs.outputFileSync(passwordFile, "password-from-file\n");
    after(() => {
        (0, node_fs_1.rmSync)(tempdir.name, { recursive: true });
    });
    describe("getTestDevices", () => {
        it("parses a test device", () => {
            const optionValue = "model=modelname,version=123,orientation=landscape,locale=en_US";
            const result = (0, options_parser_util_1.parseTestDevices)(optionValue, "");
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    model: "modelname",
                    version: "123",
                    orientation: "landscape",
                    locale: "en_US",
                },
            ]);
        });
        it("parses multiple semicolon-separated test devices", () => {
            const optionValue = "model=modelname,version=123,orientation=landscape,locale=en_US;model=modelname2,version=456,orientation=portrait,locale=es";
            const result = (0, options_parser_util_1.parseTestDevices)(optionValue, "");
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    model: "modelname",
                    version: "123",
                    orientation: "landscape",
                    locale: "en_US",
                },
                {
                    model: "modelname2",
                    version: "456",
                    orientation: "portrait",
                    locale: "es",
                },
            ]);
        });
        it("parses multiple newline-separated test devices", () => {
            const optionValue = "model=modelname,version=123,orientation=landscape,locale=en_US\nmodel=modelname2,version=456,orientation=portrait,locale=es";
            const result = (0, options_parser_util_1.parseTestDevices)(optionValue, "");
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    model: "modelname",
                    version: "123",
                    orientation: "landscape",
                    locale: "en_US",
                },
                {
                    model: "modelname2",
                    version: "456",
                    orientation: "portrait",
                    locale: "es",
                },
            ]);
        });
        it("throws an error with correct format when missing a field", () => {
            const optionValue = "model=modelname,version=123,locale=en_US";
            (0, chai_1.expect)(() => (0, options_parser_util_1.parseTestDevices)(optionValue, "")).to.throw(error_1.FirebaseError, "model=<model-id>,version=<os-version-id>,locale=<locale>,orientation=<orientation>");
        });
        it("throws an error with expected fields when field is unexpected", () => {
            const optionValue = "model=modelname,version=123,orientation=landscape,locale=en_US,notafield=blah";
            (0, chai_1.expect)(() => (0, options_parser_util_1.parseTestDevices)(optionValue, "")).to.throw(error_1.FirebaseError, "model, version, orientation, locale");
        });
    });
    describe("getLoginCredential", () => {
        it("returns credential for username and password", () => {
            const result = (0, options_parser_util_1.getLoginCredential)({ username: "user", password: "123" });
            (0, chai_1.expect)(result).to.deep.equal({
                username: "user",
                password: "123",
                fieldHints: undefined,
            });
        });
        it("returns credential for username and passwordFile", () => {
            const result = (0, options_parser_util_1.getLoginCredential)({ username: "user", passwordFile });
            (0, chai_1.expect)(result).to.deep.equal({
                username: "user",
                password: "password-from-file",
                fieldHints: undefined,
            });
        });
        it("returns undefined when no options provided", () => {
            const result = (0, options_parser_util_1.getLoginCredential)({});
            (0, chai_1.expect)(result).to.be.undefined;
        });
        it("returns credential for username, password, and resource names", () => {
            const result = (0, options_parser_util_1.getLoginCredential)({
                username: "user",
                password: "123",
                usernameResourceName: "username_resource_id",
                passwordResourceName: "password_resource_id",
            });
            (0, chai_1.expect)(result).to.deep.equal({
                username: "user",
                password: "123",
                fieldHints: {
                    usernameResourceName: "username_resource_id",
                    passwordResourceName: "password_resource_id",
                },
            });
        });
        it("returns credential for username, passwordFile, and resource names", () => {
            const result = (0, options_parser_util_1.getLoginCredential)({
                username: "user",
                passwordFile,
                usernameResourceName: "username_resource_id",
                passwordResourceName: "password_resource_id",
            });
            (0, chai_1.expect)(result).to.deep.equal({
                username: "user",
                password: "password-from-file",
                fieldHints: {
                    usernameResourceName: "username_resource_id",
                    passwordResourceName: "password_resource_id",
                },
            });
        });
        it("throws error when username and password not provided together", () => {
            (0, chai_1.expect)(() => (0, options_parser_util_1.getLoginCredential)({ username: "user" })).to.throw(error_1.FirebaseError, "Username and password for automated tests need to be specified together");
        });
        it("throws error when password (but not username) resource provided", () => {
            (0, chai_1.expect)(() => (0, options_parser_util_1.getLoginCredential)({
                username: "user",
                password: "123",
                passwordResourceName: "password_resource_id",
            })).to.throw(error_1.FirebaseError, "Username and password resource names for automated tests need to be specified together");
        });
        it("throws error when password file and password (but not username) resource provided", () => {
            (0, chai_1.expect)(() => (0, options_parser_util_1.getLoginCredential)({
                username: "user",
                passwordFile,
                passwordResourceName: "password_resource_id",
            })).to.throw(error_1.FirebaseError, "Username and password resource names for automated tests need to be specified together");
        });
        it("throws error when resource names provided without username and password", () => {
            (0, chai_1.expect)(() => (0, options_parser_util_1.getLoginCredential)({
                usernameResourceName: "username_resource_id",
                passwordResourceName: "password_resource_id",
            })).to.throw(error_1.FirebaseError, "Must specify username and password");
        });
    });
});
//# sourceMappingURL=options-parser-util.spec.js.map