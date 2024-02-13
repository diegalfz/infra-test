#!/bin/bash  

set -o errexit

# Build
cdk synth --profile edk-devops

# Deploy
cdk deploy --require-approval never --profile edk-devops

# Initialize git and push the code to repo if there are changes
if git diff-index --quiet HEAD; then
    echo "No changes to be deployed"
else
    # Changes to be committed and pushed
    git add -A
    git commit -m "Deploy"
    git push --set-upstream origin main
fi