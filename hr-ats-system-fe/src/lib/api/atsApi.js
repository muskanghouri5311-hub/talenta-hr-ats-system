import api from "./axios";

export const getATSRanking = async (requisitionId = "") => {
  const url = requisitionId
    ? `/ats/ranking/${requisitionId}`
    : `/ats/ranking`;

  const response = await api.get(url);

  return response.data;
};

// Calculate ATS score for a candidate
export const calculateATSScore = async (candidateId) => {
  const response = await api.post(
    `/ats/score/${candidateId}`
  );

  return response.data;
};

// Get ATS result of a candidate
export const getCandidateATSResult = async (candidateId) => {
  const response = await api.get(
    `/ats/result/${candidateId}`
  );

  return response.data;
};