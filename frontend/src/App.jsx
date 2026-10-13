import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import { useAuth } from "./auth/context";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Workspace from "./components/Workspace";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import EquipmentDetails from "./pages/EquipmentDetails";
import EquipmentForm from "./pages/EquipmentForm";
import BorrowRequests from "./pages/BorrowRequests";
import Maintenance from "./pages/Maintenance";
import ReportIssue from "./pages/ReportIssue";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
function Protected({ admin = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin")
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
function Home() {
  const { user } = useAuth();
  return (
    <Navigate
      to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"}
      replace
    />
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Protected />}>
            <Route element={<Workspace />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/equipment/:id" element={<EquipmentDetails />} />
              <Route path="/requests" element={<BorrowRequests />} />
              <Route
                path="/borrowed"
                element={<BorrowRequests mode="borrowed" />}
              />
              <Route path="/report" element={<ReportIssue />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/profile" element={<Profile />} />
              <Route element={<Protected admin />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route
                  path="/admin/equipment/new"
                  element={<EquipmentForm />}
                />
                <Route
                  path="/admin/equipment/:id/edit"
                  element={<EquipmentForm />}
                />
                <Route path="/admin/requests" element={<BorrowRequests />} />
                <Route
                  path="/admin/borrowed"
                  element={<BorrowRequests mode="borrowed" />}
                />
                <Route
                  path="/admin/overdue"
                  element={<BorrowRequests mode="overdue" />}
                />
                <Route path="/admin/maintenance" element={<Maintenance />} />
                <Route path="/admin/users" element={<Users />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
