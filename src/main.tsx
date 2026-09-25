import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./mobile-overrides.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("PromoAngol root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
