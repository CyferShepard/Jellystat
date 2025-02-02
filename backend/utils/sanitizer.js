const sanitizer = require("sanitize-filename");

const sanitizeFilename = (filename) => {
  return sanitizer(filename);
};

module.export = { sanitizeFilename };
