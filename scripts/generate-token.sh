#!/bin/bash

if [ ! -f .env ]; then
  echo ".env file does not exist"
  exit 1
fi

source .env

echo "${GITHUB_ACCOUNT_LOGIN}:${AUTH_PASSWORD}" | base64


