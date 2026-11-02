import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import App from "./App";
import "./styles.css";
import "./marketplace.css";
import "./fashyn-storefront.css";
const Portal = lazy(() => import("./portal/Portal"));
const portal =
  import.meta.env.MODE === "portal" ||
  (import.meta.env.DEV && window.location.pathname.startsWith("/portal"));
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <Suspense
          fallback={
            <p role="status" className="empty-state">
              Loading FASHYN…
            </p>
          }
        >
          {portal ? <Portal /> : <App />}
        </Suspense>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
);
