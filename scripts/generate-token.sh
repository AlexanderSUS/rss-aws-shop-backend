#!/bin/bash

if [ ! -f .env ]; then
  echo ".env file does not exist. Run command:"
  echo "cat env.example > .env"
  exit 1
fi

source .env

printf "%s:%s" "$GITHUB_ACCOUNT_LOGIN" "$AUTH_PASSWORD" | base64


