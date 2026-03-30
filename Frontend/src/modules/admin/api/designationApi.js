import api from "../../../config/axios";

export const useDesignationApi = {
  fetchDesignation: async () => {
    try {
      const response = await api.get("/designation");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createDesignation: async (designationData) => {
    try {
      const response = await api.post("/designation", designationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateDesignation: async (designationId, designationData) => {
    try {
      const response = await api.put(
        `/designation/${designationId}`,
        designationData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteDesignation: async (designationId) => {
    try {
      const response = await api.delete(`/designation/${designationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
