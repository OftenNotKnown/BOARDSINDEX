/* 🔐 SUPABASE CONFIG — REQUIRED */
const SUPABASE_URL = "https://chnjmdbmvjbnxxtllqwc.supabase.co"
const SUPABASE_KEY = "sb_publishable_C2416_uJ2TYUM2U0wgL2Eg_qkGpX2MW"

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

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

  if (error) alert(error.message)
  else showApp()
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

/* SUBMIT NEW WORK (PR MODEL) */
async function submitWork() {
  const user = (await supabaseClient.auth.getUser()).data.user

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

  if (error) alert(error.message)
  else alert("Submission sent for admin review")
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

  let text = ""
  data.forEach(e => {
    text += `### ${e.title}\n\n${e.content}\n\n`
  })

  const blob = new Blob([text], { type: "text/plain" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "curriculum.txt"
  a.click()
}

/* AUTO LOGIN */
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) showApp()
})
