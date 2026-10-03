import api from "./axios";

// =====================================================
// CANDIDATES
// =====================================================

export const fetchAllCandidates = async ({
  search,
  requisitionId,
} = {}) => {
  return api.get("/candidates", {
    params: {
      ...(search ? { search } : {}),
      ...(requisitionId ? { requisitionId } : {}),
    },
  });
};

export const getCandidate = async (id) => {
  return api.get(`/candidates/${id}`);
};


// =====================================================
// APPLY
// =====================================================

export const applyNow = async (data) => {
  const formData = new FormData();

  formData.append("name", data.name || "");
  formData.append("email", data.email || "");
  formData.append("phone", data.phone || "");
  formData.append("role", data.role || "");
  formData.append(
    "requisitionId",
    data.requisitionId || ""
  );
  formData.append(
    "experience",
    data.experience || ""
  );
  formData.append(
    "coverNote",
    data.coverNote || ""
  );

  formData.append(
    "currentSalary",
    data.currentSalary || ""
  );
  formData.append(
    "expectedSalary",
    data.expectedSalary || ""
  );
  formData.append(
    "noticePeriod",
    data.noticePeriod || "Immediate"
  );
  formData.append(
    "currentCity",
    data.currentCity || ""
  );
  formData.append(
    "willingToRelocate",
    data.willingToRelocate ? "true" : "false"
  );

  if (data.resume instanceof File) {
    formData.append("resume", data.resume);
  } else {
    throw new Error("Resume file is missing.");
  }

  return api.post("/candidates/apply", formData);
};

// =====================================================
// REJECT
// =====================================================

export const rejectCandidate = async (id) => {
  return api.patch(`/candidates/${id}/reject`);
};

// =====================================================
// MOVE STAGE
// =====================================================

export const moveCandidateStage = async (
  id,
  stage
) => {
  return api.patch(
    `/candidates/${id}/stage`,
    { stage }
  );
};

// =====================================================
// SCREENING
// =====================================================

export const completeScreening = async (
  candidateId,
  status,
  score = 0,
  notes = ""
) => {
  return api.patch(
    `/candidates/${candidateId}/screening`,
    {
      status,
      score,
      notes,
    }
  );
};

// =====================================================
// INTERVIEW
// =====================================================

export const scheduleInterview = async (payload) => {
  return api.post("/interviews", payload);
};

export const updateInterviewStatus = async (
  candidateId,
  data
) => {
  return api.patch(
    `/candidates/${candidateId}/interview-status`,
    data
  );
};

export const passInterview = async (
  candidateId
) => {
  return api.patch(
    `/candidates/${candidateId}/interview-status`,
    {
      status: "Passed",
    }
  );
};

export const getCandidateInterviews = async (
  candidateId
) => {
  return api.get(
    `/interviews/candidate/${candidateId}`
  );
};

// =====================================================
// OFFERS
// =====================================================

export const sendOffer = async (
  candidateId,
  offerData
) => {
  return api.post("/offers/send", {
    candidateId,
    ...offerData,
  });
};

export const getCandidateOffer = async (
  candidateId
) => {
  return api.get(
    `/offers/candidate/${candidateId}`
  );
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

// =====================================================
// HIRE
// =====================================================

export const hireCandidate = async (
  candidateId
) => {
  return api.patch(
    `/candidates/${candidateId}/stage`,
    {
      stage: "Hired",
    }
  );
};
export const getCandidateInterviewFeedback = (
  candidateId
) => {
  return api.get(
    `/candidates/${candidateId}/interview-feedback`
  );
};