import api from "../../../config/axios";

/**
 * Employee break APIs
 * Base: /break
 */
export const breakApi = {
  /** GET /break/options */
  fetchOptions: async () => {
    const response = await api.get("/break/options");
    return response.data;
  },

  /** POST /break/start  body: { breakConfigId } */
  start: async (breakConfigId) => {
    const response = await api.post("/break/start", { breakConfigId });
    return response.data;
  },

  /** POST /break/end  body: { breakId } */
  end: async (breakId) => {
    const response = await api.post("/break/end", { breakId });
    return response.data;
  },

  /** GET /break/today */
  fetchToday: async () => {
    const response = await api.get("/break/today");
    return response.data;
  },
};
