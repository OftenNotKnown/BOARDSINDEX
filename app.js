/* 🔐 SUPABASE CONFIG */
const SUPABASE_URL = "https://chnjmdbmvjbnxxtllqwc.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmptZGJtdmpibnh4dGxscXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODM2MTMsImV4cCI6MjA4NzY1OTYxM30.BYGzxR2q3sQGqPJnLLXv0z81JzSm6Ge0GgU-VYVQcRE"
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

/* GLOBALS */
let isAdmin = false
let currentImages = []
let currentIndex = 0

const compressionOptions = {
  maxWidthOrHeight: 1000,
  initialQuality: 0.25,
  fileType: "image/webp",
  useWebWorker: true
}

/* ELEMENTS */
const loginDiv = document.getElementById("login")
const appDiv = document.getElementById("app")
const adminPanel = document.getElementById("adminPanel")
const imageDirs = document.getElementById("imageDirs")
const pendingDirs = document.getElementById("pendingDirs")
const galleryModal = document.getElementById("galleryModal")
const galleryGrid = document.getElementById("galleryGrid")
const galleryTitle = document.getElementById("galleryTitle")

/* ===================== AUTH ===================== */

async function login() {
  const emailInput = document.getElementById("email").value
  const passwordInput = document.getElementById("password").value

  if (!emailInput || !passwordInput) {
    alert("Please enter email and password")
    return
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: emailInput,
    password: passwordInput
  })

  if (error) alert(error.message)
  else showApp()
}

async function logout() {
  await supabaseClient.auth.signOut()
  location.reload()
}

async function showApp() {
  loginDiv.style.display = "none"
  appDiv.style.display = "block"

  const { data } = await supabaseClient.auth.getUser()
  if (!data?.user) { location.reload(); return }
  isAdmin = data.user.email === "arduinodebugstick@outlook.com"

  loadImageDirs()
  loadTextSubmissions()

  if (isAdmin) {
    adminPanel.style.display = "block"
    loadPendingImageDirs()
    loadPendingTextSubmissions()
  }
}

/* ===================== IMAGE PROCESSING ===================== */

async function convertToGrayscale(file) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  canvas.width = bitmap.width
  canvas.height = bitmap.height
  ctx.drawImage(bitmap, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    data[i] = avg
    data[i + 1] = avg
    data[i + 2] = avg
  }

  ctx.putImageData(imageData, 0, 0)

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), "image/webp", 0.4)
  })
}

/* ===================== IMAGE UPLOAD ===================== */

async function uploadImageDirectory() {
  const user = (await supabaseClient.auth.getUser()).data.user
  const name = document.getElementById("dirName").value
  const files = document.getElementById("imageFiles").files

  if (!name || !files.length) {
    alert("Directory name and images are required")
    return
  }

  const { data: dir, error: dirError } = await supabaseClient
    .from("image_directories")
    .insert({ name, uploaded_by: user.id })
    .select()
    .single()

  if (dirError) return alert(dirError.message)

  for (const file of files) {
    try {
      const grayBlob = await convertToGrayscale(file)
      const compressed = await imageCompression(grayBlob, compressionOptions)

      const path = `${user.id}/${dir.id}/${crypto.randomUUID()}.webp`

      const { error: uploadError } = await supabaseClient.storage
        .from("image_uploads")
        .upload(path, compressed)

      if (uploadError) continue

      await supabaseClient.from("images").insert({
        directory_id: dir.id,
        uploaded_by: user.id,
        storage_path: path,
        filesize: compressed.size
      })
    } catch (err) {
      console.error(err)
    }
  }

  alert("Image directory submitted for review")
}

/* ===================== DIRECTORY LIST ===================== */

async function loadImageDirs() {
  const q = document.getElementById("dirSearch").value

  let query = supabaseClient
    .from("image_directories")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (q) query = query.ilike("name", `%${q}%`)

  const { data } = await query
  imageDirs.innerHTML = ""

  if (!data) return
  data.forEach(d => {
    const li = document.createElement("li")
    li.innerHTML = `
      <strong>${d.name}</strong><br><br>
      <button onclick="openDirectory('${d.id}')">Open Directory</button>
    `
    imageDirs.appendChild(li)
  })
}

/* ===================== DIRECTORY VIEW ===================== */

async function openDirectory(directoryId) {
  galleryGrid.innerHTML = "<p style='color:var(--muted)'>Loading images...</p>"
  galleryModal.style.display = "block"
  galleryModal.scrollTop = 0

  const { data: dir } = await supabaseClient
    .from("image_directories")
    .select("name")
    .eq("id", directoryId)
    .single()

  galleryTitle.textContent = dir ? dir.name : "Directory"

  const { data: images } = await supabaseClient
    .from("images")
    .select("*")
    .eq("directory_id", directoryId)
    .order("created_at", { ascending: true })

  currentImages = images || []
  galleryGrid.innerHTML = ""

  if (!currentImages.length) {
    galleryGrid.innerHTML = "<p style='color:var(--muted)'>No images in this directory.</p>"
    return
  }

  galleryGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;"

  for (let index = 0; index < currentImages.length; index++) {
    const img = currentImages[index]

    const { data: urlData } = await supabaseClient.storage
      .from("image_uploads")
      .createSignedUrl(img.storage_path, 3600)

    const div = document.createElement("div")
    div.style.cssText = "cursor:pointer;border-radius:8px;overflow:hidden;border:1px solid var(--border);aspect-ratio:1;background:#eee;"

    if (urlData && urlData.signedUrl) {
      div.innerHTML = `<img src="${urlData.signedUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onclick="openImageViewer(${index})" />`
    } else {
      div.innerHTML = `<div onclick="openImageViewer(${index})" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:.8rem;">File ${index + 1}</div>`
    }

    galleryGrid.appendChild(div)
  }
}

/* ===================== FULLSCREEN VIEWER ===================== */

async function openImageViewer(index) {
  currentIndex = index
  document.getElementById("fileViewer").style.display = "block"
  loadViewerImage()
}

async function loadViewerImage() {
  const img = currentImages[currentIndex]
  if (!img) return

  const viewerImg = document.getElementById("viewerImage")
  viewerImg.src = ""

  const { data, error } = await supabaseClient.storage
    .from("image_uploads")
    .createSignedUrl(img.storage_path, 3600)

  if (error || !data?.signedUrl) {
    console.error("Failed to load image:", error)
    return
  }

  viewerImg.src = data.signedUrl
}

function closeViewer() {
  document.getElementById("fileViewer").style.display = "none"
}

function nextImage() {
  if (currentIndex < currentImages.length - 1) {
    currentIndex++
    loadViewerImage()
  }
}

function prevImage() {
  if (currentIndex > 0) {
    currentIndex--
    loadViewerImage()
  }
}

/* ===================== TEXT SUBMISSIONS ===================== */

async function submitWork() {
  const user = (await supabaseClient.auth.getUser()).data.user

  const date = document.getElementById("subDate").value
  const notebook = document.getElementById("subNotebook").value.trim()
  const title = document.getElementById("subTitle").value.trim()
  const content = document.getElementById("subContent").value.trim()

  if (!date || !notebook || !title || !content)
    return alert("All fields required")

  await supabaseClient.from("submissions").insert({
    date,
    notebook,
    title,
    content,
    submitted_by: user.id,
    status: "pending"
  })

  alert("Work submitted for review")
}

async function loadTextSubmissions() {
  const q = document.getElementById("textSearch")?.value || ""

  let query = supabaseClient
    .from("submissions")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (q)
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)

  const { data } = await query
  const list = document.getElementById("textList")
  if (!list) return

  list.innerHTML = ""

  if (!data) return
  data.forEach(sub => {
    const preview = sub.content.length > 200
      ? sub.content.substring(0, 200) + "..."
      : sub.content
    const li = document.createElement("li")
    li.innerHTML = `
      <strong>${sub.title}</strong><br>
      <span class="muted">${sub.date} · ${sub.notebook}</span><br><br>
      ${preview}
    `
    list.appendChild(li)
  })
}

/* ===================== ADMIN ===================== */

async function loadPendingImageDirs() {
  const { data } = await supabaseClient
    .from("image_directories")
    .select("*")
    .eq("status", "pending")

  pendingDirs.innerHTML = ""

  if (!data) return
  data.forEach(d => {
    const li = document.createElement("li")
    li.innerHTML = `
      <strong>${d.name}</strong><br><br>
      <button onclick="openDirectory('${d.id}')">View</button>
      <button onclick="approveDir('${d.id}')">Approve</button>
      <button class="secondary" onclick="rejectDir('${d.id}')">Reject</button>
    `
    pendingDirs.appendChild(li)
  })
}

async function loadPendingTextSubmissions() {
  const { data } = await supabaseClient
    .from("submissions")
    .select("*")
    .eq("status", "pending")

  // Use a dedicated container so re-calls don't append to the whole adminPanel
  let pendingTextContainer = document.getElementById("pendingTextContainer")
  if (!pendingTextContainer) {
    pendingTextContainer = document.createElement("div")
    pendingTextContainer.id = "pendingTextContainer"
    adminPanel.appendChild(pendingTextContainer)
  }
  pendingTextContainer.innerHTML = ""

  if (!data) return
  data.forEach(sub => {
    const div = document.createElement("div")
    div.className = "card"
    div.innerHTML = `
      <strong>${sub.title}</strong><br>
      ${sub.content}<br><br>
      <button onclick="approveText('${sub.id}')">Approve</button>
      <button class="secondary" onclick="rejectText('${sub.id}')">Reject</button>
    `
    pendingTextContainer.appendChild(div)
  })
}

async function approveDir(id) {
  await supabaseClient.from("image_directories")
    .update({ status: "approved" }).eq("id", id)
  await supabaseClient.from("images")
    .update({ status: "approved" }).eq("directory_id", id)
  loadPendingImageDirs()
  loadImageDirs()
}

async function rejectDir(id) {
  await supabaseClient.from("image_directories")
    .update({ status: "rejected" }).eq("id", id)
  loadPendingImageDirs()
}

async function approveText(id) {
  await supabaseClient.from("submissions")
    .update({ status: "approved" }).eq("id", id)
  await loadPendingTextSubmissions()
  await loadTextSubmissions()
}

async function rejectText(id) {
  await supabaseClient.from("submissions")
    .update({ status: "rejected" }).eq("id", id)
  await loadPendingTextSubmissions()
}

/* ===================== AUTO LOGIN ===================== */

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) showApp()
})
