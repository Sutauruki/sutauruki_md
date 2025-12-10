import express from "express";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { 
  createSession, 
  deleteSession, 
  restoreSessions, 
  sessions, 
  botEvents 
} from "./whatsapp.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 5000;

app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USERMAIL,
    pass: process.env.USERPASS,
  },
});

// Store QRs in memory
const qrCodes = new Map<string, string>();

// Listen to bot events
botEvents.on("qr", async ({ sessionId, qr }: { sessionId: string, qr: string }) => {
  qrCodes.set(sessionId, qr);
  console.log(`New QR Code generated for ${sessionId}`);
});

botEvents.on("connection", ({ sessionId, status }: { sessionId: string, status: boolean }) => {
  if (status) {
    qrCodes.delete(sessionId);
    console.log(`Session ${sessionId} connected`);
  } else {
    console.log(`Session ${sessionId} disconnected`);
  }
});

// Serve static files from the "public" directory
app.use(express.static("public"));

// --- API Endpoints ---

// Create a new session
app.post("/sessions", async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  if (sessions.has(sessionId)) {
    return res.status(409).json({ error: "Session already exists" });
  }

  try {
    await createSession(sessionId);
    res.status(201).json({ message: "Session created", sessionId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// List all sessions
app.get("/sessions", (req, res) => {
  const activeSessions = Array.from(sessions.keys());
  res.json({ sessions: activeSessions });
});

// Get QR for a session
app.get("/sessions/:id/qr", async (req, res) => {
  const { id } = req.params;
  const qr = qrCodes.get(id);

  if (!qr) {
    if (sessions.has(id)) {
        return res.status(404).json({ error: "Session is connected or no QR available yet" });
    }
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({ qr });
});

// Delete a session
app.delete("/sessions/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    await deleteSession(id);
    qrCodes.delete(id);
    res.json({ message: "Session deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// API Endpoint for connection status
app.get("/api/status", (req, res) => {
    const status = Array.from(sessions.keys()).map(id => ({
        sessionId: id,
        isConnected: !qrCodes.has(id),
    }));
    res.json({ sessions: status });
});

// Fallback route
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  await restoreSessions();
});