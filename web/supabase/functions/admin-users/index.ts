// Admin user management — runs server-side with the service-role key.
// Only an active admin (verified from their JWT) can create accounts, reset
// passwords or remove users. The service-role key is NEVER sent to the browser.
import { createClient } from "jsr:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const ROLES = ["admin", "doctor", "nurse", "embryologist", "lab", "front_desk", "billing"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    // Identify the caller from their JWT
    const caller = createClient(URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await caller.auth.getUser();
    if (uErr || !user) return json(401, { error: "Not authenticated" });

    const admin = createClient(URL, SERVICE);
    const { data: prof } = await admin.from("profiles").select("role, active").eq("id", user.id).single();
    if (!prof?.active || prof.role !== "admin") return json(403, { error: "Administrators only" });

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const role = ROLES.includes(body.role) ? body.role : "front_desk";
      const full_name = String(body.full_name ?? "").trim() || email.split("@")[0];
      const location_id = body.location_id || null;
      if (!email || password.length < 8) return json(400, { error: "A valid email and an 8+ character password are required." });

      const { data: created, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name },
      });
      if (error) return json(400, { error: error.message });

      const { error: pErr } = await admin.from("profiles")
        .update({ full_name, role, active: true, location_id, email }).eq("id", created.user.id);
      if (pErr) return json(400, { error: pErr.message });
      return json(200, { ok: true, id: created.user.id });
    }

    if (action === "reset_password") {
      const user_id = String(body.user_id ?? "");
      const password = String(body.password ?? "");
      if (!user_id || password.length < 8) return json(400, { error: "An 8+ character password is required." });
      const { error } = await admin.auth.admin.updateUserById(user_id, { password });
      if (error) return json(400, { error: error.message });
      return json(200, { ok: true });
    }

    if (action === "delete") {
      const user_id = String(body.user_id ?? "");
      if (user_id === user.id) return json(400, { error: "You cannot remove your own account." });
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json(400, { error: error.message });
      return json(200, { ok: true });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? String(e) });
  }
});
