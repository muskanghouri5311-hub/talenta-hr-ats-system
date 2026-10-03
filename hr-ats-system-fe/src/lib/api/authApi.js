import api from "./axios";

export const loginUser = async (data) => {
  
  const response = await api.post("/auth/login", data);

  if (response.data?.success) {
    localStorage.setItem(
      "token",
      response.data.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(response.data.data)
    );
  }

  return response;
};

export const ForgotPasswordApi = (data) => {
  return api.post(
    "/auth/forgot-password",
    data
  );
};

export const ResetPasswordApi = ({
  token,
  password,
  confirmPassword,
}) => {
  return api.post(
    `/auth/reset-password/${token}`,
    {
      password,
      confirmPassword,
    }
  );
};

export const UpdatePasswordApi = ({
  token,
  newPassword,
  confirmPassword,
}) => {
  return api.post(
    `/auth/update-password/${token}`,
    {
      newPassword,
      confirmPassword,
    }
  );
};

export const changePassword = ({
  currentPassword,
  newPassword,
}) => {
  return api.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
};


export const createUser = (data) => {
  return api.post("/user", data);
};

export const updateUser = (
  id,
  data
) => {
  return api.put(
    `/user/${id}`,
    data
  );
};

export const getUsers = () => {
  return api.get("/user");
};

export const deleteUser = (id) => {
  return api.delete(`/user/${id}`);
};