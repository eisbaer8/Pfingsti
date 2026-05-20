// ---------------------------------------------------------
// KARTE ERSTELLEN (Startposition egal, GPX setzt später Bounds)
// ---------------------------------------------------------
const map = L.map('map').setView([48.137154, 11.576124], 14);

// ---------------------------------------------------------
// KARTENLAYOUT LADEN (OpenStreetMap)
// ---------------------------------------------------------
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// ---------------------------------------------------------
// GPX-Datei laden und Route automatisch anzeigen
// ---------------------------------------------------------
new L.GPX("Route_Pfingsti.gpx", {
  async: true,
  marker_options: {
    startIconUrl: null,
    endIconUrl: null,
    shadowUrl: null
  }
}).on("loaded", function(e) {
  // Karte auf die GPX-Route zoomen
  map.fitBounds(e.target.getBounds());
}).addTo(map);

// ---------------------------------------------------------
// CHECKPOINTS (Stationen, die rot werden, wenn du nah genug bist)
// ---------------------------------------------------------
const checkpoints = [
  { name: "Station 1", coords: [48.137154, 11.576124], reached: false },
  { name: "Station 2", coords: [48.140228, 11.560716], reached: false },
  { name: "Station 3", coords: [48.148545, 11.549774], reached: false }
];

// ---------------------------------------------------------
// CHECKPOINT-MARKER AUF DER KARTE ANZEIGEN
// ---------------------------------------------------------
const checkpointMarkers = [];

checkpoints.forEach((cp) => {
  const marker = L.circleMarker(cp.coords, {
    radius: 8,
    color: 'gray',
    fillColor: 'gray',
    fillOpacity: 0.8
  }).addTo(map)
    .bindPopup(cp.name);

  checkpointMarkers.push(marker);
});

// ---------------------------------------------------------
// DISTANZBERECHNUNG (Haversine-Formel)
// ---------------------------------------------------------
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => v * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lat2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------
// PRÜFEN, OB EIN CHECKPOINT ERREICHT WURDE
// ---------------------------------------------------------
function checkCheckpoints(userLat, userLng) {
  const threshold = 40;

  checkpoints.forEach((cp, index) => {
    if (cp.reached) return;

    const [cpLat, cpLng] = cp.coords;
    const dist = distanceInMeters(userLat, userLng, cpLat, cpLng);

    if (dist <= threshold) {
      cp.reached = true;

      checkpointMarkers[index].setStyle({
        color: 'red',
        fillColor: 'red'
      });

      checkpointMarkers[index].bindPopup(cp.name + " (erreicht!)");
    }
  });
}

// ---------------------------------------------------------
// GPS AKTIVIEREN UND NUTZERPOSITION AKTUALISIEREN
// ---------------------------------------------------------
let userMarker = null;

if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (!userMarker) {
        userMarker = L.marker([lat, lng]).addTo(map)
          .bindPopup("Du bist hier");
      } else {
        userMarker.setLatLng([lat, lng]);
      }

      checkCheckpoints(lat, lng);
    },
    (err) => console.error("GPS Fehler:", err),
    { enableHighAccuracy: true }
  );
} else {
  alert("Geolocation wird nicht unterstützt.");
}