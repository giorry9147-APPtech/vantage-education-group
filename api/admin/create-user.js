const { createClient } = require("@supabase/supabase-js");

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function unauthorized(res, message = "Niet geautoriseerd.") {
  return res.status(401).json({ error: message });
}

function forbidden(res, message = "Alleen admins hebben toegang.") {
  return res.status(403).json({ error: message });
}

function getRequestBaseUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";

  if (!host) return "";
  return `${proto}://${host}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appBaseUrl = process.env.APP_BASE_URL;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error: "Serverconfiguratie ontbreekt. Zet SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY."
    });
  }

  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) {
    return unauthorized(res, "Missing bearer token.");
  }

  let payload = {};

  if (typeof req.body === "string") {
    try {
      payload = JSON.parse(req.body || "{}");
    } catch {
      return badRequest(res, "Ongeldige JSON payload.");
    }
  } else {
    payload = req.body || {};
  }

  const email = String(payload.email || "").trim().toLowerCase();
  const fullName = String(payload.fullName || "").trim();
  const role = String(payload.role || "teacher").trim().toLowerCase();
  const sendResetEmail = payload.sendResetEmail !== false;

  if (!email) {
    return badRequest(res, "E-mailadres is verplicht.");
  }

  if (!["teacher", "admin"].includes(role)) {
    return badRequest(res, "Rol moet teacher of admin zijn.");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    const {
      data: { user: requester },
      error: requesterError
    } = await adminClient.auth.getUser(accessToken);

    if (requesterError || !requester) {
      return unauthorized(res, "Ongeldige sessie.");
    }

    const { data: requesterProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", requester.id)
      .single();

    if (profileError || !requesterProfile) {
      return unauthorized(res, "Profiel van aanvrager niet gevonden.");
    }

    if (requesterProfile.role !== "admin") {
      return forbidden(res);
    }

    const { data: createdData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email
      }
    });

    if (createError || !createdData?.user) {
      return res.status(400).json({
        error: createError?.message || "Kon gebruiker niet aanmaken."
      });
    }

    const newUser = createdData.user;

    const { error: upsertError } = await adminClient.from("profiles").upsert(
      {
        id: newUser.id,
        full_name: fullName || email,
        role,
        must_change_password: role === "admin"
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      return res.status(500).json({
        error: upsertError.message || "Kon profiel niet opslaan."
      });
    }

    if (sendResetEmail) {
      const requestBaseUrl = getRequestBaseUrl(req);
      const baseUrl = appBaseUrl || requestBaseUrl;
      const redirectTo = `${String(baseUrl).replace(/\/$/, "")}/reset-password.html`;

      if (!redirectTo.startsWith("http")) {
        return res.status(500).json({
          error: "APP_BASE_URL ontbreekt of is ongeldig voor resetmail links."
        });
      }

      const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (resetError) {
        return res.status(500).json({
          error: resetError.message || "Gebruiker gemaakt, maar resetmail versturen mislukte."
        });
      }
    }

    return res.status(200).json({
      ok: true,
      userId: newUser.id,
      role,
      resetEmailSent: sendResetEmail
    });
  } catch (error) {
    console.error("[api/admin/create-user] Unexpected error", error);
    return res.status(500).json({
      error: error?.message || "Onverwachte serverfout."
    });
  }
};
