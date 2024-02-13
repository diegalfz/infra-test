import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface SharedResourceStackProps extends cdk.StackProps {
    createUserPool: boolean;
    createUserPoolDomain?: boolean;
    resourcePrefix: string;
    userPoolDomainPrefix?: string;
}

export class SharedResourceStack extends cdk.Stack {
    readonly userPool?: cognito.UserPool;
    readonly userPoolClient?: cognito.UserPoolClient;
    readonly userPoolDomain?: cognito.UserPoolDomain;

    constructor(scope: Construct, id: string, props: SharedResourceStackProps) {
        super(scope, id, props);

        if (props.createUserPool) {
            this.userPool = new cognito.UserPool(this, `${props.resourcePrefix}-SharedUserPool`, {
                signInAliases: { email: true },
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            });
            this.userPoolClient = new cognito.UserPoolClient(this, `${props.resourcePrefix}-SharedUserPoolClient`, {
                userPool: this.userPool,
            });
            new StringParameter(this, `${props.resourcePrefix}-CognitoUserPoolIdParameter`, {
                parameterName: "cognitoUserPoolId",
                stringValue: this.userPool.userPoolId,
            });
            if (props.createUserPoolDomain && props.userPoolDomainPrefix) {
                this.userPoolDomain = new cognito.UserPoolDomain(this, `${props.resourcePrefix}-SharedUserPoolDomain`, {
                    userPool: this.userPool,
                    cognitoDomain: {
                        domainPrefix: props.userPoolDomainPrefix as string,
                    },
                });
            }
        }
    }
}
