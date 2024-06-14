const swaggerAutogen = require("swagger-autogen")();

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

swaggerAutogen(outputFile, endpointsFiles, config);
