import api from "./axiosInstance";

export const getAuditLogs = async (params = {}) => {
  const response = await api.get("/audit-logs", {
    params,
  });

  return response.data;
};

export const exportAuditLogs = async (params = {}) => {
  const response = await api.get("/audit-logs/export", {
    params,
    responseType: "blob",
  });

  return response;
};