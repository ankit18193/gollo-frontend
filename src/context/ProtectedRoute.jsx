import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f0f",
          color: "#fff",
          fontSize: "16px",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  
  return children;
};

export default ProtectedRoute;
