const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendAlertAndSave = functions.https.onCall(async (data, context) => {
  const { title, body, token, userId } = data;

  // 1. Send the notification
  await admin.messaging().send({
    token,
    notification: { title, body }
  });

  // 2. Save the alert to Firestore
  await admin.firestore().collection("alerts").add({
    title,
    body,
    userId: userId || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
}); 