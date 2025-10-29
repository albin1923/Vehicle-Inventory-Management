import { Navigate, createBrowserRouter } from "react-router-dom";

import AuthGuard from "./screens/AuthGuard";
import AppLayout from "./screens/AppLayout";
import CustomersScreen from "./screens/CustomersScreen";
import DashboardScreen from "./screens/DashboardScreen";
import InventoryScreen from "./screens/InventoryScreen";
import LoginScreen from "./screens/LoginScreen";
import SalesScreen from "./screens/SalesScreen";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardScreen /> },
          { path: "inventory", element: <InventoryScreen /> },
          { path: "sales", element: <SalesScreen /> },
          { path: "customers", element: <CustomersScreen /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
