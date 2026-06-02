import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'

const router = getRouter()

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("ServiceWorker registered successfully: ", reg.scope))
      .catch((err) => console.error("ServiceWorker registration failed: ", err));
  });
}

// Intercept and defer the PWA install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent("pwa-install-ready"));
});

// Recover from dynamic import chunk loading failures (e.g. after fresh production builds)
window.addEventListener("error", (e) => {
  const msg = e.message || "";
  if (
    msg.includes("Dynamically imported module") || 
    msg.includes("Importing a module script failed") ||
    msg.includes("Failed to fetch dynamically imported module")
  ) {
    console.warn("Dynamic import failure detected, reloading to fetch latest bundle...", e);
    window.location.reload();
  }
}, true);

window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason;
  if (reason && (reason.name === "ChunkLoadError" || (reason.message && (
    reason.message.includes("Dynamically imported module") || 
    reason.message.includes("Importing a module script failed") ||
    reason.message.includes("Failed to fetch dynamically imported module")
  )))) {
    console.warn("ChunkLoadError detected, reloading page...", e);
    window.location.reload();
  }
});

