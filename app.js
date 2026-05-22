// ---------------------------------------------------------
// KARTE ERSTELLEN
// ---------------------------------------------------------
window.map = L.map('map').setView([48.6327, 9.7757], 13);

// ---------------------------------------------------------
// KARTENLAYOUT LADEN (OpenStreetMap)
// ---------------------------------------------------------
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// ---------------------------------------------------------
// ⭐ ROUTING-FUNKTION (ORS) ⭐
// ---------------------------------------------------------

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjMwZDg4ZWM0MmMyYTQ4YzQ5NjlkZDhiYmQ1NGI1NzY1IiwiaCI6Im11cm11cjY0In0=";
let aktuelleRoute = null;

function starteRoute(punkte, farbe) {

  if (aktuelleRoute) {
    map.removeLayer(aktuelleRoute);
  }

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
  [48.625673, 9.777330],                                      // Station 1 
  [48.623187, 9.779140],                    // Aufgabe 1                                          
  [48.621970, 9.781733],                                     // Station 2 
  [48.624392, 9.786778],                    // Aufgabe 2
  [48.626293, 9.792231],                                     // Station 3
  [48.621579, 9.791860],                    // Aufgabe 3
  [48.615693, 9.795932],                                     // Station 4
  [48.614848, 9.795814],                    // Aufgabe 4
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

const routeZurueck = [...routeHin].reverse();
// ---------------------------------------------------------
// AUTOMATISCHE ROUTENANZEIGE FÜR ALLE ROLLEN
// ---------------------------------------------------------
window.role = localStorage.getItem("role");
window.teamId = localStorage.getItem("teamId");

// TEAM → Richtung abhängig von Teamnummer
if (role === "team" && teamId) {
  const teamNum = parseInt(teamId.replace("team", ""));

  // Teams 1,3,5,7 → richtige Richtung
  if ([1, 3, 5, 7].includes(teamNum)) {
    starteRoute(routeHin, "blue");
  } 
  // Teams 2,4,6,8 → falsche Richtung
  else {
    starteRoute(routeZurueck, "blue");
  }
}

// ADMIN & VIEWER → immer Hinroute
if (role === "admin" || role === "viewer") {
  starteRoute(routeHin, "gray");
}


// ---------------------------------------------------------
// CHECKPOINTS
// ---------------------------------------------------------
const checkpoints = [
  { name: "Start",  coords: [48.63269832105482, 9.775715624565734], reached: false },
  { name: "Ziel",   coords: [48.63269832105482, 9.775715624565734], reached: false },
  { name: "Mittag", coords: [48.61560148496865, 9.784875696421906], reached: false },
];

// ---------------------------------------------------------
// CHECKPOINT-MARKER MIT INDIVIDUELLEN ICONS AUS /img/
// ---------------------------------------------------------
const checkpointMarkers = [];

checkpoints.forEach((cp) => {
  let iconUrl;

  switch (cp.name) {
    case "Start":
      iconUrl = "img/start_icon.png";
      break;
    case "Mittag":
      iconUrl = "img/mittag_icon.png";
      break;
    case "Ziel":
      iconUrl = "img/ziel_icon.png";  // vorher falsch: start_icon.png
      break;
    default:
      iconUrl = "img/default_icon.png";
  }

  const icon = L.icon({
    iconUrl,
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });

  const marker = L.marker(cp.coords, { icon })
    .addTo(map)
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
// ⭐ SPIELERISCHE WEGPUNKTE (Info + Aufgaben) ⭐
// ---------------------------------------------------------
const gamePoints = [
  {
    name: "Station 1",
    coords: [48.625673, 9.777330],
    type: "info",
    icon: "img/station1.png",
    reached: false
  },
  {
    name: "Aufgabe 1",
    coords: [48.623187, 9.779140],
    type: "quest",
    task: "Mache ein Bild von einer Birke! \nMacht ein Bild davon und ladet es hoch! ",
    icon: "img/aufgabe1.png",
    image: "img/quest1.jpg",
    reached: false
  },
  {
    name: "Station 2",
    coords: [48.621970, 9.781733],
    type: "info",
    icon: "img/station2.png",
    reached: false
  },
  {
    name: "Aufgabe 2",
    coords: [48.624392, 9.786778],
    type: "quest",
    task: "Baut auf eurem weg ein Steinmänchen! \nMacht ein Bild davon und ladet es hoch! \nMin. 6 übereinander! ",
    icon: "img/aufgabe1.png",
    image: "img/quest2.jpg",
    reached: false
  },
  {
    name: "Station 3",
    coords: [48.626293, 9.792231],
    type: "info",
    icon: "img/station3.png",
    reached: false
  },
  {
    name: "Aufgabe 3",
    coords: [48.621579, 9.791860],
    type: "quest",
    task: "Macht ein Gruppen Bild von euch und ladet es hoch! \n Werdet creativ\n Langweilig mag keiner!",
    icon: "img/aufgabe1.png",
    reached: false
  },
  {
    name: "Station 4",
    coords: [48.615693, 9.795932],
    type: "info",
    icon: "img/station4.png",
    reached: false
  },
  {
    name: "Aufgabe 4",
    coords: [48.615448, 9.790380],
    type: "quest",
    task: "Wie viele Pinguine sind auf dem Bild zusehen? ",
    icon: "img/aufgabe1.png",
    image: "img/quest4.jpg",
    reached: false
  },{
    name: "Station 5",
    coords: [48.608009, 9.781743],
    type: "info",
    icon: "img/station5.png",
    reached: false
  },
  {
    name: "Aufgabe 5",
    coords: [48.609789, 9.785213],
    type: "quest",
    task: "Trag eure/euren Betreuer/in? \nMacht ein Bild davon und ladet es hoch!",
    icon: "img/aufgabe1.png",
    reached: false
  },
  {
    name: "Station 6",
    coords: [48.612247, 9.771929],
    type: "info",
    icon: "img/station6.png",
    reached: false
  },
  {
    name: "Aufgabe 6",
    coords: [48.610821, 9.776592],
    type: "quest",
    task: "Quiz \n Antworten Bitte so hochladen (Bsp: 1. 1873, 2. 99, 3. Bob (ältester) sophie (jüngste) \n 1. Seit wann gibt es das Pfingsti? \n 2. Wie viel Glühbirnen hängen im Gemeinschaftszelt? \n Wer ist der älteste/jungste Betreuer ?",
    icon: "img/aufgabe1.png",
    reached: false
  },{
    name: "Station 7",
    coords: [48.621330, 9.770260],
    type: "info",
    icon: "img/station7.png",
    reached: false
  },
  {
    name: "Aufgabe 7",
    coords: [48.617792, 9.7712435],
    type: "quest",
    task: "Der Boden ist Lava! Macht ein Bild von euch auf dem keiner von euch den Boden berührt! \n Werdet wieder creativ ! ",
    icon: "img/aufgabe1.png",
    reached: false
  },
  {
    name: "Station 8",
    coords: [48.628866, 9.778819],
    type: "info",
    icon: "img/station8.png",
    reached: false
  },
  {
    name: "Aufgabe 8",
    coords: [48.624662, 9.774031],
    type: "quest",
    task: "Stellt das Bild nach! Ladet es wieder hoch! ",
    icon: "img/aufgabe1.png",
    reached: false
  },
  {
    name: "Zeltplatz",
    coords: [48.63262146083127, 9.774074830040538],
    type: "quest",
    task: "Pop Up da ? ",
    icon: "img/tent.png",
    image: "img/zeltplatz.jpg",
    reached: false
  }
];

// ---------------------------------------------------------
// KOORDINATEN FÜR TEAMS 2,4,6,8 SPIEGELN
// ---------------------------------------------------------
if (role === "team" && teamId) {
  const teamNum = parseInt(teamId.replace("team", ""));

  if ([2, 4, 6, 8].includes(teamNum)) {
    const byName = {};
    gamePoints.forEach(gp => {
      byName[gp.name] = gp;
    });

    function swapCoords(a, b) {
      if (!byName[a] || !byName[b]) return;
      const tmp = byName[a].coords;
      byName[a].coords = byName[b].coords;
      byName[b].coords = tmp;
    }

    // Aufgaben
    swapCoords("Aufgabe 1", "Aufgabe 8");
    swapCoords("Aufgabe 2", "Aufgabe 7");
    swapCoords("Aufgabe 3", "Aufgabe 6");
    swapCoords("Aufgabe 4", "Aufgabe 5");
  }

  console.log("ROLE / TEAM:", role, teamId);
  console.log(
    "GAMEPOINTS NACH SWAP:",
    gamePoints.map(g => g.name + " → " + g.coords.join(", "))
  );

}

const gameMarkers = [];

gamePoints.forEach((gp) => {

  const marker = L.marker(gp.coords, {
    icon: L.icon({
      iconUrl: gp.icon,
      iconSize: [45, 45],
      iconAnchor: [22, 45],
      popupAnchor: [0, -45]
    })
  }).addTo(map)
    .bindPopup(gp.name);

  gameMarkers.push(marker);
});

function checkGamePoints(userLat, userLng) {
  const threshold = 35;

  gamePoints.forEach((gp, index) => {
    if (gp.reached) return;

    const [gpLat, gpLng] = gp.coords;
    const dist = distanceInMeters(userLat, userLng, gpLat, gpLng);

    if (dist <= threshold) {
      gp.reached = true;

      // Icon ändern
      gameMarkers[index].setIcon(
        L.icon({
          iconUrl: "img/erreicht.png",
          iconSize: [45, 45],
          iconAnchor: [22, 45]
        })
      );

      // Aufgabe anzeigen
      if (gp.type === "quest") {
        alert("Aufgabe bei " + gp.name + ":\n\n" + gp.task);
      } else {
        alert(gp.name + " erreicht!");
      }

      // In Firestore speichern
      if (role === "team" && teamId) {

        console.log("🔥 SPEICHERE AUFGABE:", gp.name, "für Team:", teamId);

        db.collection("teams").doc(teamId).update({
          reachedTasks: firebase.firestore.FieldValue.arrayUnion(gp.name)
        });
      }
    }
  });
}



// ---------------------------------------------------------
// GPS – nur für Teams
// ---------------------------------------------------------
let userMarker = null;

if (role === "team" && "geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (!userMarker) {
        userMarker = L.marker([lat, lng]).addTo(map)
          .bindPopup("Du bist hier");

        map.setView([lat, lng], 16);
      } else {
        userMarker.setLatLng([lat, lng]);
      }

      checkCheckpoints(lat, lng);
      checkGamePoints(lat, lng);

    },
    (err) => console.error("GPS Fehler:", err),
    { enableHighAccuracy: true }
  );
} else if (role === "team") {
  alert("Geolocation wird nicht unterstützt.");
}


// ---------------------------------------------------------
// ERREICHTE AUFGABEN BEIM LADEN ANZEIGEN
// ---------------------------------------------------------
if (role === "team" && teamId) {
  db.collection("teams").doc(teamId).onSnapshot((doc) => {
    const data = doc.data();
    const reached = data.reachedTasks || [];

    reached.forEach(taskName => {
      const gp = gamePoints.find(g => g.name === taskName);
      if (!gp) return;

      const index = gamePoints.indexOf(gp);

      // Icon setzen
      gameMarkers[index].setIcon(
        L.icon({
          iconUrl: "img/erreicht.png",
          iconSize: [45, 45],
          iconAnchor: [22, 45]
        })
      );

      // Klick-Handler nur EINMAL setzen
      if (!gameMarkers[index]._hasClickHandler) {
        gameMarkers[index].on("click", () => {
          showTaskPopup(gp);
        });

        gameMarkers[index]._hasClickHandler = true;
      }
    });
  });
}


// ---------------------------------------------------------
// POPUP-FENSTER FÜR AUFGABEN
// ---------------------------------------------------------
function showTaskPopup(gp) {
  // Overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  // Box
  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.padding = "20px";
  box.style.borderRadius = "12px";
  box.style.width = "90%";
  box.style.maxWidth = "400px";
  box.style.boxShadow = "0 0 20px rgba(0,0,0,0.3)";
  box.style.textAlign = "center";
  box.style.fontFamily = "Arial";

  // Titel
  const title = document.createElement("h2");
  title.innerText = gp.name;
  box.appendChild(title);

  // Bild
  if (gp.image) {
    const img = document.createElement("img");
    img.src = gp.image;
    img.style.width = "100%";
    img.style.borderRadius = "8px";
    img.style.marginBottom = "15px";
    box.appendChild(img);
  }

  // Text
  const text = document.createElement("p");
  text.innerText = gp.task || gp.name;
  text.style.fontSize = "18px";
  box.appendChild(text);

  // Schließen
  const closeBtn = document.createElement("button");
  closeBtn.innerText = "Schließen";
  closeBtn.style.marginTop = "15px";
  closeBtn.style.padding = "10px 20px";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.border = "none";
  closeBtn.style.borderRadius = "8px";
  closeBtn.style.background = "#007bff";
  closeBtn.style.color = "#fff";
  closeBtn.style.cursor = "pointer";

  closeBtn.onclick = () => overlay.remove();

  box.appendChild(closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}