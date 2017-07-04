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
    console.log(`event: ${JSON.stringify(event)}`);
    Promise.all([
        getConfig(),
        getTests()
    ])
        .then(([config, tests]) => {
            console.log(`config: ${JSON.stringify(config)} , tests: ${JSON.stringify(tests)}`);
            return Promise.all(tests.map(test => {
                let clonedData = JSON.parse(JSON.stringify(event));
                if (runTest(test.test, clonedData)) {
                    let message = evalMessage(test.message, clonedData);
                    console.log(`message: ${message}`);
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
            console.log(e);
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
