import {
  initAudio,
  toggleMute,
  enablePushToTalk,
  startTalking,
  stopTalking,
  createPeer,
  handleSignal
} from "./webrtc.js";

const socket = io("https://TON_BACKEND_RENDER");

document.addEventListener("keydown", e => {
  if (e.code === "Space") startTalking();
});

document.addEventListener("keyup", e => {
  if (e.code === "Space") stopTalking();
});

async function login() {
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  if (!res.ok) return alert("Accès refusé");

  document.getElementById("login").hidden = true;
  document.getElementById("chat").hidden = false;

  socket.emit("join", "room1");
}

async function startCall() {
  await initAudio();

  socket.on("new-peer", id => {
    addUser(id);
    createPeer(id, socket, true);
  });

  socket.on("signal", data => handleSignal(data, socket));

  socket.on("peer-left", id => removeUser(id));
}

function addUser(id) {
  const div = document.createElement("div");
  div.id = `user-${id}`;
  div.className = "user";
  div.innerText = `🎧 ${id}`;
  document.getElementById("users").appendChild(div);
}

function removeUser(id) {
  document.getElementById(`user-${id}`)?.remove();
  document.getElementById(`audio-${id}`)?.remove();
}

window.login = login;
window.startCall = startCall;
window.toggleMute = () => {
  const muted = toggleMute();
  document.getElementById("mute").innerText = muted ? "🔇" : "🔊";
};

window.togglePTT = e => enablePushToTalk(e.target.checked);
