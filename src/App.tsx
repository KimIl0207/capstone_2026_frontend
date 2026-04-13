import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { login } from "./utils/Auth";
import MainLayout from "./layouts/MainLayout";

function LoginPageWrapper() {
  const navigate = useNavigate();

  return (
    <Login
      onLogin={({ id, password }) => {
        if (id === "admin" && password === "1234") {
          login();
          navigate("/dashboard", { replace: true });
        } else {
          alert("아이디 또는 비밀번호가 올바르지 않습니다.");
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
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}