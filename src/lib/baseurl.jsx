const ensureSlashes = (url) => {
  if (!url.startsWith("/")) {
    url = "/" + url;
  }
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
};
const baseUrl = window.env?.JS_BASE_URL ? ensureSlashes(window.env?.JS_BASE_URL) : "";
export default baseUrl;
