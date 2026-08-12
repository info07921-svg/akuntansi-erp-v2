import axios from "axios";

const api = axios.create({
  // Ubah ke server lokal agar membaca editan backend Anda
  baseURL: "http://localhost:3000/api",
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
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const currentPath = window.location.pathname;

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