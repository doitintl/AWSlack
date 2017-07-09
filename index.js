function runTest(test, data) {
    $ = data;
    return eval(`'use strict';(${test});`);
}

function evalMessage(message, data) {
    $ = data;
    return eval(`'use strict';\`${message}\`;`);
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
    return readDynamo("Configs").then(data => {
        return data.reduce((configs, config) => {
            configs[config.name.S] = config.value.S;
            return configs;
        }, {});
    });
}

function getTests() {
    return readDynamo("Tests").then(data => {
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
            channel: channel
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
    Promise.all([
        writeDynamo("Configs", { name: { S: "slackAPIToken" }, value: { S: "<YOUR_API_TOKEN>" } }),
        writeDynamo("Tests", { name: { S: "all" }, test: { S: "true" }, message: { S: "this was an event: ${JSON.stringify($)}" }, slackChannel: { S: "aws" } })
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

    var request = https.request(options, function (response) {
        context.done();
    });

    request.on("error", function (error) {
        context.done();
    });

    // write data to request body
    request.write(responseBody);
    request.end();
}