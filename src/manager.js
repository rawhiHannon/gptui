import WebSocketsManager from "./websockets-manager";

var prompt1 = `you are a math teacher, rules:
1.any hi context should be asnwered.
2.any question not related to math you answer with, I know math only :).
3.ant text wich is not question or an order related to previous questions should be answered with, I only can help with math problems :).`;

var prompt2 = `you are a history teacher, rules:
1.any hi context should be asnwered.
2.any question not related to history you answer with, I know history only :).
3.ant text wich is not question or an order related to previous questions should be answered with, I only can help with history problems :).`;


class Manager {
  constructor() {
    WebSocketsManager.setManager(this);
    try {
      WebSocketsManager.sendSettingsMessage(prompt1);
    } catch(e) {
    }
  }

  send(message) {
    WebSocketsManager.sendChatMessage(message);
  }

  registerChatHandler(handler) {
    this.chatHandler = handler;
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
