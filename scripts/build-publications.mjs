import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("data/publications.json", root), "utf8"));
const papers = [...data.publications].sort(
  (a, b) => b.sortDate.localeCompare(a.sortDate) || Number(b.pmid) - Number(a.pmid)
);

if (new Set(papers.map((p) => p.pmid)).size !== data.total || papers.length !== data.total) {
  throw new Error("Publication count or PMID uniqueness mismatch");
}

// Verified JCR Impact Factors for core journals
const JOURNAL_IF = {
  "Circulation": "41.3",
  "Circ Res": "18.0",
  "Adv Sci (Weinh)": "14.1",
  "Mol Biomed": "13.0",
  "EBioMedicine": "11.2",
  "Arterioscler Thromb Vasc Biol": "8.8",
  "Am J Hum Genet": "7.7",
  "Sci Signal": "7.0",
  "Front Immunol": "7.0",
  "JCI Insight": "6.8",
  "J Am Heart Assoc": "6.0",
  "Biomedicines": "4.5",
  "Vascul Pharmacol": "3.7",
  "Cardiovasc Drugs Ther": "3.5",
  "Physiol Genomics": "2.5",
};

const counts = Object.fromEntries(
  ["featured", "latest", "reviews", "all"].map((group) => [
    group,
    papers.filter((p) => group === "all" || p[group === "reviews" ? "review" : group]).length,
  ])
);

const escape = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const authorHTML = (author) => {
  const name = author.me ? `<strong class="me">${escape(author.name)}</strong>` : escape(author.name);
  return name + (author.marks ? `<sup>${escape(author.marks)}</sup>` : "");
};

for (const [file, en] of [
  ["index.html", false],
  ["en.html", true],
]) {
  const verifiedDate = new Intl.DateTimeFormat(en ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${data.verifiedAt}T00:00:00Z`));

  const labels = en
    ? ["Featured", "Latest", "Reviews", "All"]
    : ["精选代表作", "近年最新", "综述", "全部论文"];

  const tabs = Object.keys(counts)
    .map(
      (group, i) =>
        `<button type="button" id="tab-${group}" class="tab${i === 0 ? " active" : ""}" data-filter="${group}" role="tab" aria-selected="${i === 0}" aria-controls="publication-results" tabindex="${i === 0 ? "0" : "-1"}"><span>${labels[i]}</span><span class="tab-count">${counts[group]}</span></button>`
    )
    .join("\n                ");

  const years = [...new Set(papers.map((p) => p.year))]
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");

  const rows = papers
    .map((paper) => {
      const groups = ["all", paper.featured && "featured", paper.latest && "latest", paper.review && "reviews"]
        .filter(Boolean)
        .join(" ");

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
        authors = `<span class="authors-short">${parts.join(", ")}.</span><details class="authors-details"><summary>${en ? "Full authors" : "展开全部作者"} (${paper.authors.length})</summary><p>${authors}.</p></details>`;
      } else {
        authors = `<span>${authors}${paper.authors.at(-1).name === "..." ? "" : "."}</span>`;
      }

      let citation = `${paper.year}`;
      if (paper.volume) citation += `;${paper.volume}`;
      if (paper.issue) citation += `(${paper.issue})`;
      if (paper.pages) citation += `:${paper.pages}`;

      const dateParts = paper.date.split("-");
      const month = dateParts[1]
        ? en
          ? new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
              new Date(`${paper.year}-${dateParts[1]}-01T00:00:00Z`)
            )
          : `${Number(dateParts[1])}月`
        : "";
      const day = dateParts[2] ? (en ? ` ${Number(dateParts[2])}` : `${Number(dateParts[2])}日`) : "";

      const ifVal = JOURNAL_IF[paper.journal];
      const ifBadge = ifVal ? `<span class="if-badge" title="JCR Impact Factor">IF ${ifVal}</span>` : "";

      return `              <article class="publication" data-groups="${groups}" data-year="${paper.year}" data-pmid="${paper.pmid}" data-date="${paper.sortDate}">
                <div class="publication-meta">
                  <div class="pub-meta-top">
                    <time datetime="${paper.date}">${paper.year}<span class="pub-month">${month}${day}</span></time>
                    ${ifBadge}
                  </div>
                  <p class="pub-journal"><strong><em>${escape(paper.journal)}.</em></strong></p>
                  <div class="pub-authors">${authors}</div>
                </div>
                <div class="publication-main">
                  <h3><a href="https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/" target="_blank" rel="noopener noreferrer">${escape(paper.title)}</a></h3>
                  <div class="pub-footer">
                    <p class="pub-citation">${escape(citation)} · PMID: ${paper.pmid}</p>
                    <div class="paper-links">
                      <a class="pubmed-link" href="https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/" target="_blank" rel="noopener noreferrer" aria-label="PubMed: ${escape(paper.title)}">PubMed</a>
                      <a class="doi-link" href="https://doi.org/${escape(paper.doi)}" target="_blank" rel="noopener noreferrer" aria-label="DOI: ${escape(paper.title)}">DOI</a>
                    </div>
                  </div>
                </div>
              </article>`;
    })
    .join("\n");

  const section = `      <section id="publications" class="section" aria-labelledby="publications-title">
        <div class="container split-section animate-on-scroll">
          <div class="section-heading sticky-heading">
            <p class="section-index">${en ? "III · Publications" : "III · 学术著作"}</p>
            <h2 id="publications-title">${en ? "Selected & Recent Work" : "代表论文与近期成果"}</h2>
            <p class="pub-summary">
              ${
                en
                  ? `Our public NCBI bibliography includes <strong class="inline-highlight" data-publication-total>${data.total}</strong> publications (updated ${verifiedDate}). Browse featured works, recent papers, reviews, or the complete list.`
                  : `NCBI 公开书目库共收录 <strong class="inline-highlight" data-publication-total>${data.total}</strong> 篇发表论文（核对更新于 ${verifiedDate}）。支持按分类、年份或关键词检索。`
              }
            </p>
            <div class="author-legend" aria-label="${en ? "Author notation" : "作者署名说明"}">
              <span><strong class="me">${en ? "Bold" : "粗体"}</strong> ${en ? "Haocheng Lu" : "本人署名"}</span>
              <span><sup>#</sup> ${en ? "Co-first" : "共同第一作者"}</span>
              <span><sup>*</sup> ${en ? "Corresponding" : "通讯作者（含共同通讯）"}</span>
            </div>
            <div class="link-row">
              <a href="${data.source}" target="_blank" rel="noopener noreferrer">
                <span>NCBI Bibliography</span>
                <span aria-hidden="true">↗</span>
              </a>
              <a href="https://www.sustech.edu.cn/zh/faculties/haochenglu.html" target="_blank" rel="noopener noreferrer">
                <span>${en ? "SUSTech Faculty Page" : "南科大教师主页"}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div class="publication-panel">
            <div class="publication-toolbar">
              <div class="tabs" role="tablist" aria-label="${en ? "Publication categories" : "论文分类"}">
                ${tabs}
              </div>
              <div class="publication-filters">
                <div class="pub-search-wrap">
                  <input
                    id="publication-search"
                    class="pub-search"
                    type="search"
                    placeholder="${en ? "Search title, author, journal, or PMID..." : "搜索标题、作者、期刊或 PMID..."}"
                    aria-label="${en ? "Search publications" : "搜索论文"}"
                    autocomplete="off"
                  />
                </div>
                <select id="publication-year" class="pub-year-select" aria-label="${en ? "Filter by year" : "按发表年份筛选"}">
                  <option value="all">${en ? "All years" : "全部年份"}</option>
                  ${years}
                </select>
              </div>
            </div>
            <div class="publication-statusbar">
              <span class="status-note">${en ? "Click any paper title for its PubMed record, or DOI for full text." : "点击论文标题可直达 PubMed 记录，或通过 DOI 访问期刊全文。"}</span>
              <span id="publication-count" class="status-count" role="status" aria-live="polite" aria-atomic="true">${counts.featured} ${en ? "papers shown" : "篇论文"}</span>
            </div>
            <div id="publication-results" class="publication-list" tabindex="0">
${rows}
            </div>
            <div class="pub-empty" id="pub-empty" hidden>
              <p>${en ? "No publications match these filters." : "未找到符合当前筛选条件的论文。"}</p>
              <button type="button" class="button secondary reset-filters">${en ? "Clear filters" : "清除筛选条件"}</button>
            </div>
          </div>
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
  await writeFile(url, html, "utf8");
  console.log(`${file}: ${data.total} publications, ${counts.featured} featured, ${counts.latest} latest, ${counts.reviews} reviews`);
}
