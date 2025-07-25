importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyACOgfXdFbJJ1EOC-oWvz6I5xljYaCaUiU",
  authDomain: "storage-of-finsight.firebaseapp.com",
  projectId: "storage-of-finsight",
  messagingSenderId: "583194312680",
  appId: "1:583194312680:web:eed755f06f44c95660ae5d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/placeholder.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});