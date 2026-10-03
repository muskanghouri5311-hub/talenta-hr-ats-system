import axiosInstance from "./axiosInstance";

export const fetchAllInterviews = () => {
  return axiosInstance.get("/interviews");
};


export const getInterview = (interviewId) => {
  return axiosInstance.get(
    `/interviews/${interviewId}`
  );
};


export const scheduleInterview = (payload) => {
  return axiosInstance.post(
    "/interviews",
    payload
  );
};


export const confirmInterview = (
  interviewId
) => {
  return axiosInstance.patch(
    `/interviews/${interviewId}/confirm`
  );
};


export const rescheduleInterview = (
  interviewId,
  payload
) => {
  return axiosInstance.patch(
    `/interviews/${interviewId}/reschedule`,
    payload
  );
};


export const cancelInterview = (
  interviewId
) => {
  return axiosInstance.patch(
    `/interviews/${interviewId}/cancel`
  );
};

export const completeInterview = (
  interviewId
) => {
  return axiosInstance.patch(
    `/interviews/${interviewId}/complete`
  );
};