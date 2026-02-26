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
  const emailValue = document.getElementById("email").value;
  const passwordValue = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email: emailValue,
    password: passwordValue
  });

  if (error) alert(error.message);
}

async function signup() {
  const emailValue = document.getElementById("email").value;
  const passwordValue = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({
    email: emailValue,
    password: passwordValue
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Signup successful. Check your email if confirmation is enabled.");
  }
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

// 📤 SUBMIT WORK
async function submitWork() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    alert("Not logged in");
    return;
  }

  const { error } = await supabase.from("submissions").insert({
    date: document.getElementById("date").value,
    notebook: document.getElementById("notebook").value,
    title: document.getElementById("title").value,
    content: document.getElementById("content").value,
    submitted_by: user.id
  });

  if (error) alert(error.message);
  else alert("Submitted for review.");
}

// 📚 LOAD APPROVED ENTRIES
async function loadEntries() {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return;

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

// 🔁 SESSION HANDLING (FIXED)
supabase.auth.onAuthStateChange((_, session) => {
  const authSection = document.getElementById("auth");
  const appSection = document.getElementById("app");

  if (session) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    loadEntries();
    loadAdminPanel(session.user);
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
});
