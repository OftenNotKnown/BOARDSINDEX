const DATA_URL = "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/DATA/";
const files = [
  "2024-10-01.txt",
  "2024-10-12.txt",
  "2025-01-03.txt"
];

const list = document.getElementById("files");
const content = document.getElementById("content");
const search = document.getElementById("search");

function render(filter="") {
  list.innerHTML = "";
  files
    .filter(f => f.includes(filter))
    .forEach(f => {
      const li = document.createElement("li");
      li.textContent = f;
      li.onclick = async () => {
        const res = await fetch(DATA_URL + f);
        content.textContent = await res.text();
      };
      list.appendChild(li);
    });
}

search.oninput = () => render(search.value);
render();
