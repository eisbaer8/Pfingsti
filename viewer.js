const viewerRole = localStorage.getItem("role");
if (viewerRole !== "viewer" && viewerRole !== "admin" && viewerRole !== "team") {
  // sehr locker, kann man auch strenger machen
  console.warn("Keine spezielle Rolle, aber Viewer läuft trotzdem.");
}

// Marker-Speicher
const viewerTeamMarkers = {};

db.collection("teams").onSnapshot((snap) => {
  snap.forEach((doc) => {
    const teamId = doc.id;
    const data = doc.data();
    if (!data.location) return;

    const { lat, lng, updatedAt } = data.location;

    // Minuten seit letzter Aktualisierung berechnen
    let minutesAgo = null;
    if (updatedAt) {
      const now = Date.now();
      const last = updatedAt.toDate().getTime();
      const diffMs = now - last;
      minutesAgo = Math.floor(diffMs / 60000);
    }

    // Popup-Text
    const popupText = `
      <b>${teamId}</b><br>
      Letzte Aktualisierung vor:<br>
      ${minutesAgo} Minuten
    `;

    // Marker setzen oder aktualisieren (ohne Icon)
    if (!viewerTeamMarkers[teamId]) {
      const marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(popupText);
      viewerTeamMarkers[teamId] = marker;
    } else {
      viewerTeamMarkers[teamId].setLatLng([lat, lng]);
      viewerTeamMarkers[teamId].setPopupContent(popupText);
    }
  });
});
