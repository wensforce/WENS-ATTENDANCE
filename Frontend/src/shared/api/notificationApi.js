import api from "../../config/axios";



const useNotificationApi = {
    saveToken: async (token) => {
        await api.post("/notifications/save-token", {
            deviceToken: token,
        });
    }
} 

export default useNotificationApi;