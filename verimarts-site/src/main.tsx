import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "./styles/base.css";
const App = lazy(() => import("./App"));
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
            <div className="route-loading" role="status">
              <span className="route-loading__mark" aria-hidden="true" />
              <span className="sr-only">Loading FASHYN</span>
            </div>
          }
        >
          {portal ? <Portal /> : <App />}
        </Suspense>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
);
