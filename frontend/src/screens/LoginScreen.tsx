import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiSlice, useLoginMutation } from "../store/api";
import { setCredentials, setUser, clearAuth } from "../store/authSlice";
import useAppDispatch from "../hooks/useAppDispatch";
import useAppSelector from "../hooks/useAppSelector";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (accessToken && user) {
      navigate("/", { replace: true });
    }
  }, [accessToken, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      dispatch(clearAuth());
      const tokens = await login({ username, password }).unwrap();
      dispatch(setCredentials(tokens));

      const profileQuery = dispatch(
        apiSlice.endpoints.getProfile.initiate(undefined, { forceRefetch: true }),
      );

      try {
        const profile = await profileQuery.unwrap();
        dispatch(setUser(profile));

        const role = profile.user_role;
        if (role === "ADMIN") {
          navigate("/", { replace: true });
        } else {
          navigate("/sales", { replace: true });
        }
      } finally {
        profileQuery.unsubscribe();
      }
    } catch (err) {
      dispatch(clearAuth());
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">HONDA</h1>
          <h2 className="text-xl text-gray-700">Sales Management System</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">Default Credentials:</p>
          <div className="mt-2 space-y-1 text-xs text-gray-500 text-center">
            <p><strong>Admin:</strong> admin / admin123</p>
            <p><strong>Salesman:</strong> sales / sales123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
