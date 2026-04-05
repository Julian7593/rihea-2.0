import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ui/ErrorBoundary";
<<<<<<< HEAD
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

=======
import LoadingProvider from "./contexts/LoadingContext";
import "./index.css";

>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LoadingProvider>
<<<<<<< HEAD
        <RootPage />
=======
        <App />
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
      </LoadingProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
