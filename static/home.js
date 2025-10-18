const games = [
  {
    title: "Sky Runner",
    description: "Endless runner through neon clouds. Keyboard & touch friendly.",
    tags: ["Arcade", "Single-player"],
    href: window.DJ_URLS.skyRunner,
    thumb: null
  },
  {
    title: "Grid Tactics",
    description: "Turn-based strategy on an 8×8 board. Minimalist, deep.",
    tags: ["Strategy", "Tactics"],
    href: window.DJ_URLS.gridTactics,
    thumb: null
  }
];

const grid = document.getElementById("gamesGrid");

function cardHTML(game) {
  const tagChips = (game.tags || []).map(t => `<span class="chip">${t}</span>`).join(" ");
  const thumb = game.thumb
    ? `<img class="thumb" alt="${game.title} cover" src="${game.thumb}">`
    : `<div class="thumb" role="img" aria-label="placeholder graphic"></div>`;
  return `
    <article class="card">
      <a href="${game.href}" aria-label="Open ${game.title}">
        ${thumb}
        <div class="inner">
          <div class="title">${game.title}</div>
          <p class="desc">${game.description || ""}</p>
          <div class="row">
            ${tagChips}
            <span class="spacer"></span>
            <span class="btn" role="button" aria-label="Play ${game.title}">Play</span>
          </div>
        </div>
      </a>
    </article>`;
}

function render() { grid.innerHTML = games.map(cardHTML).join(""); }

document.getElementById("customizeBtn").addEventListener("click", () => {
  const updated = JSON.parse(JSON.stringify(games));
  for (let i = 0; i < Math.min(2, updated.length); i++) {
    const g = updated[i];
    const t = prompt(`Game ${i + 1} title:`, g.title);
    if (t === null) return;
    const d = prompt(`Game ${i + 1} description:`, g.description);
    if (d === null) return;
    g.title = t.trim() || g.title;
    g.description = d.trim() || g.description;
  }
  games.splice(0, games.length, ...updated);
  render();
});

document.getElementById("year").textContent = new Date().getFullYear();
render();
