const routePoints = [
  [48.137154, 11.576124],
  [48.140228, 11.560716],
  [48.148545, 11.549774]
];

const checkpoints = [
  { name: "Station 1", coords: [48.137154, 11.576124], reached: false },
  { name: "Station 2", coords: [48.140228, 11.560716], reached: false },
  { name: "Station 3", coords: [48.148545, 11.549774], reached: false }
];

const map = L.map('map').setView(routePoints[0], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

const routeLine = L.polyline(routePoints, { color: 'blue' }).addTo(map);
map.fitBounds(routeLine.getBounds());

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

let userMarker = null;

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