import auth from "./auth";
import WebSocketsManager from "./websockets-manager";
import apiConfig from './variables/api';

class Manager {
  constructor() {
    WebSocketsManager.setManager(this);
    try {
      WebSocketsManager.sendSettingsMessage(prompt1);
    } catch(e) {
    }
  }

  send(message, receiver) {
    WebSocketsManager.sendChatMessage(message, receiver);
  }

  sendStream(message, receiver) {
    WebSocketsManager.sendStreamMessage(message, receiver);
  }

  sendVoice(message, receiver) {
    WebSocketsManager.sendVoiceMessage(message, receiver);
  }

  sendStreamBytes(bytes, receiver) {
    WebSocketsManager.sendStreamBytes(bytes, receiver);
  }

  registerChatHandler(handler) {
    this.chatHandler = handler;
  }

  isWSConnected() {
    return WebSocketsManager.isWSConnected()
  }

  setWSStatusCallback(callback) {
    WebSocketsManager.setStatusCallback(callback);
  }

  changePrompt(user) {
    if(user == "history") {
      WebSocketsManager.sendSettingsMessage(prompt2);
    } else {
      WebSocketsManager.sendSettingsMessage(prompt1);
    }
  }

  handleSocketMessage(action, target, message) {
    if (this.chatHandler != null) {
      this.chatHandler(message);
    }
  }

  generateAccessKey(username, time, password) {
    return password;
  }

  authorize(username, password) {
    let accessKey = this.generateAccessKey(username, 0, password);
    return fetch(`${apiConfig.apiHost}/authorization`, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, accessKey })
    }).then(response => {
      return response.json();
    });
  }
}

const manager = new Manager();
export default manager;
