const NODE_ENV = true;

export default {
  apiHost: NODE_ENV ? 'http://localhost:7877/api' : `https://stage.metesapi.com/api`,
  wsHost: NODE_ENV ? 'ws://localhost:7877/api/ws' : 'wss://stage.metesapi.com/api/ws',

  authorization: {
      method: "POST",
      action: "authorization",
  }
};
