// 이 파일은 App.js 에서 만든 컴포넌트와 웹 브라우저 사이의 다리 역할
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);