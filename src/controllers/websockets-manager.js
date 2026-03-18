import apiConfig from './variables/api';

async function getDemoToken() {
  const storageKey = 'demo_token';
  const expiryKey = 'demo_token_expires';

  // Reuse cached token if still valid (with 60s buffer)
  const cached = localStorage.getItem(storageKey);
  const expiry = localStorage.getItem(expiryKey);
  if (cached && expiry && Date.now() / 1000 < Number(expiry) - 60) {
    return cached;
  }

  const res = await fetch(`${apiConfig.apiHost}/auth/demo`, { method: 'POST' });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem(storageKey, data.access_token);
    localStorage.setItem(expiryKey, String(data.expires_at));
    return data.access_token;
  }
  throw new Error('Failed to get demo token');
}

function getDeviceKey() {
  const key = 'demo_device_key';
  let deviceKey = localStorage.getItem(key);
  if (deviceKey) return deviceKey;

  // Generate a stable random device key
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  deviceKey = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(key, deviceKey);
  return deviceKey;
}

function WebSocketsManager() {
  this.ws = null;
  this.serverUrl = apiConfig.wsHost;
  this.roomInput = null;
  this.rooms = [];
  this.manager = null;
  this.handler = null;
  this.user = {
    name: "rawhi"
  };
  this.users = [];
  this.reconnectInterval = 1000;
  this.maxReconnectInterval = 30000;
  this.reconnectAttempts = 0;
  this.ready = this.connectToWebsocket();
  this.connected = false
  this.statusCallback = () => {}
}
var self = WebSocketsManager.prototype;

self.setManager = function(manager) {
this.manager = manager
}

self.setStatusCallback = function(callback) {
  if(callback != null) {
    this.statusCallback = callback;
  }
}

self.isWSConnected = function() {
  return this.connected
}


//TODO: handle reject
self.connectToWebsocket = async function() {
  var token = ""
  try {
    token = await getDemoToken();
  } catch (error) {
      console.error('Error getting demo token:', error);
  }
  var deviceKey = getDeviceKey();
  return new Promise((resolve, reject) => {
    this.ws = new WebSocket(this.serverUrl + "?bearer=" + token + "&device=" + deviceKey);
    this.ws.addEventListener('open', (event) => { this.onWebsocketOpen(event, resolve) });
    this.ws.addEventListener('message', (event) => { this.handleNewMessage(event) });
    this.ws.addEventListener('close', (event) => { this.handleClose(event) });
    this.ws.onerror = function(event) {
      console.error("WebSocket error observed:", event);
    };
  })
}

self.handleClose = function(event) {
  console.log("Server closed the connection, attempting to reconnect...");
  this.connected = false
  this.statusCallback(false)
  this.reconnectAttempts = 0; // Reset the number of reconnection attempts
  setTimeout(() => {
      this.reconnect();
  }, this.reconnectInterval);
}

self.reconnect = async function() {
try {
    this.ready = this.connectToWebsocket();
    await this.ready;
    console.log("Reconnected to the server");
    this.reconnectAttempts = 0; // Reset the number of reconnection attempts
} catch (err) {
    console.error("Failed to reconnect, retrying in", this.reconnectInterval, "ms");
    this.reconnectAttempts++;
    const nextInterval = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts), this.maxReconnectInterval);
    setTimeout(() => {
        this.reconnect();
    }, nextInterval);
}
}

self.onWebsocketOpen = function(event, resolve) {
  if(resolve) {
    try {
      resolve();
    } catch(err) {}
  }
  this.connected = true
  this.statusCallback(true)
  console.log("connected to WS!");
}

self.handleNewMessage = function(event) {
  let data = event.data;
  data = data.split(/\r?\n/);

  for (let i = 0; i < data.length; i++) {
    let msg = JSON.parse(data[i]);
    switch (msg.action) {
      case "stream":
        this.handleStreamMessage(msg);
        break;
      case "event":
        this.handleEventMessage(msg);
        break;
      case "chat":
        this.handleEventMessage(msg);
        break;
      default:
        break;
    }

  }
}

self.handleStreamMessage = function(msg) {
  this.manager.handleSocketMessage(msg.action, msg.target, msg.message);
}

self.handleEventMessage = function(msg) {
  this.manager.handleSocketMessage(msg.action, msg.target, msg.message);
}

self.handleChatMessage = function(msg) {
  this.manager.handleSocketMessage(msg.action, msg.target, msg.message);
}

self.sendChatMessage = async function(msg, receiver) {
  await this.ready;
  const receiverId = parseInt(receiver, 10);
  this.ws.send(JSON.stringify({
    action: 'chat',
    message: msg,
    receiver: receiverId
  }));
}

self.sendStreamMessage = async function(msg, receiver) {
  await this.ready;
  const receiverId = parseInt(receiver, 10);
  this.ws.send(JSON.stringify({
    action: 'stream',
    audio: msg,
    receiver: receiverId
  }));
}

self.sendVoiceMessage = async function(msg, receiver) {
  await this.ready;
  this.ws.send(JSON.stringify({
    action: 'voice',
    audio: msg,
    receiver: receiver
  }));
}  

self.sendSettingsMessage = async function(data) {
  await this.ready;
  this.ws.send(JSON.stringify({
    action: 'settings',
    data: {figure_id: 1}
  }));
}

self.sendStreamBytes = async function(blob, receiverIdStr) {
  await this.ready;
  const receiverId = parseInt(receiverIdStr, 10);

  blob.arrayBuffer().then(audioBuffer => {
      const headerBuffer = new ArrayBuffer(8);
      const headerView = new DataView(headerBuffer);
      headerView.setInt32(0, 0, true);          // groupID = 0 (demo)
      headerView.setInt32(4, receiverId, true);  // receiverID

      const combinedBuffer = concatenateBuffers(headerBuffer, audioBuffer);
      this.ws.send(combinedBuffer);
  });
};

function concatenateBuffers(buffer1, buffer2) {
  const combined = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  combined.set(new Uint8Array(buffer1), 0);
  combined.set(new Uint8Array(buffer2), buffer1.byteLength);
  return combined.buffer;
}



self.findRoom = function(roomId) {
  for (let i = 0; i < this.rooms.length; i++) {
    if (this.rooms[i].id === roomId) {
      return this.rooms[i];
    }
  }
}

self.joinRoom = async function(room, data) {
  await this.ready;
  console.log("joining rawhi room")
  this.ws.send(JSON.stringify({
    action: 'join-room',
    message: room,
    data: data || ""
  }));
  this.roomInput = "";
}

self.leaveRoom = async function(room) {
await this.ready;
  this.ws.send(JSON.stringify({ action: 'leave-room', message: room }));

  for (let i = 0; i < this.rooms.length; i++) {
    if (this.rooms[i].id === room.id) {
      this.rooms.splice(i, 1);
      break;
    }
  }
}

var nm = new WebSocketsManager();
export default nm;
