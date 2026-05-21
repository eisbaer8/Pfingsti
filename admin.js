const adminRole = localStorage.getItem("role");
if (adminRole !== "admin") {
  alert("Kein Admin angemeldet");
  window.location.href = "index.html";
}

// Marker-Speicher für Teams
const teamMarkers = {};

// Live-Teams aus Firestore
db.collection("teams").onSnapshot((snap) => {
  snap.forEach((doc) => {
    const teamId = doc.id;
    const data = doc.data();
    if (!data.location) return;

    const { lat, lng } = data.location;

    if (!teamMarkers[teamId]) {
      const marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(teamId);
      teamMarkers[teamId] = marker;
    } else {
      teamMarkers[teamId].setLatLng([lat, lng]);
    }
  });
});

// Uploads anzeigen
const uploadsList = document.getElementById("uploadsList");

db.collection("uploads")
  .orderBy("createdAt", "desc")
  .onSnapshot((snap) => {
    uploadsList.innerHTML = "";
    snap.forEach((doc) => {
      const up = doc.data();
      const div = document.createElement("div");
      div.style.borderBottom = "1px solid #ddd";
      div.style.marginBottom = "8px";
      div.style.paddingBottom = "8px";

      div.innerHTML = `
        <strong>${up.teamId}</strong> – ${up.taskId}<br>
        Antwort: ${up.answer || "(keine)"}<br>
        <a href="${up.url}" target="_blank">Bild ansehen</a>
      `;
      uploadsList.appendChild(div);
    });
  });
