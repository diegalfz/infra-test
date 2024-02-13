import { DeploymentPipeline } from "@awssolutions-cdk/deployment-pipeline";
import { Stage, aws_codecommit as codecommit } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { Environment } from "../app";
import { retrieveAccount } from "../lib/ssm-account-retriever";
import { SharedResourceStageProps } from "../stages/shared-resource";
import * as config from "../config.json";

export class InfrastructurePipelineStage extends Stage {}

export interface InfrastructurePipelineStackProps extends cdk.StackProps {
    readonly coreInfraRepoName: string;
    readonly infrastructurePipelineStage: typeof InfrastructurePipelineStage;
    readonly resourcePrefix: string;
    readonly servicesRepoName: string;
    readonly stageProps: SharedResourceStageProps;
    readonly userPoolDomainPrefix?: string;
    readonly environmentAccounts: Environment[] | [];
}

export class InfrastructurePipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: InfrastructurePipelineStackProps) {
        super(scope, id, props);

        const account = cdk.Stack.of(this).account;
        const region = cdk.Stack.of(this).region;
        let source: pipelines.CodePipelineSource;

        // Create the repo containing core-infra
        const repoBranch = "main";
        const coreInfraRepo = new codecommit.Repository(this, "CoreInfra", {
            repositoryName: props.coreInfraRepoName,
        } as codecommit.RepositoryProps);

        // Create the repo containing services
        new codecommit.Repository(this, "Services", {
            repositoryName: props.servicesRepoName,
        } as codecommit.RepositoryProps);

        if (config.infraCodeSource === "GitHub") {
            source = pipelines.CodePipelineSource.connection(
                `${config.infraGithubUserName}/${config.infraGithubRepoName}`,
                repoBranch,
                {
                    connectionArn: config.infraCodeStarConnectionARN,
                }
            );
        } else {
            source = pipelines.CodePipelineSource.codeCommit(coreInfraRepo, repoBranch);
        }

        const deploymentPipeline = new DeploymentPipeline(this, `${props.resourcePrefix}-Pipeline`, {
            pipelineName: "InfrastructurePipeline",
            primarySource: source,
            buildProps: {
                commands: [
                    "npm install -g pnpm@^8.2.0",
                    // assume the constructs repo read only role before getting auth token
                    "CREDS=$(aws sts assume-role --role-arn arn:aws:iam::188219725814:role/AWSProServeCECDKRepo-RepositoryReadOnlyRole --role-session-name ConstructsRepoAccess)",
                    "aws configure set aws_access_key_id $(echo \"${CREDS}\" | jq -r '.Credentials.AccessKeyId') --profile ConstructsRepoAccess",
                    "aws configure set aws_secret_access_key $(echo \"${CREDS}\" | jq -r '.Credentials.SecretAccessKey') --profile ConstructsRepoAccess",
                    "aws configure set aws_session_token $(echo \"${CREDS}\" | jq -r '.Credentials.SessionToken') --profile ConstructsRepoAccess",
                    // get auth token and configure npm
                    "export CA_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain amazon --domain-owner 188219725814 --query authorizationToken --region us-east-1 --output text --profile ConstructsRepoAccess`",
                    "npm config set registry=https://amazon-188219725814.d.codeartifact.us-east-1.amazonaws.com/npm/ce-cdk-constructs/",
                    "npm config set //amazon-188219725814.d.codeartifact.us-east-1.amazonaws.com/npm/ce-cdk-constructs/:_authToken=$CA_AUTH_TOKEN",
                    // add :443 for pnpm to work properly with CodeArtifact. ref : https://github.com/pnpm/pnpm/issues/5561#issuecomment-1298565447
                    "npm config set //amazon-188219725814.d.codeartifact.us-east-1.amazonaws.com:443/npm/ce-cdk-constructs/:_authToken=$CA_AUTH_TOKEN",
                    "npm config list",
                    "pnpm install",
                    "pnpm build",
                ],
            },
            reviewProps: {
                // TODO: unblock when we are ready
                blockOnIssuesFound: false,
            },
        });

        props.environmentAccounts.forEach((envAccount) => {
            let environment = retrieveAccount(this, envAccount.accountSsmKey);

            deploymentPipeline.addWave({
                waveName: envAccount.accountName,
                stages: [
                    {
                        stage: new props.infrastructurePipelineStage(this, envAccount.accountName, {
                            ...props.stageProps,
                            env: {
                                account: environment.accountId,
                                region: environment.region,
                            },
                        }),
                        approvalSteps: [],
                    },
                ],
            });
        });

        deploymentPipeline.buildPipeline();

        deploymentPipeline.codePipeline.synthProject.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["ssm:GetParameter"],
                resources: [`arn:aws:ssm:${region}:${account}:parameter/account/*`],
            })
        );

        deploymentPipeline.codePipeline.synthProject.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["sts:AssumeRole"],
                resources: ["arn:aws:iam::188219725814:role/AWSProServeCECDKRepo-RepositoryReadOnlyRole"],
            })
        );

        deploymentPipeline.codePipeline.selfMutationProject.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["ssm:GetParameter"],
                resources: [`arn:aws:ssm:${region}:${account}:parameter/cdk-bootstrap/*`],
            })
        );

        deploymentPipeline.codePipeline.selfMutationProject.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["sts:AssumeRole"],
                resources: [`arn:aws:iam::${account}:role/cdk-*`],
            })
        );
    }
}
