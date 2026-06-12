// Vite exposes env vars prefixed with VITE_ via import.meta.env
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export default BASE_URL;
