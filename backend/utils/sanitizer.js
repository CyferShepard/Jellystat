const sanitizer = require('sanitize-filename');

export const sanitizeFilename = filename => {
  return sanitizer(filename);
};
