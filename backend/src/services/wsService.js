import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";

const connections = new Map();

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    let userId = null;
    try {
      const cookies = String(req.headers.cookie || "");
      const match = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith("token="));
      const token = match ? decodeURIComponent(match.split("=")[1]) : null;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        userId = decoded.userId;
      }
    } catch {}

    if (!userId) {
      ws.close();
      return;
    }

    const list = connections.get(userId) || new Set();
    list.add(ws);
    connections.set(userId, list);

    ws.on("close", () => {
      const set = connections.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) connections.delete(userId);
      }
    });
  });
};

const sendToUser = (userId, payload) => {
  const set = connections.get(userId);
  if (!set) return;
  const msg = JSON.stringify(payload);
  for (const ws of set) {
    try { ws.send(msg); } catch {}
  }
};

export { setupWebSocket, sendToUser };