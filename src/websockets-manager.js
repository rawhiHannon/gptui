function WebSocketsManager() {
    this.ws = null;
    this.serverUrl = "ws://localhost:7878/api/ws";
    this.roomInput = null;
    this.rooms = [];
    this.manager = null;
    this.user = {
      name: "rawhi"
    };
    this.users = [];
    this.ready = this.connectToWebsocket()
}
var self = WebSocketsManager.prototype;

self.setManager = function(manager) {
  this.manager = manager
}

//TODO: handle reject
self.connectToWebsocket = function() {
  return new Promise((resolve, reject) => {
    this.ws = new WebSocket(this.serverUrl + "?name=" + this.user.name);
    this.ws.addEventListener('open', (event) => { this.onWebsocketOpen(event, resolve) });
    this.ws.addEventListener('message', (event) => { this.handleNewMessage(event) });
    this.ws.addEventListener('close', (event) => { this.handleClose(event) });
  })
}

self.handleClose = function(event) {
    alert("Server closed the connection, please refresh the page")
}

self.onWebsocketOpen = function(event, resolve) {
    if(resolve) {
      try {
        resolve();
      } catch(err) {}
    }
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
      message: msg,
    }));
}

self.sendSettingsMessage = async function(data) {
  await this.ready;
  this.ws.send(JSON.stringify({
    action: 'settings',
    data: data,
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
