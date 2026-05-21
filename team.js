const teamRole = localStorage.getItem("role");
const teamId = localStorage.getItem("teamId");

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
  const taskId = document.getElementById("taskId").value.trim();
  const answer = document.getElementById("answer").value.trim();
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  if (!taskId) {
    alert("Bitte eine Aufgabe-ID eingeben (z.B. aufgabe1)");
    return;
  }
  if (!file) {
    alert("Bitte ein Bild auswählen");
    return;
  }

  try {
    const ref = storage.ref(`uploads/${teamId}/${taskId}_${Date.now()}.png`);
    await ref.put(file);
    const url = await ref.getDownloadURL();

    await db.collection("uploads").add({
      teamId,
      taskId,
      url,
      answer: answer || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Upload erfolgreich");
    fileInput.value = "";
    document.getElementById("answer").value = "";
  } catch (e) {
    console.error(e);
    alert("Fehler beim Upload");
  }
}
