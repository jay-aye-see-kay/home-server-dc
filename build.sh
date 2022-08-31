#!/bin/sh
set -eu

yarn ts-node src/main.ts
docker-compose up -d --remove-orphans
docker-compose exec --workdir=/etc/caddy caddy caddy reload
