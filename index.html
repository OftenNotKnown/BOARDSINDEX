<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Curriculum Archive</title>

  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  <script src="https://unpkg.com/browser-image-compression/dist/browser-image-compression.js"></script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg:#f8fafc; --card:#fff; --border:#e5e7eb;
      --text:#0f172a; --muted:#64748b;
      --accent:#6366f1; --accent-hover:#4f46e5;
      --radius:12px;
    }
    *{box-sizing:border-box}
    body{
      font-family:'Inter',system-ui,sans-serif;
      background:var(--bg);color:var(--text);
      max-width:960px;margin:40px auto;padding:0 20px;
    }
    h1{font-size:2rem;margin-bottom:24px}
    h2{font-size:1.25rem;margin-bottom:12px}
    label{font-size:.85rem;color:var(--muted);margin-top:12px;display:block}
    input,textarea{
      width:100%;padding:10px 12px;margin-top:6px;
      border-radius:var(--radius);border:1px solid var(--border);
      font-family:inherit;font-size:.95rem;
    }
    button{
      background:var(--accent);color:#fff;border:none;
      border-radius:var(--radius);padding:10px 16px;
      font-weight:600;font-size:.9rem;cursor:pointer;margin-top:12px;
    }
    button.secondary{
      background:transparent;color:var(--text);border:1px solid var(--border);
    }
    .card{
      background:var(--card);border:1px solid var(--border);
      border-radius:var(--radius);padding:20px;margin-bottom:24px;
    }
    .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
    ul{list-style:none;padding:0}
    li{border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px}
    .top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
    .muted{color:var(--muted);font-size:.85rem}
  </style>
</head>

<body>

<h1>Curriculum Archive</h1>

<!-- LOGIN -->
<div id="login" class="card">
  <h2>Login</h2>
  <input id="email" placeholder="Email" />
  <input id="password" type="password" placeholder="Password" />
  <button onclick="login()">Login</button>
</div>

<!-- APP -->
<div id="app" style="display:none">

  <div class="top-bar">
    <h2>Dashboard</h2>
    <button class="secondary" onclick="logout()">Logout</button>
  </div>

  <!-- TEXT SUBMISSION -->
  <div class="card">
    <h2>Submit New Work</h2>
    <div class="row">
      <input id="subDate" type="date" />
      <input id="subNotebook" placeholder="Notebook" />
      <input id="subTitle" placeholder="Title" />
    </div>
    <textarea id="subContent" rows="6"></textarea>
    <button onclick="submitWork()">Submit for Review</button>
  </div>

  <!-- IMAGE UPLOAD -->
  <div class="card">
    <h2>Submit Image Directory</h2>
    <label>Directory Name</label>
    <input id="dirName" />
    <label>Select Images</label>
    <input id="imageFiles" type="file" multiple accept="image/*" />
    <button onclick="uploadImageDirectory()">Upload Directory</button>
  </div>

  <!-- IMAGE DIRECTORIES -->
  <div class="card">
    <h2>Approved Image Directories</h2>
    <input id="dirSearch" placeholder="Search" oninput="loadImageDirs()" />
    <ul id="imageDirs"></ul>
  </div>

  <!-- ADMIN -->
  <div id="adminPanel" class="card" style="display:none">
    <h2>Admin · Pending Image Directories</h2>
    <ul id="pendingDirs"></ul>
  </div>
</div>

<!-- GALLERY MODAL -->
<div id="galleryModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:1000;padding:40px">
  <div class="card" style="max-width:1000px;margin:auto">
    <div style="display:flex;justify-content:space-between">
      <h2 id="galleryTitle"></h2>
      <button class="secondary" onclick="closeGallery()">Close</button>
    </div>
    <div id="galleryGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px"></div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html>
