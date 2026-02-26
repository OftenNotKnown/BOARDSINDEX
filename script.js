// 🔑 SUPABASE CONFIG
const SUPABASE_URL = "https://chnjmdbmvjbnxxtllqwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmptZGJtdmpibnh4dGxscXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODM2MTMsImV4cCI6MjA4NzY1OTYxM30.BYGzxR2q3sQGqPJnLLXv0z81JzSm6Ge0GgU-VYVQcRE";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 👑 ADMIN EMAIL
const ADMIN_EMAIL = "arduinodebugstick@outlook.com"; // CHANGE THIS

// 🔐 AUTH
async function signup() {
  const email = email.value;
  const password = password.value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  else alert("Check your email to confirm.");
}

async function login() {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });

  if (error) alert(error.message);
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
  else {
    alert("Submitted for review");
    content.value = "";
  }
}

// 📚 LOAD APPROVED ENTRIES
async function loadEntries() {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) return;

  const container = document.getElementById("entries");
  container.innerHTML = "";

  data.forEach(e => {
    container.innerHTML += `
      <div>
        <strong>${e.title}</strong><br/>
        <em>${e.notebook} — ${e.date}</em>
        <pre>${e.content}</pre>
      </div>
      <hr/>
    `;
  });
}

// 🛡️ ADMIN PANEL
async function loadAdminPanel(user) {
  if (user.email !== ADMIN_EMAIL) return;

  document.getElementById("adminPanel").style.display = "block";

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("status", "pending");

  if (error) return alert(error.message);

  const container = document.getElementById("pendingSubmissions");
  container.innerHTML = "";

  data.forEach(s => {
    container.innerHTML += `
      <div>
        <strong>${s.title}</strong>
        <pre>${s.content}</pre>
        <button onclick="approveSubmission('${s.id}')">Approve</button>
        <button onclick="rejectSubmission('${s.id}')">Reject</button>
      </div>
      <hr/>
    `;
  });
}

async function approveSubmission(id) {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  await supabase.from("entries").insert({
    date: data.date,
    notebook: data.notebook,
    title: data.title,
    content: data.content
  });

  await supabase.from("submissions").delete().eq("id", id);
  location.reload();
}

async function rejectSubmission(id) {
  await supabase.from("submissions").delete().eq("id", id);
  location.reload();
}

// 🔄 SESSION HANDLING
supabase.auth.onAuthStateChange(async (_, session) => {
  if (session?.user) {
    auth.style.display = "none";
    submitSection.style.display = "block";
    logoutBtn.style.display = "block";
    loadAdminPanel(session.user);
  }
});

loadEntries();
