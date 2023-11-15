function WebSocketsManager() {
    this.ws = null;
    this.serverUrl = "ws://localhost:7879/api/ws";
    this.roomInput = null;
    this.rooms = [];
    this.manager = null;
    this.user = {
      name: "rawhi"
    };
    this.token = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk3OWVkMTU1OTdhYjM1Zjc4MjljZTc0NDMwN2I3OTNiN2ViZWIyZjAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYmlibGVwaWNzLTU2ZmM1IiwiYXVkIjoiYmlibGVwaWNzLTU2ZmM1IiwiYXV0aF90aW1lIjoxNjc5NjEwOTM1LCJ1c2VyX2lkIjoiVWdjdDJyZXVkMVRDZUdYRlV3MG0zcndnQVdBMiIsInN1YiI6IlVnY3QycmV1ZDFUQ2VHWEZVdzBtM3J3Z0FXQTIiLCJpYXQiOjE2Nzk2MTA5MzUsImV4cCI6MTY3OTYxNDUzNSwiZW1haWwiOiJycmF3aGlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInJyYXdoaUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.AezYbeCG4El1OExH8edWLrn1L2an8rx-zec9Ai1ANpCCThbuHjn4qUUSIGwMZ_Oz8enXlwIJeO995vUzBO5DhLWaOQMutsS2CE0fu62WvnVa9sgi8m5M85utsJEBBs03AgpGb-BGoXgL06FoNYbn4rDv1J6OFrxz63OfL5joX9rkzXD9kxHKwrC_xmErjqLI_-UFNyo7Z267nnIgj94KvNm9hzs7ijHjzWyB7vQ3rPHbAQj-jv0Kcs1cu3c9FGh5K_C3Rl-rH4yKDVro7jRqSsSDiqTl1rxgArBeCSkqS1241GeTgnerbY8i8BE09styP_ydbMeOflArMnkaduit2w"
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
    this.ws = new WebSocket(this.serverUrl + "?bearer=1234dd56");
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
      message: msg
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
