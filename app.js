/* 🔐 SUPABASE CONFIG */
const SUPABASE_URL = "https://chnjmdbmvjbnxxtllqwc.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmptZGJtdmpibnh4dGxscXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODM2MTMsImV4cCI6MjA4NzY1OTYxM30.BYGzxR2q3sQGqPJnLLXv0z81JzSm6Ge0GgU-VYVQcRE"
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

/* GLOBALS */
let isAdmin = false

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

async function showApp() {
  loginDiv.style.display = "none"
  appDiv.style.display = "block"

  const { data } = await supabaseClient.auth.getUser()
  isAdmin = data.user.email === "arduinodebugstick@outlook.com"

  loadImageDirs()

  if (isAdmin) {
    adminPanel.style.display = "block"
    loadPendingImageDirs()
  }
}

/* ===================== GRAYSCALE CONVERSION ===================== */

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

  if (dirError) {
    alert(dirError.message)
    return
  }

  for (const file of files) {
    try {
      // 🔥 Convert to grayscale first
      const grayBlob = await convertToGrayscale(file)

      // 🔥 Then compress aggressively
      const compressed = await imageCompression(grayBlob, compressionOptions)

      const path = `${user.id}/${dir.id}/${crypto.randomUUID()}.webp`

      const { error: uploadError } = await supabaseClient.storage
        .from("image_uploads")
        .upload(path, compressed)

      if (uploadError) {
        console.error(uploadError)
        continue
      }

      await supabaseClient.from("images").insert({
        directory_id: dir.id,
        uploaded_by: user.id,
        storage_path: path,
        filesize: compressed.size
      })
    } catch (err) {
      console.error("Image failed:", err)
    }
  }

  alert("Image directory submitted for review")

  document.getElementById("dirName").value = ""
  document.getElementById("imageFiles").value = ""
}

/* ===================== USER GALLERY ===================== */

async function loadImageDirs() {
  const q = document.getElementById("dirSearch").value

  let query = supabaseClient
    .from("image_directories")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (q) query = query.ilike("name", `%${q}%`)

  const { data, error } = await query
  if (error) return alert(error.message)

  imageDirs.innerHTML = ""

  data.forEach(d => {
    const li = document.createElement("li")
    li.innerHTML = `
      <strong>${d.name}</strong><br><br>
      <button onclick="openGallery('${d.id}')">Open</button>
    `
    imageDirs.appendChild(li)
  })
}

async function openGallery(directoryId) {
  galleryGrid.innerHTML = ""
  galleryModal.style.display = "block"

  const { data: dir } = await supabaseClient
    .from("image_directories")
    .select("name")
    .eq("id", directoryId)
    .single()

  galleryTitle.textContent = dir.name

  const { data: images, error } = await supabaseClient
    .from("images")
    .select("*")
    .eq("directory_id", directoryId)
    .eq("status", "approved")

  if (error) return alert(error.message)

  images.forEach(img => {
    const { data } = supabaseClient.storage
      .from("image_uploads")
      .getPublicUrl(img.storage_path)

    const div = document.createElement("div")
    div.innerHTML = `
      <img src="${data.publicUrl}" style="width:100%;border-radius:8px">
      <button class="secondary" style="width:100%;margin-top:6px"
        onclick="downloadImage('${img.storage_path}')">
        Download
      </button>
    `
    galleryGrid.appendChild(div)
  })
}

function closeGallery() {
  galleryModal.style.display = "none"
}

async function downloadImage(path) {
  const { data, error } = await supabaseClient.storage
    .from("image_uploads")
    .download(path)

  if (error) return alert(error.message)

  const a = document.createElement("a")
  a.href = URL.createObjectURL(data)
  a.download = path.split("/").pop()
  a.click()
}

/* ===================== ADMIN ===================== */

async function loadPendingImageDirs() {
  const { data, error } = await supabaseClient
    .from("image_directories")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  if (error) return alert(error.message)

  pendingDirs.innerHTML = ""

  data.forEach(d => {
    const li = document.createElement("li")
    li.innerHTML = `
      <strong>${d.name}</strong><br>
      <span class="muted">Uploader: ${d.uploaded_by}</span><br><br>
      <button onclick="approveDir('${d.id}')">Approve</button>
      <button class="secondary" onclick="rejectDir('${d.id}')">Reject</button>
    `
    pendingDirs.appendChild(li)
  })
}

async function approveDir(id) {
  await supabaseClient
    .from("image_directories")
    .update({ status: "approved" })
    .eq("id", id)

  await supabaseClient
    .from("images")
    .update({ status: "approved" })
    .eq("directory_id", id)

  loadPendingImageDirs()
  loadImageDirs()
}

async function rejectDir(id) {
  await supabaseClient
    .from("image_directories")
    .update({ status: "rejected" })
    .eq("id", id)

  await supabaseClient
    .from("images")
    .update({ status: "rejected" })
    .eq("directory_id", id)

  loadPendingImageDirs()
}

/* ===================== AUTO LOGIN ===================== */

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) showApp()
})
