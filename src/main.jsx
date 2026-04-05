import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import DietExerciseTestPage from "./pages/DietExerciseTestPage";
import AppSystemGuidePage from "./pages/AppSystemGuidePage";
import LoadingProvider from "./contexts/LoadingContext";
import "./index.css";

const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

const RootPage =
  pathname === "/test"
    ? DietExerciseTestPage
    : ["/docs", "/guide", "/app-guide", "/integration-check"].includes(pathname)
      ? AppSystemGuidePage
      : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LoadingProvider>
        <RootPage />
      </LoadingProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
