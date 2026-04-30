import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import firebaseConfig from "./firebaseConfig";

const app = initializeApp(firebaseConfig);

// getMessaging() requires Service Workers, Push API, and Notification API.
// Guard it so unsupported browsers (some mobile browsers, older Safari, etc.)
// don't throw at module load time.
export const messaging = await isSupported()
  .then((supported) => (supported ? getMessaging(app) : null))
  .catch(() => null);