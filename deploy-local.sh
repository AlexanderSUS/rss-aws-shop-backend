#!/bin/bash

npm run build && \
cdk synth && \
docker compose -f localstack-compose.yaml up -d && \
cdklocal bootstrap && \
cdklocal deploy --require-approval never ProductServiceStack --parameters subscriptionEmail=your@email.here && \
cdklocal deploy --require-approval never ImportServiceStack
npm run clean