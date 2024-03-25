import React from 'react'
import { createRoot } from 'react-dom/client';
import {HashRouter, Route, Routes} from "react-router-dom";

import './index.css'

import indexRoutes from "./routes/index.jsx";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute.jsx";

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <HashRouter>
    <Routes>
      {indexRoutes.map((prop, key) => (
        <Route
          key={key}
          path={prop.path}
          element={
            prop.protected ? (
              <PrivateRoute component={prop.component} />
            ) : (
              <prop.component />
            )
          }
        />
      ))}
    </Routes>
  </HashRouter>
);
