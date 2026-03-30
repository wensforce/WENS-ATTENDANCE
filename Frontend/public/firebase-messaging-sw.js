// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");

let messaging;

// Listen for config sent from the React app
self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG") {
    firebase.initializeApp(event.data.config);
    messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo192.png",
      });
    });
  }
});