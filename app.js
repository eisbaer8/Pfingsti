// ---------------------------------------------------------
// KARTE ERSTELLEN
// ---------------------------------------------------------
const map = L.map('map').setView([48.6327, 9.7757], 13);

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

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjMwZDg4ZWM0MmMyYTQ4YzQ5NjlkZDhiYmQ1NGI1NzY1IiwiaCI6Im11cm11cjY0In0=";
let aktuelleRoute = null;

function starteRoute(punkte, farbe) {

  if (aktuelleRoute) {
    map.removeLayer(aktuelleRoute);
  }

  // ORS erwartet: [lon, lat]
  const coords = punkte.map(p => [p[1], p[0]]);

  fetch("https://api.openrouteservice.org/v2/directions/foot-hiking/geojson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": ORS_API_KEY
    },
    body: JSON.stringify({
      coordinates: coords
    })
  })
    .then(res => res.json())
    .then(data => {
      const routeCoords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
      aktuelleRoute = L.polyline(routeCoords, { color: farbe, weight: 4 }).addTo(map);
      map.fitBounds(routeCoords);
    })
    .catch(err => console.error("ORS Fehler:", err));
}
// ---------------------------------------------------------
// ⭐ ROUTEN-DEFINITIONEN (Hinweg / Rückweg) ⭐
// ---------------------------------------------------------

const routeHin = [
  [48.63269832105482, 9.775715624565734],   // Start
  [48.634871, 9.783646],                                      // Station 1 
  [48.631932, 9.779618],                    // Aufgabe 1
  [48.626529, 9.778440],                                                  // Wegpunkt 
  [48.621970, 9.781733],                                     // Station 2 
  [48.624392, 9.786778],                    // Aufgabe 2
  [48.626293, 9.792231],                                     // Station 3
  [48.621579, 9.791860],                    // Aufgabe 3
  [48.615693, 9.795932],                                     // Station 4
  [48.614740, 9.794486],                                                   // Wegpunkt
  [48.614833, 9.792761],                    // Aufgabe 4
  [48.61560148496865, 9.784875696421906],   // Mittag
  [48.609789, 9.785213],                    // Aufgabe 5
  [48.607640, 9.784240],                                                  // Wegpunkt 
  [48.608009, 9.781743],                                     // Station 5
  [48.610042, 9.780076],                    // Aufgabe 6
  [48.612247, 9.771929],                                     // Station 6
  [48.614632, 9.772938],                    // Aufgabe 7
  [48.621330, 9.770260],                                     // Station 7
  [48.624662, 9.774031],                    // Aufgabe 8 
  [48.628866, 9.778819],                                     // Station 8 
  [48.63269832105482, 9.775715624565734]    // Ziel
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
  starteRoute(routeHin, "blue");   // Hinweg = grün
});

document.getElementById("zurueck").addEventListener("click", () => {
  starteRoute(routeZurueck, "green"); // Rückweg = blau
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

       map.setView([lat, lng], 16);  // ⭐ WICHTIG: Zoom auf Standort
  }    else {
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