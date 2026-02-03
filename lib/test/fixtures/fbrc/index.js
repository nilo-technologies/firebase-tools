"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFLICT_RC_DIR = exports.INVALID_RC_DIR = exports.FIREBASE_JSON_PATH = exports.VALID_RC_DIR = void 0;
const path_1 = require("path");
exports.VALID_RC_DIR = __dirname;
exports.FIREBASE_JSON_PATH = (0, path_1.resolve)(__dirname, "firebase.json");
exports.INVALID_RC_DIR = (0, path_1.resolve)(__dirname, "invalid");
exports.CONFLICT_RC_DIR = (0, path_1.resolve)(__dirname, "conflict");
//# sourceMappingURL=index.js.map