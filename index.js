const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

exports.deleteUpload = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { filePath, docId } = req.body;

      // 🔥 1) Wenn KEIN Bild → nur Firestore löschen
      if (!filePath) {
        await admin.firestore().collection("uploads").doc(docId).delete();
        return res.json({ success: true, message: "Nur Text gelöscht" });
      }

      // 🔥 2) Wenn Bild vorhanden → zuerst Storage löschen
      await admin.storage().bucket().file(filePath).delete();

      // 🔥 3) Dann Firestore löschen
      await admin.firestore().collection("uploads").doc(docId).delete();

      return res.json({ success: true });

    } catch (err) {
      console.error("Fehler beim Löschen:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});