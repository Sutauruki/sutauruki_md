import express from "express";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { startSock, botEvents, isConnected } from "./whatsapp.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 5000;

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USERMAIL,
    pass: process.env.USERPASS, // Assuming USERPASS is in env for app password
  },
});

let currentQR: string | null = null;

// Listen to bot events
botEvents.on("qr", async (qr: string) => {
  currentQR = qr;
  console.log("New QR Code generated");

  if (process.env.USERMAIL) {
    try {
      const qrImageBuffer = await QRCode.toBuffer(qr);
      await transporter.sendMail({
        from: process.env.USERMAIL,
        to: process.env.USERMAIL,
        subject: "WhatsApp Bot QR Code",
        html: "<p>Here is your new QR code to login:</p><img src='cid:qrcode'/>",
        attachments: [
          {
            filename: "qrcode.png",
            content: qrImageBuffer,
            cid: "qrcode",
          },
        ],
      });
      console.log("QR Code sent to email");
    } catch (error) {
      console.error("Failed to send QR email:", error);
    }
  }
});

botEvents.on("connection", (status: boolean) => {
  if (status) {
    currentQR = null;
  }
});

// Serve static files from the "public" directory
app.use(express.static("public"));

// API Endpoint for connection status
app.get("/api/status", (req, res) => {
  if (isConnected) {
    res.json({ isConnected: true });
  } else {
    res.json({ isConnected: false, qr: currentQR });
  }
});

// Fallback route (optional, or just rely on static index.html)
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  startSock();
}); 