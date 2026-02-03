"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs");
const fsPromises = require("fs/promises");
const fsExtra = require("fs-extra");
const sinon = require("sinon");
const glob = require("glob");
const childProcess = require("child_process");
const error_1 = require("../../error");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const frameworksUtils = require("../utils");
const fsUtils = require("../../fsutils");
const testing_1 = require("./testing");
const i18n_1 = require("./testing/i18n");
describe("Next.js utils", () => {
    describe("cleanEscapedChars", () => {
        it("should clean escaped chars", () => {
            const testPath = "/\\(\\)\\{\\}\\:\\+\\?\\*/:slug";
            (0, chai_1.expect)(testPath.includes("\\(")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\(")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\)")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\)")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\{")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\{")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\}")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\}")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\:")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\:")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\+")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\+")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\?")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\?")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\*")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\*")).to.be.false;
        });
    });
    it("should allow supported rewrites", () => {
        (0, chai_1.expect)([...testing_1.supportedRewritesArray, ...testing_1.unsupportedRewritesArray].filter((it) => (0, utils_1.isRewriteSupportedByHosting)(it))).to.have.members(testing_1.supportedRewritesArray);
    });
    describe("isRedirectSupportedByFirebase", () => {
        it("should allow supported redirects", () => {
            (0, chai_1.expect)([...testing_1.supportedRedirects, ...testing_1.unsupportedRedirects].filter((it) => (0, utils_1.isRedirectSupportedByHosting)(it))).to.have.members(testing_1.supportedRedirects);
        });
    });
    describe("isHeaderSupportedByFirebase", () => {
        it("should allow supported headers", () => {
            (0, chai_1.expect)([...testing_1.supportedHeaders, ...testing_1.unsupportedHeaders].filter((it) => (0, utils_1.isHeaderSupportedByHosting)(it))).to.have.members(testing_1.supportedHeaders);
        });
    });
    describe("getNextjsRewritesToUse", () => {
        it("should use only beforeFiles", () => {
            if (!testing_1.supportedRewritesObject?.beforeFiles?.length) {
                throw new Error("beforeFiles must have rewrites");
            }
            const rewritesToUse = (0, utils_1.getNextjsRewritesToUse)(testing_1.supportedRewritesObject);
            for (const [i, rewrite] of testing_1.supportedRewritesObject.beforeFiles.entries()) {
                (0, chai_1.expect)(rewrite.source).to.equal(rewritesToUse[i].source);
                (0, chai_1.expect)(rewrite.destination).to.equal(rewritesToUse[i].destination);
            }
        });
        it("should return all rewrites if in array format", () => {
            const rewritesToUse = (0, utils_1.getNextjsRewritesToUse)(testing_1.supportedRewritesArray);
            (0, chai_1.expect)(rewritesToUse).to.have.length(testing_1.supportedRewritesArray.length);
        });
    });
    describe("usesAppDirRouter", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return false when app dir doesn't exist", () => {
            sandbox.stub(fs, "existsSync").returns(false);
            (0, chai_1.expect)((0, utils_1.usesAppDirRouter)("")).to.be.false;
        });
        it("should return true when app dir does exist", () => {
            sandbox.stub(fs, "existsSync").returns(true);
            (0, chai_1.expect)((0, utils_1.usesAppDirRouter)("")).to.be.true;
        });
    });
    describe("usesNextImage", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return true when export marker has isNextImageImported", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves({
                isNextImageImported: true,
            });
            (0, chai_1.expect)(await (0, utils_1.usesNextImage)("", "")).to.be.true;
        });
        it("should return false when export marker has !isNextImageImported", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves({
                isNextImageImported: false,
            });
            (0, chai_1.expect)(await (0, utils_1.usesNextImage)("", "")).to.be.false;
        });
    });
    describe("hasUnoptimizedImage", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return true when images manfiest indicates unoptimized", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves({
                images: { unoptimized: true },
            });
            (0, chai_1.expect)(await (0, utils_1.hasUnoptimizedImage)("", "")).to.be.true;
        });
        it("should return true when images manfiest indicates !unoptimized", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves({
                images: { unoptimized: false },
            });
            (0, chai_1.expect)(await (0, utils_1.hasUnoptimizedImage)("", "")).to.be.false;
        });
    });
    describe("isUsingMiddleware", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it("should return true if using middleware in development", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            (0, chai_1.expect)(await (0, utils_1.isUsingMiddleware)("", true)).to.be.true;
        });
        it("should return false if not using middleware in development", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(false);
            (0, chai_1.expect)(await (0, utils_1.isUsingMiddleware)("", true)).to.be.false;
        });
        it("should return true if using middleware in production", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves(testing_1.middlewareV2ManifestWhenUsed);
            (0, chai_1.expect)(await (0, utils_1.isUsingMiddleware)("", false)).to.be.true;
        });
        it("should return false if not using middleware in production", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves(testing_1.middlewareV2ManifestWhenNotUsed);
            (0, chai_1.expect)(await (0, utils_1.isUsingMiddleware)("", false)).to.be.false;
        });
    });
    describe("isUsingImageOptimization", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it("should return true if images optimization is used", async () => {
            const stub = sandbox.stub(frameworksUtils, "readJSON");
            stub.withArgs(constants_1.EXPORT_MARKER).resolves(testing_1.exportMarkerWithImage);
            stub.withArgs(constants_1.IMAGES_MANIFEST).resolves(testing_1.imagesManifest);
            (0, chai_1.expect)(await (0, utils_1.isUsingImageOptimization)("", "")).to.be.true;
        });
        it("should return false if isNextImageImported is false", async () => {
            const stub = sandbox.stub(frameworksUtils, "readJSON");
            stub.withArgs(constants_1.EXPORT_MARKER).resolves(testing_1.exportMarkerWithoutImage);
            (0, chai_1.expect)(await (0, utils_1.isUsingImageOptimization)("", "")).to.be.false;
        });
        it("should return false if `unoptimized` option is used", async () => {
            const stub = sandbox.stub(frameworksUtils, "readJSON");
            stub.withArgs(constants_1.EXPORT_MARKER).resolves(testing_1.exportMarkerWithImage);
            stub.withArgs(constants_1.IMAGES_MANIFEST).resolves(testing_1.imagesManifestUnoptimized);
            (0, chai_1.expect)(await (0, utils_1.isUsingImageOptimization)("", "")).to.be.false;
        });
    });
    describe("isUsingNextImageInAppDirectory", () => {
        describe("Next.js >= 13.4.10", () => {
            let sandbox;
            beforeEach(() => (sandbox = sinon.createSandbox()));
            afterEach(() => sandbox.restore());
            it("should return true when using next/image in the app directory", async () => {
                sandbox
                    .stub(glob, "sync")
                    .returns(["/path-to-app/.next/server/app/page_client-reference-manifest.js"]);
                sandbox.stub(fsPromises, "readFile").resolves(testing_1.pageClientReferenceManifestWithImage);
                (0, chai_1.expect)(await (0, utils_1.isUsingNextImageInAppDirectory)("", "")).to.be.true;
            });
            it("should return false when not using next/image in the app directory", async () => {
                sandbox.stub(fsPromises, "readFile").resolves(testing_1.pageClientReferenceManifestWithoutImage);
                const globStub = sandbox
                    .stub(glob, "sync")
                    .returns(["/path-to-app/.next/server/app/page_client-reference-manifest.js"]);
                (0, chai_1.expect)(await (0, utils_1.isUsingNextImageInAppDirectory)("", "")).to.be.false;
                globStub.restore();
                sandbox.stub(glob, "sync").returns([]);
                (0, chai_1.expect)(await (0, utils_1.isUsingNextImageInAppDirectory)("", "")).to.be.false;
            });
        });
        describe("Next.js < 13.4.10", () => {
            let sandbox;
            beforeEach(() => (sandbox = sinon.createSandbox()));
            afterEach(() => sandbox.restore());
            it("should return true when using next/image in the app directory", async () => {
                sandbox.stub(fsPromises, "readFile").resolves(testing_1.clientReferenceManifestWithImage);
                sandbox
                    .stub(glob, "sync")
                    .returns(["/path-to-app/.next/server/client-reference-manifest.js"]);
                (0, chai_1.expect)(await (0, utils_1.isUsingNextImageInAppDirectory)("", "")).to.be.true;
            });
            it("should return false when not using next/image in the app directory", async () => {
                sandbox.stub(fsPromises, "readFile").resolves(testing_1.clientReferenceManifestWithoutImage);
                sandbox.stub(glob, "sync").returns([]);
                (0, chai_1.expect)(await (0, utils_1.isUsingNextImageInAppDirectory)("", "")).to.be.false;
            });
        });
    });
    describe("isUsingAppDirectory", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it(`should return true if ${constants_1.APP_PATH_ROUTES_MANIFEST} exists`, () => {
            sandbox.stub(fsUtils, "fileExistsSync").returns(true);
            (0, chai_1.expect)((0, utils_1.isUsingAppDirectory)("")).to.be.true;
        });
        it(`should return false if ${constants_1.APP_PATH_ROUTES_MANIFEST} did not exist`, () => {
            sandbox.stub(fsUtils, "fileExistsSync").returns(false);
            (0, chai_1.expect)((0, utils_1.isUsingAppDirectory)("")).to.be.false;
        });
    });
    describe("cleanCustomRouteI18n", () => {
        it("should remove Next.js i18n prefix", () => {
            for (const path of i18n_1.pathsWithCustomRoutesInternalPrefix) {
                const cleanPath = (0, utils_1.cleanCustomRouteI18n)(path);
                (0, chai_1.expect)(!!path.match(utils_1.I18N_SOURCE)).to.be.true;
                (0, chai_1.expect)(!!cleanPath.match(utils_1.I18N_SOURCE)).to.be.false;
                (0, chai_1.expect)(cleanPath.startsWith("//")).to.be.false;
            }
        });
    });
    describe("allDependencyNames", () => {
        it("should return empty on stopping conditions", () => {
            (0, chai_1.expect)((0, utils_1.allDependencyNames)({})).to.eql([]);
            (0, chai_1.expect)((0, utils_1.allDependencyNames)({ version: "foo" })).to.eql([]);
        });
        it("should return expected dependency names", () => {
            (0, chai_1.expect)((0, utils_1.allDependencyNames)(testing_1.npmLsReturn)).to.eql([
                "@next/font",
                "next",
                "@next/env",
                "@next/swc-android-arm-eabi",
                "@next/swc-android-arm64",
                "@next/swc-darwin-arm64",
                "@next/swc-darwin-x64",
                "@next/swc-freebsd-x64",
                "@next/swc-linux-arm-gnueabihf",
                "@next/swc-linux-arm64-gnu",
                "@next/swc-linux-arm64-musl",
                "@next/swc-linux-x64-gnu",
                "@next/swc-linux-x64-musl",
                "@next/swc-win32-arm64-msvc",
                "@next/swc-win32-ia32-msvc",
                "@next/swc-win32-x64-msvc",
                "@swc/helpers",
                "tslib",
                "caniuse-lite",
                "fibers",
                "node-sass",
                "postcss",
                "nanoid",
                "picocolors",
                "source-map-js",
                "react-dom",
                "react",
                "sass",
                "styled-jsx",
                "client-only",
                "react",
                "react-dom",
                "loose-envify",
                "js-tokens",
                "react",
                "scheduler",
                "loose-envify",
                "react",
                "loose-envify",
            ]);
        });
    });
    describe("getMiddlewareMatcherRegexes", () => {
        it("should return regexes when using version 1", () => {
            const middlewareMatcherRegexes = (0, utils_1.getMiddlewareMatcherRegexes)(testing_1.middlewareV1ManifestWhenUsed);
            for (const regex of middlewareMatcherRegexes) {
                (0, chai_1.expect)(regex).to.be.an.instanceOf(RegExp);
            }
        });
        it("should return empty array when using version 1 but not using middleware", () => {
            const middlewareMatcherRegexes = (0, utils_1.getMiddlewareMatcherRegexes)(testing_1.middlewareV1ManifestWhenNotUsed);
            (0, chai_1.expect)(middlewareMatcherRegexes).to.eql([]);
        });
        it("should return regexes when using version 2", () => {
            const middlewareMatcherRegexes = (0, utils_1.getMiddlewareMatcherRegexes)(testing_1.middlewareV2ManifestWhenUsed);
            for (const regex of middlewareMatcherRegexes) {
                (0, chai_1.expect)(regex).to.be.an.instanceOf(RegExp);
            }
        });
        it("should return empty array when using version 2 but not using middleware", () => {
            const middlewareMatcherRegexes = (0, utils_1.getMiddlewareMatcherRegexes)(testing_1.middlewareV2ManifestWhenNotUsed);
            (0, chai_1.expect)(middlewareMatcherRegexes).to.eql([]);
        });
    });
    describe("getNonStaticRoutes", () => {
        it("should get non-static routes", () => {
            (0, chai_1.expect)((0, utils_1.getNonStaticRoutes)(testing_1.pagesManifest, Object.keys(testing_1.prerenderManifest.routes), Object.keys(testing_1.prerenderManifest.dynamicRoutes))).to.deep.equal(["/dynamic/[dynamic-slug]"]);
        });
    });
    describe("getNonStaticServerComponents", () => {
        it("should get non-static server components", () => {
            (0, chai_1.expect)((0, utils_1.getNonStaticServerComponents)(testing_1.appPathsManifest, testing_1.appPathRoutesManifest, Object.keys(testing_1.prerenderManifest.routes), Object.keys(testing_1.prerenderManifest.dynamicRoutes))).to.deep.equal(new Set(["/api/test/route"]));
        });
    });
    describe("getAppMetadataFromMetaFiles", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it("should return the correct headers and pprRoutes from meta files", async () => {
            const distDir = ".next";
            const readJsonStub = sandbox.stub(frameworksUtils, "readJSON");
            const dirExistsSyncStub = sandbox.stub(fsUtils, "dirExistsSync");
            const fileExistsSyncStub = sandbox.stub(fsUtils, "fileExistsSync");
            dirExistsSyncStub.withArgs(`${distDir}/server/app/api/static`).returns(true);
            fileExistsSyncStub.withArgs(`${distDir}/server/app/api/static.meta`).returns(true);
            readJsonStub.withArgs(`${distDir}/server/app/api/static.meta`).resolves(testing_1.metaFileContents);
            dirExistsSyncStub.withArgs(`${distDir}/server/app/ppr`).returns(true);
            fileExistsSyncStub.withArgs(`${distDir}/server/app/ppr.meta`).returns(true);
            readJsonStub.withArgs(`${distDir}/server/app/ppr.meta`).resolves({
                ...testing_1.metaFileContents,
                postponed: "true",
            });
            (0, chai_1.expect)(await (0, utils_1.getAppMetadataFromMetaFiles)(".", distDir, "/asdf", testing_1.appPathRoutesManifest)).to.deep.equal({
                headers: [
                    {
                        source: "/asdf/api/static",
                        headers: [
                            {
                                key: "content-type",
                                value: "application/json",
                            },
                            {
                                key: "custom-header",
                                value: "custom-value",
                            },
                        ],
                    },
                    {
                        source: "/asdf/ppr",
                        headers: [
                            {
                                key: "content-type",
                                value: "application/json",
                            },
                            {
                                key: "custom-header",
                                value: "custom-value",
                            },
                        ],
                    },
                ],
                pprRoutes: ["/ppr"],
            });
        });
    });
    describe("getNextVersion", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it("should get version", () => {
            sandbox.stub(frameworksUtils, "findDependency").returns({ version: "13.4.10" });
            (0, chai_1.expect)((0, utils_1.getNextVersion)("")).to.equal("13.4.10");
        });
        it("should ignore canary version", () => {
            sandbox.stub(frameworksUtils, "findDependency").returns({ version: "13.4.10-canary.0" });
            (0, chai_1.expect)((0, utils_1.getNextVersion)("")).to.equal("13.4.10");
        });
        it("should return undefined if unable to get version", () => {
            sandbox.stub(frameworksUtils, "findDependency").returns(undefined);
            (0, chai_1.expect)((0, utils_1.getNextVersion)("")).to.be.undefined;
        });
    });
    describe("getNextVersionRaw", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it("should get version", () => {
            sandbox.stub(frameworksUtils, "findDependency").returns({ version: "13.4.10" });
            (0, chai_1.expect)((0, utils_1.getNextVersionRaw)("")).to.equal("13.4.10");
        });
        it("should return exact version including canary", () => {
            sandbox.stub(frameworksUtils, "findDependency").returns({ version: "13.4.10-canary.0" });
            (0, chai_1.expect)((0, utils_1.getNextVersionRaw)("")).to.equal("13.4.10-canary.0");
        });
        it("should return undefined if unable to get version", () => {
            sandbox.stub(frameworksUtils, "findDependency").returns(undefined);
            (0, chai_1.expect)((0, utils_1.getNextVersionRaw)("")).to.be.undefined;
        });
    });
    describe("getRoutesWithServerAction", () => {
        it("should get routes with server action", () => {
            (0, chai_1.expect)((0, utils_1.getRoutesWithServerAction)(testing_1.serverReferenceManifest, testing_1.appPathRoutesManifest)).to.deep.equal(["/another-s-a", "/server-action", "/server-action/edge"]);
        });
    });
    describe("findEsbuildPath", () => {
        let execSyncStub;
        beforeEach(() => {
            execSyncStub = sinon.stub(childProcess, "execSync");
        });
        afterEach(() => {
            execSyncStub.restore();
        });
        it("should return the correct esbuild path when esbuild is found", () => {
            const mockBinaryPath = "/path/to/.bin/esbuild";
            const expectedResolvedPath = "/path/to/esbuild";
            execSyncStub
                .withArgs("npx which esbuild", { encoding: "utf8" })
                .returns(mockBinaryPath + "\n");
            const esbuildPath = (0, utils_1.findEsbuildPath)();
            (0, chai_1.expect)(esbuildPath).to.equal(expectedResolvedPath);
        });
        it("should return null if esbuild is not found", () => {
            execSyncStub
                .withArgs("npx which esbuild", { encoding: "utf8" })
                .throws(new Error("not found"));
            const esbuildPath = (0, utils_1.findEsbuildPath)();
            (0, chai_1.expect)(esbuildPath).to.be.null;
        });
        it("should warn if global esbuild version does not match required version", () => {
            const mockBinaryPath = "/path/to/.bin/esbuild";
            const mockGlobalVersion = "1.2.3";
            execSyncStub
                .withArgs("npx which esbuild", { encoding: "utf8" })
                .returns(mockBinaryPath + "\n");
            execSyncStub
                .withArgs(`"${mockBinaryPath}" --version`, { encoding: "utf8" })
                .returns(`${mockGlobalVersion}\n`);
            const consoleWarnStub = sinon.stub(console, "warn");
            (0, utils_1.findEsbuildPath)();
            (0, chai_1.expect)(consoleWarnStub.calledWith(`Warning: Global esbuild version (${mockGlobalVersion}) does not match the required version (${constants_1.ESBUILD_VERSION}).`)).to.be.true;
            consoleWarnStub.restore();
        });
    });
    describe("installEsbuild", () => {
        let execSyncStub;
        beforeEach(() => {
            execSyncStub = sinon.stub(childProcess, "execSync");
        });
        afterEach(() => execSyncStub.restore());
        it("should successfully install esbuild", () => {
            execSyncStub
                .withArgs(`npm install esbuild@${constants_1.ESBUILD_VERSION} --no-save`, { stdio: "inherit" })
                .returns("");
            (0, utils_1.installEsbuild)(constants_1.ESBUILD_VERSION);
            (0, chai_1.expect)(execSyncStub.calledOnce).to.be.true;
        });
        it("should throw a FirebaseError if installation fails", () => {
            execSyncStub
                .withArgs(`npm install esbuild@${constants_1.ESBUILD_VERSION} --no-save`, { stdio: "inherit" })
                .throws(new Error("Installation failed"));
            try {
                (0, utils_1.installEsbuild)(constants_1.ESBUILD_VERSION);
                chai_1.expect.fail("Expected installEsbuild to throw");
            }
            catch (error) {
                const typedError = error;
                (0, chai_1.expect)(typedError).to.be.instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(typedError.message).to.include("Failed to install esbuild");
            }
        });
    });
    describe("isNextJsVersionVulnerable", () => {
        describe("vulnerable versions", () => {
            it("should block vulnerable 15.0.x versions (< 15.0.5)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.4")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.0")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.0-rc.1")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.0-canary.205")).to.be.true;
            });
            it("should block vulnerable 15.1.x versions (< 15.1.9)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.1.8")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.1.0")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.1.1-canary.27")).to.be.true;
            });
            it("should block vulnerable 15.2.x versions (< 15.2.6)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.2.5")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.2.0-canary.77")).to.be.true;
            });
            it("should block vulnerable 15.3.x versions (< 15.3.6)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.3.5")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.3.0-canary.46")).to.be.true;
            });
            it("should block vulnerable 15.4.x versions (< 15.4.8)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.4.7")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.4.2-canary.56")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.4.0-canary.130")).to.be.true;
            });
            it("should block vulnerable 15.5.x versions (< 15.5.7)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.5.6")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.5.1-canary.39")).to.be.true;
            });
            it("should block vulnerable 16.0.x versions (< 16.0.7)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("16.0.6")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("16.0.0-beta.0")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("16.0.0-canary.18")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("16.0.2-canary.34")).to.be.true;
            });
            it("should block vulnerable 14.x canary versions (>= 14.3.0-canary.77)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("14.3.0-canary.77")).to.be.true;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("14.3.0-canary.87")).to.be.true;
            });
            it("should treat pre-releases of patched versions as vulnerable (conservative)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.5-canary.1")).to.be.true;
            });
            it("should block versions with build metadata if base is vulnerable", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.4+build123")).to.be.true;
            });
        });
        describe("safe versions", () => {
            it("should allow patched 15.0.x versions (>= 15.0.5)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.5")).to.be.false;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.6")).to.be.false;
            });
            it("should allow patched 15.1.x versions (>= 15.1.9)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.1.9")).to.be.false;
            });
            it("should allow patched 15.2.x versions (>= 15.2.6)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.2.6")).to.be.false;
            });
            it("should allow patched 15.3.x versions (>= 15.3.6)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.3.6")).to.be.false;
            });
            it("should allow patched 15.4.x versions (>= 15.4.8)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.4.8")).to.be.false;
            });
            it("should allow patched 15.5.x versions (>= 15.5.7)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.5.7")).to.be.false;
            });
            it("should allow newer minor versions (e.g. 15.6.x)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.6.0-canary.57")).to.be.false;
            });
            it("should allow patched 16.0.x versions (>= 16.0.7)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("16.0.7")).to.be.false;
            });
            it("should allow newer 16.x minor versions (e.g. 16.1.x)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("16.1.0-canary.12")).to.be.false;
            });
            it("should allow safe 14.x canary versions (< 14.3.0-canary.77)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("14.3.0-canary.76")).to.be.false;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("14.3.0-canary.43")).to.be.false;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("14.2.0-canary.67")).to.be.false;
            });
            it("should allow stable 14.x versions (not vulnerable)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("14.3.0")).to.be.false;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("14.2.33")).to.be.false;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("14.1.4")).to.be.false;
            });
            it("should allow unaffected older versions", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("13.5.11")).to.be.false;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("12.3.7")).to.be.false;
            });
            it("should allow versions with build metadata if base is safe", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("15.0.5+build123")).to.be.false;
            });
            it("should return false for invalid versions (fail open)", () => {
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("invalid-version")).to.be.false;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)("")).to.be.false;
                (0, chai_1.expect)((0, utils_1.isNextJsVersionVulnerable)(undefined)).to.be.false;
            });
        });
    });
});
//# sourceMappingURL=utils.spec.js.map