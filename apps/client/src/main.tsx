import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Сохраняем реферальный параметр до любого рендеринга
const refParam = new URLSearchParams(window.location.search).get("ref");
if (refParam) {
  window.localStorage.setItem("pixel-vpn-ref", refParam);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
