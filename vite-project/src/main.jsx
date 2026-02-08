import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { AppContextProvider } from "./context/AppContext.jsx";
import axios from 'axios'


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
    <AppContextProvider>
      <App />
      <Toaster />
      </AppContextProvider>
    </BrowserRouter>
  </React.StrictMode>
  // Set default config for axios
);
