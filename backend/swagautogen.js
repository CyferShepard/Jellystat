const swaggerAutogen = require("swagger-autogen")();
const fs = require("fs");

const outputFile = "./swagger.json";
const endpointsFiles = ["./server.js"];
const config = {
  info: {
    title: "Jellystat API Documentation",
    description: "",
  },
  tags: [
    {
      name: "API",
      description: "Jellystat API Endpoints",
    },
    {
      name: "Auth",
      description: "Jellystat Auth Endpoints",
    },
    {
      name: "Proxy",
      description: "Jellyfin Proxied Endpoints",
    },
    {
      name: "Stats",
      description: "Jellystat Statisitc Endpoints",
    },
    {
      name: "Sync",
      description: "Jellystat Sync Endpoints",
    },
    {
      name: "Backup",
      description: "Jellystat Backup/Restore Endpoints",
    },
    {
      name: "Logs",
      description: "Jellystat Log Endpoints",
    },
  ],
  host: "",
  schemes: ["http", "https"],
  securityDefinitions: {
    apiKey: {
      type: "apiKey",
      name: "x-api-token",
      in: "header",
    },
  },
  security: [
    {
      apiKey: [],
    },
  ],
};

module.exports = config;

const modifySwaggerFile = (filePath) => {
  const swaggerData = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const endpointsToModify = ["/api/getHistory", "/api/getLibraryHistory", "/api/getUserHistory", "/api/getItemHistory"]; // Add more endpoints as needed

  endpointsToModify.forEach((endpoint) => {
    if (swaggerData.paths[endpoint]) {
      const methods = Object.keys(swaggerData.paths[endpoint]);
      methods.forEach((method) => {
        const parameters = swaggerData.paths[endpoint][method].parameters;
        if (parameters) {
          parameters.forEach((param) => {
            if (param.name === "sort") {
              param.enum = [
                "UserName",
                "RemoteEndPoint",
                "NowPlayingItemName",
                "Client",
                "DeviceName",
                "ActivityDateInserted",
                "PlaybackDuration",
              ];

              if (endpoint.includes("getHistory") || endpoint.includes("getLibraryHistory")) {
                param.enum.push("TotalPlays");
              }
            }
          });
        }
      });
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(swaggerData, null, 2));
};

swaggerAutogen(outputFile, endpointsFiles, config).then(() => {
  modifySwaggerFile(outputFile);
});
