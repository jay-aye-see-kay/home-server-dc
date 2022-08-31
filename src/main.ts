import yaml from "yaml";
import fs from "fs/promises";

/** dc calls these "services" but they're just containers */
type ContainerOpts = {
  name: string;
  image: string;
  ports?: { host: number; container: number }[];
  volumes?: { host: string; container: string }[];
  environment?: Record<string, string>;
};

type HcPair = { host: string | number; container: string | number };
function hc2s(x: HcPair) {
  return `${x.host}:${x.container}`;
}

class Container {
  name: string;
  image: string;
  ports?: HcPair[];
  volumes?: HcPair[];
  environment?: Record<string, string>;

  constructor(opts: ContainerOpts) {
    this.name = opts.name;
    this.image = opts.image;
    this.ports = opts.ports;
    this.volumes = opts.volumes;
    this.environment = opts.environment;
  }

  toJson() {
    const ports = !this.ports ? {} : { ports: this.ports.map(hc2s) };
    const volumes = !this.volumes ? {} : { volumes: this.volumes.map(hc2s) };
    const env = !this.environment ? {} : { environment: this.environment };
    return {
      [this.name]: {
        // name: this.name,
        image: this.image,
        ...ports,
        ...volumes,
        ...env,
      },
    };
  }
}

/** group of containers and how they're exposed to the internet */
type Service = {
  name: string;
  containers: {};
};

const caddy = new Container({
  name: "caddy",
  image: "caddy",
  ports: [{ host: 80, container: 80 }],
  volumes: [
    { host: "$PWD/Caddyfile", container: "/etc/caddy/Caddyfile" },
    { host: "$PWD/site", container: "/srv" },
  ],
});

const echo = new Container({
  name: "echo",
  image: "ealen/echo-server",
});

const warningGenerated = "# this file was generated, do not edit directly";

const dockerComposeFile =
  warningGenerated +
  "\n" +
  yaml.stringify({
    version: "3",
    services: {
      ...caddy.toJson(),
      ...echo.toJson(),
    },
  });
fs.writeFile("docker-compose.yaml", dockerComposeFile, "utf-8");

const caddyFile = `${warningGenerated}
:80 {
	reverse_proxy echo:80
}
http://echo.localhost {
	reverse_proxy echo:80
}
`;

fs.writeFile("Caddyfile", caddyFile, "utf-8");

// setup caddy
// - services should add to caddy file as well as the docker compose file
//
// setup a "sync" or "update" script
// - runs the TS to make docker-compose file
// - docker-compose up -d
// - reloads caddyfile
