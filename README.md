Steps to deploy:

1. Ensure your core-accounts pipeline has finished, and your devops and environment accounts have been successfully created.
1. Add your admin account and devops account credentials to your ~/.aws/credentials file.
    ```
    [edk-admin]
    aws_access_key_id=<your admin access key>
    aws_secret_access_key=<your admin secret>
    aws_session_token=<your admin session token>
    [edk-devops]
    aws_access_key_id=<your devops access key>
    aws_secret_access_key=<your devops secret>
    aws_session_token=<your devops session token>
    ```
1. Deploy from your parent EDK project using `edk deploy core-infrastructure`