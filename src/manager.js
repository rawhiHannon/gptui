import WebSocketsManager from "./websockets-manager";

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
}

const manager = new Manager();
export default manager;
