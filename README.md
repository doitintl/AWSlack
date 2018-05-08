# AWSlack

## Prerequisites
- A valid `AWS` Account.
- Any `AWS` supported browser. ( Chrome / Firefox / Safari etc. )

## Generate Slack API Token
- Go to https://<YOUR_SLACK_TEAM>.slack.com/apps/new/A0F7YS25R-bots
- Enter a name for the bot to post with. (i.e. @aws)
- Click `Add bot integration`.
- Wait until the UI displays the `API Token` and copy the string (i.e. xxxx-yyyyyyyyyyyy-zzzzzzzzzzzzzzzzzzzzzzzz).
- Keep this token for using in the next step.
- Don't forget to invite your new bot to a channel by `@` mentioning it.

## Deployment
- Hold down the `Ctrl` button and Click the `Launch Stack` button to deploy the stack into your account:

<a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/new?stackName=AWSlack&templateURL=https://s3.amazonaws.com/awslack-v2/source/AWSlack.template.json" target="_blank"><img src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"></img></a>
- Paste your `API Token` in the `SlackAPIToken` parameter.
- The bot will publish messages to the channel in the `DefaultSlackChannel` parameter. The default is `aws`.
- Click `Next` and Confirm all steps until the stack deploys.

## Configure
- Open your browser at [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/home)
- Switch to the `Tables` tab.
- Select the `awslack.tests` table and go to the `Items` tab.
- You can add new tests or change/delete existing tests.
- You can change the `slackChannel` attribute of each test to another Slack channel.
- Select the `awslack.configs` table and go to the `Items` tab.
- You can edit the slackAPIToken and set the `value` to another slack API token.
