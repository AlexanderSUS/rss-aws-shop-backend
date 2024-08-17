#!/bin/bash

npm run build

cdk synth

sam build -t ./cdk.out/ProductServiceStack.template.json

rm ./{test,product-service,lib}/*.{d.ts,js}
rm ./product-service/create-product/*.{d.ts,js}

docker compose up -d

LOCAL_DB_HOST=http://localhost:8000 ts-node ./test/create-tables.ts
LOCAL_DB_HOST=http://localhost:8000 npm run fill:tables | grep id | head -1

sam local invoke -t .aws-sam/build/template.yaml GetProductsListFunction \
 --docker-network rss-aws-shop-backend_default --env-vars ./sam-test/env.json

sam local invoke -t .aws-sam/build/template.yaml GetProductByIdFunction \
  --docker-network rss-aws-shop-backend_default --env-vars ./sam-test/env.json -e ./sam-test/getProductByIdEvent.json

sam local invoke -t .aws-sam/build/template.yaml CreateProductFunction \
  --docker-network rss-aws-shop-backend_default --env-vars ./sam-test/env.json -e ./sam-test/createProductEvent.json

docker compose down

