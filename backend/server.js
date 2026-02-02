import express from "express";
import http from "http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

const ROOM_PASSWORD_HASH = process.env.ROOM_PASSWORD_HASH;
const ALLOWED_IPS = process.env.ALLOWED_IPS.split(",");

function checkIP(req) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  return ALLOWED_IPS.some(allowed => ip.includes(allowed));
}

app.post("/login", async (req, res) => {
  if (!checkIP(req)) return res.status(403).json({ error: "IP refusée" });

  const { password } = req.body;
  const ok = await bcrypt.compare(password, ROOM_PASSWORD_HASH);

  if (!ok) return res.status(401).json({ error: "Mot de passe invalide" });

  res.json({ success: true });
});

/* ===== WebRTC signaling ===== */
io.on("connection", socket => {
  socket.on("join", room => {
    socket.join(room);
    socket.to(room).emit("new-peer", socket.id);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("peer-left", socket.id);
  });
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

server.listen(3000, () =>
  console.log("Backend sur :3000")
);

