const { Resend } = require("resend");
const nodemailer = require("nodemailer");

// ---------------------------------------------------------------------------
// Email providers
//
// Gmail is preferred when EMAIL_USER and EMAIL_PASS are configured. This keeps
// OTP delivery working even when a Resend key is missing, expired, or invalid.
// Resend remains available as a fallback for deployments using a verified
// sending domain.
// ---------------------------------------------------------------------------
const hasGmail = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const hasResend = Boolean(process.env.RESEND_API_KEY);

const gmailTransporter = hasGmail
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

if (!hasGmail && !hasResend) {
  console.warn(
    "⚠️  No email provider configured — set EMAIL_USER/EMAIL_PASS or RESEND_API_KEY.",
  );
}

const resend = hasResend ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM =
  process.env.RESEND_FROM_EMAIL ||
  (process.env.EMAIL_USER
    ? `"Kifayat" <${process.env.EMAIL_USER}>`
    : `"Kifayat" <onboarding@resend.dev>`);

function normalizeBaseUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.origin;
  } catch {
    return "";
  }
}

function getConfirmationBaseUrl(requestBaseUrl) {
  // PUBLIC_APP_URL is the portable deployment setting. FRONTEND_URL remains
  // supported for existing installations.
  const configuredUrl = normalizeBaseUrl(
    process.env.PUBLIC_APP_URL ||
      process.env.SITE_URL ||
      process.env.FRONTEND_URL,
  );
  const requestUrl = normalizeBaseUrl(requestBaseUrl);

  // Never send a loopback URL to a remote customer when the request arrived
  // through a public frontend host.
  const configuredIsLoopback = configuredUrl
    ? /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(new URL(configuredUrl).hostname)
    : false;

  if (configuredUrl && !configuredIsLoopback) return configuredUrl;
  if (requestUrl) return requestUrl;
  return configuredUrl || "http://localhost:5000";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Rough HTML-to-text conversion — gives every email a plain-text alternative,
// which improves deliverability (spam filters penalise HTML-only mail).
function htmlToText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function sendMail({ from, to, subject, html, text }) {
  const toList = Array.isArray(to) ? to : [to];
  const errors = [];
  const headers = {
    "X-Mailer": "Kifayat",
    "X-Entity-Ref-ID": `${subject}-${Date.now()}`,
    "List-Unsubscribe": "<mailto:contact@kifayat.co?subject=unsubscribe>",
  };

  // Prefer Gmail because it is configured for this project and does not
  // require a Resend domain verification.
  if (gmailTransporter) {
    try {
      await gmailTransporter.sendMail({
        from: from || FROM,
        to: toList,
        subject,
        html,
        text: text || htmlToText(html),
        headers,
      });
      console.log(`[email] Sent via Gmail to ${toList.join(", ")}`);
      return;
    } catch (error) {
      errors.push(`Gmail: ${error.message}`);
      console.error("[email] Gmail delivery failed:", error.message);
    }
  }

  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: from || FROM,
        to: toList,
        subject,
        html,
        text: text || htmlToText(html),
      });
      if (!error) {
        console.log(`[email] Sent via Resend to ${toList.join(", ")}`);
        return;
      }
      errors.push(`Resend: ${error.message || JSON.stringify(error)}`);
    } catch (error) {
      errors.push(`Resend: ${error.message}`);
    }
  }

  throw new Error(errors.join(" | ") || "No email provider is configured.");
}

// ---------------------------------------------------------------------------
// OTP verification
// ---------------------------------------------------------------------------

const sendOTPEmail = async (to, name, otp) => {
  await sendMail({
    to,
    subject: "Your Kifayat Verification Code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#111827;margin-top:0;">Verify your Kifayat account</h2>
        <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;">Use the code below to complete your sign-up. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:28px;text-align:center;margin:24px 0;">
          <span style="font-size:42px;font-weight:bold;letter-spacing:14px;color:#111827;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

// ---------------------------------------------------------------------------
// Admin notification (generic)
// ---------------------------------------------------------------------------

const sendAdminNotification = async (subject, message) => {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    console.warn("No admin emails configured — skipping admin notification.");
    return;
  }
  await sendMail({
    from: `"Kifayat System" <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
    to: adminEmails,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#111827;margin-top:0;">${subject}</h2>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:16px 0;">
          <p style="color:#374151;margin:0;line-height:1.6;">${message}</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">This is an automated notification from Kifayat.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

// ---------------------------------------------------------------------------
// Order confirmation
// ---------------------------------------------------------------------------

const sendOrderConfirmationEmail = async (to, name, order, shippingDetails) => {
  const orderItemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:12px 0;font-size:14px;color:#111827;">${item.name} x ${item.quantity}</td>
      <td style="padding:12px 0;font-size:14px;color:#111827;text-align:right;">PKR ${Number(item.price * item.quantity).toLocaleString("en-PK")}</td>
    </tr>
  `
    )
    .join("");

  await sendMail({
    to,
    subject: `Order Confirmation #${order._id.toString().slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#111827;margin-top:0;">Order Placed Successfully</h2>
        <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;">Thank you for your order! Your order details are below:</p>
        
        <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString("en-PK")}</p>
          <p style="margin:0;font-size:14px;color:#374151;"><strong>Total Amount:</strong> <span style="font-weight:bold;color:#111827;">PKR ${Number(order.totalAmount).toLocaleString("en-PK")}</span></p>
        </div>
        
        <h3 style="color:#111827;margin:0 0 12px;">Order Items</h3>
        <table style="width:100%;margin-bottom:24px;">
          <tbody>
            ${orderItemsHtml}
          </tbody>
        </table>
        
        <h3 style="color:#111827;margin:0 0 12px;">Shipping Details</h3>
        <div style="background:#f9fafb;border-radius:8px;padding:20px;">
          <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Name:</strong> ${shippingDetails.name}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Phone:</strong> ${shippingDetails.phoneNumber}${shippingDetails.phoneNumber2 ? ` / ${shippingDetails.phoneNumber2}` : ""}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Address:</strong> ${shippingDetails.address}, ${shippingDetails.courierCity}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Ship Type:</strong> ${shippingDetails.shpType} — ${shippingDetails.courierCompany}</p>
          <p style="margin:0;font-size:14px;color:#374151;"><strong>Payment:</strong> ${shippingDetails.shipping === "cod" ? "Cash on Delivery" : "Advance Payment"}</p>
        </div>
        
        <p style="color:#6b7280;font-size:14px;">We'll process your order shortly and keep you updated!</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

// ---------------------------------------------------------------------------
// Order confirmation link (10-minute window)
// ---------------------------------------------------------------------------

const sendOrderConfirmationLinkEmail = async (
  to,
  name,
  order,
  confirmationToken,
  requestBaseUrl,
) => {
  const frontendUrl = getConfirmationBaseUrl(requestBaseUrl);
  const confirmLink = `${frontendUrl}/confirm-order?token=${confirmationToken}`;
  const orderIdDisplay = `#${order._id.toString().slice(-8).toUpperCase()}`;

  const orderItemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:12px 0;font-size:14px;color:#111827;">${item.name} x ${item.quantity}</td>
      <td style="padding:12px 0;font-size:14px;color:#111827;text-align:right;">PKR ${Number(item.price * item.quantity).toLocaleString("en-PK")}</td>
    </tr>
  `
    )
    .join("");

  await sendMail({
    to,
    subject: `Please Confirm Your Order ${orderIdDisplay}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#111827;margin-top:0;">Confirm Your Order</h2>
        <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;">Your order has been received. Please confirm it within <strong>24 hours</strong> by clicking the button below. If you do not confirm, the order will be automatically cancelled.</p>

        <div style="text-align:center;margin:28px 0;">
          <a href="${confirmLink}"
             style="display:inline-block;background:#16a34a;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
            Confirm Order
          </a>
        </div>

        <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Order ID:</strong> ${orderIdDisplay}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString("en-PK")}</p>
          <p style="margin:0;font-size:14px;color:#374151;"><strong>Total Amount:</strong> <span style="font-weight:bold;color:#111827;">PKR ${Number(order.totalAmount).toLocaleString("en-PK")}</span></p>
        </div>

        <h3 style="color:#111827;margin:0 0 12px;">Order Items</h3>
        <table style="width:100%;margin-bottom:24px;">
          <tbody>${orderItemsHtml}</tbody>
        </table>

        <p style="color:#6b7280;font-size:13px;">If you didn't place this order, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

// ---------------------------------------------------------------------------
// Late confirmation — stock unavailable
// ---------------------------------------------------------------------------

const sendLateConfirmationEmail = async (to, name, order) => {
  const orderIdDisplay = `#${(order._id || order).toString().slice(-8).toUpperCase()}`;

  await sendMail({
    to,
    subject: `Order ${orderIdDisplay} — Confirmation Failed`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#dc2626;margin-top:0;">Stock Unavailable</h2>
        <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;">You confirmed your order <strong>${orderIdDisplay}</strong>, but unfortunately the stock is no longer available. This can happen when items sell out between the time you placed your order and when you confirmed it.</p>
        <div style="background:#fef2f2;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #fecaca;">
          <p style="margin:0;font-size:14px;color:#991b1b;"><strong>What now?</strong></p>
          <p style="margin:8px 0 0;font-size:14px;color:#991b1b;">Please try placing your order again later. We restock items regularly. If you have questions, reach out to our support team.</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">We apologise for the inconvenience.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

// ---------------------------------------------------------------------------
// Order cancelled due to stock exhaustion (after main order entry, before HSC)
// ---------------------------------------------------------------------------

const sendStockExhaustionEmail = async (to, name, order) => {
  const orderIdDisplay = `#${(order._id || order).toString().slice(-8).toUpperCase()}`;

  await sendMail({
    to,
    subject: `Order ${orderIdDisplay} — Cancelled Due to Stock Issue`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#dc2626;margin-top:0;">Order Cancelled</h2>
        <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;">We regret to inform you that your order <strong>${orderIdDisplay}</strong> has been cancelled due to warehouse or revenue-related issues.</p>
        <div style="background:#fef2f2;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #fecaca;">
          <p style="margin:0;font-size:14px;color:#991b1b;"><strong>What happens next?</strong></p>
          <p style="margin:8px 0 0;font-size:14px;color:#991b1b;">We will notify you as soon as the stock is available again. You will not be charged for this order.</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">We apologise for the inconvenience and appreciate your patience.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

// ---------------------------------------------------------------------------
// Order cancellation (user-initiated)
// ---------------------------------------------------------------------------

const sendOrderCancelledByUserEmail = async (to, name, order) => {
  const orderIdDisplay = `#${(order._id || order).toString().slice(-8).toUpperCase()}`;

  await sendMail({
    to,
    subject: `Order ${orderIdDisplay} — Cancelled as Requested`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#111827;margin-top:0;">Order Cancelled</h2>
        <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;">Your order <strong>${orderIdDisplay}</strong> has been cancelled as requested.</p>
        <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0;font-size:14px;color:#374151;">If you did not request this cancellation, please contact our support team immediately.</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">We hope to see you again soon!</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

// ---------------------------------------------------------------------------
// Insufficient stock cancellation (system-initiated)
// ---------------------------------------------------------------------------

const sendInsufficientStockEmail = async (to, name, order) => {
  const orderIdDisplay = `#${(order._id || order).toString().slice(-8).toUpperCase()}`;

  await sendMail({
    to,
    subject: `Order ${orderIdDisplay} — Cancelled Due to Insufficient Stock`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#dc2626;margin-top:0;">Insufficient Stock</h2>
        <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;">We regret to inform you that your order <strong>${orderIdDisplay}</strong> has been cancelled due to insufficient stock.</p>
        <div style="background:#fef2f2;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #fecaca;">
          <p style="margin:0;font-size:14px;color:#991b1b;"><strong>What happens next?</strong></p>
          <p style="margin:8px 0 0;font-size:14px;color:#991b1b;">We will notify you as soon as the items are back in stock. You will not be charged for this order.</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">We apologise for the inconvenience and appreciate your patience.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

// ---------------------------------------------------------------------------
// Warehouse/Revenue cancellation with compensation vouchers
// ---------------------------------------------------------------------------

const sendCompensationEmail = async (to, name, order, vouchers) => {
  const orderIdDisplay = `#${(order._id || order).toString().slice(-8).toUpperCase()}`;

  let voucherRows = vouchers.map((v, i) => {
    if (v.voucher_type === "discount_all") {
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${v.discount_percent}% OFF</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">All products</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">${new Date(v.expires_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
      </tr>`;
    } else if (v.voucher_type === "discount_specific") {
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${v.discount_percent}% OFF</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">Specific products</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">${new Date(v.expires_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
      </tr>`;
    } else {
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">Free Product</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">${v.products?.length ? v.products.map(p => p.name || "Selected product").join(", ") : "Selected product"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">${new Date(v.expires_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
      </tr>`;
    }
  }).join("");

  await sendMail({
    to,
    subject: `Order ${orderIdDisplay} — Cancelled — Compensation Vouchers Inside`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
        <h2 style="color:#111827;margin-top:0;">We Apologise</h2>
        <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;">We regret to inform you that your order <strong>${orderIdDisplay}</strong> has been cancelled due to a warehouse or revenue-related issue.</p>
        <div style="background:#fef2f2;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #fecaca;">
          <p style="margin:0;font-size:14px;color:#991b1b;">As a token of apology, we have added compensation vouchers to your account. Use them on your next order!</p>
        </div>
        <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #e5e7eb;">
          <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">Your Compensation Vouchers</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#e5e7eb;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#374151;text-transform:uppercase;">#</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#374151;text-transform:uppercase;">Discount</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#374151;text-transform:uppercase;">Applies To</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#374151;text-transform:uppercase;">Expires</th>
              </tr>
            </thead>
            <tbody>
              ${voucherRows}
            </tbody>
          </table>
        </div>
        <p style="color:#6b7280;font-size:14px;">Log in to your account to view and apply your vouchers.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">Kifayat &mdash; Your financial companion</p>
      </div>
    `,
  });
};

module.exports = {
  sendMail,
  sendOTPEmail,
  sendOrderConfirmationEmail,
  sendAdminNotification,
  sendOrderConfirmationLinkEmail,
  sendLateConfirmationEmail,
  sendStockExhaustionEmail,
  sendOrderCancelledByUserEmail,
  sendInsufficientStockEmail,
  sendCompensationEmail,
};
