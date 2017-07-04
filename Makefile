all:

zip-code:
	zip code.zip index.js package.json

deploy-version: zip-code
	aws s3 cp aSlack.template.json s3://a-slack/source/ --acl public-read
	aws s3 cp code.zip s3://a-slack/source/ --acl public-read

