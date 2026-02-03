"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const filters_1 = require("./filters");
const error_1 = require("../error");
chai.use(chaiAsPromised);
const expect = chai.expect;
describe("filters", () => {
    describe("validateEventFilters", () => {
        it("should not throw for undefined filter", () => {
            expect(() => (0, filters_1.validateEventFilters)(undefined)).to.not.throw();
        });
        it("should not throw for empty filter", () => {
            expect(() => (0, filters_1.validateEventFilters)({})).to.not.throw();
        });
        describe("deviceDisplayNames validation", () => {
            it("should not throw for valid device display name format", () => {
                const filter = {
                    deviceDisplayNames: ["Samsung (Galaxy S21)", "Google (Pixel 6)", "Apple (iPhone 13)"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.not.throw();
            });
            it("should throw for invalid device display name without parentheses", () => {
                const filter = {
                    deviceDisplayNames: ["Samsung Galaxy S21"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "deviceDisplayNames must match pattern 'manufacturer (device)'");
            });
            it("should throw for invalid device display name with missing manufacturer", () => {
                const filter = {
                    deviceDisplayNames: ["(Galaxy S21)"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "deviceDisplayNames must match pattern 'manufacturer (device)'");
            });
            it("should throw for invalid device display name with empty parentheses", () => {
                const filter = {
                    deviceDisplayNames: ["Samsung ()"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "deviceDisplayNames must match pattern 'manufacturer (device)'");
            });
            it("should throw when any device display name is invalid", () => {
                const filter = {
                    deviceDisplayNames: ["Samsung (Galaxy S21)", "InvalidFormat", "Google (Pixel 6)"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "deviceDisplayNames must match pattern 'manufacturer (device)'");
            });
        });
        describe("operatingSystemDisplayNames validation", () => {
            it("should not throw for valid OS display name format", () => {
                const filter = {
                    operatingSystemDisplayNames: ["iOS (15.0)", "Android (12)", "Windows (11)"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.not.throw();
            });
            it("should throw for invalid OS display name without parentheses", () => {
                const filter = {
                    operatingSystemDisplayNames: ["iOS 15.0"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "operatingSystemDisplayNames must match pattern 'os (version)'");
            });
            it("should throw for invalid OS display name with empty parentheses", () => {
                const filter = {
                    operatingSystemDisplayNames: ["iOS ()"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "operatingSystemDisplayNames must match pattern 'os (version)'");
            });
        });
        describe("versionDisplayNames validation", () => {
            it("should not throw for valid version display name format", () => {
                const filter = {
                    versionDisplayNames: ["1.0.0 (100)", "2.1.3 (213)", "3.0.0-beta (300)"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.not.throw();
            });
            it("should throw for invalid version display name without parentheses", () => {
                const filter = {
                    versionDisplayNames: ["1.0.0 build 100"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "versionDisplayNames must match pattern 'version (build)'");
            });
            it("should throw for invalid version display name with missing version", () => {
                const filter = {
                    versionDisplayNames: ["(100)"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "versionDisplayNames must match pattern 'version (build)'");
            });
            it("should throw when any version display name is invalid", () => {
                const filter = {
                    versionDisplayNames: ["1.0.0 (100)", "InvalidFormat", "2.0.0 (200)"],
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "versionDisplayNames must match pattern 'version (build)'");
            });
        });
        describe("intervalStartTime validation", () => {
            it("should not throw for intervalStartTime within 90 days", () => {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                const filter = {
                    intervalStartTime: thirtyDaysAgo,
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.not.throw();
            });
            it("should not throw for intervalStartTime exactly 89 days ago", () => {
                const eightyNineDaysAgo = new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString();
                const filter = {
                    intervalStartTime: eightyNineDaysAgo,
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.not.throw();
            });
            it("should throw for intervalStartTime more than 90 days in the past", () => {
                const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString();
                const filter = {
                    intervalStartTime: ninetyOneDaysAgo,
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "intervalStartTime must be less than 90 days in the past");
            });
            it("should throw for intervalStartTime 100 days in the past", () => {
                const hundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
                const filter = {
                    intervalStartTime: hundredDaysAgo,
                };
                expect(() => (0, filters_1.validateEventFilters)(filter)).to.throw(error_1.FirebaseError, "intervalStartTime must be less than 90 days in the past");
            });
        });
    });
});
//# sourceMappingURL=filters.spec.js.map