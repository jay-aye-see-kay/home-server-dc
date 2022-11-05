#!/bin/sh
set -eu

docker-compose pull
docker-compose up -d --remove-orphans
