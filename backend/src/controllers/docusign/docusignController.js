import express from "express";
import axios from "axios";
import db from "../../models/index.js";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { decryptWithSecret } from "../../utils/cryptoUtil.js";

const { BookingContract, Booking, Vehicle, User } = db;

const DOCUSIGN_CLIENT_ID = process.env.DOCUSIGN_CLIENT_ID;
const DOCUSIGN_CLIENT_SECRET = process.env.DOCUSIGN_CLIENT_SECRET;
const DOCUSIGN_REDIRECT_URI = process.env.DOCUSIGN_REDIRECT_URI;
const DOCUSIGN_ACCOUNT_ID =
  process.env.DOCUSIGN_ACCOUNT_ID || "a16fee36-3a27-4ac3-9bef-21dbd4027c5c";
let DOCUSIGN_BASE_PATH =
  process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi";
const DOCUSIGN_AUTH_BASE =
  process.env.DOCUSIGN_AUTH_BASE || "https://account-d.docusign.com";
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID || ""; // JWT user GUID
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY || ""; // Integration Key (client_id)
const OAUTH_CLIENT_ID =
  process.env.DOCUSIGN_CLIENT_ID || DOCUSIGN_INTEGRATION_KEY;
const DS_PRIVATE_KEY_PATH =
  process.env.DS_PRIVATE_KEY_PATH ||
  process.env.DOCUSIGN_PRIVATE_KEY_PATH ||
  "";

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
  const ttlMs = parseInt(process.env.DOCUSIGN_TOKEN_TTL_MS || "3600000", 10);
  tokenExpiresAt = Date.now() + ttlMs;
}

// Helper: Ensure we have a valid access token via JWT Grant
async function ensureAccessTokenJWT() {
  const now = Date.now();
  if (docusignAccessToken && now < tokenExpiresAt) {
    return true;
  }
  // Try env token first
  const envToken = process.env.DOCUSIGN_ACCESS_TOKEN;
  if (envToken) {
    docusignAccessToken = envToken;
    const ttlMs = parseInt(process.env.DOCUSIGN_TOKEN_TTL_MS || "3600000", 10);
    tokenExpiresAt = now + ttlMs;
    return true;
  }
  // Require JWT config
  if (!DOCUSIGN_INTEGRATION_KEY || !DOCUSIGN_USER_ID || !DS_PRIVATE_KEY_PATH) {
    return false;
  }
  try {
    const candidates = [
      DS_PRIVATE_KEY_PATH,
      "./src/config/private.key",
      "./config/private.key",
    ];
    let privateKeyPath = null;
    for (const p of candidates) {
      if (!p) continue;
      const full = path.resolve(process.cwd(), p);
      if (fs.existsSync(full)) {
        privateKeyPath = full;
        break;
      }
    }
    if (!privateKeyPath) {
      throw new Error(
        `DocuSign private key not found. Checked: ${candidates
          .map((p) => p && path.resolve(process.cwd(), p))
          .filter(Boolean)
          .join(", ")}`
      );
    }
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    // DocuSign JWT assertion
    const audHost = new URL(DOCUSIGN_AUTH_BASE).hostname; // e.g., account-d.docusign.com
    const jwtPayload = {
      iss: DOCUSIGN_INTEGRATION_KEY,
      sub: DOCUSIGN_USER_ID,
      aud: audHost,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 3600,
      scope: "signature impersonation",
    };

    const assertion = jwt.sign(jwtPayload, privateKey, { algorithm: "RS256" });

    const form = new URLSearchParams();
    form.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    form.set("assertion", assertion);

    const tokenRes = await axios.post(
      `${DOCUSIGN_AUTH_BASE}/oauth/token`,
      form.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const accessToken = tokenRes.data?.access_token;
    const expiresIn = tokenRes.data?.expires_in || 3600;
    if (accessToken) {
      docusignAccessToken = accessToken;
      tokenExpiresAt = now + expiresIn * 1000;
      return true;
    }
    return false;
  } catch (err) {
    console.error("JWT Grant token error:", err.response?.data || err.message);
    throw err;
  }
}

// Router
const router = express.Router();

// OAuth: redirect user to DocuSign consent/login
/**
 * GET /api/docusign/oauth/login
 * Chuyển hướng người dùng tới trang đăng nhập/consent của DocuSign.
 * Sử dụng Authorization Code để lấy access_token phía server qua oauthCallback.
 */
export const oauthLogin = (req, res) => {
  const authUrl = new URL(`${DOCUSIGN_AUTH_BASE}/oauth/auth`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "signature");
  authUrl.searchParams.set("client_id", OAUTH_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", DOCUSIGN_REDIRECT_URI);
  res.redirect(authUrl.toString());
};

// OAuth: callback to exchange code for access token
/**
 * GET /api/docusign/oauth/callback?code=...
 * Trao đổi authorization code lấy access_token, lưu vào bộ nhớ tạm để dùng cho các API khác.
 */
export const oauthCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });
  try {
    const form = new URLSearchParams();
    form.set("grant_type", "authorization_code");
    form.set("code", code);
    form.set("client_id", OAUTH_CLIENT_ID);
    form.set("client_secret", DOCUSIGN_CLIENT_SECRET);
    form.set("redirect_uri", DOCUSIGN_REDIRECT_URI);
    const tokenRes = await axios.post(
      `${DOCUSIGN_AUTH_BASE}/oauth/token`,
      form.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    docusignAccessToken = tokenRes.data.access_token;
    tokenExpiresAt = Date.now() + tokenRes.data.expires_in * 1000;
    res.json({
      success: true,
      access_token: docusignAccessToken,
      expires_in: tokenRes.data.expires_in,
    });
  } catch (err) {
    console.error("DocuSign OAuth error:", err.response?.data || err.message);
    res
      .status(500)
      .json({
        error: "Failed to exchange token",
        details: err.response?.data || err.message,
      });
  }
};

/**
 * Middleware yêu cầu đã có access_token DocuSign trong memory.
 * Gọi sau khi người dùng hoàn tất đăng nhập DocuSign.
 */
export const requireToken = (req, res, next) => {
  const now = Date.now();
  if (!docusignAccessToken || now >= tokenExpiresAt) {
    const envToken = process.env.DOCUSIGN_ACCESS_TOKEN;
    if (envToken) {
      docusignAccessToken = envToken;
      const ttlMs = parseInt(
        process.env.DOCUSIGN_TOKEN_TTL_MS || "3600000",
        10
      );
      tokenExpiresAt = now + ttlMs;
    }
  }
  if (!docusignAccessToken || now >= tokenExpiresAt) {
    ensureAccessTokenJWT()
      .then((ok) => {
        if (ok) return next();
        return res.status(401).json({
          error: "DocuSign access token missing/expired",
          message:
            "Provide DOCUSIGN_ACCESS_TOKEN or configure JWT (INTEGRATION_KEY, USER_ID, DS_PRIVATE_KEY_PATH) and grant consent.",
        });
      })
      .catch((err) => {
        const isConsentRequired =
          err?.response?.data?.error === "consent_required";
        if (isConsentRequired) {
          const consentUrl = new URL(`${DOCUSIGN_AUTH_BASE}/oauth/auth`);
          consentUrl.searchParams.set("response_type", "code");
          consentUrl.searchParams.set("scope", "signature impersonation");
          consentUrl.searchParams.set("client_id", DOCUSIGN_INTEGRATION_KEY);
          const fallbackRedirect =
            "http://localhost:3000/api/docusign/oauth/callback";
          consentUrl.searchParams.set(
            "redirect_uri",
            DOCUSIGN_REDIRECT_URI || fallbackRedirect
          );
          return res.status(403).json({
            error: "consent_required",
            message:
              "Cần cấp quyền cho Integration Key để dùng JWT. Mở consent_url và xác nhận.",
            consent_url: consentUrl.toString(),
          });
        }
        return res.status(401).json({
          error: "DocuSign access token missing/expired",
          message: "JWT Grant failed. Check private key and consent.",
          details: err?.response?.data || err?.message,
        });
      });
    return;
  }
  next();
};

// Send Envelope with single PDF and single signer
// Body: { signerEmail, signerName, clientUserId, pdfBase64, subject, bookingId }
/**
 * POST /api/docusign/booking/:bookingId/send
 * Tạo envelope từ hợp đồng HTML và gửi tới renter & owner để ký.
 * Body có thể nhận `purpose`, `payment_method` để hiển thị trong template.
 */
export const sendContract = async (req, res) => {
  const {
    bookingId,
    subject = "Contract",
    pdfBase64,
    htmlBase64,
    signers,
  } = req.body;
  if (!bookingId || (!pdfBase64 && !htmlBase64)) {
    return res
      .status(400)
      .json({
        error:
          "Missing bookingId and document base64 (pdfBase64 or htmlBase64)",
      });
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
              anchorString: "SIGN_RENTER",
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
              {
                model: User,
                as: "owner",
                attributes: ["full_name", "phone_number", "email"],
              },
            ],
          },
          {
            model: User,
            as: "renter",
            attributes: ["full_name", "phone_number", "email"],
          },
        ],
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking không tồn tại" });
      }
      if (booking.status !== "deposit_paid") {
        return res
          .status(400)
          .json({ error: "Chỉ khởi tạo hợp đồng khi đã thanh toán cọc" });
      }

      signerList = [
        {
          email: booking.renter?.email,
          name: booking.renter?.full_name || "Renter",
          recipientId: "1",
          routingOrder: "1",
          clientUserId: "renter",
          tabs: {
            signHereTabs: [
              {
                anchorString: "SIGN_RENTER",
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
          clientUserId: "owner",
          tabs: {
            signHereTabs: [
              {
                anchorString: "SIGN_OWNER",
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
    }

    const webhookUrl =
      process.env.DOCUSIGN_WEBHOOK_URL ||
      (process.env.APP_BASE_URL
        ? `${process.env.APP_BASE_URL}/api/docusign/webhook`
        : "");
    if (!/^https:\/\//.test(webhookUrl)) {
      return res
        .status(400)
        .json({
          errorCode: "HTTPS_REQUIRED_FOR_CONNECT_LISTENER",
          message:
            "HTTPS required for Connect listener communication. Set DOCUSIGN_WEBHOOK_URL to an https URL (e.g., https://<your-ngrok>.ngrok-free.dev/api/docusign/webhook).",
        });
    }

    const eventNotification = {
      url: webhookUrl,
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
        ? {
            documentBase64: htmlBase64,
            name: "Contract.html",
            fileExtension: "html",
            documentId: "1",
          }
        : {
            documentBase64: pdfBase64,
            name: "Contract.pdf",
            fileExtension: "pdf",
            documentId: "1",
          },
    ];

    const envelopeDefinition = {
      emailSubject: subject,
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
    const existing = await BookingContract.findOne({
      where: { booking_id: bookingId },
    });
    const mappedStatus =
      status === "sent"
        ? "pending_signatures"
        : status === "completed"
        ? "completed"
        : status === "voided"
        ? "terminated"
        : "draft";

    if (existing) {
      await existing.update({
        contract_number: envelopeId,
        contract_status: mappedStatus,
        updated_at: now,
      });
    } else {
      await BookingContract.create({
        booking_id: bookingId,
        contract_number: envelopeId,
        contract_status: mappedStatus,
        created_at: now,
        updated_at: now,
      });
    }

    res.json({ success: true, envelopeId, status });
  } catch (err) {
    console.error("Create envelope error:", err.response?.data || err.message);
    res
      .status(500)
      .json({
        error: "Failed to create envelope",
        details: err.response?.data || err.message,
      });
  }
};

// Create Embedded Signing URL
// GET /sign/:envelopeId?name=...&email=...&clientUserId=...&role=owner|renter&returnUrl=
/**
 * GET /api/docusign/sign-recipient-view/:id
 * Lấy URL DocuSign Recipient View để renter ký trực tiếp trong trình duyệt.
 */
export const signRecipientView = async (req, res) => {
  const { envelopeId } = req.params;
  const { role, name, email, clientUserId, returnUrl } = req.query;

  try {
    let signerName = name;
    let signerEmail = email;
    let signerClientUserId = clientUserId;
    let booking; // ensure booking is available for redirect URL computation

    if ((!signerName || !signerEmail) && role) {
      // lookup booking via envelopeId
      const contract = await BookingContract.findOne({
        where: { contract_number: envelopeId },
      });
      booking = await Booking.findByPk(contract.booking_id, {
        include: [
          {
            model: Vehicle,
            as: "vehicle",
            attributes: ["brand_id", "vehicle_type", "model", "license_plate", "year", "price_per_day"],
            include: [
              {
                model: User,
                as: "owner",
                attributes: ["full_name", "phone_number", "email", "national_id_number"],
              },
            ],
          },
          {
            model: User,
            as: "renter",
            attributes: ["full_name", "phone_number", "email", "driver_license_number"],
          },
        ],
      });

      if (role === "renter") {
        signerName = booking.renter?.full_name || "Renter";
        signerEmail = booking.renter?.email;
        signerClientUserId = "renter"; // MUST match envelopeDefinition clientUserId
      } else {
        signerName = booking.vehicle?.owner?.full_name || "Owner";
        signerEmail = booking.vehicle?.owner?.email;
        signerClientUserId = "owner"; // MUST match envelopeDefinition clientUserId
      }
    }

    if (!signerEmail) {
      return res
        .status(400)
        .json({
          error: "Missing signer email",
          message: "Không tìm thấy email người ký phù hợp với role.",
        });
    }

    const rawOrigin = (
      process.env.FRONTEND_ORIGIN ||
      process.env.APP_BASE_URL ||
      ""
    ).trim();
    const originToUse = /^https:\/\//.test(rawOrigin) ? rawOrigin : null;
    const normalizedReturnUrl = (returnUrl || "").trim();
    const redirectUrlCandidate =
      normalizedReturnUrl && /^https:\/\//.test(normalizedReturnUrl)
        ? normalizedReturnUrl
        : booking && booking.booking_id && originToUse
        ? `${originToUse}/contract/${booking.booking_id}`
        : originToUse
        ? `${originToUse}/contract/return`
        : "";

    if (!/^https:\/\//.test(redirectUrlCandidate)) {
      return res.status(400).json({
        errorCode: "HTTPS_REQUIRED_FOR_RETURN_URL",
        message:
          "Recipient View returnUrl phải là HTTPS public. Hãy đặt CLIENT_ORIGIN/FRONTEND_ORIGIN/APP_BASE_URL = https://<your-ngrok>.ngrok-free.dev (không có khoảng trắng) hoặc truyền ?returnUrl=https://...",
      });
    }

    const recipientViewRequest = {
      authenticationMethod: "none",
      clientUserId: String(signerClientUserId || "123"),
      userName: signerName,
      email: signerEmail,
      returnUrl: redirectUrlCandidate,
    };

    console.log("Creating DocuSign recipient view:", {
      envelopeId,
      role,
      signerEmail,
      clientUserId: recipientViewRequest.clientUserId,
      returnUrl: recipientViewRequest.returnUrl,
    });

    const viewUrl = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`;
    const resp = await axios.post(viewUrl, recipientViewRequest, {
      headers: { Authorization: `Bearer ${docusignAccessToken}` },
    });
    res.json({ success: true, url: resp.data.url });
  } catch (err) {
    const docuErr = err.response?.data || {};
    console.error("Recipient view error:", docuErr || err.message);
    const code = docuErr.errorCode || docuErr.error || "UNKNOWN";
    const message = docuErr.message || err.message || "Unknown error";

    // Return more specific status for known DocuSign errors
    if (code === "RECIPIENT_NOT_IN_SEQUENCE") {
      return res.status(409).json({
        errorCode: code,
        message:
          "Người ký này chưa tới lượt theo thứ tự ký. Vui lòng để bên trước hoàn tất trước khi tiếp tục.",
        details: docuErr,
      });
    }

    // Default error response
    return res.status(500).json({
      error: "Failed to create recipient view",
      details: docuErr || err.message,
    });
  }
};

// Get Envelope Status
/**
 * GET /api/docusign/status/:id
 * Trả về trạng thái của envelope (e.g., sent, completed) để FE cập nhật UI.
 */
export const getStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const ok = await ensureAccessTokenJWT();
    if (!ok) {
      return res.status(500).json({ error: "DocuSign access token missing/expired." });
    }

    const envelopeUrl = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${id}`;
    const resp = await axios.get(envelopeUrl, {
      headers: { Authorization: `Bearer ${docusignAccessToken}` },
    });

    const envelopeId = resp.data?.envelopeId || id;
    const status = resp.data?.status;
    const now = new Date();

    const mapStatus = (s) =>
      s === "sent"
        ? "pending_signatures"
        : s === "completed"
        ? "completed"
        : s === "voided"
        ? "terminated"
        : undefined;

    const mappedStatus = mapStatus(status);

    if (mappedStatus) {
      await BookingContract.update(
        { contract_status: mappedStatus, updated_at: now },
        { where: { contract_number: envelopeId } }
      );
    }

    // Truy vấn recipients để cập nhật thời điểm ký và suy ra trạng thái
    let derivedStatus; // đảm bảo biến tồn tại ngoài khối try
    try {
      const recipientsUrl = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/recipients`;
      const recResp = await axios.get(recipientsUrl, {
        headers: { Authorization: `Bearer ${docusignAccessToken}` },
      });
      const signers = recResp.data?.signers || [];
      const updates = {};

      // Resolve renter/owner emails from booking to match signers when clientUserId is missing
      let renterEmail = null;
      let ownerEmail = null;
      try {
        const contractRecord = await BookingContract.findOne({
          where: { contract_number: envelopeId },
          attributes: ["booking_id"],
        });
        if (contractRecord) {
          const bookingRec = await Booking.findByPk(contractRecord.booking_id, {
            include: [
              { model: User, as: "renter", attributes: ["email"] },
              {
                model: Vehicle,
                as: "vehicle",
                attributes: [],
                include: [{ model: User, as: "owner", attributes: ["email"] }],
              },
            ],
          });
          renterEmail = bookingRec?.renter?.email?.toLowerCase() || null;
          ownerEmail = bookingRec?.vehicle?.owner?.email?.toLowerCase() || null;
        }
      } catch (resolveErr) {
        console.warn(
          "Resolve booking emails for status update failed:",
          resolveErr.message || resolveErr
        );
      }

      for (const s of signers) {
        const clientId = String(s.clientUserId || "").toLowerCase();
        const signerEmail = String(s.email || "").toLowerCase();
        const signerStatus = String(s.status || "").toLowerCase();
        if (signerStatus === "completed") {
          const isRenter =
            clientId === "renter" ||
            clientId.startsWith("renter_") ||
            (renterEmail && signerEmail === renterEmail);
          const isOwner =
            clientId === "owner" ||
            clientId.startsWith("owner_") ||
            (ownerEmail && signerEmail === ownerEmail);
          if (isRenter) {
            updates.renter_signed_at = updates.renter_signed_at || now;
          }
          if (isOwner) {
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

      const totalSigners = signers.length;
      const completedSigners = signers.filter((s) => s.status === "completed").length;
      if (status === "voided") {
        derivedStatus = "terminated";
      } else if (totalSigners > 0 && completedSigners === totalSigners) {
        derivedStatus = "completed";
      } else if (completedSigners > 0) {
        derivedStatus = "signed"; // đã có ít nhất một bên ký
      } else if (status === "sent") {
        derivedStatus = "pending_signatures";
      }

      if (derivedStatus) {
        await BookingContract.update(
          { contract_status: derivedStatus, updated_at: now },
          { where: { contract_number: envelopeId } }
        );
      }
    } catch (innerErr) {
      console.error(
        "Get status recipients query error:",
        innerErr.response?.data || innerErr.message || innerErr
      );
      // không chặn response nếu không thể cập nhật thời điểm ký bằng polling
    }

    const appStatus = derivedStatus || mappedStatus || "unknown";
    return res.json({ success: true, status, app_status: appStatus, envelope: resp.data });
  } catch (err) {
    console.error("Get status error", err.response?.data || err.message);
    return res
      .status(500)
      .json({ error: "Failed to get status", details: err.response?.data || err.message });
  }
};

// Download combined signed PDF
/**
 * GET /api/docusign/documents/:id/combined
 * Tải về Combined Document (PDF) cho toàn bộ envelope để lưu trữ/tải xuống.
 */
export const getCombinedDocuments = async (req, res) => {
  const { id } = req.params;
  try {
    const url = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${id}/documents/combined`;
    const resp = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${docusignAccessToken}`,
        Accept: "application/pdf",
      },
      responseType: "arraybuffer",
    });
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(resp.data));
  } catch (err) {
    console.error(
      "Download combined PDF error:",
      err.response?.data || err.message
    );
    res
      .status(500)
      .json({
        error: "Failed to download combined PDF",
        details: err.response?.data || err.message,
      });
  }
};

// Generate contract HTML template from booking
// Inline contract template helpers and remove service dependencies
function safe(val, fallback = "") {
  if (val === null || val === undefined) return fallback;
  return String(val);
}
function formatCurrency(vnd) {
  const n = Number(vnd || 0);
  return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}
function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.max(0, (e - s) / (1000 * 60 * 60 * 24));
  return Math.round(diff);
}
function htmlToBase64(html) {
  return Buffer.from(html, "utf8").toString("base64");
}
function render(template, data) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const k = String(key).trim();
    return safe(data[k], "");
  });
}
/**
 * Render contract.html với placeholder {{key}} từ dữ liệu Booking.
 * Placeholder chính: renter_*, owner_*, vehicle_*, days_count, start_date, end_date,
 * total_price, deposit_paid, booking_status, contract_number_display, generated_at.
 * Các trường không có dữ liệu (CMND/CCCD, nơi cấp...) sẽ render rỗng để người dùng bổ sung.
 */
async function buildContractHtmlByBookingId(bookingId) {
  const templatePath = path.resolve(
    process.cwd(),
    "src/templates/contract.html"
  );
  const template = fs.readFileSync(templatePath, "utf8");
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        attributes: ["brand_id", "vehicle_type", "model", "license_plate", "year", "price_per_day"],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["full_name", "phone_number", "email", "national_id_number"],
          },
        ],
      },
      {
        model: User,
        as: "renter",
        attributes: ["full_name", "phone_number", "email", "driver_license_number"],
      },
    ],
  });
  if (!booking) throw new Error("Booking không tồn tại");
  const contract = await BookingContract.findOne({
    where: { booking_id: bookingId },
  });
  const data = {
    contract_number_display: safe(contract?.contract_number, "(chưa cấp)"),
    renter_name: safe(booking.renter?.full_name, ""),
    renter_phone: safe(booking.renter?.phone_number, ""),
    renter_email: safe(booking.renter?.email, ""),
    renter_driver_license: booking.renter?.driver_license_number
      ? decryptWithSecret(booking.renter.driver_license_number, process.env.ENCRYPT_KEY)
      : "",
    owner_name: safe(booking.vehicle?.owner?.full_name, ""),
    owner_phone: safe(booking.vehicle?.owner?.phone_number, ""),
    owner_email: safe(booking.vehicle?.owner?.email, ""),
    owner_cccd: safe(booking.vehicle?.owner?.national_id_number, ""),
    vehicle_brand_id: safe(booking.vehicle?.brand_id, ""),
    vehicle_type: safe(booking.vehicle?.vehicle_type, ""),
    vehicle_model: safe(booking.vehicle?.model, ""),
    vehicle_year: safe(booking.vehicle?.year, ""),
    license_plate: safe(booking.vehicle?.license_plate, ""),
    price_per_day: formatCurrency(booking.vehicle?.price_per_day),
    days_count: String(daysBetween(booking.start_date, booking.end_date)),
    start_date: new Date(booking.start_date).toLocaleString("vi-VN"),
    end_date: new Date(booking.end_date).toLocaleString("vi-VN"),
    total_price: formatCurrency(booking.total_amount),
    deposit_paid: formatCurrency(
      booking.status === "deposit_paid"
        ? Number(booking.total_paid || 0)
        : Math.round(Number(booking.total_amount || 0) * 0.3)
    ),
    booking_status: safe(booking.status, ""),
    generated_at: new Date().toLocaleString("vi-VN"),
  };
  return render(template, data);
}
/**
 * GET /api/docusign/contract-template/:bookingId
 * Trả về HTML hợp đồng được render theo booking và dữ liệu kèm.
 */
export const contractTemplate = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const html = await buildContractHtmlByBookingId(bookingId);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("Generate contract template error:", err.message);
    res
      .status(500)
      .json({
        error: "Failed to generate contract template",
        details: err.message,
      });
  }
};

// New: Initialize envelope from booking server-side (HTML template)
/**
 * POST /api/docusign/booking/:bookingId/send
 * Tạo và gửi envelope cho booking cụ thể, thiết lập signer là renter/owner.
 */
export const bookingSend = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const { envelopeId, status } = await sendContractForBookingServerSide(
      bookingId
    );
    res.json({ success: true, envelopeId, status });
  } catch (err) {
    console.error(
      "Prepare/send envelope error:",
      err.response?.data || err.message
    );
    res
      .status(500)
      .json({
        error: "Failed to create envelope",
        details: err.response?.data || err.message,
      });
  }
};

// Webhook (Connect Service)
/**
 * POST /api/docusign/webhook
 * Webhook DocuSign ghi nhận sự kiện envelope/recipient để cập nhật trạng thái hợp đồng.
 */
export const webhook = async (req, res) => {
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
      const ok = await ensureAccessTokenJWT();
      if (envelopeId && ok) {
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
            if (clientId === "renter" || clientId.startsWith("renter_")) {
              updates.renter_signed_at = updates.renter_signed_at || now;
            }
            if (clientId === "owner" || clientId.startsWith("owner_")) {
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
      console.error(
        "DocuSign recipients query error:",
        innerErr.message || innerErr
      );
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).send("ERROR");
  }
};

export default router; // TODO: legacy router mounted; router file will call named handlers for new pattern.
export async function sendContractForBookingServerSide(bookingId) {
  if (!bookingId) throw new Error("Missing bookingId");
  const ok = await ensureAccessTokenJWT();
  if (!ok)
    throw new Error(
      "DocuSign access token missing/expired. Configure JWT or set DOCUSIGN_ACCESS_TOKEN env."
    );

  const html = await buildContractHtmlByBookingId(bookingId);
  const htmlBase64 = htmlToBase64(html);

  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        attributes: [
          "model",
          "license_plate",
          "price_per_day",
          "year",
          "transmission",
          "body_type",
          "seats",
          "fuel_type"
        ],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["full_name", "phone_number", "email", "national_id_number"],
          },
        ],
      },
      {
        model: User,
        as: "renter",
        attributes: ["full_name", "phone_number", "email", "driver_license_number"],
      },
    ],
  });
  if (!booking) throw new Error("Booking không tồn tại");

  const renterEmail = booking.renter?.email || "";
  const renterName = booking.renter?.full_name || "Người thuê";
  const ownerEmail = booking.vehicle?.owner?.email || "";
  const ownerName = booking.vehicle?.owner?.full_name || "Chủ xe";

  const webhookUrl =
    process.env.DOCUSIGN_WEBHOOK_URL ||
    (process.env.APP_BASE_URL
      ? `${process.env.APP_BASE_URL}/api/docusign/webhook`
      : "");
  if (!/^https:\/\//.test(webhookUrl)) {
    throw new Error(
      "HTTPS_REQUIRED_FOR_CONNECT_LISTENER: HTTPS required for Connect listener communication. Set DOCUSIGN_WEBHOOK_URL to an https URL (e.g., https://<your-ngrok>.ngrok-free.dev/api/docusign/webhook)."
    );
  }
  const envelopeDefinition = {
    emailSubject: `Hợp đồng thuê xe #${bookingId}`,
    documents: [
      {
        documentBase64: htmlBase64,
        name: "HopDongThueXe.html",
        fileExtension: "html",
        documentId: "1",
      },
    ],
    recipients: {
      signers: [
        {
          email: renterEmail,
          name: renterName,
          recipientId: "1",
          routingOrder: "1",
          roleName: "Renter",
          clientUserId: "renter",
          tabs: {
            signHereTabs: [
              {
                anchorString: "SIGN_RENTER",
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
          email: ownerEmail,
          name: ownerName,
          recipientId: "2",
          routingOrder: "2",
          roleName: "Owner",
          clientUserId: "owner",
          tabs: {
            signHereTabs: [
              {
                anchorString: "SIGN_OWNER",
                anchorUnits: "pixels",
                anchorXOffset: "0",
                anchorYOffset: "0",
                documentId: "1",
                pageNumber: "1",
              },
            ],
          },
        },
      ],
    },
    eventNotification: {
      url: webhookUrl,
      loggingEnabled: "true",
      requireAcknowledgment: "true",
      includeDocumentFields: "true",
      eventTypes: [
        { eventType: "envelope-sent" },
        { eventType: "envelope-completed", includeDocuments: "true" },
        { eventType: "envelope-voided" },
      ],
    },
    status: "sent",
  };

  const url = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`;
  const resp = await axios.post(url, envelopeDefinition, {
    headers: { Authorization: `Bearer ${docusignAccessToken}` },
  });
  const { envelopeId, status } = resp.data || {};

  const mappedStatus =
    status === "sent"
      ? "pending_signatures"
      : status === "completed"
      ? "completed"
      : status === "voided"
      ? "terminated"
      : "draft";
  let bc = await BookingContract.findOne({ where: { booking_id: bookingId } });
  const now = new Date();
  if (bc) {
    await bc.update({
      contract_number: envelopeId,
      contract_status: mappedStatus,
      updated_at: now,
    });
  } else {
    await BookingContract.create({
      booking_id: bookingId,
      contract_number: envelopeId,
      contract_status: mappedStatus,
      created_at: now,
      updated_at: now,
    });
  }

  return { envelopeId, status };
}

export async function getRecipientViewUrlServerSide(
  envelopeId,
  role,
  returnUrl
) {
  if (!envelopeId) throw new Error("Missing envelopeId");
  const ok = await ensureAccessTokenJWT();
  if (!ok) throw new Error("DocuSign access token missing/expired.");

  const bc = await BookingContract.findOne({
    where: { contract_number: envelopeId },
  });
  if (!bc) throw new Error("Không tìm thấy BookingContract từ envelopeId");
  const booking = await Booking.findByPk(bc.booking_id, {
    include: [
      {
        model: Vehicle,
        as: "vehicle",
        include: [{ model: User, as: "owner" }],
      },
      { model: User, as: "renter" },
    ],
  });
  if (!booking) throw new Error("Booking không tồn tại");

  const isOwner = String(role).toLowerCase() === "owner";
  const email = isOwner ? booking.vehicle?.owner?.email : booking.renter?.email;
  const name = isOwner
    ? booking.vehicle?.owner?.full_name
    : booking.renter?.full_name;
  const clientUserId = isOwner ? "owner" : "renter";

  const feOrigin =
    process.env.CLIENT_ORIGIN ||
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173";
  const redirectUrl = returnUrl || `${feOrigin}/contract/${booking.booking_id}`;

  const viewReq = {
    returnUrl: redirectUrl,
    authenticationMethod: "none",
    email,
    userName: name,
    clientUserId,
  };
  const url = `${DOCUSIGN_BASE_PATH}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`;
  const resp = await axios.post(url, viewReq, {
    headers: { Authorization: `Bearer ${docusignAccessToken}` },
  });
  return resp.data?.url;
}
