import { Container, Pod } from "../lib";

// https://hub.docker.com/r/jellyfin/jellyfin
// https://jellyfin.org/docs/general/administration/installing.html#docker
const main = new Container({
  name: "main",
  image: "jellyfin/jellyfin",
  volumes: [
    { host: "$PWD/data/jellyfin/config", container: "/config" },
    { host: "$PWD/data/jellyfin/cache", container: "/cache" },
  ],
});

export const jellyfin = new Pod({
  name: "jellyfin",
  containers: [main],
  expose: [{ container: main, port: 8096 }],
});
