import ChatApp from "../views/chat/ChatApp.jsx";
// import AgentsApp from "../views/admin/AgentsApp.jsx";
import Login from "../views/login/Login.jsx";

var indexRoutes = [
  { protected: false, path: "/", name: "ChatApp", component: ChatApp },
  // { protected: true, path: "/", name: "AgentsApp", component: AgentsApp },
  // { protected: false, path: "/login", name: "Login", component: Login },
];

export default indexRoutes;
