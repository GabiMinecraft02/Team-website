import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { checkIP, checkPassword } from "./auth.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

/* ===== AUTH ===== */
app.post("/login", async (req, res) => {
  if (!checkIP(req)) {
    return res.status(403).json({ error: "IP non autorisée" });
  }

  const { password } = req.body;
  const ok = await checkPassword(password);

  if (!ok) {
    return res.status(401).json({ error: "Mot de passe invalide" });
  }

  res.json({ success: true });
});

/* ===== WEBRTC SIGNALING ===== */
io.on("connection", socket => {
  socket.on("join", room => {
    socket.join(room);
    socket.to(room).emit("new-peer", socket.id);
  });

  socket.on("signal", data => {
    socket.to(data.to).emit("signal", {
      from: socket.id,
      signal: data.signal
    });
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("peer-left", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Backend lancé sur :3000");
});
