function runTest(test, data) {
    try {
        $ = data;
        return eval(`'use strict';(${test});`);
    }
    catch (err) {
        console.log(`Rule test error in '${test}': ${err}`);
        return false;
    }
}

function evalMessage(message, data) {
    try {
        $ = data;
        return eval(`'use strict';\`${message}\`;`);
    }
    catch (err) {
        console.log(`Rule message error in '${message}': ${err}`);
        return "";
    }
}

const AWS = require('aws-sdk');
const Slack = require('slack-node');
const dynamodb = new AWS.DynamoDB();

exports.handleEvent = function (event, context, callback) {
    console.log(`event data: ${JSON.stringify(event)}`);
    Promise.all([
        getConfig(),
        getTests()
    ])
        .then(([config, tests]) => {
            return Promise.all(tests.map(test => {
                let clonedData = JSON.parse(JSON.stringify(event));
                if (runTest(test.test, clonedData)) {
                    let message = evalMessage(test.message, clonedData);
                    return sendSlack(test.slackChannel, message, config.slackAPIToken);
                }
                else {
                    return Promise.resolve();
                }
            }));
        })
        .then(() => {
            callback(null, {});
        })
        .catch(err => {
            callback(err);
        });
};

function getConfig() {
    return readDynamo("awslack.configs").then(data => {
        return data.reduce((configs, config) => {
            configs[config.name.S] = config.value.S;
            return configs;
        }, {});
    });
}

function getTests() {
    return readDynamo("awslack.tests").then(data => {
        return data.map(test => ({
            test: test.test.S,
            message: test.message.S,
            slackChannel: test.slackChannel.S
        }));
    });
}

function readDynamo(tableName) {
    return new Promise((resolve, reject) => {
        try {
            dynamodb.scan({
                TableName: tableName
            }, function (err, data) {
                if (!!err) {
                    reject(err);
                }
                else {
                    resolve(data.Items);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    });
}

function writeDynamo(tableName, item) {
    return new Promise((resolve, reject) => {
        try {
            dynamodb.putItem({
                TableName: tableName,
                Item: item
            }, function (err, data) {
                if (!!err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    });
}

function sendSlack(channel, message, apiToken) {
    return new Promise((resolve, reject) => {
        const slack = new Slack(apiToken);
        slack.api('chat.postMessage', {
            text: message, 
            channel: channel,
            as_user	: true
        }, function (err, response) {
            if (!!err) {
                reject(err);
            }
            else {
                resolve(response);
            }
        });
    });
}

exports.initDynamoDB = function (event, context, callback) {
    const slackAPIToken = event.ResourceProperties.SlackAPIToken;
    const defaultSlackChannel = event.ResourceProperties.DefaultSlackChannel;

    Promise.all([
        writeDynamo("awslack.configs", { name: { S: "slackAPIToken" }, value: { S: slackAPIToken } }),
        writeDynamo("awslack.tests", { name: { S: "bucket_create" }, test: { S: "$.source==='aws.s3' && $.detail.eventName==='CreateBucket'" }, message: { S: "Bucket ${$.detail.requestParameters.bucketName} created in region ${$.region} by ${$.detail.userIdentity.arn}" }, slackChannel: { S: defaultSlackChannel } }),
        writeDynamo("awslack.tests", { name: { S: "bucket_delete" }, test: { S: "$.source==='aws.s3' && $.detail.eventName==='DeleteBucket'" }, message: { S: "Bucket ${$.detail.requestParameters.bucketName} deleted in region ${$.region} by ${$.detail.userIdentity.arn}" }, slackChannel: { S: defaultSlackChannel } }),
        writeDynamo("awslack.tests", { name: { S: "lambda_update" }, test: { S: "$.source==='aws.lambda' && $.detail.eventName.includes('UpdateFunctionCode')" }, message: { S: "The Lambda function ${$.detail.requestParameters.functionName} was updated by ${$.detail.userIdentity.arn}" }, slackChannel: { S: defaultSlackChannel } }),
        writeDynamo("awslack.tests", { name: { S: "ec2_start" }, test: { S: "$.source==='aws.ec2' && $['detail-type']==='EC2 Instance State-change Notification' && $.detail.state==='running'" }, message: { S: "EC2 instance ${$.detail['instance-id']} started in region ${$.region}" }, slackChannel: { S: defaultSlackChannel } }),
        writeDynamo("awslack.tests", { name: { S: "autoscale" }, test: { S:"$.source==='aws.autoscaling' && ( $['detail-type']==='EC2 Instance Terminate Successful' || $['detail-type']==='EC2 Instance Launch Successful')" }, message: { S: "Autoscaling event of type ${$['detail-type']} on group ${$.detail.AutoScalingGroupName} in region ${$.region} - Cause: ${$.detail.Cause}" }, slackChannel: { S: defaultSlackChannel } }),
        writeDynamo("awslack.tests", { name: { S: "health" }, test: { S:"$.source==='aws.health'" }, message: { S: "Health event ${$.detail.eventTypeCode} in region ${$.region}" }, slackChannel: { S: defaultSlackChannel } }),
        writeDynamo("awslack.tests", { name: { S: "signin" }, test: { S:"$.source==='aws.signin'" }, message: { S: "Sign-in event by ${$.detail.userIdentity.arn} from ${$.detail.sourceIPAddress} in region ${$.region} at ${$.detail.eventTime} with UserAgent: ${$.detail.userAgent}" }, slackChannel: { S: defaultSlackChannel } })
    ])
        .then(() => {
            sendResponse(event, context, "SUCCESS", {});
            callback(null, {});
        })
        .catch(err => {
            sendResponse(event, context, "FAILED", err);
            callback(err);
        });
};

function sendResponse(event, context, responseStatus, responseData) {
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: JSON.stringify(responseData),
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });

    console.log("RESPONSE BODY:\n", responseBody);

    var https = require("https");
    var url = require("url");

    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };

    console.log("SENDING RESPONSE...\n");

    var request = https.request(options, function (response) {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        // Tell AWS Lambda that the function execution is done  
        context.done();
    });

    request.on("error", function (error) {
        console.log("sendResponse Error:" + error);
        // Tell AWS Lambda that the function execution is done  
        context.done();
    });

    // write data to request body
    request.write(responseBody);
    request.end();
}