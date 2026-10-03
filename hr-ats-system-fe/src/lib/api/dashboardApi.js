import api from "./axios";

export const getDashboard = (startDate, endDate) => {
  return api.get("/dashboard", {
    params: {
      startDate,
      endDate,
    },
  });
};