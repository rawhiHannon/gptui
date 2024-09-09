// const NODE_ENV = process.env.NODE_ENV === 'development';
const NODE_ENV = false;

export default {
  apiHost: NODE_ENV ? 'http://localhost:7877/api' : `https://www.metesapi.com:7877/api`,
  wsHost: NODE_ENV ? 'ws://localhost:7877/api/ws' : 'wss://www.metesapi.com:7877/api/ws',

  authorization: {
      method: "POST",
      action: "authorization",
  }
};
