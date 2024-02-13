/// <reference types="@types/jest" />

import { App } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { retrieveAccount } from "../../../cdk/lib/ssm-account-retriever";

jest.mock("aws-cdk-lib/aws-ssm");

describe("Test ssm-account-retrieve", () => {
    let app: App;

    beforeEach(() => {
        app = new App();
    });

    describe("retrieveAccount", () => {
        describe("when CDK returns a dummy value", () => {
            beforeEach(() => {
                StringParameter.valueFromLookup = jest.fn().mockReturnValue("dummy-value");
            });
            describe("when no default overrides are provided", () => {
                it("should return function defaults", () => {
                    const account = retrieveAccount(app, "accountKey");
                    expect(account.accountId).toBe("123456789012");
                    expect(account.region).toBe("us-east-1");
                });
            });
            describe("when default overrides are provided", () => {
                it("should return the overrides", () => {
                    const accountOverride = "accountOverride";
                    const regionOverride = "regionOverride";
                    const account = retrieveAccount(app, "accountKey", accountOverride, regionOverride);
                    expect(account.accountId).toBe(accountOverride);
                    expect(account.region).toBe(regionOverride);
                });
            });
        });
        describe("when CDK returns actual lookup values", () => {
            let accountId = "21087654321";
            let region = "us-west-1";
            beforeEach(() => {
                StringParameter.valueFromLookup = jest.fn().mockReturnValue(`${accountId}:${region}`);
            });
            it("should return the lookup values", () => {
                const account = retrieveAccount(app, "accountKey");
                expect(account.accountId).toBe(accountId);
                expect(account.region).toBe(region);
            });
        });
    });
});
