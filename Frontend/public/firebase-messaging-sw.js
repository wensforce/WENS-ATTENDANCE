// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");

// Initialize Firebase immediately
firebase.initializeApp({
  apiKey: "AIzaSyCmmlegQNRK03hzErOBY46VnE66VgOnq7Q",
  authDomain: "test-f8c71.firebaseapp.com",
  projectId: "test-f8c71",
  messagingSenderId: "G-FWKPDNW68D",
  appId: "1:910069171643:web:af9cc933432d0c7a85709e",
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "Background Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icons/android-chrome-192x192.png", // optional
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});