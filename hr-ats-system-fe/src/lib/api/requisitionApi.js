import api from "./axios";


// =====================================
// PUBLIC API
// =====================================

// Career Portal
// No authentication required
export const getPublicOpenRequisitions = () => {
  return api.get("/requisitions/public/open");
};

// Apply Page — single open job, no auth required
export const getPublicRequisitionById = (id) => {
  return api.get("/requisitions/public/open/" + id);
};


// =====================================
// INTERNAL PROTECTED APIs
// =====================================

// Get requisitions
export const getRequisitions = (status) => {
  return api.get("/requisitions", {
    params:
      status && status !== "All"
        ? { status }
        : {},
  });
};


// Get requisition counts
export const getRequisitionCounts = () => {
  return api.get("/requisitions/counts");
};


// Get single requisition
export const getRequisition = (id) => {
  return api.get("/requisitions/" + id);
};


// Create requisition
export const createRequisition = (data) => {
  return api.post("/requisitions", data);
};


// Update requisition
export const updateRequisition = (id, data) => {
  return api.put("/requisitions/" + id, data);
};


// Delete requisition
export const deleteRequisition = (id) => {
  return api.delete("/requisitions/" + id);
};