// ---------------------------------------------------------
// KARTE ERSTELLEN
// ---------------------------------------------------------
const map = L.map('map');

// ---------------------------------------------------------
// KARTENLAYOUT LADEN (OpenStreetMap)
// ---------------------------------------------------------
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// ---------------------------------------------------------
// ⭐ OSRM-ROUTING MIT MEHREREN WEGPUNKTEN ⭐
// ---------------------------------------------------------

// HIER trägst du deine Route ein (Start → Zwischenpunkte → Ziel)
const punkte = [
  [48.63269832105482, 9.775715624565734], // Start
  [48.61560148496865, 9.784875696421906], // Mittag
  [48.63269832105482, 9.775715624565734]  // Ziel
];

// OSRM erwartet lon,lat;lon,lat;...
const coordsString = punkte
  .map(p => `${p[1]},${p[0]}`)
  .join(";");

fetch(`https://router.project-osrm.org/route/v1/foot/${coordsString}?overview=full&geometries=geojson`)
  .then(res => res.json())
  .then(data => {
    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    L.polyline(coords, { color: "green", weight: 4 }).addTo(map);
    map.fitBounds(coords);
  });

// ---------------------------------------------------------
// CHECKPOINTS (Stationen, die rot werden, wenn du nah genug bist)
// ---------------------------------------------------------
const checkpoints = [
  { name: "Start",  coords: [48.63269832105482, 9.775715624565734], reached: false },
  { name: "Ziel",   coords: [48.63269832105482, 9.775715624565734], reached: false },
  { name: "Mittag", coords: [48.61560148496865, 9.784875696421906], reached: false },
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