/* 🔐 SUPABASE CONFIG — REQUIRED */
const SUPABASE_URL = "https://chnjmdbmvjbnxxtllqwc.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmptZGJtdmpibnh4dGxscXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODM2MTMsImV4cCI6MjA4NzY1OTYxM30.BYGzxR2q3sQGqPJnLLXv0z81JzSm6Ge0GgU-VYVQcRE"

/* ✅ MOBILE-SAFE AUTH CONFIG (LOCKMANAGER FIX) */
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
)

/* ELEMENTS */
const loginDiv = document.getElementById("login")
const appDiv = document.getElementById("app")
const entriesList = document.getElementById("entries")

/* AUTH */
async function login() {
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    alert(error.message)
  } else {
    showApp()
  }
}

async function logout() {
  await supabaseClient.auth.signOut()
  location.reload()
}

/* APP VIEW */
function showApp() {
  loginDiv.style.display = "none"
  appDiv.style.display = "block"
  loadEntries()
}

/* LOAD APPROVED ENTRIES */
async function loadEntries() {
  let query = supabaseClient
    .from("entries")
    .select("*")
    .order("date", { ascending: true })

  const notebook = document.getElementById("notebookFilter").value
  const date = document.getElementById("dateFilter").value

  if (notebook) query = query.ilike("notebook", `%${notebook}%`)
  if (date) query = query.eq("date", date)

  const { data, error } = await query
  if (error) return alert(error.message)

  entriesList.innerHTML = ""

  data.forEach(e => {
    const li = document.createElement("li")
    li.innerHTML = `
      <strong>${e.title}</strong> (${e.date})<br>
      <em>${e.notebook}</em>
      <pre>${e.content}</pre>
      <button onclick="downloadEntry('${e.id}')">Download</button>
    `
    entriesList.appendChild(li)
  })
}

/* SUBMIT NEW WORK (GITHUB-STYLE PR) */
async function submitWork() {
  const { data: userData } = await supabaseClient.auth.getUser()
  const user = userData.user

  if (!user) {
    alert("You must be logged in to submit.")
    return
  }

  const { error } = await supabaseClient
    .from("submissions")
    .insert({
      date: document.getElementById("subDate").value,
      notebook: document.getElementById("subNotebook").value,
      title: document.getElementById("subTitle").value,
      content: document.getElementById("subContent").value,
      submitted_by: user.id,
      status: "pending"
    })

  if (error) {
    alert(error.message)
  } else {
    alert("Submission sent for admin review.")
    document.getElementById("subContent").value = ""
  }
}

/* DOWNLOAD SINGLE ENTRY */
async function downloadEntry(id) {
  const { data } = await supabaseClient
    .from("entries")
    .select("title, content")
    .eq("id", id)
    .single()

  const blob = new Blob([data.content], { type: "text/plain" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `${data.title}.txt`
  a.click()
}

/* DOWNLOAD ALL */
async function downloadAll() {
  const { data } = await supabaseClient
    .from("entries")
    .select("title, content")

  let combined = ""
  data.forEach(e => {
    combined += `### ${e.title}\n\n${e.content}\n\n`
  })

  const blob = new Blob([combined], { type: "text/plain" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "curriculum.txt"
  a.click()
}

/* AUTO LOGIN ON REFRESH */
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) showApp()
})
