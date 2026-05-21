const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// HTTP-Function statt onCall → funktioniert mit GitHub Pages
exports.deleteUpload = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const filePath = req.body.filePath;
      const docId = req.body.docId;

      if (!filePath || !docId) {
        return res.status(400).send({ error: "filePath und docId fehlen" });
      }

      // Datei löschen
      await admin.storage().bucket().file(filePath).delete();

      // Firestore-Eintrag löschen
      await admin.firestore().collection("uploads").doc(docId).delete();

      return res.status(200).send({ success: true });
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
      return res.status(500).send({ error: err.message });
    }
  });
});
