import axiosInstance from "./axiosInstance";


// GET ROLES
export const getRoles = async () => {
  const response = await axiosInstance.get("/roles");
  return response.data;
};


// GET SINGLE ROLE BY ID
export const getRole = async (id) => {
  const response = await axiosInstance.get(`/roles/${id}`);
  return response.data;
};


// CREATE ROLE
export const createRole = async (data) => {
  const response = await axiosInstance.post("/roles", data);
  return response.data;
};


// UPDATE ROLE
export const updateRole = async (id, data) => {
  const response = await axiosInstance.put(`/roles/${id}`, data);
  return response.data;
};


// DELETE ROLE
export const deleteRole = async (id) => {
  const response = await axiosInstance.delete(`/roles/${id}`);
  return response.data;
};