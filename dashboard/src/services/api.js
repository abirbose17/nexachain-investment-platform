import api from "../lib/axios";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
  me:       ()     => api.get("/auth/me"),
};

export const investmentApi = {
  getPlans:   ()       => api.get("/investments/plans"),
  create:     (data)   => api.post("/investments", data),
  getAll:     (params) => api.get("/investments", { params }),
};

export const dashboardApi = {
  getStats: () => api.get("/dashboard"),
};

export const referralApi = {
  getDirect:   () => api.get("/referrals/direct"),
  getTree:     () => api.get("/referrals/tree"),
  getEarnings: (params) => api.get("/referrals/earnings", { params }),
};
