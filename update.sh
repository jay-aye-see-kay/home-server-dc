#!/bin/sh
set -eu

docker-compose up -d --remove-orphans
docker-compose exec --workdir=/etc/caddy caddy caddy reload
