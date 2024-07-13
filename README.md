# rss-aws-shop-backend

## installation and deployment

Before deploy you should instal aws cli and aws-cdk on you computer

Install dependencies
```bash
npm install && (cd product-service && npm i) && (cd import-service && npm i)
```

Create .env file and put there content of env.example file with updated credentials

Build the project
```bash
npm run build
```

Synth cdk template
```bash
cdk synth
```

Run bootstrap command (need to run only once)
```bash
cdk bootstrap
```

Deploy <br>
For getting email form SNS specify your email as parameter
```bash
cdk deploy ProductServiceStack --parameters subscriptionEmail=your@email.here && cdk deploy ImportServiceStack
```

Remove js and .d.ts files
```bash
npm run clean
```

## Test
To run tests you should install docker on you computer
as tests are require dynamodb-local

to run test execute
```bash
npm run test
```

## Run app locally with localstack
#### install localstack tools
Install aws-cdk-local
```bash
npm install -g aws-cdk-local
```
Install awslocal

```bash
python3 -m pip --version
python3 -m pip install awscli-local
awslocal --version
```
if you got "command not found" error add following string to your ~/.zshrc(.bashrc) file for mac or Linux. Or google the how to do it if you Windows guy<br>
**don't forget to replace your user and check python version in path**
```
export PATH="/Users/your_username/Library/Python/3.9/bin:$PATH"
```
#### Deploy
start localstack in docker

After containers starts you can see available resources in [web interface](https://app.localstack.cloud/inst/default/status)

```bash
docker compose -f localstack-compose.yaml up -d
```
stop localstack container
```bash
docker compose -f localstack-compose.yaml down
```

bootstrap cdk
```bash
cdklocal bootstrap
```

build project
```bash
npm run build
```

synth cdk assets and templates
```bash
cdk synth
```

Deploy in localstack
- ProductServiceStack. Don't forget to change `subscriptionEmail` parameter
```bash
cdklocal deploy --require-approval never ProductServiceStack --parameters subscriptionEmail=your@email.here
```
- ImportServiceStack
```bash
cdklocal deploy --require-approval never ImportServiceStack
```

You can deploy with one command, but before running update subscriptionEmail in ./deploy-local.sh file
```bash
npm run local:start
```

to stop use
```bash
npm run local:stop
```

You can use command `awslocal` to call you resources. For example
```bash
BUCKET_NAME=$(awslocal s3 ls | grep importservicestack | awk '{ print $3 }') && \
awslocal s3api put-object --bucket  "$BUCKET_NAME" --key uploaded/testfile.csv --body ./test/testfile.csv && \
awslocal s3api list-objects --bucket  "$BUCKET_NAME"
```
Due to current importservicestack's bucket cors policy you can't see objects via web interface
