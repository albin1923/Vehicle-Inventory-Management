import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";

import { useGetProfileQuery } from "../store/api";
import { clearAuth, setUser } from "../store/authSlice";
import useAppDispatch from "../hooks/useAppDispatch";
import useAppSelector from "../hooks/useAppSelector";

const AuthGuard = () => {
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((state) => state.auth);

  const shouldSkipProfile = !accessToken || !!user;
  const { data, isFetching, isError } = useGetProfileQuery(undefined, {
    skip: shouldSkipProfile,
  });

  useEffect(() => {
    if (data) {
      dispatch(setUser(data));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (isError) {
      dispatch(clearAuth());
    }
  }, [isError, dispatch]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (isFetching && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="rounded-lg bg-white px-6 py-4 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Checking your session…</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AuthGuard;
