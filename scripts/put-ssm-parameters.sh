# The reason to have this helper script is to be able to test the infrastructure pipeline without having accounts pipeline

#!/usr/bin/env bash
set -eu

STAGES=(` \
    ts-node -pe \
    'import {STAGES} from "./cdk/config"; (STAGES??["Beta","Gamma","Prod"]).join(" ") ' \
`)

echo "This script will take the region and AWS Account ID from the current AWS configuration (using aws cli) and save them as SSM parameters."

echo -n "Detecting region..."
region=$(aws ec2 describe-availability-zones --output text --query "AvailabilityZones[0].[RegionName]")
echo " = ${region}"

echo -n "Detecting AWS Account ID..."
account_id=$(aws sts get-caller-identity --output text --query "Account")
echo " = ${account_id}"

echo "Putting (overwriting) SSM Parameters:"
for stage in "${STAGES[@]}"; do
  echo "    * ${account_id}:${region} -> /account/${stage}"
  aws ssm put-parameter \
    --name "/account/${stage}" \
    --value "${account_id}:${region}" \
    --overwrite \
    --type String
done;