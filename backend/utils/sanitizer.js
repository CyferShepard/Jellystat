const sanitizeFilename = require("sanitize-filename");

const sanitizeFile = (filename) => {
  return sanitizeFilename(filename);
};

module.exports = sanitizeFile;
