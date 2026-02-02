import bcrypt from "bcrypt";

const ALLOWED_IPS = process.env.ALLOWED_IPS
  ? process.env.ALLOWED_IPS.split(",")
  : [];

const PASSWORD_HASH = process.env.ROOM_PASSWORD_HASH;

/* Vérification IP */
export function checkIP(req) {
  const rawIp =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  return ALLOWED_IPS.length === 0 ||
    ALLOWED_IPS.some(ip => rawIp.includes(ip));
}

/* Vérification mot de passe */
export async function checkPassword(password) {
  if (!PASSWORD_HASH) return false;
  return bcrypt.compare(password, PASSWORD_HASH);
}
