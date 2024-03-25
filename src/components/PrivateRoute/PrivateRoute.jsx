import { Navigate } from "react-router-dom";
import React from "react";
import Auth from "../../controllers/auth";

const PrivateRoute = ({ children }) => {
  return Auth.isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
