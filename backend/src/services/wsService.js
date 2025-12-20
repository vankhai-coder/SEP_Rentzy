import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";

const connections = new Map();

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });
  console.log("WebSocket server initialized on /ws path : ");

  wss.on("connection", (ws, req) => {
    console.log("Client connected to WebSocket");
    let userId = null;

    try {
      const cookies = String(req.headers.cookie || "");
      const match = cookies
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("token="));
      const token = match ? decodeURIComponent(match.split("=")[1]) : null;

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        userId = decoded.userId;
      }
    } catch (err) {
      console.error("JWT verification failed:", err);
      ws.close(1008, "Invalid token"); // close with policy violation
      return;
    }

    if (!userId) {
      console.log("WebSocket connection rejected: No valid userId");
      ws.close(1008, "No valid userId");
      return;
    }

    const list = connections.get(userId) || new Set();
    list.add(ws);
    console.log("list websocket", list.size);
    connections.set(userId, list);

    // --- Heartbeat setup ---
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("close", (code, reason) => {
      console.log(`WebSocket disconnected: code=${code}, reason=${reason}`);
      const set = connections.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) connections.delete(userId);
      }
    });
  });

  // Heartbeat interval: ping all clients every 30s
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log("Terminating dead connection");
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });
};

const sendToUser = (userId, payload) => {
  const set = connections.get(userId);
  if (!set) {
    console.log("No active WS connections for userId:", userId);
    return;
  }
  const msg = JSON.stringify(payload);
  for (const ws of set) {
    try {
      ws.send(msg);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }
};

export { setupWebSocket, sendToUser };
