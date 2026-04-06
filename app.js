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

  // Show progress bar, disable button
  const btn = document.getElementById("uploadBtn")
  const wrap = document.getElementById("uploadProgressWrap")
  const bar = document.getElementById("uploadProgressBar")
  const label = document.getElementById("uploadProgressLabel")
  const pct = document.getElementById("uploadProgressPct")

  btn.disabled = true
  wrap.style.display = "block"
  bar.style.width = "0%"

  const total = files.length
  let done = 0

  for (const file of files) {
    try {
      label.textContent = `Processing ${file.name}…`
      const grayBlob = await convertToGrayscale(file)
      const compressed = await imageCompression(grayBlob, compressionOptions)

      const path = `${user.id}/${dir.id}/${crypto.randomUUID()}.webp`

      label.textContent = `Uploading ${file.name}…`
      const { error: uploadError } = await supabaseClient.storage
        .from("image_uploads")
        .upload(path, compressed)

      if (uploadError) { done++; continue }

      await supabaseClient.from("images").insert({
        directory_id: dir.id,
        uploaded_by: user.id,
        storage_path: path,
        filesize: compressed.size,
        status: "pending"
      })
    } catch (err) {
      console.error(err)
    }

    done++
    const progress = Math.round((done / total) * 100)
    bar.style.width = progress + "%"
    pct.textContent = progress + "%"
  }

  label.textContent = "Upload complete!"
  btn.disabled = false
  setTimeout(() => { wrap.style.display = "none" }, 3000)
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

  // Admins see all images; regular users only see approved ones
  let imgQuery = supabaseClient
    .from("images")
    .select("*")
    .eq("directory_id", directoryId)
    .order("created_at", { ascending: true })

  if (!isAdmin) imgQuery = imgQuery.eq("status", "approved")

  const { data: images } = await imgQuery

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

function closeGallery() {
  document.getElementById("galleryModal").style.display = "none"
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

/* ===================== TAB SWITCHING ===================== */

function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
  document.getElementById('tab-' + name).classList.add('active')
  btn.classList.add('active')

  if (name === 'calendar') initCalendar()
  if (name === 'terminal') initTerminal()
}

/* ===================== CALENDAR ===================== */

let calYear, calMonth, calDirsByDate = {}

async function initCalendar() {
  if (calYear !== undefined) { renderCal(); return }
  const now = new Date()
  calYear = now.getFullYear()
  calMonth = now.getMonth()
  await loadAllDirsForCalendar()
  renderCal()
}

async function loadAllDirsForCalendar() {
  const { data } = await supabaseClient
    .from('image_directories')
    .select('id, name')
    .eq('status', 'approved')
  calDirsByDate = {}
  if (!data) return

  // Parse DD/MM/YYYY from directory names
  data.forEach(d => {
    const m = d.name.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (!m) return
    const key = `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
    if (!calDirsByDate[key]) calDirsByDate[key] = []
    calDirsByDate[key].push(d)
  })
}

function calNav(dir) {
  calMonth += dir
  if (calMonth > 11) { calMonth = 0; calYear++ }
  if (calMonth < 0)  { calMonth = 11; calYear-- }
  renderCal()
}

function renderCal() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  document.getElementById('calTitle').textContent = `${months[calMonth]} ${calYear}`

  const grid = document.getElementById('calGrid')
  grid.innerHTML = ''

  // Day-of-week headers
  const dows = ['Su','Mo','Tu','We','Th','Fr','Sa']
  dows.forEach(d => {
    const el = document.createElement('div')
    el.className = 'cal-dow'
    el.textContent = d
    grid.appendChild(el)
  })

  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const today = new Date()

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div')
    el.className = 'cal-day empty'
    el.textContent = ' '
    grid.appendChild(el)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const el = document.createElement('div')
    el.className = 'cal-day'
    el.textContent = day

    const mm = String(calMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const key = `${calYear}-${mm}-${dd}`

    if (today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day)
      el.classList.add('today')

    if (calDirsByDate[key]) {
      el.classList.add('has-entries')
      el.title = `${calDirsByDate[key].length} director${calDirsByDate[key].length > 1 ? 'ies' : 'y'}`
      el.onclick = () => showCalDate(key, day, el)
    }
    grid.appendChild(el)
  }
}

function showCalDate(key, day, el) {
  document.querySelectorAll('.cal-day.selected').forEach(e => e.classList.remove('selected'))
  el.classList.add('selected')

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dirs = calDirsByDate[key] || []
  document.getElementById('calResultTitle').textContent =
    `${dirs.length} director${dirs.length !== 1 ? 'ies' : 'y'} on ${day} ${months[calMonth]} ${calYear}`

  const list = document.getElementById('calDirList')
  list.innerHTML = ''
  dirs.forEach(d => {
    const li = document.createElement('li')
    li.innerHTML = `<strong>${d.name}</strong><br><br><button onclick="openDirectory('${d.id}')">Open Directory</button>`
    list.appendChild(li)
  })
}

/* ===================== TERMINAL ===================== */

let termInited = false
let termHistory = []
let termHistIdx = -1
let allDirsCache = null

async function initTerminal() {
  if (termInited) return
  termInited = true

  const input = document.getElementById('termInput')
  input.addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim()
      input.value = ''
      termHistIdx = -1
      if (cmd) { termHistory.unshift(cmd); await runTermCmd(cmd) }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (termHistIdx < termHistory.length - 1) { termHistIdx++; input.value = termHistory[termHistIdx] }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (termHistIdx > 0) { termHistIdx--; input.value = termHistory[termHistIdx] }
      else { termHistIdx = -1; input.value = '' }
    }
  })

  // Click anywhere on terminal to focus input
  document.getElementById('termOutput').addEventListener('click', () => input.focus())

  termPrint('<span class="term-green">Curriculum Archive VFS Terminal</span>')
  termPrint('<span class="term-muted">Type <span class="term-cyan">help</span> for available commands.</span>')
  termPrint('')
  input.focus()
}

function termPrint(html) {
  const out = document.getElementById('termOutput')
  const line = document.createElement('div')
  line.className = 'term-line'
  line.innerHTML = html
  out.appendChild(line)
  out.scrollTop = out.scrollHeight
}

function termEcho(cmd) {
  termPrint(`<span class="term-prompt">archive:/$ </span><span>${escHtml(cmd)}</span>`)
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

async function runTermCmd(cmd) {
  termEcho(cmd)
  const parts = cmd.trim().split(/\s+/)
  const base = parts[0].toLowerCase()

  if (base === 'clear') {
    document.getElementById('termOutput').innerHTML = ''
    return
  }

  if (base === 'help') {
    termPrint('<span class="term-yellow">Available commands:</span>')
    termPrint('  <span class="term-cyan">ls</span>              — list all approved directories')
    termPrint('  <span class="term-cyan">download &lt;name&gt;</span>  — fuzzy-search and download a directory\'s images as ZIP')
    termPrint('  <span class="term-cyan">clear</span>           — clear terminal')
    termPrint('  <span class="term-cyan">help</span>            — show this help')
    termPrint('')
    return
  }

  if (base === 'ls') {
    termPrint('<span class="term-muted">Fetching directories...</span>')
    const dirs = await fetchAllDirs()
    const prev = document.getElementById('termOutput').lastChild
    if (prev) prev.remove()
    if (!dirs.length) { termPrint('<span class="term-muted">No directories found.</span>'); return }
    termPrint(`<span class="term-muted">total ${dirs.length}</span>`)
    dirs.forEach(d => {
      termPrint(`  <span class="term-dir">📁 ${escHtml(d.name)}</span>`)
    })
    termPrint('')
    return
  }

  if (base === 'download') {
    const query = parts.slice(1).join(' ').trim()
    if (!query) { termPrint('<span class="term-red">Usage: download &lt;directory name&gt;</span>'); return }
    termPrint(`<span class="term-muted">Searching for "${escHtml(query)}"...</span>`)
    const dirs = await fetchAllDirs()
    const ql = query.toLowerCase()
    const match = dirs.find(d => d.name.toLowerCase().includes(ql)) || dirs[0]
    if (!match) { termPrint('<span class="term-red">No directories found.</span>'); return }
    termPrint(`<span class="term-green">Found:</span> <span class="term-dir">${escHtml(match.name)}</span>`)
    termPrint('<span class="term-muted">Fetching images...</span>')
    await termDownloadDir(match)
    return
  }

  termPrint(`<span class="term-red">Command not found:</span> ${escHtml(base)} — type <span class="term-cyan">help</span>`)
}

async function fetchAllDirs() {
  if (allDirsCache) return allDirsCache
  const { data } = await supabaseClient
    .from('image_directories')
    .select('id, name')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  allDirsCache = data || []
  return allDirsCache
}

async function termDownloadDir(dir) {
  // Fetch image records
  const { data: images } = await supabaseClient
    .from('images')
    .select('storage_path')
    .eq('directory_id', dir.id)
    .eq('status', 'approved')

  if (!images || !images.length) {
    termPrint('<span class="term-red">No approved images in this directory.</span>')
    return
  }

  termPrint(`<span class="term-muted">Downloading ${images.length} image(s)...</span>`)

  // We'll use JSZip from CDN if available, otherwise download individually
  if (typeof JSZip === 'undefined') {
    // Lazy-load JSZip
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }

  const zip = new JSZip()
  const folder = zip.folder(dir.name.replace(/[\/\\:*?"<>|]/g, '_'))
  let fetched = 0

  for (const img of images) {
    const { data: urlData } = await supabaseClient.storage
      .from('image_uploads')
      .createSignedUrl(img.storage_path, 3600)
    if (!urlData?.signedUrl) { fetched++; continue }
    try {
      const res = await fetch(urlData.signedUrl)
      const blob = await res.blob()
      const fname = img.storage_path.split('/').pop() || `image_${fetched}.webp`
      folder.file(fname, blob)
    } catch(e) { /* skip */ }
    fetched++
    termPrint(`  <span class="term-muted">[${fetched}/${images.length}] fetched</span>`)
  }

  termPrint('<span class="term-yellow">Zipping...</span>')
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dir.name.replace(/[\/\\:*?"<>|]/g, '_') + '.zip'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  termPrint(`<span class="term-green">✓ Download started: ${escHtml(a.download)}</span>`)
  termPrint('')
}
