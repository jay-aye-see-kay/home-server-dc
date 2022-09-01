type ContainerOpts = {
  name: string;
  image: string;
  ports?: { host: number; container: number }[];
  volumes?: { host: string; container: string }[];
  environment?: Record<string, string>;
  dependsOn?: Container[];
  labels?: Record<string, string>;
};

type HcPair = { host: string | number; container: string | number };
function hc2s(x: HcPair) {
  return `${x.host}:${x.container}`;
}

/** docker-compose calls these "services" but they're just containers */
export class Container {
  name: string;
  image: string;
  ports?: HcPair[];
  volumes?: HcPair[];
  environment?: Record<string, string>;
  dependsOn?: Container[];
  labels: Record<string, string>;

  constructor(opts: ContainerOpts) {
    this.name = opts.name;
    this.image = opts.image;
    this.ports = opts.ports;
    this.volumes = opts.volumes;
    this.environment = opts.environment;
    this.dependsOn = opts.dependsOn;
    this.labels = opts.labels ?? {};
  }

  dockerConfig() {
    const ports = !this.ports ? {} : { ports: this.ports.map(hc2s) };
    const volumes = !this.volumes ? {} : { volumes: this.volumes.map(hc2s) };
    const env = !this.environment ? {} : { environment: this.environment };
    const deps = !this.dependsOn
      ? {}
      : { depends_on: this.dependsOn.map((c) => c.name) };

    return {
      [this.name]: {
        container_name: "hs__" + this.name,
        image: this.image,
        ...ports,
        ...volumes,
        ...env,
        ...deps,
        labels: this.labels,
      },
    };
  }
}

type ServiceOpts = {
  name: string;
  containers: Container[];
  expose: Array<{
    container: Container;
    port: number;
    /** defailts to service name */
    subdomain?: string;
  }>;
};

/** group of containers and how they're exposed to the internet */
export class Pod {
  name: string;
  containers: Container[];
  exposed: ServiceOpts["expose"];

  constructor(opts: ServiceOpts) {
    this.name = opts.name;
    this.containers = opts.containers;
    this.containers.forEach((container) => {
      container.name = `${this.name}__${container.name}`;
      container.labels.hs__pod = this.name;
    });
    this.exposed = opts.expose;
  }

  dockerConfig() {
    return this.containers.reduce((all, one) => {
      return { ...all, ...one.dockerConfig() };
    }, {});
  }

  caddyConfig() {
    return this.exposed.map(({ container, port, subdomain }) =>
      caddyRp(container.name, port, subdomain ?? this.name)
    );
  }
}

function caddyRp(containerName: string, port: number, subdomain: string) {
  return `http://${subdomain}.localhost {
	reverse_proxy ${containerName}:${port}
}`;
}
