// const NODE_ENV = process.env.NODE_ENV === 'development';
const NODE_ENV = false;

export default {
  // apiHost: NODE_ENV ? 'http://localhost:7878/api' : `https://www.metesapi.com:7878/api`,
  // wsHost: NODE_ENV ? 'ws://localhost:7878/api/ws' : 'wss://www.metesapi.com/7878/api/ws',

  apiHost: NODE_ENV ? 'http://localhost:7879/api' : `https://www.metesapi.com/api`,
  wsHost: NODE_ENV ? 'ws://localhost:7879/api/ws' : 'wss://www.metesapi.com/api/ws',

  authorization: {
      method: "POST",
      action: "authorization",
  }
};
