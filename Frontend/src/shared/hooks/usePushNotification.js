import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../../firebase";
import firebaseConfig from "../../firebaseConfig";
import useNotificationApi from "../api/notificationApi";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Register SW and send it the Firebase config
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration, // ✅ pass it directly
    });
    
    console.log("Firebase token:", token);

    if (token) {
      await saveTokenToBackend(token);
      return token;
    }
  } catch (err) {
    console.error("Error getting token:", err);
  }
};

const saveTokenToBackend = async (token) => {
  try {
    await useNotificationApi.saveToken(token);
  } catch (error) {
    console.error("Error saving token to backend:", error);
  }
};

export const onForegroundMessage = (callback) => {
  return onMessage(messaging, callback);
};
