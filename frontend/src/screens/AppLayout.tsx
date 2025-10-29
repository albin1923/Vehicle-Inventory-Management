import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";

import useAppSelector from "../hooks/useAppSelector";
import useAppDispatch from "../hooks/useAppDispatch";
import { clearAuth } from "../store/authSlice";

interface NavItem {
  label: string;
  to: string;
  roles?: Array<"ADMIN" | "SALESMAN">;
}

const baseNav: NavItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "Sales", to: "/sales" },
  { label: "Customers", to: "/customers" },
  { label: "Inventory", to: "/inventory", roles: ["ADMIN"] },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const navItems = useMemo(() => {
    const role = user?.user_role ?? "SALESMAN";
    return baseNav.filter((item) => {
      if (!item.roles) {
        return true;
      }
      return item.roles.includes(role);
    });
  }, [user?.user_role]);

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-honda-red">Honda</p>
            <h1 className="text-xl font-semibold text-slate-800">Sales Tracking Console</h1>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden gap-4 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition ${
                      isActive ? "text-honda-red" : "text-slate-500 hover:text-honda-red"
                    }`
                  }
                  end={item.to === "/"}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-slate-700">{user?.full_name ?? user?.username}</span>
              <span className="text-xs uppercase tracking-wide text-slate-400">{user?.user_role}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50 py-3 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-wrap gap-3 px-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-xs font-medium transition ${
                    isActive ? "text-honda-red" : "text-slate-500 hover:text-honda-red"
                  }`
                }
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
