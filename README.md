# aSlack

## Prerequisites
- A valid `AWS` Account.
- Any `AWS` supported browser. ( Chrome / Firefox / Safari etc. )

## Deployment
- Hold down the `Ctrl` button and Click the `Launch Stack` button to deploy the stack into your account:

<a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/new?stackName=aSlack&templateURL=https://s3.amazonaws.com/a-slack/source/aSlack.template.json" target="_blank"><img src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"></img></a>

## Generate Slack API Token
- Go to [https://<YOUR_SLACK_TEAM>.slack.com/apps/new/A0F7YS25R-bots]()
- Enter a name for the bot to post with. (i.e. gcp-alert-service)
- Click `Add bot integration`.
- Wait until the UI displays the `API Token` and copy the string (i.e. xxxx-yyyyyyyyyyyy-zzzzzzzzzzzzzzzzzzzzzzzz)
- Configure the deployment configuration using the [Datastore UI](https://console.cloud.google.com/datastore) by adding a Config {"name":"slackAPIToken","value":"<YOUR_SLACK_API_TOKEN>"} entity.
