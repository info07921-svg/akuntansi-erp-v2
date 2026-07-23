import { Navigate, useLocation } from "react-router-dom";

// Cek apakah token JWT sudah expired di sisi client
// tanpa perlu request ke server
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // Tidak ada token sama sekali
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token ada tapi sudah expired
  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return (
      <Navigate
        to="/login?session=expired"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}