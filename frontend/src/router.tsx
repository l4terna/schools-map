import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { MapPage } from "@/pages/MapPage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <MapPage /> },
      { path: "admin/login", element: <AdminLoginPage /> },
      { path: "admin", element: <AdminDashboardPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
