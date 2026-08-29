import api from "../../../config/axios";

export const useLeaveSubtypeApi = {
  fetchLeaveSubtypes: async (type) => {
    try {
      const response = await api.get("/leave-subtype", {
        params: type ? { type } : undefined,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createLeaveSubtype: async (leaveSubtypeData) => {
    try {
      const response = await api.post("/leave-subtype", leaveSubtypeData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateLeaveSubtype: async (leaveSubtypeId, leaveSubtypeData) => {
    try {
      const response = await api.put(
        `/leave-subtype/${leaveSubtypeId}`,
        leaveSubtypeData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteLeaveSubtype: async (leaveSubtypeId) => {
    try {
      const response = await api.delete(`/leave-subtype/${leaveSubtypeId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
