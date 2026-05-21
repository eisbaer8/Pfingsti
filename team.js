const teamId = window.teamId;
const teamRole = window.role;

if (teamRole !== "team" || !teamId) {
  alert("Kein Team angemeldet");
  window.location.href = "index.html";
}

document.getElementById("teamInfo").textContent = "Angemeldet als: " + teamId;

// Standorttracking für dieses Team
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      db.collection("teams").doc(teamId).set({
        location: {
          lat,
          lng,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
    },
    (err) => console.error("GPS Fehler (Team):", err),
    { enableHighAccuracy: true }
  );
}

// Upload-Funktion
async function uploadTask() {
  const taskId = document.getElementById("taskIdSelect").value;
  const answer = document.getElementById("answer").value.trim();
  const file = document.getElementById("file").files[0];
  const teamId = localStorage.getItem("teamId");

  if (!answer && !file) {
    alert("Bitte Antwort eingeben oder ein Bild auswählen");
    return;
  }

  const uploadData = {
    teamId,
    taskId,
    answer: answer || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Wenn kein Bild → nur Firestore speichern
  if (!file) {
    await db.collection("uploads").add(uploadData);
    alert("Antwort gespeichert");
    return;
  }

  // Wenn Bild vorhanden → zuerst hochladen
  const storagePath = `uploads/${teamId}/${taskId}_${Date.now()}.png`;
  const storageRef = firebase.storage().ref().child(storagePath);

  await storageRef.put(file);
  const url = await storageRef.getDownloadURL();

  uploadData.url = url;
  uploadData.storagePath = storagePath;

  await db.collection("uploads").add(uploadData);

  alert("Antwort + Bild gespeichert");
}
