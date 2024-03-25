import ChatApp from "../views/chat/ChatApp.jsx";
import Login from "../views/login/Login.jsx";

var indexRoutes = [
  { protected: true, path: "/", name: "ChatApp", component: ChatApp },
  { protected: false, path: "/login", name: "Login", component: Login },
];

export default indexRoutes;
