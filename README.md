# AWSlack

## Prerequisites
- A valid `AWS` Account.
- Any `AWS` supported browser. ( Chrome / Firefox / Safari etc. )

## Deployment
- Hold down the `Ctrl` button and Click the `Launch Stack` button to deploy the stack into your account:

<a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/new?stackName=AWSlack&templateURL=https://s3.amazonaws.com/awslack-cfn-template/source/AWSlack.template.json" target="_blank"><img src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"></img></a>
- Click `Next` and Confirm all steps until the stack deploys.

## Generate Slack API Token
- Go to https://<YOUR_SLACK_TEAM>.slack.com/apps/new/A0F7YS25R-bots
- Enter a name for the bot to post with. (i.e. @aws)
- Click `Add bot integration`.
- Wait until the UI displays the `API Token` and copy the string (i.e. xxxx-yyyyyyyyyyyy-zzzzzzzzzzzzzzzzzzzzzzzz).
- Keep this token for using in the next step.
- Don't forget to invite your new bot to a channel by `@` mentioning it.

## Configure
- Open your browser at [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/home)
- Switch to the `Tables` tab.
- Select the `awslack.configs` table and go to the `Items` tab.
- Edit the slackAPIToken and set the `value` to the slack API token created in the previous step.
- Save the new value.
- Select the `awslack.tests` table and go to the `Items` tab.
- You can change or delete the existing tests.
- You can also add new tests.
