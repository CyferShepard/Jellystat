const fs = require("fs");
const path = require("path");

async function writeEnvVariables() {
  //Define sensitive variables that should not be exposed
  const excludedVariables = ["JS_GEOLITE_LICENSE_KEY", "JS_USER", "JS_PASSWORD"];
  // Fetch environment variables that start with JS_
  const envVariables = Object.keys(process.env).reduce((acc, key) => {
    if (key.startsWith("JS_") && !excludedVariables.includes(key)) {
      acc[key] = process.env[key];
    }
    return acc;
  }, {});

  // Convert the environment variables to a JavaScript object string
  const envContent = `window.env = ${JSON.stringify(envVariables, null, 2)};`;

  // Define the output file path
  const outputPath = path.join(__dirname, "..", "..", "dist", "env.js");

  // Write the environment variables to the file
  fs.writeFile(outputPath, envContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing env.js file:", err);
    } else {
      console.log("env.js file has been saved successfully.");
    }
  });
}

module.exports = writeEnvVariables;
