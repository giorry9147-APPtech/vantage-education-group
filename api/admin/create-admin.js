const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminCreatorEmailsRaw =
  process.env.ADMIN_CREATOR_EMAILS || process.env.ADMIN_CREATOR_EMAIL || "";
const adminCreatorEmails = adminCreatorEmailsRaw
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function json(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, {
      error: "Server is not configured. Missing Supabase environment variables."
    });
  }

  if (adminCreatorEmails.length === 0) {
    return json(res, 500, {
      error: "Server is not configured. Missing ADMIN_CREATOR_EMAILS allowlist."
    });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return json(res, 401, { error: "Missing bearer token." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const { data: requesterData, error: requesterAuthError } = await supabase.auth.getUser(token);

  if (requesterAuthError || !requesterData?.user) {
    return json(res, 401, { error: "Invalid or expired session token." });
  }

  const requesterId = requesterData.user.id;

  const { data: requesterProfile, error: requesterProfileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", requesterId)
    .single();

  if (requesterProfileError || !requesterProfile || requesterProfile.role !== "admin") {
    return json(res, 403, { error: "Only admins can create admin accounts." });
  }

  const requesterEmail = String(requesterData.user.email || "").trim().toLowerCase();
  const isAllowedCreator = adminCreatorEmails.includes(requesterEmail);

  if (!isAllowedCreator) {
    return json(res, 403, {
      error: "You are not allowed to create admin accounts."
    });
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return json(res, 400, { error: "Invalid JSON request body." });
  }
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const temporaryPassword = String(body.temporaryPassword || "").trim();

  if (!fullName || !email || !temporaryPassword) {
    return json(res, 400, { error: "fullName, email and temporaryPassword are required." });
  }

  if (temporaryPassword.length < 8) {
    return json(res, 400, { error: "temporaryPassword must contain at least 8 characters." });
  }

  try {
    const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (createError || !createdData?.user?.id) {
      throw createError || new Error("Could not create auth user.");
    }

    const newUserId = createdData.user.id;

    const { error: profileUpsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          full_name: fullName,
          role: "admin",
          must_change_password: true
        },
        { onConflict: "id" }
      );

    if (profileUpsertError) {
      throw profileUpsertError;
    }

    return json(res, 200, {
      success: true,
      user: {
        id: newUserId,
        email
      },
      forcedPasswordChange: true
    });
  } catch (error) {
    return json(res, 400, { error: error.message || "Failed to create admin." });
  }
};
