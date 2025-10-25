import { Outlet, NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Inventory", to: "/inventory" },
  { label: "Sales", to: "/sales" },
  { label: "Payments", to: "/payments" },
  { label: "Transfers", to: "/transfers" },
  { label: "Imports", to: "/imports" },
  { label: "Anomalies", to: "/anomalies" },
  { label: "Settings", to: "/settings" },
];

const AppLayout = () => (
  <div className="min-h-screen bg-slate-100">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-honda-red">Honda Internal System</h1>
        <nav className="hidden gap-4 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? "text-honda-red" : "text-slate-500 hover:text-honda-red"}`
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
