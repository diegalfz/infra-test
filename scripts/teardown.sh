#!/bin/bash  

stacks=`cdk list`

for i in $stacks
do
    yes | cdk destroy $i --profile edk-devops
done