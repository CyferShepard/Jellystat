class WebSocketServerSingleton {
  constructor() {
    if (!WebSocketServerSingleton.instance) {
      WebSocketServerSingleton.instance = null;
    }
  }

  setInstance(io) {
    WebSocketServerSingleton.instance = io;
  }

  getInstance() {
    return WebSocketServerSingleton.instance;
  }
}

module.exports = new WebSocketServerSingleton();
