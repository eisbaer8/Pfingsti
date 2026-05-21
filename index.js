const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Cloud Function: Löscht Datei + Firestore-Eintrag
exports.deleteUpload = functions.https.onCall(async (data, context) => {
  // Prüfen ob Admin
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Nur Admins dürfen löschen."
    );
  }

  const filePath = data.filePath;     // z.B. "uploads/12345.jpg"
  const docId = data.docId;           // Firestore Dokument-ID

  if (!filePath || !docId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "filePath und docId müssen übergeben werden."
    );
  }

  try {
    // 1. Datei aus Storage löschen
    await admin.storage().bucket().file(filePath).delete();

    // 2. Firestore-Eintrag löschen
    await admin.firestore().collection("uploads").doc(docId).delete();

    return { success: true };
  } catch (error) {
    console.error("Fehler beim Löschen:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Löschen fehlgeschlagen."
    );
  }
});