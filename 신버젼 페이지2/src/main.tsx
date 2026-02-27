
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // 배포 시 1회성 캐시 초기화 (즐겨찾기는 유지)
  const APP_VERSION = "2.0.0";
  const storedVersion = localStorage.getItem("ec21rnc-app-version");
  if (storedVersion !== APP_VERSION) {
    const favorites = localStorage.getItem("ec21rnc-favorites");
    const keysToRemove = Object.keys(localStorage).filter(
      (k) => k.startsWith("ec21rnc-") && k !== "ec21rnc-favorites"
    );
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    if (favorites) localStorage.setItem("ec21rnc-favorites", favorites);
    localStorage.setItem("ec21rnc-app-version", APP_VERSION);
  }

  createRoot(document.getElementById("root")!).render(<App />);
  