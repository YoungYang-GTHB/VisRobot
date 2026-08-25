const SITE = {
  manifest: null,
  language: "zh",
  activeTrack: "state",
  evidenceFilter: "all",
};

const copy = (item, field) => item[`${field}_${SITE.language}`] || item[`${field}_zh`] || "";

const VERDICT_COPY = {
  SUPPORTED: { zh: "获得支持", en: "SUPPORTED" },
  FALSIFIED: { zh: "已证否", en: "FALSIFIED" },
  CORRECTED: { zh: "已纠正", en: "CORRECTED" },
  INCONCLUSIVE: { zh: "证据不足", en: "INCONCLUSIVE" },
};

const CATEGORY_COPY = {
  data: { zh: "数据证据", en: "DATA EVIDENCE" },
  learning: { zh: "学习证据", en: "LEARNING EVIDENCE" },
  deployment: { zh: "部署证据", en: "DEPLOYMENT EVIDENCE" },
};

function verdictLabel(verdict) {
  return VERDICT_COPY[verdict]?.[SITE.language] || verdict;
}

function escapeHTML(value) {
  const node = document.createElement("div");
  node.textContent = String(value ?? "");
  return node.innerHTML;
}

async function loadManifest() {
  const response = await fetch("content/site_manifest.json");
  if (!response.ok) throw new Error(`site manifest → HTTP ${response.status}`);
  SITE.manifest = await response.json();
}

function applyLanguage(language) {
  SITE.language = language === "en" ? "en" : "zh";
  document.documentElement.lang = SITE.language === "en" ? "en" : "zh-CN";
  document.querySelectorAll("[data-copy-zh]").forEach((element) => {
    const value = element.dataset[SITE.language === "en" ? "copyEn" : "copyZh"];
    if (value !== undefined) element.textContent = value;
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === SITE.language);
    button.setAttribute("aria-pressed", String(button.dataset.lang === SITE.language));
  });
  renderAll();
}

function renderHeroMetrics() {
  const container = document.querySelector("#hero-metrics");
  if (!container || !SITE.manifest) return;
  container.innerHTML = SITE.manifest.hero_metrics.map((metric) => `
    <article class="metric-card">
      <div class="metric-status">${escapeHTML(copy(metric, "status") || metric.status)}</div>
      <div class="metric-value">${escapeHTML(metric.value)}</div>
      <div class="metric-label">${escapeHTML(copy(metric, "label"))}</div>
      <div class="metric-detail">${escapeHTML(copy(metric, "detail"))}</div>
    </article>
  `).join("");
}

function renderSystemRail() {
  const container = document.querySelector("#system-rail");
  if (!container || !SITE.manifest) return;
  container.innerHTML = SITE.manifest.system_stages.map((stage) => `
    <article class="system-stage" data-tone="${escapeHTML(stage.tone)}">
      <span class="stage-index">${escapeHTML(stage.index)} / ${escapeHTML(SITE.manifest.system_stages.length.toString().padStart(2, "0"))}</span>
      <h3>${escapeHTML(copy(stage, "name"))}</h3>
      <p>${escapeHTML(copy(stage, "summary"))}</p>
    </article>
  `).join("");
}

function renderLearning() {
  if (!SITE.manifest) return;
  const tabs = document.querySelector("#learning-tabs");
  const panel = document.querySelector("#learning-panel");
  const tracks = SITE.manifest.learning_tracks;
  const active = tracks.find((track) => track.id === SITE.activeTrack) || tracks[0];
  if (!active) return;

  tabs.innerHTML = tracks.map((track) => `
    <button class="learning-tab ${track.id === active.id ? "active" : ""}"
            type="button" role="tab" aria-selected="${track.id === active.id}"
            data-track="${escapeHTML(track.id)}">
      ${escapeHTML(copy(track, "name"))}
    </button>
  `).join("");

  panel.innerHTML = `
    <div class="track-eyebrow">${escapeHTML(active.eyebrow)}</div>
    <h3>${escapeHTML(copy(active, "title"))}</h3>
    <p>${escapeHTML(copy(active, "body"))}</p>
    <div class="track-metrics">
      ${(active[`metrics_${SITE.language}`] || active.metrics || []).map((metric) => `<span>${escapeHTML(metric)}</span>`).join("")}
    </div>
  `;

  tabs.querySelectorAll("[data-track]").forEach((button) => {
    button.addEventListener("click", () => {
      SITE.activeTrack = button.dataset.track;
      renderLearning();
    });
  });
}

function renderReports() {
  const container = document.querySelector("#report-grid");
  if (!container || !SITE.manifest) return;
  container.innerHTML = SITE.manifest.reports.map((report) => `
    <a class="report-card" href="${escapeHTML(report.href)}">
      <span class="report-kind">${escapeHTML(report.kind)}</span>
      <strong>${escapeHTML(copy(report, "label"))} →</strong>
    </a>
  `).join("");
}

function renderOtherWork() {
  const container = document.querySelector("#other-work-grid");
  if (!container || !SITE.manifest?.other_work) return;
  container.innerHTML = SITE.manifest.other_work.map((entry) => `
    <article class="other-work-card">
      <div class="other-work-top">
        <span class="report-kind">${escapeHTML(entry.kicker)}</span>
        <span class="verdict" data-verdict="${escapeHTML(entry.status)}">${escapeHTML(copy(entry, "status") || entry.status)}</span>
      </div>
      <h3>${escapeHTML(copy(entry, "title"))}</h3>
      <p>${escapeHTML(copy(entry, "body"))}</p>
      <div class="other-work-result">${escapeHTML(copy(entry, "metric") || entry.metric)}</div>
      <a href="${escapeHTML(entry.href)}">${SITE.language === "en" ? "Open evidence →" : "查看证据 →"}</a>
    </article>
  `).join("");
}

function renderEvidence() {
  const container = document.querySelector("#evidence-grid");
  if (!container || !SITE.manifest) return;
  container.innerHTML = SITE.manifest.evidence_cases.map((entry) => {
    const hidden = SITE.evidenceFilter !== "all" && SITE.evidenceFilter !== entry.category;
    return `
      <article class="evidence-card" data-category="${escapeHTML(entry.category)}" ${hidden ? "hidden" : ""}>
        <div class="evidence-card-top">
          <span class="evidence-id">${escapeHTML(CATEGORY_COPY[entry.category]?.[SITE.language] || entry.category)} · ${escapeHTML(entry.id)}</span>
          <span class="verdict" data-verdict="${escapeHTML(entry.verdict)}">${escapeHTML(verdictLabel(entry.verdict))}</span>
        </div>
        <h3>${escapeHTML(copy(entry, "title"))}</h3>
        <p class="evidence-result">${escapeHTML(copy(entry, "result") || entry.result)}</p>
        <button class="evidence-open" type="button" data-evidence-id="${escapeHTML(entry.id)}">
          ${SITE.language === "en" ? "Inspect reasoning →" : "查看证否逻辑 →"}
        </button>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-evidence-id]").forEach((button) => {
    button.addEventListener("click", () => openEvidence(button.dataset.evidenceId));
  });
}

function openEvidence(id) {
  const entry = SITE.manifest?.evidence_cases.find((item) => item.id === id);
  const dialog = document.querySelector("#evidence-dialog");
  if (!entry || !dialog) return;
  dialog.querySelector("#dialog-kicker").textContent = `${CATEGORY_COPY[entry.category]?.[SITE.language] || entry.category} · ${entry.id} · ${verdictLabel(entry.verdict)}`;
  dialog.querySelector("#dialog-title").textContent = copy(entry, "title");
  dialog.querySelector("#dialog-question").textContent = copy(entry, "question");
  dialog.querySelector("#dialog-result").textContent = copy(entry, "result") || entry.result;
  dialog.querySelector("#dialog-change").textContent = copy(entry, "change");
  dialog.querySelector("#dialog-source").textContent = entry.source;
  dialog.showModal();
}

function renderAll() {
  if (!SITE.manifest) return;
  renderHeroMetrics();
  renderSystemRail();
  renderLearning();
  renderOtherWork();
  renderReports();
  renderEvidence();
}

function bindControls() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.lang));
  });

  const nav = document.querySelector("#site-nav");
  const navToggle = document.querySelector("#nav-toggle");
  navToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-evidence-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      SITE.evidenceFilter = button.dataset.evidenceFilter;
      document.querySelectorAll("[data-evidence-filter]").forEach((candidate) => {
        candidate.classList.toggle("active", candidate === button);
      });
      renderEvidence();
    });
  });

  const dialog = document.querySelector("#evidence-dialog");
  dialog?.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function observeSections() {
  const links = [...document.querySelectorAll("#site-nav a[href^='#']")];
  const byId = new Map(links.map((link) => [link.getAttribute("href").slice(1), link]));
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.remove("active"));
    byId.get(visible.target.id)?.classList.add("active");
  }, { rootMargin: "-22% 0px -62%", threshold: [0.05, 0.2, 0.5] });
  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

async function boot() {
  bindControls();
  observeSections();
  try {
    await loadManifest();
    applyLanguage("zh");
  } catch (error) {
    console.error("Failed to load public site manifest", error);
    document.querySelector("#hero-metrics").innerHTML = `
      <div class="metric-card"><div class="metric-label">Evidence manifest unavailable</div></div>
    `;
  }
}

window.addEventListener("DOMContentLoaded", boot);
