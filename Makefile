all: deploy-version

install-dep:
	npm install

zip-code: install-dep
	zip -r code.zip index.js package.json node_modules

deploy-version: zip-code
	aws s3 cp AWSlack.template.json s3://awslack-v2/source/ --acl public-read
	aws s3 cp code.zip s3://awslack-v2/source/ --acl public-read

clean:
	rm -f code.zip
	rm -rf node_modules