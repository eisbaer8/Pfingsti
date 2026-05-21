// Admin-Check
const adminRole = localStorage.getItem("role");
if (adminRole !== "admin") {
  alert("Kein Admin angemeldet");
  window.location.href = "index.html";
}


// Marker-Speicher für Teams
const teamMarkers = {};

// Live-Teams auf Karte anzeigen
db.collection("teams").onSnapshot((snap) => {
  snap.forEach((doc) => {
    const teamId = doc.id;
    const data = doc.data();
    if (!data.location) return;

    const { lat, lng } = data.location;

    if (!teamMarkers[teamId]) {
      const marker = L.marker([lat, lng]).addTo(map).bindPopup(teamId);
      teamMarkers[teamId] = marker;
    } else {
      teamMarkers[teamId].setLatLng([lat, lng]);
    }
  });
});

// Upload-Liste laden
const uploadsList = document.getElementById("uploadsList");

function renderUploads() {
  db.collection("uploads")
    .orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      uploadsList.innerHTML = "";

      if (snap.empty) {
        uploadsList.innerHTML = "<p>Keine Uploads vorhanden.</p>";
        return;
      }

      snap.forEach((doc) => {
        const up = doc.data();

        const div = document.createElement("div");
        div.style.borderBottom = "1px solid #ddd";
        div.style.marginBottom = "12px";
        div.style.paddingBottom = "12px";

        div.innerHTML = `
          <strong>Team:</strong> ${up.teamId}<br>
          <strong>Aufgabe:</strong> ${up.taskId}<br>
          <strong>Antwort:</strong> ${up.answer || "(keine)"}<br>

          ${up.url 
            ? `<a href="${up.url}" target="_blank">Bild ansehen</a>` 
            : `<span>Kein Bild</span>`}
          <br><br>

          <button onclick="deleteUploadEntry('${up.storagePath || ""}', '${doc.id}')"

            style="background:#c62828;color:white;padding:6px 12px;border:none;border-radius:4px;cursor:pointer;">
            Löschen
          </button>
        `;

        uploadsList.appendChild(div);
      });
    });
}

// Upload löschen
function deleteUploadEntry(filePath, docId) {
  if (!confirm("Willst du diesen Upload wirklich löschen")) return;

  fetch("https://us-central1-pfingsti.cloudfunctions.net/deleteUpload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath, docId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert("Fehler: " + data.error);
    } else {
      alert("Erfolgreich gelöscht");
    }
  })
  .catch(err => alert("Fehler: " + err.message));
}

// Starten
renderUploads();
