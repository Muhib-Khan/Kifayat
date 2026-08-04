const Groq     = require("groq-sdk");
const Settings = require("../models/Settings");

const GROQ_TEST_MODEL = "llama-3.3-70b-versatile";

function maskKey(key) {
  if (!key) return null;
  return `${key.slice(0, 6)}${"•".repeat(Math.max(0, key.length - 10))}${key.slice(-4)}`;
}

async function pingGroq(apiKey) {
  const groq = new Groq({ apiKey });
  const rsp  = await groq.chat.completions.create({
    model:    GROQ_TEST_MODEL,
    messages: [{ role: "user", content: 'Reply with exactly one word: "OK"' }],
    max_tokens: 5, temperature: 0,
  });
  return (rsp.choices[0]?.message?.content || "").trim();
}

// ─── GET /api/admin/settings ─────────────────────────────────────────────────
const getAdminSettings = async (req, res) => {
  try {
    const s = await Settings.findOne({}).lean();
    const keys = (s?.groqApiKeys || []).map((k) => ({
      id:      k._id.toString(),
      label:   k.label,
      task:    k.task,
      preview: maskKey(k.key),
    }));

    // Legacy compat
    const legacyRaw = s?.groqApiKey || process.env.GROQ_API_KEY || "";
    const groqKey   = {
      configured: keys.length > 0 || !!legacyRaw,
      preview:    keys.length > 0 ? null : maskKey(legacyRaw),
    };

    res.json({ success: true, settings: { groqKeys: keys, groqKey } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/settings/groq-keys — add a new key ──────────────────────
const addGroqKey = async (req, res) => {
  try {
    const { key, label = "API Key", task = "default" } = req.body;
    if (!key || typeof key !== "string" || key.trim().length < 8)
      return res.status(400).json({ success: false, message: "Invalid API key." });

    await Settings.findOneAndUpdate(
      {},
      { $push: { groqApiKeys: { key: key.trim(), label: label.trim() || "API Key", task } } },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "Key added." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/admin/settings/groq-keys/:id — update label / task ─────────────
const updateGroqKeyById = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, task } = req.body;
    await Settings.findOneAndUpdate(
      { "groqApiKeys._id": id },
      {
        $set: {
          ...(label !== undefined && { "groqApiKeys.$.label": label }),
          ...(task  !== undefined && { "groqApiKeys.$.task":  task  }),
        },
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/admin/settings/groq-keys/:id ────────────────────────────────
const deleteGroqKeyById = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.findOneAndUpdate({}, { $pull: { groqApiKeys: { _id: id } } });
    res.json({ success: true, message: "Key removed." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/settings/groq-keys/:id/test ─────────────────────────────
const testGroqKeyById = async (req, res) => {
  try {
    const { id } = req.params;
    const s   = await Settings.findOne({}).lean();
    const entry = (s?.groqApiKeys || []).find((k) => k._id.toString() === id);
    if (!entry) return res.status(404).json({ success: false, message: "Key not found." });

    const reply = await pingGroq(entry.key);
    res.json({ success: true, message: `Connection OK — model replied: ${reply}` });
  } catch (err) {
    const msg = err?.error?.message || err?.message || "Connection failed.";
    res.status(400).json({ success: false, message: msg });
  }
};

// ─── Legacy endpoints (kept for backward-compat) ─────────────────────────────
const updateGroqKey = async (req, res) => {
  try {
    const { key } = req.body;
    if (!key || typeof key !== "string" || key.trim().length < 8)
      return res.status(400).json({ success: false, message: "Invalid API key." });
    await Settings.findOneAndUpdate({}, { $set: { groqApiKey: key.trim() } }, { upsert: true });
    res.json({ success: true, message: "Groq API key saved." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteGroqKey = async (req, res) => {
  try {
    await Settings.findOneAndUpdate({}, { $unset: { groqApiKey: "" } }, { upsert: true });
    res.json({ success: true, message: "Groq API key removed." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const testGroqKey = async (req, res) => {
  try {
    let apiKey = (req.body?.key || "").trim();
    if (!apiKey) {
      const s = await Settings.findOne({}).lean();
      const keys = s?.groqApiKeys || [];
      apiKey = keys.find((k) => k.task === "default")?.key
            || keys[0]?.key
            || s?.groqApiKey
            || process.env.GROQ_API_KEY
            || "";
    }
    if (!apiKey) return res.status(400).json({ success: false, message: "No Groq API key configured." });
    const reply = await pingGroq(apiKey);
    res.json({ success: true, message: `Connection successful — model replied: ${reply}` });
  } catch (err) {
    const msg = err?.error?.message || err?.message || "Connection failed.";
    res.status(400).json({ success: false, message: msg });
  }
};

module.exports = {
  getAdminSettings,
  addGroqKey,
  updateGroqKeyById,
  deleteGroqKeyById,
  testGroqKeyById,
  // legacy
  updateGroqKey,
  deleteGroqKey,
  testGroqKey,
};
