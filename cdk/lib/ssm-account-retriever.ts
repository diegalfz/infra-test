import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface Account {
    readonly accountId: string;
    readonly region: string;
}

const dummyPrefix = "dummy-value";

/**
 * Retrieves account information from SSM.
 *
 * SSM will return dummy values in the form 'dummy-value-for-${parameterName}' during initial CDK construction that can cause CDK synth to fail before the actual SSM value is returned. To account for this, default values can be provided to override the initial dummy values.
 *
 * @param scope - Scope of the stack
 * @param accountKey - The SSM key of the AccountId to retrieve
 * @param regionKey  - The SSM key of the region to retrieve
 * @param accountDefault - Account Default value to use during initial construct. Defaults to "123456789012" if no value is provided.
 * @param regionDefault - Region Default value to use during initial CDK construction. Defaults to "us-east-1" if no value is provided.
 * @returns - An {@class Account} containing the retrieved accountId and region.
 */
export function retrieveAccount(
    scope: Construct,
    accountKey: string,
    accountDefault: string = "123456789012",
    regionDefault: string = "us-east-1"
): Account {
    const accountInformationValue = StringParameter.valueFromLookup(scope, accountKey);

    /*
     SSM returns dummy values during initial cdk construction, before cdk synth is finalized. This can cause the initial construction to fail before cdk synth retrieves the actual values. This logic overrides those dummy values with more sensible default values that will get past initial construction.
     */
    if (accountInformationValue.includes(dummyPrefix)) {
        return {
            accountId: accountDefault,
            region: regionDefault,
        };
    }

    const accountInformation = accountInformationValue.split(":");

    return {
        accountId: accountInformation[0],
        region: accountInformation[1],
    };
}
