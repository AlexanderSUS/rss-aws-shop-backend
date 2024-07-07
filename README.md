# rss-aws-shop-backend

## installation and deployment

Before deploy you should instal aws cli and aws-cdk on you computer

Install dependencies
```bash
npm install && (cd product-service && npm i) && (cd import-service && npm i)
```

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
cdk deploy --parameters subscriptionEmail=your@email.here
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
