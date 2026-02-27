import { createBrowserRouter } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { AdminPage } from "./components/AdminPage";
import { ErrorFallback } from "./components/ErrorFallback";

export const router = createBrowserRouter([
  {
    path: "/",
    ErrorBoundary: ErrorFallback,
    children: [
      { index: true, Component: Dashboard },
      { path: "admin", Component: AdminPage },
    ],
  },
]);
