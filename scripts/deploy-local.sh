#!/bin/bash

if [ ! -f .env ]; then
  echo ".env file does not exist"
  exit 1
fi

if docker ps | grep -q "localstack/localstack"; then
echo "Doker is running"
else
docker compose -f localstack-compose.yaml up -d && cdklocal bootstrap
fi

source .env

npm run build && \
cdk synth && \
cdklocal deploy --all --require-approval never --parameters "subscriptionEmail=$SUBSCRIPTION_EMAIL"
npm run clean