"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewareV1ManifestWhenNotUsed = exports.middlewareV1ManifestWhenUsed = exports.middlewareV2ManifestWhenNotUsed = exports.middlewareV2ManifestWhenUsed = void 0;
exports.middlewareV2ManifestWhenUsed = {
    sortedMiddleware: ["/"],
    middleware: {
        "/": {
            files: ["server/edge-runtime-webpack.js", "server/middleware.js"],
            name: "middleware",
            page: "/",
            matchers: [
                {
                    regexp: "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/([^/.]{1,}))\\/about(?:\\/((?:[^\\/#\\?]+?)(?:\\/(?:[^\\/#\\?]+?))*))?(.json)?[\\/#\\?]?$",
                    originalSource: "",
                },
            ],
            wasm: [],
            assets: [],
        },
    },
    functions: {},
    version: 2,
};
exports.middlewareV2ManifestWhenNotUsed = {
    sortedMiddleware: [],
    middleware: {},
    functions: {},
    version: 2,
};
exports.middlewareV1ManifestWhenUsed = {
    sortedMiddleware: ["/"],
    clientInfo: [["/", false]],
    middleware: {
        "/": {
            env: [],
            files: ["server/edge-runtime-webpack.js", "server/pages/_middleware.js"],
            name: "pages/_middleware",
            page: "/",
            regexp: "^/(?!_next).*$",
            wasm: [],
        },
    },
    version: 1,
};
exports.middlewareV1ManifestWhenNotUsed = {
    sortedMiddleware: [],
    clientInfo: [],
    middleware: {},
    version: 1,
};
//# sourceMappingURL=middleware.js.map