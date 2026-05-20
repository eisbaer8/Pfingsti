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
// ⭐ ROUTING-FUNKTION (OSRM) ⭐
// ---------------------------------------------------------
let aktuelleRoute = null;

function starteRoute(punkte, farbe) {

  // Alte Route entfernen
  if (aktuelleRoute) {
    map.removeLayer(aktuelleRoute);
  }

  const coordsString = punkte
    .map(p => `${p[1]},${p[0]}`)
    .join(";");

  fetch(`https://router.project-osrm.org/route/v1/foot/${coordsString}?overview=full&geometries=geojson`)
    .then(res => res.json())
    .then(data => {
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      aktuelleRoute = L.polyline(coords, { color: "green", weight: 4 }).addTo(map);
      map.fitBounds(coords);
    });
}

// ---------------------------------------------------------
// ⭐ ROUTEN-DEFINITIONEN (Hinweg / Rückweg) ⭐
// ---------------------------------------------------------

const routeHin = [
  [48.63269832105482, 9.775715624565734], // Start
  [48.61560148496865, 9.784875696421906], // Mittag
  [48.63269832105482, 9.775715624565734]  // Ziel
];

const routeZurueck = [
  [48.63269832105482, 9.775715624565734], // Ziel wird Start
  [48.61560148496865, 9.784875696421906], // Mittag rückwärts
  [48.63269832105482, 9.775715624565734]  // Start wird Ziel
];

// ---------------------------------------------------------
// ⭐ BUTTON-EVENTS ⭐
// ---------------------------------------------------------
document.getElementById("hin").addEventListener("click", () => {
  starteRoute(routeHin, "green");   // Hinweg = grün
});

document.getElementById("zurueck").addEventListener("click", () => {
  starteRoute(routeZurueck, "blue"); // Rückweg = blau
});
// ---------------------------------------------------------
// CHECKPOINTS
// ---------------------------------------------------------
const checkpoints = [
  { name: "Start",  coords: [48.63269832105482, 9.775715624565734], reached: false },
  { name: "Ziel",   coords: [48.63269832105482, 9.775715624565734], reached: false },
  { name: "Mittag", coords: [48.61560148496865, 9.784875696421906], reached: false },
];

// ---------------------------------------------------------
// CHECKPOINT-MARKER
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
// DISTANZBERECHNUNG
// ---------------------------------------------------------
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => v * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------
// CHECKPOINT-PRÜFUNG
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
// GPS
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