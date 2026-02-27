const SUPABASE_URL = "https://chnjmdbmvjbnxxtllqwc.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmptZGJtdmpibnh4dGxscXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODM2MTMsImV4cCI6MjA4NzY1OTYxM30.BYGzxR2q3sQGqPJnLLXv0z81JzSm6Ge0GgU-VYVQcRE"

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const loginDiv = document.getElementById("login")
const appDiv = document.getElementById("app")
const entriesList = document.getElementById("entries")

async function login() {
  const email = email.value
  const password = password.value

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
  if (error) alert(error.message)
  else showApp()
}

function showApp() {
  loginDiv.style.display = "none"
  appDiv.style.display = "block"
  loadEntries()
}

async function submitWork() {
  const user = (await supabaseClient.auth.getUser()).data.user
  if (!user) return alert("Not logged in")

  const form = new FormData()
  form.append("date", subDate.value)
  form.append("notebook", subNotebook.value)
  form.append("title", subTitle.value)
  form.append("text", subContent.value)
  form.append("user_id", user.id)

  if (subImage.files[0]) {
    form.append("image", subImage.files[0])
  }

  const res = await fetch("https://server-au82.onrender.com/", {
    method: "POST",
    body: form
  })

  if (!res.ok) alert("Submission failed")
  else alert("Submitted for review")
}

async function loadEntries() {
  const { data } = await supabaseClient
    .from("entries")
    .select("*")
    .order("date")

  entriesList.innerHTML = ""

  data.forEach(e => {
    let display = e.content
    try {
      const parsed = JSON.parse(e.content)
      display = parsed.summary + "\n\n" +
        (parsed.extracted.ocr_text || parsed.extracted.pasted_text)
    } catch {}

    const li = document.createElement("li")
    li.innerHTML = `<strong>${e.title}</strong><pre>${display}</pre>`
    entriesList.appendChild(li)
  })
}

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) showApp()
})
