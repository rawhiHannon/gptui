function generateOrRetrieveBearer() {
  const localStorageKey = 'uniqueBearerToken';

  // Check if the token already exists in local storage
  let bearerToken = localStorage.getItem(localStorageKey);
  if (bearerToken) {
      return bearerToken;
  }

  // Generate a new token
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const randomPart = Math.random().toString(36).substring(2, 15);

  const combinedString = `${screenResolution}-${timezone}-${language}-${randomPart}`;
  bearerToken = hashString(combinedString);

  // Store the new token in local storage
  localStorage.setItem(localStorageKey, bearerToken);

  return bearerToken;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
  }
  return hash.toString();
}

// Usage
const uniqueBearer = generateOrRetrieveBearer();

function WebSocketsManager() {
  this.ws = null;
  this.serverUrl = "wss://www.metesapi.com/api/ws";
  // this.serverUrl = "ws://localhost:7879/api/ws";
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
self.connectToWebsocket = function() {
return new Promise((resolve, reject) => {
  this.ws = new WebSocket(this.serverUrl + "?bearer=" + uniqueBearer + "&host=agentbuddy.me");
  this.ws.addEventListener('open', (event) => { this.onWebsocketOpen(event, resolve) });
  this.ws.addEventListener('message', (event) => { this.handleNewMessage(event) });
  this.ws.addEventListener('close', (event) => { this.handleClose(event) });
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

self.sendMessageToRoom = function(room) {
  if (room.newMessage !== "") {
    this.ws.send(JSON.stringify({
      action: 'message',
      message: room.newMessage,
      target: {
        id: room.id,
        name: room.name
      }
    }));
    room.newMessage = "";
  }
}

self.sendChatMessage = async function(msg) {
await this.ready;
  this.ws.send(JSON.stringify({
    action: 'chat',
    message: msg
  }));
}

self.sendStreamMessage = async function(msg) {
  await this.ready;
    this.ws.send(JSON.stringify({
      action: 'stream',
      audio: msg
    }));
}  

self.sendVoiceMessage = async function(msg) {
  await this.ready;
    this.ws.send(JSON.stringify({
      action: 'voice',
      audio: msg
    }));
}  

self.sendSettingsMessage = async function(data) {
await this.ready;
this.ws.send(JSON.stringify({
  action: 'settings',
  data: {figure_id: 1}
}));
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
