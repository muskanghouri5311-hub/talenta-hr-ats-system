import api from "./axios";

export const getRecruiterPerformance = (
  startDate = "",
  endDate = ""
) =>
  api.get(
    "/reports/recruiter-performance",
    {
      params: {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      },
    }
  );

export const exportReport = (
  format,
  startDate = "",
  endDate = ""
) =>
  api.get("/reports/export", {
    params: {
      format,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    },
    responseType: "blob",
  });
