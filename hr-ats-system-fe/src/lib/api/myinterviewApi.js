import axiosInstance from "./axiosInstance";

export const getMyInterviews = () => {
  return axiosInstance.get("/my-interviews");
};

export const getMyInterviewById = (interviewId) => {
  return axiosInstance.get(
    `/my-interviews/${interviewId}`
  );
};

export const getMyFeedbackSubmitted = (days = 7) => {
  return axiosInstance.get(
    `/my-interviews/feedback?days=${days}`
  );
};

export const getRecommendationOptions = () => {
  return axiosInstance.get(
    "/my-interviews/recommendations"
  );
};

export const submitInterviewFeedback = (
  interviewId,
  payload
) => {
  return axiosInstance.patch(
    `/my-interviews/${interviewId}/feedback`,
    {
      overallRating: Number(
        payload.overallRating
      ),

      recommendation:
        payload.recommendation,

      technicalStrengths:
        payload.technicalStrengths || "",

      concerns:
        payload.concerns || "",
    }
  );
};