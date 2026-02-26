// 🔧 CONFIG — CHANGE THESE
const SUPABASE_URL = "https://chnjmdbmvjbnxxtllqwc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmptZGJtdmpibnh4dGxscXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODM2MTMsImV4cCI6MjA4NzY1OTYxM30.BYGzxR2q3sQGqPJnLLXv0z81JzSm6Ge0GgU-VYVQcRE";
const ADMIN_EMAIL = "arduinodebugstick@outlook.com";

// 🔌 INIT
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// 🔐 AUTH
async function login() {
  const email = email.value;
  const password = password.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
}

async function signup() {
  const email = email.value;
  const password = password.value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  else alert("Check email to confirm signup.");
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

// 📤 SUBMIT WORK
async function submitWork() {
  const user = (await supabase.auth.getUser()).data.user;

  const { error } = await supabase.from("submissions").insert({
    date: date.value,
    notebook: notebook.value,
    title: title.value,
    content: content.value,
    submitted_by: user.id
  });

  if (error) alert(error.message);
  else alert("Submitted for review.");
}

// 📚 LOAD APPROVED ENTRIES
async function loadEntries() {
  const { data } = await supabase
    .from("entries")
    .select("*")
    .order("created_at", { ascending: false });

  const container = document.getElementById("entries");
  container.innerHTML = "";

  data.forEach(e => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${e.title}</strong><br/>
      <em>${e.notebook} — ${e.date}</em>
      <pre>${e.content}</pre>
    `;
    container.appendChild(div);
  });
}

// 🛡️ ADMIN PANEL
async function loadAdminPanel(user) {
  if (user.email !== ADMIN_EMAIL) return;

  document.getElementById("adminPanel").style.display = "block";

  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const container = document.getElementById("pendingSubmissions");
  container.innerHTML = "";

  data.forEach(sub => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${sub.title}</strong><br/>
      <em>${sub.notebook} — ${sub.date}</em>
      <pre>${sub.content}</pre>
      <button onclick="approve('${sub.id}')">Approve</button>
      <button onclick="reject('${sub.id}')">Reject</button>
    `;
    container.appendChild(div);
  });
}

async function approve(id) {
  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  await supabase.from("entries").insert({
    date: sub.date,
    notebook: sub.notebook,
    title: sub.title,
    content: sub.content
  });

  await supabase.from("submissions").delete().eq("id", id);
  location.reload();
}

async function reject(id) {
  await supabase.from("submissions").delete().eq("id", id);
  location.reload();
}

// 🔁 SESSION HANDLING
supabase.auth.onAuthStateChange((_, session) => {
  if (session) {
    auth.style.display = "none";
    app.style.display = "block";
    loadEntries();
    loadAdminPanel(session.user);
  }
});
