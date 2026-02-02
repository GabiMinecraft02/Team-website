const socket = io("https://TON_BACKEND_RENDER");

let localStream;
let peers = {};

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
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  socket.on("new-peer", id => createPeer(id, true));
  socket.on("signal", data => handleSignal(data));
  socket.on("peer-left", id => {
    if (peers[id]) peers[id].close();
  });
}

function createPeer(id, initiator) {
  const pc = new RTCPeerConnection();

  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("signal", { to: id, signal: e.candidate });
    }
  };

  pc.ontrack = e => {
    const audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  if (initiator) {
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      socket.emit("signal", { to: id, signal: offer });
    });
  }

  peers[id] = pc;
}

function handleSignal({ from, signal }) {
  const pc = peers[from] || createPeer(from, false);

  if (signal.type === "offer") {
    pc.setRemoteDescription(signal);
    pc.createAnswer().then(answer => {
      pc.setLocalDescription(answer);
      socket.emit("signal", { to: from, signal: answer });
    });
  } else if (signal.type === "answer") {
    pc.setRemoteDescription(signal);
  } else {
    pc.addIceCandidate(signal);
  }
}
