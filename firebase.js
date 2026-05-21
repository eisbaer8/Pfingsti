const firebaseConfig = {
  apiKey: "AIzaSyAgziNQwcsktG5Um2AA2y7sG9I48Rrjx6U",
  authDomain: "pfingsti.firebaseapp.com",
  projectId: "pfingsti",
  storageBucket: "pfingsti.firebasestorage.app",
  messagingSenderId: "440967905315",
  appId: "1:440967905315:web:b8aebe8994209c1068f196",
  measurementId: "G-EX200KBNZ1"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// --- Login-Funktionen für index.html ---

async function loginTeam() {
  const code = document.getElementById("teamCode").value.trim().toLowerCase();
  if (!code) return alert("Bitte Teamcode eingeben (z.B. team1)");

  // Optional: prüfen, ob Team existiert
  // Hier: wir akzeptieren team1–team8 direkt
  const validTeams = [
    "team1","team2","team3","team4",
    "team5","team6","team7","team8"
  ];
  if (!validTeams.includes(code)) {
    alert("Unbekannter Teamcode");
    return;
  }

  localStorage.setItem("role", "team");
  localStorage.setItem("teamId", code);

  window.location.href = "team.html";
}

function loginAdmin() {
  const adminCode = document.getElementById("adminCode").value.trim();
  // ganz simpel: fester Code, später besser über Auth lösen
  if (adminCode !== "PFINGSTADMIN") {
    alert("Falscher Admin-Code");
    return;
  }

  localStorage.setItem("role", "admin");
  window.location.href = "admin.html";
}

function loginViewer() {
  localStorage.setItem("role", "viewer");
  window.location.href = "viewer.html";
}
