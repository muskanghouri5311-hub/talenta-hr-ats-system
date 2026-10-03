import api from "./axios";

export const globalSearch = (query) => {
  return api.get("/search", {
    params: {
      q: query,
    },
  });
};