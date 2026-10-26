import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("data/publications.json", root), "utf8"));
const papers = [...data.publications].sort((a, b) => b.sortDate.localeCompare(a.sortDate) || Number(b.pmid) - Number(a.pmid));
if (new Set(papers.map(p => p.pmid)).size !== data.total || papers.length !== data.total) {
  throw new Error("Publication count or PMID uniqueness mismatch");
}
const counts = Object.fromEntries(["featured", "latest", "reviews", "all"].map(group => [group,
  papers.filter(p => group === "all" || p[group === "reviews" ? "review" : group]).length]));
if (counts.featured !== 10) throw new Error("Expected ten featured publications");
const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const icon = name => `<img class="icon" src="assets/icons/${name}.svg" width="16" height="16" alt="" />`;
const authorHTML = author => {
  const name = author.me ? `<strong class="me">${escape(author.name)}</strong>` : escape(author.name);
  return name + (author.marks ? `<sup>${escape(author.marks)}</sup>` : "");
};

for (const [file, en] of [["index.html", false], ["en.html", true]]) {
  const verifiedDate = new Intl.DateTimeFormat(en ? "en-US" : "zh-CN", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
  }).format(new Date(`${data.verifiedAt}T00:00:00Z`));
  const labels = en ? ["Featured", "Latest", "Reviews", "All"] : ["精选", "最新", "综述", "全部"];
  const tabs = Object.keys(counts).map((group, i) => `<button type="button" id="tab-${group}" class="tab${i === 0 ? " active" : ""}" data-filter="${group}" role="tab" aria-selected="${i === 0}" aria-controls="publication-results" tabindex="${i === 0 ? "0" : "-1"}">${labels[i]}<span class="tab-count">${counts[group]}</span></button>`).join("\n              ");
  const years = [...new Set(papers.map(p => p.year))].map(year => `<option value="${year}">${year}</option>`).join("");
  const rows = papers.map(paper => {
    const groups = ["all", paper.featured && "featured", paper.latest && "latest", paper.review && "reviews"].filter(Boolean).join(" ");
    let authors = paper.authors.map(authorHTML).join(", ").replace(/, \.\.\./g, ", ...");
    if (paper.authors.length > 14) {
      const parts = [];
      let skipped = false;
      paper.authors.forEach((author, i) => {
        if (i < 3 || i >= paper.authors.length - 2 || author.me || author.marks) {
          if (skipped) parts.push("...");
          parts.push(authorHTML(author));
          skipped = false;
        } else {
          skipped = true;
        }
      });
      authors = `<span class="authors-short">${parts.join(", ")}.</span><details class="authors-details"><summary>${en ? "Full authors" : "完整作者"} (${paper.authors.length})</summary><p>${authors}.</p></details>`;
    } else {
      authors = `<span>${authors}${paper.authors.at(-1).name === "..." ? "" : "."}</span>`;
    }
    let citation = `${paper.year}`;
    if (paper.volume) citation += `;${paper.volume}`;
    if (paper.issue) citation += `(${paper.issue})`;
    if (paper.pages) citation += `:${paper.pages}`;
    const dateParts = paper.date.split("-");
    const month = dateParts[1] ? (en ? new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${paper.year}-${dateParts[1]}-01T00:00:00Z`)) : `${Number(dateParts[1])}月`) : "";
    const day = dateParts[2] ? (en ? ` ${Number(dateParts[2])}` : `${Number(dateParts[2])}日`) : "";
    return `            <article class="publication" data-groups="${groups}" data-year="${paper.year}" data-pmid="${paper.pmid}" data-date="${paper.sortDate}">
              <div class="publication-meta">
                <time datetime="${paper.date}">${paper.year}<span class="pub-month">${month}${day}</span></time>
                <p class="pub-journal"><strong><em>${escape(paper.journal)}</em></strong></p>
                <div class="pub-authors">${authors}</div>
              </div>
              <div class="publication-main">
                <h3><a href="https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/" target="_blank" rel="noopener noreferrer">${escape(paper.title)}</a></h3>
                <p class="pub-citation">${escape(citation)} · PMID: ${paper.pmid}</p>
                <div class="paper-links"><a class="pubmed-link" href="https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/" target="_blank" rel="noopener noreferrer" aria-label="PubMed: ${escape(paper.title)}">PubMed ${icon("arrow-up-right")}</a><a class="doi-link" href="https://doi.org/${escape(paper.doi)}" target="_blank" rel="noopener noreferrer" aria-label="DOI: ${escape(paper.title)}">DOI ${icon("arrow-up-right")}</a></div>
              </div>
            </article>`;
  }).join("\n");
  const section = `      <section id="publications" class="section publications-section" aria-labelledby="publications-title">
        <div class="publications-heading">
          <div><p class="section-kicker">Publications</p><h2 id="publications-title">${en ? "Selected & Recent Work" : "代表论文与近期成果"}</h2></div>
          <div class="publication-source">
            <p>${en ? `${data.total} publications · Updated ${verifiedDate}` : `${data.total} 篇发表论文 · 更新于 ${verifiedDate}`}</p>
            <a href="${data.source}" target="_blank" rel="noopener noreferrer">NCBI Bibliography ${icon("arrow-up-right")}</a>
          </div>
        </div>
        <div class="publication-panel">
          <div class="publication-controls" hidden>
            <div class="tabs" role="tablist" aria-label="${en ? "Publication categories" : "论文分类"}">
              ${tabs}
            </div>
            <div class="publication-filters">
              <label class="search-field" for="publication-search">${icon("search")}<span class="sr-only">${en ? "Search publications" : "搜索论文"}</span><input id="publication-search" type="search" placeholder="${en ? "Title, author, journal or PMID" : "搜索标题、作者、期刊或 PMID"}" autocomplete="off" /></label>
              <label class="year-field" for="publication-year"><span class="sr-only">${en ? "Publication year" : "发表年份"}</span><select id="publication-year"><option value="all">${en ? "All years" : "全部年份"}</option>${years}</select></label>
            </div>
          </div>
          <div class="publication-context"><p class="publication-legend"><sup>#</sup> ${en ? "Co-first author" : "共同第一作者"} <span>·</span> <sup>*</sup> ${en ? "Corresponding author (including co-corresponding)" : "通讯作者（含共同通讯）"}</p><p id="publication-count" role="status" aria-live="polite" aria-atomic="true">${data.total} ${en ? "publications" : "篇论文"}</p></div>
          <div id="publication-results" class="publication-list" tabindex="0">
${rows}
          </div>
          <div class="publication-empty" hidden><p>${en ? "No publications match these filters." : "未找到符合条件的论文。"}</p><button type="button" class="reset-filters">${en ? "Clear filters" : "清除筛选"}</button></div>
        </div>
      </section>`;
  const url = new URL(file, root);
  let html = await readFile(url, "utf8");
  const startMarker = "<!-- PUBLICATIONS:START -->";
  const endMarker = "<!-- PUBLICATIONS:END -->";
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start < 0 || end < start) throw new Error(`Missing publication markers in ${file}`);
  html = html.slice(0, start + startMarker.length) + "\n" + section + "\n      " + html.slice(end);
  html = html.replace(/(<strong data-publication-total>)\d+/, `$1${data.total}`);
  await writeFile(url, html, "utf8");
  console.log(`${file}: ${data.total} publications, ${counts.featured} featured, ${counts.reviews} reviews`);
}
