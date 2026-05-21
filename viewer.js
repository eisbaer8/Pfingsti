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

    const { lat, lng } = data.location;

    if (!viewerTeamMarkers[teamId]) {
      const marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(teamId);
      viewerTeamMarkers[teamId] = marker;
    } else {
      viewerTeamMarkers[teamId].setLatLng([lat, lng]);
    }
  });
});