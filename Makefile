all:

zip-code:
	zip -r code.zip index.js package.json node_modules

deploy-version: zip-code
	aws s3 cp AWSlack.template.json s3://awslack-cf-template/source/ --acl public-read
	aws s3 cp code.zip s3://awslack-cf-template/source/ --acl public-read

