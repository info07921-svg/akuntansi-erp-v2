import axios from "axios";

const api = axios.create({
  baseURL: "http://akuntansi-erp-v2-production.up.railway.app",
});

// REQUEST INTERCEPTOR — selipkan token di setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE INTERCEPTOR — tangkap 401 (token expired / tidak valid)
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Bersihkan data sesi
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Arahkan ke login dengan pesan
      const currentPath = window.location.pathname;

      // Hindari redirect loop jika sudah di halaman login
      if (currentPath !== "/login") {
        window.location.href = "/login?session=expired";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// =====================
// AUTH
// =====================

export const loginUser = (data) =>
  api.post("/auth/login", data);

export const registerUser = (data) =>
  api.post("/auth/register", data);

// =====================
// PERUSAHAAN
// =====================

export const getPerusahaan = () =>
  api.get("/perusahaan");