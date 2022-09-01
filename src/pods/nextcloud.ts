import { Container, Pod } from "../lib";

// FIXME use proper secrets management
const postgresSecrets = {
  POSTGRES_DB: "postgres_db",
  POSTGRES_USER: "postgres_user",
  POSTGRES_PASSWORD: "postgres_password",
};

const db = new Container({
  name: "db",
  image: "postgres:14",
  environment: {
    ...postgresSecrets,
  },
});

// https://hub.docker.com/_/nextcloud/
const main = new Container({
  name: "main",
  image: "nextcloud:24",
  volumes: [
    // { host: "$PWD/data/jellyfin/config", container: "/config" },
  ],
  environment: {
    POSTGRES_HOST: "nextcloud__db", // FIXME how can I compute this at runtime?
    ...postgresSecrets,
  },
  dependsOn: [db],
});

export const nextcloud = new Pod({
  name: "nextcloud",
  containers: [main, db],
  expose: [{ container: main, port: 80 }],
});
