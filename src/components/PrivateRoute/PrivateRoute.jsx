import { Navigate } from "react-router-dom";
import React from "react";
import Auth from "../../controllers/auth";

const PrivateRoute = ({ component: Component }) => {
  return Auth.isAuthenticated ? <Component /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;