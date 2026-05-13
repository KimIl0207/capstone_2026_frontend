import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { loginWithPassword } from "./api/client";
import WebSocketTest from "./components/WebSocketTest";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import Login from "./pages/Login";
import SettingsPage from "./pages/SettingsPage";
import StatsPage from "./pages/StatsPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { loginWithToken } from "./utils/Auth";

function LoginPageWrapper() {
  const navigate = useNavigate();

  return (
    <Login
      onLogin={async ({ id, password }) => {
        try {
          const response = await loginWithPassword({ username: id, password });

          if (!response.success || !response.data) {
            alert(response.message ?? "로그인에 실패했습니다.");
            return;
          }

          loginWithToken(response.data);
          navigate("/dashboard", { replace: true });
        } catch (error) {
          alert(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.");
        }
      }}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPageWrapper />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ws-test" element={<WebSocketTest />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
