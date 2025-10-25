import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./screens/AppLayout";
import DashboardScreen from "./screens/DashboardScreen";
import InventoryScreen from "./screens/InventoryScreen";
import SalesScreen from "./screens/SalesScreen";
import PaymentsScreen from "./screens/PaymentsScreen";
import TransfersScreen from "./screens/TransfersScreen";
import ImportScreen from "./screens/ImportScreen";
import AnomaliesScreen from "./screens/AnomaliesScreen";
import SettingsScreen from "./screens/SettingsScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardScreen /> },
      { path: "inventory", element: <InventoryScreen /> },
      { path: "sales", element: <SalesScreen /> },
      { path: "payments", element: <PaymentsScreen /> },
      { path: "transfers", element: <TransfersScreen /> },
      { path: "imports", element: <ImportScreen /> },
      { path: "anomalies", element: <AnomaliesScreen /> },
      { path: "settings", element: <SettingsScreen /> },
    ],
  },
]);
