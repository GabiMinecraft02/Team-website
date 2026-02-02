let localStream;
let peers = {};
let isMuted = false;
let pushToTalk = false;

export async function initAudio() {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    }
  });

  // mute par défaut si push-to-talk
  localStream.getAudioTracks()[0].enabled = !pushToTalk;
}

export function toggleMute() {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  return isMuted;
}

export function enablePushToTalk(enabled) {
  pushToTalk = enabled;
  localStream.getAudioTracks()[0].enabled = !enabled;
}

export function startTalking() {
  if (pushToTalk) localStream.getAudioTracks()[0].enabled = true;
}

export function stopTalking() {
  if (pushToTalk) localStream.getAudioTracks()[0].enabled = false;
}

export function createPeer(id, socket, initiator) {
  const pc = new RTCPeerConnection();

  localStream.getTracks().forEach(track =>
    pc.addTrack(track, localStream)
  );

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("signal", { to: id, signal: e.candidate });
    }
  };

  pc.ontrack = e => {
    const audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    audio.id = `audio-${id}`;
    document.body.appendChild(audio);

    detectSpeaker(audio, id);
  };

  if (initiator) {
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      socket.emit("signal", { to: id, signal: offer });
    });
  }

  peers[id] = pc;
}

export function handleSignal({ from, signal }, socket) {
  let pc = peers[from];

  if (!pc) createPeer(from, socket, false);

  pc = peers[from];

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

/* 🎤 Détection qui parle */
function detectSpeaker(audio, id) {
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  const source = ctx.createMediaStreamSource(audio.srcObject);

  source.connect(analyser);
  analyser.fftSize = 256;

  const data = new Uint8Array(analyser.frequencyBinCount);

  setInterval(() => {
    analyser.getByteFrequencyData(data);
    const volume = data.reduce((a, b) => a + b) / data.length;

    document
      .getElementById(`user-${id}`)
      ?.classList.toggle("talking", volume > 25);
  }, 200);
}
