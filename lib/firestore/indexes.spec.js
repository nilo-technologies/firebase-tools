"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const api_1 = require("./api");
const error_1 = require("../error");
const API = require("./api-types");
const api_types_1 = require("./api-types");
const sort = require("./api-sort");
const idx = new api_1.FirestoreApi();
const VALID_SPEC = {
    indexes: [
        {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: "ASCENDING" },
                { fieldPath: "bar", order: "DESCENDING" },
                { fieldPath: "baz", arrayConfig: "CONTAINS" },
            ],
        },
    ],
    fieldOverrides: [
        {
            collectionGroup: "collection",
            fieldPath: "foo",
            indexes: [
                { order: "ASCENDING", scope: "COLLECTION" },
                { arrayConfig: "CONTAINS", scope: "COLLECTION" },
            ],
        },
    ],
};
describe("IndexValidation", () => {
    it("should accept a valid v1beta2 index spec", () => {
        idx.validateSpec(VALID_SPEC);
    });
    it("should accept a valid index spec with apiScope, density, and multikey", () => {
        const spec = {
            indexes: [
                {
                    collectionGroup: "collection",
                    queryScope: "COLLECTION",
                    apiScope: "ANY_API",
                    density: "DENSE",
                    multikey: true,
                    fields: [
                        { fieldPath: "foo", order: "ASCENDING" },
                        { fieldPath: "bar", order: "DESCENDING" },
                        { fieldPath: "baz", arrayConfig: "CONTAINS" },
                    ],
                },
            ],
        };
        idx.validateSpec(spec);
    });
    it("should reject an index spec with invalid apiScope", () => {
        const spec = {
            indexes: [
                {
                    collectionGroup: "collection",
                    queryScope: "COLLECTION",
                    apiScope: "UNKNOWN",
                    fields: [],
                },
            ],
        };
        (0, chai_1.expect)(() => {
            idx.validateSpec(spec);
        }).to.throw(error_1.FirebaseError, /Field "apiScope" must be one of ANY_API, DATASTORE_MODE_API, MONGODB_COMPATIBLE_API/);
    });
    it("should reject an index spec with invalid density", () => {
        const spec = {
            indexes: [
                {
                    collectionGroup: "collection",
                    queryScope: "COLLECTION",
                    apiScope: "ANY_API",
                    density: "UNKNOWN",
                    fields: [],
                },
            ],
        };
        (0, chai_1.expect)(() => {
            idx.validateSpec(spec);
        }).to.throw(error_1.FirebaseError, /Field "density" must be one of DENSITY_UNSPECIFIED, SPARSE_ALL, SPARSE_ANY, DENSE/);
    });
    it("should reject an index spec with invalid multikey", () => {
        const spec = {
            indexes: [
                {
                    collectionGroup: "collection",
                    queryScope: "COLLECTION",
                    apiScope: "ANY_API",
                    density: "DENSE",
                    multikey: "multikey",
                    fields: [],
                },
            ],
        };
        (0, chai_1.expect)(() => {
            idx.validateSpec(spec);
        }).to.throw(error_1.FirebaseError, /Property "multikey" must be of type boolean/);
    });
    it("should reject an index spec with invalid unique", () => {
        const spec = {
            indexes: [
                {
                    collectionGroup: "collection",
                    queryScope: "COLLECTION",
                    apiScope: "ANY_API",
                    density: "DENSE",
                    multikey: true,
                    unique: "true",
                    fields: [],
                },
            ],
        };
        (0, chai_1.expect)(() => {
            idx.validateSpec(spec);
        }).to.throw(error_1.FirebaseError, /Property "unique" must be of type boolean/);
    });
    it("should not change a valid v1beta2 index spec after upgrade", () => {
        const upgraded = idx.upgradeOldSpec(VALID_SPEC);
        (0, chai_1.expect)(upgraded).to.eql(VALID_SPEC);
    });
    it("should accept an empty spec", () => {
        const empty = {
            indexes: [],
        };
        idx.validateSpec(idx.upgradeOldSpec(empty));
    });
    it("should accept a valid v1beta1 index spec after upgrade", () => {
        idx.validateSpec(idx.upgradeOldSpec({
            indexes: [
                {
                    collectionId: "collection",
                    fields: [
                        { fieldPath: "foo", mode: "ASCENDING" },
                        { fieldPath: "bar", mode: "DESCENDING" },
                        { fieldPath: "baz", mode: "ARRAY_CONTAINS" },
                    ],
                },
            ],
        }));
    });
    it("should accept a valid vectorConfig index", () => {
        idx.validateSpec(idx.upgradeOldSpec({
            indexes: [
                {
                    collectionGroup: "collection",
                    queryScope: "COLLECTION",
                    fields: [
                        {
                            fieldPath: "embedding",
                            vectorConfig: {
                                dimension: 100,
                                flat: {},
                            },
                        },
                    ],
                },
            ],
        }));
    });
    it("should accept a valid vectorConfig index after upgrade", () => {
        idx.validateSpec({
            indexes: [
                {
                    collectionGroup: "collection",
                    queryScope: "COLLECTION",
                    fields: [
                        {
                            fieldPath: "embedding",
                            vectorConfig: {
                                dimension: 100,
                                flat: {},
                            },
                        },
                    ],
                },
            ],
        });
    });
    it("should accept a valid vectorConfig index with another field", () => {
        idx.validateSpec({
            indexes: [
                {
                    collectionGroup: "collection",
                    queryScope: "COLLECTION",
                    fields: [
                        { fieldPath: "foo", order: "ASCENDING" },
                        {
                            fieldPath: "embedding",
                            vectorConfig: {
                                dimension: 100,
                                flat: {},
                            },
                        },
                    ],
                },
            ],
        });
    });
    it("should reject invalid vectorConfig dimension", () => {
        (0, chai_1.expect)(() => {
            idx.validateSpec({
                indexes: [
                    {
                        collectionGroup: "collection",
                        queryScope: "COLLECTION",
                        fields: [
                            {
                                fieldPath: "embedding",
                                vectorConfig: {
                                    dimension: "wrongType",
                                    flat: {},
                                },
                            },
                        ],
                    },
                ],
            });
        }).to.throw(error_1.FirebaseError, /Property "vectorConfig.dimension" must be of type number/);
    });
    it("should reject invalid vectorConfig missing flat type", () => {
        (0, chai_1.expect)(() => {
            idx.validateSpec({
                indexes: [
                    {
                        collectionGroup: "collection",
                        queryScope: "COLLECTION",
                        fields: [
                            {
                                fieldPath: "embedding",
                                vectorConfig: {
                                    dimension: 100,
                                },
                            },
                        ],
                    },
                ],
            });
        }).to.throw(error_1.FirebaseError, /Must contain "flat"/);
    });
    it("should reject an incomplete index spec", () => {
        (0, chai_1.expect)(() => {
            idx.validateSpec({
                indexes: [
                    {
                        collectionGroup: "collection",
                        fields: [
                            { fieldPath: "foo", order: "ASCENDING" },
                            { fieldPath: "bar", order: "DESCENDING" },
                        ],
                    },
                ],
            });
        }).to.throw(error_1.FirebaseError, /Must contain "queryScope"/);
    });
    it("should reject an overspecified index spec", () => {
        (0, chai_1.expect)(() => {
            idx.validateSpec({
                indexes: [
                    {
                        collectionGroup: "collection",
                        queryScope: "COLLECTION",
                        fields: [
                            { fieldPath: "foo", order: "ASCENDING", arrayConfig: "CONTAINES" },
                            { fieldPath: "bar", order: "DESCENDING" },
                        ],
                    },
                ],
            });
        }).to.throw(error_1.FirebaseError, /Must contain exactly one of "order,arrayConfig,vectorConfig"/);
    });
});
describe("IndexSpecMatching", () => {
    const baseApiIndex = {
        name: "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123",
        queryScope: API.QueryScope.COLLECTION,
        fields: [{ fieldPath: "__name__", order: API.Order.ASCENDING }],
    };
    const baseSpecIndex = {
        collectionGroup: "collection",
        queryScope: "COLLECTION",
        fields: [{ fieldPath: "__name__", order: API.Order.ASCENDING }],
    };
    it("should identify a positive index spec match", () => {
        const apiIndex = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "bar", arrayConfig: API.ArrayConfig.CONTAINS },
                { fieldPath: "baz", vectorConfig: { dimension: 384, flat: {} } },
                { fieldPath: "__name__", order: API.Order.ASCENDING },
            ],
            state: API.State.READY,
        };
        const specIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: "ASCENDING" },
                { fieldPath: "bar", arrayConfig: "CONTAINS" },
                { fieldPath: "baz", vectorConfig: { dimension: 384, flat: {} } },
                { fieldPath: "__name__", order: API.Order.ASCENDING },
            ],
        };
        (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
        (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
    });
    it("should identify a negative index spec match with different vector config dimension", () => {
        const apiIndex = {
            ...baseApiIndex,
            fields: [{ fieldPath: "baz", vectorConfig: { dimension: 384, flat: {} } }],
        };
        const specIndex = {
            ...baseSpecIndex,
            fields: [{ fieldPath: "baz", vectorConfig: { dimension: 382, flat: {} } }],
        };
        (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
        (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
    });
    it("should identify a positive index spec match with apiScope, density, multikey, and unique", () => {
        const apiIndex = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123",
            queryScope: API.QueryScope.COLLECTION,
            apiScope: API.ApiScope.ANY_API,
            density: API.Density.DENSE,
            multikey: true,
            unique: true,
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "bar", arrayConfig: API.ArrayConfig.CONTAINS },
            ],
            state: API.State.READY,
        };
        const specIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            apiScope: "ANY_API",
            density: "DENSE",
            multikey: true,
            unique: true,
            fields: [
                { fieldPath: "foo", order: "ASCENDING" },
                { fieldPath: "bar", arrayConfig: "CONTAINS" },
            ],
        };
        (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
    });
    it("should identify a positive index spec match when missing apiScope and density and multikey in both", () => {
        (0, chai_1.expect)(idx.indexMatchesSpec(baseApiIndex, baseSpecIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
        (0, chai_1.expect)(idx.indexMatchesSpec(baseApiIndex, baseSpecIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
    });
    describe("ApiScope", () => {
        it("should identify a negative index spec match with different apiScope", () => {
            const apiIndex = { ...baseApiIndex, apiScope: API.ApiScope.ANY_API };
            const specIndex = { ...baseSpecIndex, apiScope: "MONGODB_COMPATIBLE_API" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
        it("should identify a positive index spec match with same apiScope ANY_API", () => {
            const apiIndex = { ...baseApiIndex, apiScope: API.ApiScope.ANY_API };
            const specIndex = { ...baseSpecIndex, apiScope: "ANY_API" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive index spec match with same apiScope MONGODB_COMPATIBLE_API", () => {
            const apiIndex = { ...baseApiIndex, apiScope: API.ApiScope.MONGODB_COMPATIBLE_API };
            const specIndex = { ...baseSpecIndex, apiScope: "MONGODB_COMPATIBLE_API" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive match, apiScope missing in index, default in spec", () => {
            const apiIndex = baseApiIndex;
            const specIndex = { ...baseSpecIndex, apiScope: "ANY_API" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive match, apiScope missing in spec, default in index", () => {
            const apiIndex = { ...baseApiIndex, apiScope: api_types_1.ApiScope.ANY_API };
            const specIndex = baseSpecIndex;
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a negative match, apiScope missing in index, non-default in spec", () => {
            const apiIndex = baseApiIndex;
            const specIndex = { ...baseSpecIndex, apiScope: "MONGODB_COMPATIBLE_API" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
        it("should identify a negative match, apiScope missing in spec, non-default in index", () => {
            const apiIndex = { ...baseApiIndex, apiScope: api_types_1.ApiScope.MONGODB_COMPATIBLE_API };
            const specIndex = baseSpecIndex;
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
    });
    describe("Density", () => {
        it("should identify a negative index spec match with different density", () => {
            const apiIndex = { ...baseApiIndex, density: API.Density.DENSE };
            const specIndex = { ...baseSpecIndex, density: "SPARSE_ALL" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
        it("should identify a positive index spec match with same density DENSE", () => {
            const apiIndex = { ...baseApiIndex, density: API.Density.DENSE };
            const specIndex = { ...baseSpecIndex, density: "DENSE" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive index spec match with same density SPARSE_ALL", () => {
            const apiIndex = { ...baseApiIndex, density: API.Density.SPARSE_ALL };
            const specIndex = { ...baseSpecIndex, density: "SPARSE_ALL" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive index spec match with same density SPARSE_ANY", () => {
            const apiIndex = { ...baseApiIndex, density: API.Density.SPARSE_ANY };
            const specIndex = { ...baseSpecIndex, density: "SPARSE_ANY" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive match, density missing in index, default in spec", () => {
            const apiIndex1 = baseApiIndex;
            const specIndex1 = { ...baseSpecIndex, density: "DENSE" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex1, specIndex1, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex1, specIndex1, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
            const apiIndex = baseApiIndex;
            const specIndex = { ...baseSpecIndex, density: "SPARSE_ALL" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
        it("should identify a positive match, density missing in spec, default in index", () => {
            const apiIndex1 = { ...baseApiIndex, density: api_types_1.Density.DENSE };
            const specIndex1 = baseSpecIndex;
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex1, specIndex1, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex1, specIndex1, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
            const apiIndex2 = { ...baseApiIndex, density: api_types_1.Density.SPARSE_ALL };
            const specIndex2 = baseSpecIndex;
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex2, specIndex2, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex2, specIndex2, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
        it("should identify a negative match, density missing in index, non-default in spec", () => {
            const apiIndex = baseApiIndex;
            const specIndex = { ...baseSpecIndex, density: "SPARSE_ANY" };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
        it("should identify a negative match, density missing in spec, non-default in index", () => {
            const apiIndex1 = { ...baseApiIndex, density: api_types_1.Density.SPARSE_ANY };
            const specIndex1 = baseSpecIndex;
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex1, specIndex1, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex1, specIndex1, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
    });
    describe("Multikey", () => {
        it("should identify a negative index spec match with different multikey", () => {
            const apiIndex = { ...baseApiIndex, multikey: true };
            const specIndex = { ...baseSpecIndex, multikey: false };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
        it("should identify a positive index spec match with same multikey true", () => {
            const apiIndex = { ...baseApiIndex, multikey: true };
            const specIndex = { ...baseSpecIndex, multikey: true };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive index spec match with same multikey false", () => {
            const apiIndex = { ...baseApiIndex, multikey: false };
            const specIndex = { ...baseSpecIndex, multikey: false };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive match, multikey missing in index, default in spec", () => {
            const apiIndex = baseApiIndex;
            const specIndex = { ...baseSpecIndex, multikey: false };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a positive match, multikey missing in spec, default in index", () => {
            const apiIndex = { ...baseApiIndex, multikey: false };
            const specIndex = baseSpecIndex;
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("should identify a negative match, multikey missing in index, non-default in spec", () => {
            const apiIndex = baseApiIndex;
            const specIndex = { ...baseSpecIndex, multikey: true };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
        it("should identify a negative match, multikey missing in spec, non-default in index", () => {
            const apiIndex = { ...baseApiIndex, multikey: true };
            const specIndex = baseSpecIndex;
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
    });
    describe("With __name__ field in index", () => {
        it("__name__ field with default sort order, identified as matching", () => {
            const apiIndex = {
                name: "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123",
                queryScope: "COLLECTION",
                fields: [
                    { fieldPath: "foo", order: "ASCENDING" },
                    { fieldPath: "__name__", order: "ASCENDING" },
                ],
                state: API.State.READY,
            };
            const specIndex = {
                collectionGroup: "collection",
                queryScope: "COLLECTION",
                fields: [
                    { fieldPath: "foo", order: "ASCENDING" },
                    { fieldPath: "__name__", order: "ASCENDING" },
                ],
            };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("__name__ field with default sort order stripped off, identified as matching if STANDARD", () => {
            const apiIndex = {
                name: "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123",
                queryScope: "COLLECTION",
                fields: [
                    { fieldPath: "foo", order: "ASCENDING" },
                    { fieldPath: "__name__", order: "ASCENDING" },
                ],
                state: API.State.READY,
            };
            const specIndex = {
                collectionGroup: "collection",
                queryScope: "COLLECTION",
                fields: [{ fieldPath: "foo", order: "ASCENDING" }],
            };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
        });
        it("__name__ field with non-default sort order, identified as matching", () => {
            const apiIndex = {
                name: "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123",
                queryScope: "COLLECTION",
                fields: [
                    { fieldPath: "foo", order: "ASCENDING" },
                    { fieldPath: "__name__", order: "DESCENDING" },
                ],
                state: API.State.READY,
            };
            const specIndex = {
                collectionGroup: "collection",
                queryScope: "COLLECTION",
                fields: [
                    { fieldPath: "foo", order: "ASCENDING" },
                    { fieldPath: "__name__", order: "DESCENDING" },
                ],
            };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(true);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(true);
        });
        it("__name__ field sort order mismatch, identified as not matching", () => {
            const apiIndex = {
                name: "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123",
                queryScope: "COLLECTION",
                fields: [
                    { fieldPath: "foo", order: "ASCENDING" },
                    { fieldPath: "__name__", order: "ASCENDING" },
                ],
                state: API.State.READY,
            };
            const specIndex = {
                collectionGroup: "collection",
                queryScope: "COLLECTION",
                fields: [
                    { fieldPath: "foo", order: "ASCENDING" },
                    { fieldPath: "__name__", order: "DESCENDING" },
                ],
            };
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
            (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
        });
    });
    it("should identify a negative index spec match", () => {
        const apiIndex = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/indexes/abc123",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: "DESCENDING" },
                { fieldPath: "bar", arrayConfig: "CONTAINS" },
            ],
            state: API.State.READY,
        };
        const specIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: "ASCENDING" },
                { fieldPath: "bar", arrayConfig: "CONTAINS" },
            ],
        };
        (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.STANDARD)).to.eql(false);
        (0, chai_1.expect)(idx.indexMatchesSpec(apiIndex, specIndex, api_types_1.DatabaseEdition.ENTERPRISE)).to.eql(false);
    });
    it("should identify a positive field spec match", () => {
        const apiField = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/fields/abc123",
            indexConfig: {
                indexes: [
                    {
                        queryScope: "COLLECTION",
                        fields: [{ fieldPath: "abc123", order: "ASCENDING" }],
                    },
                    {
                        queryScope: "COLLECTION",
                        fields: [{ fieldPath: "abc123", arrayConfig: "CONTAINS" }],
                    },
                ],
            },
        };
        const specField = {
            collectionGroup: "collection",
            fieldPath: "abc123",
            indexes: [
                { order: "ASCENDING", queryScope: "COLLECTION" },
                { arrayConfig: "CONTAINS", queryScope: "COLLECTION" },
            ],
        };
        (0, chai_1.expect)(idx.fieldMatchesSpec(apiField, specField)).to.eql(true);
    });
    it("should identify a positive field spec match with ttl specified as false", () => {
        const apiField = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/fields/abc123",
            indexConfig: {
                indexes: [
                    {
                        queryScope: "COLLECTION",
                        fields: [{ fieldPath: "abc123", order: "ASCENDING" }],
                    },
                    {
                        queryScope: "COLLECTION",
                        fields: [{ fieldPath: "abc123", arrayConfig: "CONTAINS" }],
                    },
                ],
            },
        };
        const specField = {
            collectionGroup: "collection",
            fieldPath: "abc123",
            ttl: false,
            indexes: [
                { order: "ASCENDING", queryScope: "COLLECTION" },
                { arrayConfig: "CONTAINS", queryScope: "COLLECTION" },
            ],
        };
        (0, chai_1.expect)(idx.fieldMatchesSpec(apiField, specField)).to.eql(true);
    });
    it("should identify a positive ttl field spec match", () => {
        const apiField = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/fields/fieldTtl",
            indexConfig: {
                indexes: [
                    {
                        queryScope: "COLLECTION",
                        fields: [{ fieldPath: "fieldTtl", order: "ASCENDING" }],
                    },
                ],
            },
            ttlConfig: {
                state: "ACTIVE",
            },
        };
        const specField = {
            collectionGroup: "collection",
            fieldPath: "fieldTtl",
            ttl: true,
            indexes: [{ order: "ASCENDING", queryScope: "COLLECTION" }],
        };
        (0, chai_1.expect)(idx.fieldMatchesSpec(apiField, specField)).to.eql(true);
    });
    it("should identify a negative ttl field spec match", () => {
        const apiField = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/fields/fieldTtl",
            indexConfig: {
                indexes: [
                    {
                        queryScope: "COLLECTION",
                        fields: [{ fieldPath: "fieldTtl", order: "ASCENDING" }],
                    },
                ],
            },
        };
        const specField = {
            collectionGroup: "collection",
            fieldPath: "fieldTtl",
            ttl: true,
            indexes: [{ order: "ASCENDING", queryScope: "COLLECTION" }],
        };
        (0, chai_1.expect)(idx.fieldMatchesSpec(apiField, specField)).to.eql(false);
    });
    it("should match a field spec with all indexes excluded", () => {
        const apiField = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/fields/abc123",
            indexConfig: {},
        };
        const specField = {
            collectionGroup: "collection",
            fieldPath: "abc123",
            indexes: [],
        };
        (0, chai_1.expect)(idx.fieldMatchesSpec(apiField, specField)).to.eql(true);
    });
    it("should match a field spec with only ttl", () => {
        const apiField = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/fields/ttlField",
            ttlConfig: {
                state: "ACTIVE",
            },
            indexConfig: {},
        };
        const specField = {
            collectionGroup: "collection",
            fieldPath: "ttlField",
            ttl: true,
            indexes: [],
        };
        (0, chai_1.expect)(idx.fieldMatchesSpec(apiField, specField)).to.eql(true);
    });
    it("should identify a negative field spec match", () => {
        const apiField = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/fields/abc123",
            indexConfig: {
                indexes: [
                    {
                        queryScope: "COLLECTION",
                        fields: [{ fieldPath: "abc123", order: "ASCENDING" }],
                    },
                    {
                        queryScope: "COLLECTION",
                        fields: [{ fieldPath: "abc123", arrayConfig: "CONTAINS" }],
                    },
                ],
            },
        };
        const specField = {
            collectionGroup: "collection",
            fieldPath: "abc123",
            indexes: [
                { order: "DESCENDING", queryScope: "COLLECTION" },
                { arrayConfig: "CONTAINS", queryScope: "COLLECTION" },
            ],
        };
        (0, chai_1.expect)(idx.fieldMatchesSpec(apiField, specField)).to.eql(false);
    });
    it("should identify a negative field spec match with ttl as false", () => {
        const apiField = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collection/fields/fieldTtl",
            ttlConfig: {
                state: "ACTIVE",
            },
            indexConfig: {},
        };
        const specField = {
            collectionGroup: "collection",
            fieldPath: "fieldTtl",
            ttl: false,
            indexes: [],
        };
        (0, chai_1.expect)(idx.fieldMatchesSpec(apiField, specField)).to.eql(false);
    });
});
describe("Normalize __name__ field for database indexes", () => {
    it("No-op if exists __name__ field as the last field with default sort order", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "__name__", order: API.Order.ASCENDING },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(2);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.ASCENDING);
    });
    it("No-op if exists __name__ field as the last field with default sort order, with array contains", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
                { fieldPath: "__name__", order: API.Order.ASCENDING },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(2);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.ASCENDING);
    });
    it("No-op if exists __name__ field as the last field with default sort order, with vector field", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "__name__", order: API.Order.ASCENDING },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(3);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.ASCENDING);
    });
    it("No-op if exists __name__ field as the last field with default sort order, with array contains and vector field", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
                { fieldPath: "__name__", order: API.Order.ASCENDING },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(4);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[3].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[2].order).to.equal(API.Order.ASCENDING);
    });
    it("No-op if exists __name__ field as the last field with non-default sort order", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "__name__", order: API.Order.DESCENDING },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(2);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.DESCENDING);
    });
    it("No-op if exists __name__ field as the last field with default sort order, with array contains", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
                { fieldPath: "__name__", order: API.Order.ASCENDING },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(2);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.ASCENDING);
    });
    it("No-op if exists __name__ field as the last field with default sort order, with vector field", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "__name__", order: API.Order.DESCENDING },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(3);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.DESCENDING);
    });
    it("No-op if exists __name__ field as the last field with default sort order, with array contains and vector field", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
                { fieldPath: "__name__", order: API.Order.DESCENDING },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(4);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[3].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[2].order).to.equal(API.Order.DESCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, ascending", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [{ fieldPath: "foo", order: API.Order.ASCENDING }],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(2);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.ASCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, ascending, with array contains", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(3);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[2].order).to.equal(API.Order.ASCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, ascending, with vector field", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(3);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.ASCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, with array contains and vector field, default to ascending", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(3);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.ASCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, with index field with ascending order, array contains and vector field", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(4);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[3].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[2].order).to.equal(API.Order.ASCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, descending", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.ASCENDING },
                { fieldPath: "bar", order: API.Order.DESCENDING },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(3);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("bar");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[2].order).to.equal(API.Order.DESCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, descending, with array contains", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.DESCENDING },
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(3);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[2].order).to.equal(API.Order.DESCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, ascending, with vector field", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.DESCENDING },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(3);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[1].order).to.equal(API.Order.DESCENDING);
    });
    it("should attach __name__ suffix with the default order if not exists, with index field with descending order, array contains and vector field", () => {
        const mockSpecIndex = {
            collectionGroup: "collection",
            queryScope: "COLLECTION",
            fields: [
                { fieldPath: "foo", order: API.Order.DESCENDING },
                { fieldPath: "arr", arrayConfig: API.ArrayConfig.CONTAINS },
                {
                    fieldPath: "vector",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const result = api_1.FirestoreApi.processIndex(mockSpecIndex);
        (0, chai_1.expect)(result.fields).to.have.length(4);
        (0, chai_1.expect)(result.fields[0].fieldPath).to.equal("foo");
        (0, chai_1.expect)(result.fields[1].fieldPath).to.equal("arr");
        (0, chai_1.expect)(result.fields[2].fieldPath).to.equal("__name__");
        (0, chai_1.expect)(result.fields[3].fieldPath).to.equal("vector");
        (0, chai_1.expect)(result.fields[2].order).to.equal(API.Order.DESCENDING);
    });
});
describe("IndexSorting", () => {
    it("should be able to handle empty arrays", () => {
        (0, chai_1.expect)([].sort(sort.compareSpecIndex)).to.eql([]);
        (0, chai_1.expect)([].sort(sort.compareFieldOverride)).to.eql([]);
        (0, chai_1.expect)([].sort(sort.compareApiIndex)).to.eql([]);
        (0, chai_1.expect)([].sort(sort.compareApiField)).to.eql([]);
    });
    it("should correctly sort an array of Spec indexes", () => {
        const a = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
        };
        const b = {
            collectionGroup: "collectionB",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldA",
                    order: API.Order.ASCENDING,
                },
            ],
        };
        const c = {
            collectionGroup: "collectionB",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldA",
                    order: API.Order.ASCENDING,
                },
                {
                    fieldPath: "fieldB",
                    order: API.Order.ASCENDING,
                },
            ],
        };
        const d = {
            collectionGroup: "collectionB",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldB",
                    order: API.Order.ASCENDING,
                },
            ],
        };
        const e = {
            collectionGroup: "collectionB",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldB",
                    order: API.Order.ASCENDING,
                },
                {
                    fieldPath: "fieldA",
                    order: API.Order.ASCENDING,
                },
            ],
        };
        (0, chai_1.expect)([b, a, e, d, c].sort(sort.compareSpecIndex)).to.eql([a, b, c, d, e]);
    });
    it("should correctly sort an array of Spec indexes with apiScope, density, multikey, and unique", () => {
        const a = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.ANY_API,
        };
        const b = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.ANY_API,
        };
        const c = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.DATASTORE_MODE_API,
        };
        const d = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
        };
        const e = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
            density: API.Density.DENSITY_UNSPECIFIED,
        };
        const f = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
            density: API.Density.SPARSE_ALL,
        };
        const g = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
            density: API.Density.SPARSE_ANY,
        };
        const h = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
            density: API.Density.DENSE,
        };
        const i = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
            density: API.Density.DENSE,
            multikey: false,
        };
        const j = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
            density: API.Density.DENSE,
            multikey: true,
        };
        const k = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
            density: API.Density.DENSE,
            multikey: true,
            unique: false,
        };
        const l = {
            collectionGroup: "collectionA",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
            apiScope: API.ApiScope.MONGODB_COMPATIBLE_API,
            density: API.Density.DENSE,
            multikey: true,
            unique: true,
        };
        (0, chai_1.expect)([l, k, j, i, h, g, f, e, d, c, b, a].sort(sort.compareSpecIndex)).to.eql([
            a,
            b,
            c,
            d,
            e,
            f,
            g,
            h,
            i,
            j,
            k,
            l,
        ]);
    });
    it("should correcty sort an array of Spec field overrides", () => {
        const a = {
            collectionGroup: "collectionA",
            fieldPath: "fieldA",
            indexes: [],
        };
        const b = {
            collectionGroup: "collectionB",
            fieldPath: "fieldA",
            indexes: [],
        };
        const c = {
            collectionGroup: "collectionB",
            fieldPath: "fieldB",
            indexes: [
                {
                    queryScope: API.QueryScope.COLLECTION,
                    order: API.Order.ASCENDING,
                },
            ],
        };
        const d = {
            collectionGroup: "collectionB",
            fieldPath: "fieldB",
            indexes: [
                {
                    queryScope: API.QueryScope.COLLECTION,
                    arrayConfig: API.ArrayConfig.CONTAINS,
                },
            ],
        };
        (0, chai_1.expect)([b, a, d, c].sort(sort.compareFieldOverride)).to.eql([a, b, c, d]);
    });
    it("should sort ttl true to be last in an array of Spec field overrides", () => {
        const a = {
            collectionGroup: "collectionA",
            fieldPath: "fieldA",
            ttl: false,
            indexes: [],
        };
        const b = {
            collectionGroup: "collectionA",
            fieldPath: "fieldB",
            ttl: true,
            indexes: [],
        };
        const c = {
            collectionGroup: "collectionB",
            fieldPath: "fieldA",
            ttl: false,
            indexes: [],
        };
        const d = {
            collectionGroup: "collectionB",
            fieldPath: "fieldB",
            ttl: true,
            indexes: [],
        };
        (0, chai_1.expect)([b, a, d, c].sort(sort.compareFieldOverride)).to.eql([a, b, c, d]);
    });
    it("should correctly sort an array of API indexes", () => {
        const a = {
            name: "/projects/project/databases/(default)/collectionGroups/collectionA/indexes/a",
            queryScope: API.QueryScope.COLLECTION,
            fields: [],
        };
        const b = {
            name: "/projects/project/databases/(default)/collectionGroups/collectionB/indexes/b",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldA",
                    order: API.Order.ASCENDING,
                },
            ],
        };
        const c = {
            name: "/projects/project/databases/(default)/collectionGroups/collectionB/indexes/c",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldA",
                    order: API.Order.ASCENDING,
                },
                {
                    fieldPath: "fieldB",
                    order: API.Order.ASCENDING,
                },
            ],
        };
        const d = {
            name: "/projects/project/databases/(default)/collectionGroups/collectionB/indexes/d",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldA",
                    order: API.Order.DESCENDING,
                },
            ],
        };
        const e = {
            name: "/projects/project/databases/(default)/collectionGroups/collectionB/indexes/e",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldA",
                    vectorConfig: {
                        dimension: 100,
                        flat: {},
                    },
                },
            ],
        };
        const f = {
            name: "/projects/project/databases/(default)/collectionGroups/collectionB/indexes/f",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldA",
                    vectorConfig: {
                        dimension: 200,
                        flat: {},
                    },
                },
            ],
        };
        const g = {
            name: "/projects/project/databases/(default)/collectionGroups/collectionB/indexes/g",
            queryScope: API.QueryScope.COLLECTION,
            fields: [
                {
                    fieldPath: "fieldA",
                },
            ],
        };
        (0, chai_1.expect)([b, a, d, g, f, e, c].sort(sort.compareApiIndex)).to.eql([a, b, c, d, e, f, g]);
    });
    it("should correctly sort an array of API field overrides", () => {
        const a = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collectionA/fields/fieldA",
            indexConfig: {
                indexes: [],
            },
        };
        const b = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collectionB/fields/fieldA",
            indexConfig: {
                indexes: [],
            },
        };
        const c = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collectionB/fields/fieldB",
            indexConfig: {
                indexes: [
                    {
                        queryScope: API.QueryScope.COLLECTION,
                        fields: [{ fieldPath: "fieldB", order: API.Order.DESCENDING }],
                    },
                ],
            },
        };
        const d = {
            name: "/projects/myproject/databases/(default)/collectionGroups/collectionB/fields/fieldB",
            indexConfig: {
                indexes: [
                    {
                        queryScope: API.QueryScope.COLLECTION,
                        fields: [{ fieldPath: "fieldB", arrayConfig: API.ArrayConfig.CONTAINS }],
                    },
                ],
            },
        };
        (0, chai_1.expect)([b, a, d, c].sort(sort.compareApiField)).to.eql([a, b, c, d]);
    });
});
//# sourceMappingURL=indexes.spec.js.map