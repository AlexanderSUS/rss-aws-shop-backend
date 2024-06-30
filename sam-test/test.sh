#!/bin/bash

npm run build

cdk synth

sam build -t ./cdk.out/ProductServiceStack.template.json

rm ./{test,product-service,import-service,lib,bin}/*.{d.ts,js}

docker compose up -d

YELLOW='\033[0;33m'
NC='\033[0m'

LOCAL_DB_HOST=http://localhost:8000 ts-node ./test/create-tables.ts
ID=$(LOCAL_DB_HOST=http://localhost:8000 npm run fill:tables | tail -n +4 | jq '.[0].id')


echo -e "${YELLOW}GetProductsListFunction GET 200${NC}" 
echo "{\"pathParameters\":{\"productId\": $ID}}" > ./sam-test/GetProductByIdEvent.json
sam local invoke -t .aws-sam/build/template.yaml GetProductsListFunction \
 --docker-network rss-aws-shop-backend_default --env-vars ./sam-test/env.json | tail -n 1 | jq '.'


echo -e "${YELLOW}GetProductByIdFunction GET 404${NC}" 
echo "{\"pathParameters\":{\"productId\": \"56775fcb-6f2a-458e-a66b-b19db5b9ddd7\"}}" > ./sam-test/GetProductByIdEvent.json
sam local invoke -t .aws-sam/build/template.yaml GetProductByIdFunction \
  --docker-network rss-aws-shop-backend_default --env-vars ./sam-test/env.json -e ./sam-test/GetProductByIdEvent.json | tail -n 1 | jq '.'


echo -e "${YELLOW}GetProductByIdFunction GET 400${NC}" 
echo "{\"pathParameters\":{\"productId\": \"72445ea5\"}}" > ./sam-test/GetProductByIdEvent.json
sam local invoke -t .aws-sam/build/template.yaml GetProductByIdFunction \
  --docker-network rss-aws-shop-backend_default --env-vars ./sam-test/env.json -e ./sam-test/GetProductByIdEvent.json | tail -n 1 | jq '.'


rm ./sam-test/GetProductByIdEvent.json


echo -e "${YELLOW}CreateProductFucntion POST 201${NC}" 
sam local invoke -t .aws-sam/build/template.yaml CreateProductFunction \
  --docker-network rss-aws-shop-backend_default --env-vars ./sam-test/env.json -e ./sam-test/createProductEvent.json | tail -n 1 | jq '.'

docker compose down

sam build -t ./cdk.out/ImportServiceStack.template.json

echo -e "${YELLOW}ImportProdutsFileFunction GET 200${NC}" 
sam local invoke -t .aws-sam/build/template.yaml ImportProductsFile -e ./sam-test/GetImportEvnet.json | tail -n 1 | jq '.'

## TODO doesn't work in local environment without s3 
# echo -e "${YELLOW}ImportFileParserFunction GET 200${NC}" 
# sam local invoke -t .aws-sam/build/template.yaml ImportFileParser -e ./sam-test/s3PutEvent.json
