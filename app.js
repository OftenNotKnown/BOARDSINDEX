/***********************
 * SUPABASE SETUP
 ***********************/
const SUPABASE_URL = "https://hlretjxmkncpvnqskqlg.supabase.co";
const SUPABASE_KEY = "sb_publishable_VfW1k-K3MjlLn7i02vns8Q_6JnGv9QC";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/***********************
 * DOM ELEMENTS
 ***********************/
const resultsEl = document.getElementById("results");
const dateInput = document.getElementById("dateInput");
const searchInput = document.getElementById("searchInput");
const dateBtn = document.getElementById("dateBtn");
const searchBtn = document.getElementById("searchBtn");

/***********************
 * RENDERING
 ***********************/
function renderPages(pages) {
  resultsEl.innerHTML = "";

  if (!pages || pages.length === 0) {
    resultsEl.innerHTML = "<p>No results found.</p>";
    return;
  }

  pages.forEach(p => {
    const div = document.createElement("div");
    div.className = "page";

    div.innerHTML = `
      <h3>
        ${p.notebook} — Page ${p.page_number}
        <small>(${p.date})</small>
      </h3>
      <p>${p.content}</p>
    `;

    resultsEl.appendChild(div);
  });
}

/***********************
 * DATA FETCHING
 ***********************/
async function loadByDate(date) {
  const { data, error } = await supabaseClient
    .from("pages")
    .select("*")
    .eq("date", date)
    .order("page_number");

  if (error) {
    console.error(error);
    return;
  }

  renderPages(data);
}

async function searchByKeyword(keyword) {
  const { data, error } = await supabaseClient
    .from("pages")
    .select("*")
    .ilike("content", `%${keyword}%`)
    .order("date");

  if (error) {
    console.error(error);
    return;
  }

  renderPages(data);
}

/***********************
 * EVENT LISTENERS
 ***********************/
dateBtn.addEventListener("click", () => {
  if (!dateInput.value) return;
  loadByDate(dateInput.value);
});

searchBtn.addEventListener("click", () => {
  if (!searchInput.value) return;
  searchByKeyword(searchInput.value);
});
