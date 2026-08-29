import api from "../../../config/axios";

export const useAttendanceSettingApi = {
  fetchAttendanceSetting: async () => {
    try {
      const response = await api.get("/attendance-setting");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateAttendanceSetting: async (id, settingData) => {
    try {
      const response = await api.patch(`/attendance-setting/${id}`, settingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
