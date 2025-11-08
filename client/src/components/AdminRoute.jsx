import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AdminRoute() {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    // Not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    // Logged in but not admin → redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorized → render child routes
  return <Outlet />;
}
