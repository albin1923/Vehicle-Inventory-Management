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

  const userInitials = useMemo(() => {
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .filter(Boolean)
        .map((segment) => (segment ? segment.charAt(0).toUpperCase() : ""))
        .join("")
        .slice(0, 2);
    }
    return (user?.username ?? "").slice(0, 2).toUpperCase();
  }, [user?.full_name, user?.username]);

  const roleTag = user?.user_role === "ADMIN" ? "Administrator" : "Sales crew";

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white to-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-spotlight opacity-70" />
      <div className="pointer-events-none absolute inset-0 -z-30 bg-grid-light opacity-30 [background-size:42px_42px]" />
      <header className="sticky top-0 z-30 border-b border-white/50 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-honda-red to-rose-500 shadow-glow">
              <span className="absolute inset-0 grid place-items-center text-sm font-semibold uppercase text-white">
                {userInitials || "HN"}
              </span>
              <span className="absolute inset-0 -translate-x-full bg-white/50 blur-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-honda-red">Honda</p>
              <h1 className="text-lg font-semibold text-slate-800 md:text-xl">Sales Tracking Console</h1>
              <p className="text-xs text-slate-500 md:text-sm">Live CRM sync with Excel parity</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden gap-2 rounded-full border border-slate-200/60 bg-white/60 p-1 shadow-sm backdrop-blur md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-gradient-to-r from-honda-red to-rose-500 text-white shadow-glow"
                        : "text-slate-500 hover:text-slate-800"
                    }`
                  }
                  end={item.to === "/"}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="hidden flex-col items-end text-right md:flex">
              <span className="text-sm font-semibold text-slate-700">{user?.full_name ?? user?.username}</span>
              <span className="text-xs uppercase tracking-wide text-slate-400">{roleTag}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="border-t border-white/60 bg-white/70 py-3 shadow-sm md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-honda-red to-rose-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
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
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
