import axiosInstance from "./axiosInstance";

export const getRolesLookup = () => {
  return axiosInstance.get("/lookups/roles");
};

export const getEmploymentTypesLookup = () => {
  return axiosInstance.get("/lookups/employment-types");
};

export const getUsersLookup = (role) => {
  return axiosInstance.get("/lookups/users", {
    params: {
      role,
    },
  });
};