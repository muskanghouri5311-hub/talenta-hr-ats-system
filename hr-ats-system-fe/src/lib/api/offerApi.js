import api from "./axios";

export const getAllOffers = async () => {
  return api.get("/offers");
};

export const sendOffer = async (candidateId, offerData) => {
  return api.post("/offers/send", {
    candidateId,
    ...offerData,
  });
};

export const getCandidateOffer = async (candidateId) => {
  return api.get(`/offers/candidate/${candidateId}`);
};

export const updateOfferStatus = async (
  candidateId,
  statusOrData
) => {
  const data =
    typeof statusOrData === "string"
      ? { status: statusOrData }
      : statusOrData;

  return api.patch(
    `/offers/candidate/${candidateId}/status`,
    data
  );
};