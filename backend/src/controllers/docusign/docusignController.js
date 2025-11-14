import express from "express";
import axios from "axios";
import db from "../../models/index.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const { BookingContract, Booking, Vehicle, User } = db;

const DOCUSIGN_CLIENT_ID = process.env.DOCUSIGN_CLIENT_ID;
const DOCUSIGN_CLIENT_SECRET = process.env.DOCUSIGN_CLIENT_SECRET;
const DOCUSIGN_REDIRECT_URI = process.env.DOCUSIGN_REDIRECT_URI;
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID || "a16fee36-3a27-4ac3-9bef-21dbd4027c5c";
let DOCUSIGN_BASE_PATH = process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi";
const DOCUSIGN_AUTH_BASE = process.env.DOCUSIGN_AUTH_BASE || "https://account-d.docusign.com";
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID || ""; // for JWT if needed

// Normalize base path to include /restapi
if (!DOCUSIGN_BASE_PATH.endsWith("/restapi")) {
  DOCUSIGN_BASE_PATH = DOCUSIGN_BASE_PATH.replace(/\/$/, "") + "/restapi";
}

// In-memory token store for demo purposes
let docusignAccessToken = null;
let tokenExpiresAt = 0;

// Fallback: allow using pre-provisioned access token from env for server-side automation
if (!docusignAccessToken && process.env.DOCUSIGN_ACCESS_TOKEN) {
  docusignAccessToken = process.env.DOCUSIGN_ACCESS_TOKEN;
  // Assume 1 hour validity if not specified
  tokenExpiresAt = Date.now() + 3600 * 1000;
}

// Router
const router = express.Router();

// OAuth: redirect user to DocuSign consent/login
router.get("/oauth/login", (req, res) => {
  const authUrl = new URL(`${DOCUSIGN_AUTH_BASE}/oauth/auth`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "signature");
  authUrl.searchParams.set("client_id", DOCUSIGN_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", DOCUSIGN_REDIRECT_URI);
  res.redirect(authUrl.toString());
});

// OAuth: callback to exchange code for access token
router.get("/oauth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    const form = new URLSearchParams();
    form.set("grant_type", "authorization_code");
    form.set("code", code);
    form.set("client_id", DOCUSIGN_CLIENT_ID);
    form.set("client_secret", DOCUSIGN_CLIENT_SECRET);
    form.set("redirect_uri", DOCUSIGN_REDIRECT_URI);

    const tokenRes = await axios.post(`${DOCUSIGN_AUTH_BASE}/oauth/token`, form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    docusignAccessToken = tokenRes.data.access_token;
    tokenExpiresAt = Date.now() + tokenRes.data.expires_in * 1000;
    res.json({ success: true, access_token: docusignAccessToken, expires_in: tokenRes.data.expires_in });
  } catch (err) {
    console.error("DocuSign OAuth error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to exchange token", details: err.response?.data || err.message });
  }
});

function requireToken(req, res, next) {
  const now = Date.now();
  if (!docusignAccessToken || now >= tokenExpiresAt) {
    // Try reading fresh token from env without restart
    const envToken = process.env.DOCUSIGN_ACCESS_TOKEN;
    if (envToken) {
      docusignAccessToken = envToken;
      const ttlMs = parseInt(process.env.DOCUSIGN_TOKEN_TTL_MS || "3600000", 10);
      tokenExpiresAt = now + ttlMs;
    }
  }
  if (!docusignAccessToken || now >= tokenExpiresAt) {
    return res.status(401).json({ error: "Access token missing/expired. Please authenticate via /api/docusign/oauth/login" });
  }
  next();
}

// Send Envelope with single PDF and single signer
// Body: { signerEmail, signerName, clientUserId, pdfBase64, subject, bookingId }
router.post("/send-contract", verifyJWTToken, requireToken, async (req, res) => {
  const { bookingId, subject = "Contract", pdfBase64, htmlBase64, signers } = req.body;
  if (!bookingId || (!pdfBase64 && !htmlBase64)) {
    return res.status(400).json({ error: "Missing bookingId and document base64 (pdfBase64 or htmlBase64)" });
  }

  try {
    // Build signers: use provided or derive from booking
    let signerList = [];
    if (Array.isArray(signers) && signers.length > 0) {
      signerList = signers.map((s, idx) => ({
        email: s.email,
        name: s.name,
        recipientId: String(idx + 1),
        routingOrder: String(s.routingOrder || idx + 1),
        clientUserId: String(s.clientUserId),
        tabs: {
          signHereTabs: [
            {
              anchorString: "Ký và ghi rõ họ tên",
              anchorUnits: "pixels",
              anchorXOffset: "0",
              anchorYOffset: "0",
              documentId: "1",
              pageNumber: "1",
            },
          ],
        },
      }));
    } else {
      // Derive from booking: renter first, owner second (sequential signing)
      const booking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: Vehicle,
            as: "vehicle",
            attributes: ["model", "license_plate", "price_per_day"],
            include: [
              { model: User, as: "owner", attributes: ["full_name", "phone_number", "email"] },
            ],
          },
          { model: User, as: "renter", attributes: ["full_name", "phone_number", "email"] },
        ],
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking không tồn tại" });
      }
      if (booking.status !== "deposit_paid") {
        return res.status(400).json({ error: "Chỉ khởi tạo hợp đồng khi đã thanh toán cọc" });
      }

      signerList = [
        {
          email: booking.renter?.email,
          name: booking.renter?.full_name || "Renter",
          recipientId: "1",
          routingOrder: "1",
          clientUserId: `renter_${bookingId}`,
          tabs: { signHereTabs: [{ anchorString: "Ký và ghi rõ họ tên", anchorUnits: "pixels", anchorXOffset: "0", anchorYOffset: "0", documentId: "1", pageNumber: "1" }] },
        },
        {
          email: booking.vehicle?.owner?.email,
          name: booking.vehicle?.owner?.full_name || "Owner",
          recipientId: "2",
          routingOrder: "2",
          clientUserId: `owner_${bookingId}`,
          tabs: { signHereTabs: [{ anchorString: "Ký và ghi rõ họ tên", anchorUnits: "pixels", anchorXOffset: "0", anchorYOffset: "0", documentId: "1", pageNumber: "1" }] },
        },
      ];
    }

    const eventNotification = {
      url: process.env.DOCUSIGN_WEBHOOK_URL || "https://yourapp.com/api/docusign/webhook",
      loggingEnabled: true,
      requireAcknowledgment: true,
      useSoapInterface: false,
      includeDocuments: false,
      envelopeEvents: [
        { envelopeEventStatusCode: "sent" },
        { envelopeEventStatusCode: "completed" },
        { envelopeEventStatusCode: "voided" },
      ],
      recipientEvents: [{ recipientEventStatusCode: "Completed" }],
    };

    const documents = [
      htmlBase64
        ? { documentBase64: htmlBase64, name: "Contract.html", fileExtension: "html", documentId: "1" }
        : { documentBase64: pdfBase64, name: "Contract.pdf", fileExtension: "pdf", documentId: "1" },
    ];

    const envelopeDefinition = {
      emailSubject: subject,
      documents,
      recipients: { signers: signerList },
      status: "sent",
      eventNotification,
    };

    const createEnvelopeUrl = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`;
    const resp = await axios.post(createEnvelopeUrl, envelopeDefinition, { headers: { Authorization: `Bearer ${docusignAccessToken}` } });

    const envelopeId = resp.data?.envelopeId;
    const status = resp.data?.status || "sent";

    const now = new Date();
    const existing = await BookingContract.findOne({ where: { booking_id: bookingId } });
    const mappedStatus = status === "sent" ? "pending_signatures" : status === "completed" ? "completed" : status === "voided" ? "terminated" : "draft";

    if (existing) {
      await existing.update({ contract_number: envelopeId, contract_status: mappedStatus, updated_at: now });
    } else {
      await BookingContract.create({ booking_id: bookingId, contract_number: envelopeId, contract_status: mappedStatus, created_at: now, updated_at: now });
    }

    res.json({ success: true, envelopeId, status });
  } catch (err) {
    console.error("Create envelope error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create envelope", details: err.response?.data || err.message });
  }
});

// Create Embedded Signing URL
// GET /sign/:envelopeId?name=...&email=...&clientUserId=...&role=owner|renter&returnUrl=
router.get("/sign/:envelopeId", verifyJWTToken, requireToken, async (req, res) => {
  const { envelopeId } = req.params;
  const { role, name, email, clientUserId, returnUrl = process.env.DOCUSIGN_RETURN_URL || "https://yourapp.com/sign-callback" } = req.query;

  try {
    let signerName = name;
    let signerEmail = email;
    let signerClientUserId = clientUserId;

    if ((!signerName || !signerEmail) && role) {
      // lookup booking via envelopeId
      const contract = await BookingContract.findOne({ where: { contract_number: envelopeId } });
      const booking = await Booking.findByPk(contract.booking_id, {
        include: [
          {
            model: Vehicle,
            as: "vehicle",
            attributes: ["model", "license_plate", "price_per_day"],
            include: [{ model: User, as: "owner", attributes: ["full_name", "phone_number", "email"] }],
          },
          { model: User, as: "renter", attributes: ["full_name", "phone_number", "email"] },
        ],
      });

      if (role === "renter") {
        signerName = booking.renter?.full_name || "Renter";
        signerEmail = booking.renter?.email;
        signerClientUserId = `renter_${booking.booking_id}`;
      } else {
        signerName = booking.vehicle?.owner?.full_name || "Owner";
        signerEmail = booking.vehicle?.owner?.email;
        signerClientUserId = `owner_${booking.booking_id}`;
      }
    }

    const recipientViewRequest = {
      authenticationMethod: "none",
      clientUserId: String(signerClientUserId || "123"),
      userName: signerName,
      email: signerEmail,
      returnUrl,
    };

    const viewUrl = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`;
    const resp = await axios.post(viewUrl, recipientViewRequest, {
      headers: { Authorization: `Bearer ${docusignAccessToken}` },
    });
    res.json({ success: true, url: resp.data.url });
  } catch (err) {
    console.error("Recipient view error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create recipient view", details: err.response?.data || err.message });
  }
});

// Get Envelope Status
router.get("/status/:id", verifyJWTToken, requireToken, async (req, res) => {
  const { id } = req.params;
  try {
    const url = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${id}`;
    const resp = await axios.get(url, { headers: { Authorization: `Bearer ${docusignAccessToken}` } });

    const envelopeId = resp.data?.envelopeId || id;
    const status = resp.data?.status;
    const mappedStatus = status === "sent" ? "pending_signatures" : status === "completed" ? "completed" : status === "voided" ? "terminated" : undefined;

    if (mappedStatus) {
      await BookingContract.update(
        { contract_status: mappedStatus, updated_at: new Date() },
        { where: { contract_number: envelopeId } }
      );
    }

    res.json({ success: true, status, envelope: resp.data });
  } catch (err) {
    console.error("Get status error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to get status", details: err.response?.data || err.message });
  }
});

// Download combined signed PDF
router.get("/documents/:id/combined", verifyJWTToken, requireToken, async (req, res) => {
  const { id } = req.params;
  try {
    const url = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${id}/documents/combined`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${docusignAccessToken}`, Accept: "application/pdf" },
      responseType: "arraybuffer",
    });
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(resp.data));
  } catch (err) {
    console.error("Download combined PDF error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to download combined PDF", details: err.response?.data || err.message });
  }
});

// Generate contract HTML template from booking
router.get("/contract-template/:bookingId", verifyJWTToken, async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["model", "license_plate", "price_per_day"],
          include: [{ model: User, as: "owner", attributes: ["full_name", "phone_number", "email"] }],
        },
        { model: User, as: "renter", attributes: ["full_name", "phone_number", "email"] },
      ],
    });

    if (!booking) return res.status(404).json({ error: "Booking không tồn tại" });

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Hợp đồng thuê xe</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.5; color: #222; }
    h1 { text-align: center; }
    .section { margin: 16px 0; }
    .box { border: 1px solid #ccc; padding: 12px; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px; vertical-align: top; }
    .muted { color: #666; }
  </style>
</head>
<body>
  <h1>HỢP ĐỒNG THUÊ XE</h1>
  <div class="section box">
    <strong>Bên Cho Thuê (Chủ xe)</strong>
    <div>Họ tên: ${booking.vehicle?.owner?.full_name || ""}</div>
    <div>Điện thoại: ${booking.vehicle?.owner?.phone_number || ""}</div>
    <div>Email: ${booking.vehicle?.owner?.email || ""}</div>
  </div>
  <div class="section box">
    <strong>Bên Thuê (Người thuê)</strong>
    <div>Họ tên: ${booking.renter?.full_name || ""}</div>
    <div>Điện thoại: ${booking.renter?.phone_number || ""}</div>
    <div>Email: ${booking.renter?.email || ""}</div>
  </div>
  <div class="section box">
    <strong>Thông tin xe</strong>
    <div>Model: ${booking.vehicle?.model || ""}</div>
    <div>Biển số: ${booking.vehicle?.license_plate || ""}</div>
    <div>Giá/ngày: ${booking.vehicle?.price_per_day || ""} VND</div>
  </div>
  <div class="section box">
    <strong>Thông tin hợp đồng</strong>
    <table>
      <tr><td>Booking ID:</td><td>${booking.booking_id}</td></tr>
      <tr><td>Ngày bắt đầu:</td><td>${booking.start_date || ""}</td></tr>
      <tr><td>Ngày kết thúc:</td><td>${booking.end_date || ""}</td></tr>
      <tr><td>Tổng tiền:</td><td>${booking.total_amount || ""} VND</td></tr>
    </table>
    <p class="muted">Hai bên cam kết thực hiện đúng các điều khoản của hợp đồng thuê xe theo quy định hiện hành.</p>
  </div>
  <div class="section box">
    <strong>Chữ ký</strong>
    <table>
      <tr>
        <td>
          <div>Đại diện Bên Cho Thuê</div>
          <div class="muted">(Ký và ghi rõ họ tên)</div>
        </td>
        <td>
          <div>Đại diện Bên Thuê</div>
          <div class="muted">(Ký và ghi rõ họ tên)</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

    const base64 = Buffer.from(html, "utf-8").toString("base64");
    res.json({ success: true, html, htmlBase64: base64 });
  } catch (err) {
    console.error("Generate contract template error:", err.message);
    res.status(500).json({ error: "Lỗi tạo giao diện hợp đồng", details: err.message });
  }
});

// New: Initialize envelope from booking server-side (HTML template)
router.post("/booking/:bookingId/send", verifyJWTToken, requireToken, async (req, res) => {
  const { bookingId } = req.params;
  try {
    const { envelopeId, status } = await prepareAndSendEnvelopeServerSide(bookingId);
    res.json({ success: true, envelopeId, status });
  } catch (err) {
    console.error("Prepare/send envelope error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create envelope", details: err.response?.data || err.message });
  }
});

// Webhook (Connect Service)
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;
    const { envelopeId, status } = event || {};

    // 1) Cập nhật trạng thái hợp đồng từ sự kiện webhook
    if (envelopeId && status) {
      const mappedStatus =
        status === "sent"
          ? "pending_signatures"
          : status === "completed"
          ? "completed"
          : status === "voided"
          ? "terminated"
          : undefined;

      if (mappedStatus) {
        await BookingContract.update(
          { contract_status: mappedStatus, updated_at: new Date() },
          { where: { contract_number: envelopeId } }
        );
      }
    }

    // 2) Cố gắng truy vấn danh sách người ký để cập nhật thời điểm ký của từng bên
    try {
      if (envelopeId && docusignAccessToken && Date.now() < tokenExpiresAt) {
        const recipientsUrl = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/recipients`;
        const recResp = await axios.get(recipientsUrl, {
          headers: { Authorization: `Bearer ${docusignAccessToken}` },
        });
        const signers = recResp.data?.signers || [];
        const now = new Date();
        const updates = {};

        for (const s of signers) {
          const clientId = String(s.clientUserId || "");
          if (s.status === "completed") {
            if (clientId.startsWith("renter_")) {
              updates.renter_signed_at = updates.renter_signed_at || now;
            }
            if (clientId.startsWith("owner_")) {
              updates.owner_signed_at = updates.owner_signed_at || now;
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          updates.updated_at = now;
          await BookingContract.update(updates, {
            where: { contract_number: envelopeId },
          });
        }
      }
    } catch (innerErr) {
      // Không chặn webhook nếu không thể truy vấn người ký; chỉ log để theo dõi
      console.error("DocuSign recipients query error:", innerErr.message || innerErr);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).send("ERROR");
  }
});

export default router;
export async function sendContractForBookingServerSide(bookingId) {
  if (!bookingId) throw new Error("Missing bookingId");
  if (!docusignAccessToken || Date.now() >= tokenExpiresAt) {
    throw new Error("DocuSign access token missing/expired. Authenticate or set DOCUSIGN_ACCESS_TOKEN env.");
  }

  // Load booking with owner and renter info
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        attributes: ["model", "license_plate", "price_per_day"],
        include: [{ model: User, as: "owner", attributes: ["full_name", "phone_number", "email"] }],
      },
      { model: User, as: "renter", attributes: ["full_name", "phone_number", "email"] },
    ],
  });
  if (!booking) throw new Error("Booking không tồn tại");

  // Build HTML contract (same as /contract-template)
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Hợp đồng thuê xe</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.5; color: #222; }
    h1 { text-align: center; }
    .section { margin: 16px 0; }
    .box { border: 1px solid #ccc; padding: 12px; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px; vertical-align: top; }
    .muted { color: #666; }
  </style>
</head>
<body>
  <h1>HỢP ĐỒNG THUÊ XE</h1>
  <div class="section box">
    <strong>Bên Cho Thuê (Chủ xe)</strong>
    <div>Họ tên: ${booking.vehicle?.owner?.full_name || ""}</div>
    <div>Điện thoại: ${booking.vehicle?.owner?.phone_number || ""}</div>
    <div>Email: ${booking.vehicle?.owner?.email || ""}</div>
  </div>
  <div class="section box">
    <strong>Bên Thuê (Người thuê)</strong>
    <div>Họ tên: ${booking.renter?.full_name || ""}</div>
    <div>Điện thoại: ${booking.renter?.phone_number || ""}</div>
    <div>Email: ${booking.renter?.email || ""}</div>
  </div>
  <div class="section box">
    <strong>Thông tin xe</strong>
    <div>Model: ${booking.vehicle?.model || ""}</div>
    <div>Biển số: ${booking.vehicle?.license_plate || ""}</div>
    <div>Giá/ngày: ${booking.vehicle?.price_per_day || ""} VND</div>
  </div>
  <div class="section box">
    <strong>Thông tin hợp đồng</strong>
    <table>
      <tr><td>Booking ID:</td><td>${booking.booking_id}</td></tr>
      <tr><td>Ngày bắt đầu:</td><td>${booking.start_date || ""}</td></tr>
      <tr><td>Ngày kết thúc:</td><td>${booking.end_date || ""}</td></tr>
      <tr><td>Tổng tiền:</td><td>${booking.total_amount || ""} VND</td></tr>
    </table>
    <p class="muted">Hai bên cam kết thực hiện đúng các điều khoản của hợp đồng thuê xe theo quy định hiện hành.</p>
  </div>
  <div class="section box">
    <strong>Chữ ký</strong>
    <table>
      <tr>
        <td>
          <div>Đại diện Bên Cho Thuê</div>
          <div class="muted">(Ký và ghi rõ họ tên)</div>
        </td>
        <td>
          <div>Đại diện Bên Thuê</div>
          <div class="muted">(Ký và ghi rõ họ tên)</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  const htmlBase64 = Buffer.from(html, "utf-8").toString("base64");

  // Build signer list: renter first then owner
  const signerList = [
    {
      email: booking.renter?.email,
      name: booking.renter?.full_name || "Renter",
      recipientId: "1",
      routingOrder: "1",
      clientUserId: `renter_${bookingId}`,
      tabs: {
        signHereTabs: [
          {
            anchorString: "Ký và ghi rõ họ tên",
            anchorUnits: "pixels",
            anchorXOffset: "0",
            anchorYOffset: "0",
            documentId: "1",
            pageNumber: "1",
          },
        ],
      },
    },
    {
      email: booking.vehicle?.owner?.email,
      name: booking.vehicle?.owner?.full_name || "Owner",
      recipientId: "2",
      routingOrder: "2",
      clientUserId: `owner_${bookingId}`,
      tabs: {
        signHereTabs: [
          {
            anchorString: "Ký và ghi rõ họ tên",
            anchorUnits: "pixels",
            anchorXOffset: "0",
            anchorYOffset: "0",
            documentId: "1",
            pageNumber: "1",
          },
        ],
      },
    },
  ];

  const eventNotification = {
    url: process.env.DOCUSIGN_WEBHOOK_URL || "https://yourapp.com/api/docusign/webhook",
    loggingEnabled: true,
    requireAcknowledgment: true,
    useSoapInterface: false,
    includeDocuments: false,
    envelopeEvents: [
      { envelopeEventStatusCode: "sent" },
      { envelopeEventStatusCode: "completed" },
      { envelopeEventStatusCode: "voided" },
    ],
    recipientEvents: [{ recipientEventStatusCode: "Completed" }],
  };

  const documents = [
    {
      documentBase64: htmlBase64,
      name: "Contract.html",
      fileExtension: "html",
      documentId: "1",
    },
  ];

  const envelopeDefinition = {
    emailSubject: "Contract",
    documents,
    recipients: { signers: signerList },
    status: "sent",
    eventNotification,
  };

  const createEnvelopeUrl = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`;
  const resp = await axios.post(createEnvelopeUrl, envelopeDefinition, {
    headers: { Authorization: `Bearer ${docusignAccessToken}` },
  });

  const envelopeId = resp.data?.envelopeId;
  const status = resp.data?.status || "sent";
  const now = new Date();
  const existing = await BookingContract.findOne({ where: { booking_id: bookingId } });
  const mappedStatus = status === "sent" ? "pending_signatures" : status === "completed" ? "completed" : status === "voided" ? "terminated" : "draft";

  if (existing) {
    await existing.update({ contract_number: envelopeId, contract_status: mappedStatus, updated_at: now });
  } else {
    await BookingContract.create({ booking_id: bookingId, contract_number: envelopeId, contract_status: mappedStatus, created_at: now, updated_at: now });
  }

  return { envelopeId, status };
}

export async function getRecipientViewUrlServerSide(envelopeId, role, returnUrl) {
  if (!docusignAccessToken || Date.now() >= tokenExpiresAt) {
    throw new Error("DocuSign access token missing/expired. Authenticate or set DOCUSIGN_ACCESS_TOKEN env.");
  }
  const contract = await BookingContract.findOne({ where: { contract_number: envelopeId } });
  if (!contract) throw new Error("Không tìm thấy hợp đồng cho envelopeId");
  const booking = await Booking.findByPk(contract.booking_id, {
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        attributes: ["model", "license_plate", "price_per_day"],
        include: [{ model: User, as: "owner", attributes: ["full_name", "phone_number", "email"] }],
      },
      { model: User, as: "renter", attributes: ["full_name", "phone_number", "email"] },
    ],
  });
  if (!booking) throw new Error("Booking không tồn tại");

  let signerName, signerEmail, signerClientUserId;
  if (role === "renter") {
    signerName = booking.renter?.full_name || "Renter";
    signerEmail = booking.renter?.email;
    signerClientUserId = `renter_${booking.booking_id}`;
  } else if (role === "owner") {
    signerName = booking.vehicle?.owner?.full_name || "Owner";
    signerEmail = booking.vehicle?.owner?.email;
    signerClientUserId = `owner_${booking.booking_id}`;
  } else {
    throw new Error("role phải là 'renter' hoặc 'owner'");
  }

  const recipientViewRequest = {
    authenticationMethod: "none",
    clientUserId: String(signerClientUserId),
    userName: signerName,
    email: signerEmail,
    returnUrl: returnUrl || process.env.DOCUSIGN_RETURN_URL || "https://yourapp.com/sign-callback",
  };

  const viewUrl = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`;
  const resp = await axios.post(viewUrl, recipientViewRequest, {
    headers: { Authorization: `Bearer ${docusignAccessToken}` },
  });
  return { url: resp.data.url };
}