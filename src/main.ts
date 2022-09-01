import yaml from "yaml";
import fs from "fs/promises";
import { Container } from "./lib";
import { pods } from "./pods";

const caddy = new Container({
  name: "caddy",
  image: "caddy",
  ports: [{ host: 80, container: 80 }],
  volumes: [
    { host: "$PWD/Caddyfile", container: "/etc/caddy/Caddyfile" },
    { host: "$PWD/site", container: "/srv" },
  ],
});

const warningGenerated = "# this file was generated, do not edit directly";

// create and write the docker compose file
const dockerComposeFile =
  warningGenerated +
  "\n" +
  yaml.stringify({
    version: "3",
    services: {
      ...caddy.dockerConfig(),
      ...pods.reduce((all, one) => ({ ...all, ...one.dockerConfig() }), {}),
    },
  });
fs.writeFile("docker-compose.yaml", dockerComposeFile, "utf-8");

// create and write the reverse proxy file
const caddyFile =
  `${warningGenerated}
:80 {
	reverse_proxy echo:80
}
` +
  pods.reduce((all, one) => {
    return all + one.caddyConfig() + "\n";
  }, "");
fs.writeFile("Caddyfile", caddyFile, "utf-8");
