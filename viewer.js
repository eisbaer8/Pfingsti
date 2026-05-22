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

    // Farbe bestimmen
    let color = "green";
    if (minutesAgo >= 5) color = "yellow";
    if (minutesAgo >= 10) color = "red";

    // Leaflet-Icon erzeugen
    const icon = L.icon({
      iconUrl: `img/${color}.png`,   // du brauchst green.png, yellow.png, red.png
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    // Popup-Text
    const popupText = `
      <b>${teamId}</b><br>
      Letzte Aktualisierung vor:<br>
      ${minutesAgo} Minuten
    `;

    // Marker setzen oder aktualisieren
    if (!viewerTeamMarkers[teamId]) {
      const marker = L.marker([lat, lng], { icon }).addTo(map)
        .bindPopup(popupText);
      viewerTeamMarkers[teamId] = marker;
    } else {
      viewerTeamMarkers[teamId].setLatLng([lat, lng]);
      viewerTeamMarkers[teamId].setIcon(icon);
      viewerTeamMarkers[teamId].setPopupContent(popupText);
    }
  });
});