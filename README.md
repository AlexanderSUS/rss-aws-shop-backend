# rss-aws-shop-backend

## installation 

Before deploy you should instal aws cli and aws-cdk on you computer

install dependencies
```bash
npm install && (cd product-service && npm install)
```

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Test
To run tests you should install docker on you computer
as tests are require dynamodb-local

to run test execute
```bash
npm run test
```
