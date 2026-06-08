/* GA EP Training & Infrastructure plan - rendering + i18n binding */
(function () {
  "use strict";

  const STRINGS = window.EP_STRINGS || {};
  const LANG_KEY = "ga-dash-lang"; // shared with the other dashboards

  // Static sources list (URLs are stable; the labels are i18n-friendly enough to leave in English short-form).
  const SOURCES = [
    {
      label: "Election Protection 2024 Hotline Volunteer Guide (866-OUR-VOTE)",
      url: "https://866ourvote.org/wp-content/uploads/2022/11/2024-Hotline-Volunteer-Guide.pdf"
    },
    {
      label: "Election Protection Voter-Facing Intimidation/Polling-Place Guidance",
      url: "https://866ourvote.org/wp-content/uploads/2024/10/Intimidation_Polling-Place-Issues-Volunteer-Facing-Guidance.pdf"
    },
    {
      label: "Election Protection Guidance on Voter Intimidation",
      url: "https://866ourvote.org/wp-content/uploads/2020/11/Election-Protection-Guidance-on-Voter-Intimidation-re-up.pdf"
    },
    {
      label: "Brennan Center: Georgia Election Observers Rules and Constraints",
      url: "https://www.brennancenter.org/our-work/research-reports/georgia-election-observers-rules-and-constraints"
    },
    {
      label: "Brennan Center: Law in Georgia on Voter Intimidation, Poll Watchers, and Challengers",
      url: "https://www.brennancenter.org/our-work/research-reports/law-georgia-voter-intimidation-poll-watchers-and-challengers"
    },
    {
      label: "Brennan Center: Guide to Laws Against Intimidation of Voters and Election Workers",
      url: "https://www.brennancenter.org/our-work/research-reports/guide-laws-against-intimidation-voters-and-election-workers"
    },
    {
      label: "ACLU: What Is Voter Intimidation?",
      url: "https://www.aclu.org/sites/default/files/field_pdf_file/kyr-voterintimidation-v03.pdf"
    },
    {
      label: "O.C.G.A. § 21-2-408 (poll watchers and observers)",
      url: "https://law.justia.com/codes/georgia/title-21/chapter-2/article-11/part-1/section-21-2-408/"
    },
    {
      label: "Everytown Law: Election Protection (federal statutes summary)",
      url: "https://everytownlaw.org/report/election-protection/"
    },
    {
      label: "Lawyers' Committee for Civil Rights Under Law",
      url: "https://www.lawyerscommittee.org/"
    },
    {
      label: "CLINIC Rapid Response Toolkit",
      url: "https://www.cliniclegal.org/toolkits/rapid-response-toolkit"
    },
    {
      label: "Legal Aid Justice Center Rapid Response Toolkit",
      url: "https://www.justice4all.org/rapid-response-toolkit/"
    },
    {
      label: "NILC / TIRRC Worksite Raids Response webinar series",
      url: "https://www.nilc.org/resources/worksite-raids-resistance-response-tirrc-nilc-webinar-training-series/"
    },
    {
      label: "Michigan Immigrant Rights Center: Preparing Your Community Toolkit",
      url: "https://michiganimmigrant.org/documents/preparing-your-community-immigration-enforcement-toolkit"
    },
    {
      label: "SFILDC Rapid Response",
      url: "https://sfildc.org/our-work/rapid-response/"
    }
  ];

  function t(key) {
    const lang = getLang();
    const dict = STRINGS[lang] || STRINGS.en || {};
    return dict[key] || (STRINGS.en && STRINGS.en[key]) || key;
  }

  function getLang() {
    const stored = localStorage.getItem(LANG_KEY);
    return STRINGS[stored] ? stored : "en";
  }

  function applyLang(lang) {
    const dict = STRINGS[lang] || STRINGS.en;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      if (dict[k]) el.textContent = dict[k];
    });
    document.querySelectorAll(".lang-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-lang-btn") === lang);
    });
    // Re-render dynamic blocks that pull from i18n
    renderRoles();
    renderMatrix();
    renderRubric();
    renderCurriculum();
    renderFormPages();
    renderSeverityTable();
    renderRegions();
    renderOnboarding();
    renderSources();
    // Doc title
    const docTitle = dict["doc.title"];
    if (docTitle) document.title = docTitle;
  }

  function setLang(lang) {
    if (!STRINGS[lang]) return;
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }
  window.setLang = setLang; // for manual testing

  // -- Role cards
  function renderRoles() {
    const host = document.getElementById("role-grid");
    if (!host) return;
    host.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const card = document.createElement("div");
      card.className = "role-card";
      const dos = [t(`role.${i}.do.1`), t(`role.${i}.do.2`), t(`role.${i}.do.3`)];
      const donts = [t(`role.${i}.dont.1`), t(`role.${i}.dont.2`), t(`role.${i}.dont.3`)];
      card.innerHTML = `
        <div class="num">ROLE 0${i}</div>
        <h3>${escapeHtml(t(`role.${i}.name`))}</h3>
        <div class="sla">${escapeHtml(t(`role.${i}.sla`))}</div>
        <p class="role-mission">${escapeHtml(t(`role.${i}.mission`))}</p>
        <ul>
          ${dos.map(d => `<li class="do">${escapeHtml(d)}</li>`).join("")}
          ${donts.map(d => `<li class="dont">${escapeHtml(d)}</li>`).join("")}
        </ul>
      `;
      host.appendChild(card);
    }
  }

  // -- Do/Don't matrix
  function renderMatrix() {
    const body = document.getElementById("matrix-body");
    if (!body) return;
    body.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="role-name">${escapeHtml(t(`role.${i}.name`))}</td>
        <td class="do-col">${escapeHtml(t(`matrix.row.${i}.do`))}</td>
        <td class="dont-col">${escapeHtml(t(`matrix.row.${i}.dont`))}</td>
      `;
      body.appendChild(tr);
    }
  }

  // -- Escalation rubric
  function renderRubric() {
    const host = document.getElementById("rubric-grid");
    if (!host) return;
    host.innerHTML = "";
    ["red", "yellow", "green"].forEach(level => {
      const card = document.createElement("div");
      card.className = `rubric-card ${level}`;
      card.innerHTML = `
        <h3 class="${level}">${escapeHtml(t(`rubric.${level}.name`))}</h3>
        <div class="sla-pill">${escapeHtml(t(`rubric.${level}.sla`))}</div>
        <p class="trigger">${escapeHtml(t(`rubric.${level}.trigger`))}</p>
        <p class="action">${escapeHtml(t(`rubric.${level}.action`))}</p>
      `;
      host.appendChild(card);
    });
  }

  // -- 90-minute curriculum (7 modules)
  function renderCurriculum() {
    const host = document.getElementById("curriculum-grid");
    if (!host) return;
    host.innerHTML = "";
    const times = ["10 min", "15 min", "15 min", "20 min", "15 min", "10 min", "5 min"];
    for (let i = 1; i <= 7; i++) {
      const mod = document.createElement("div");
      mod.className = "module";
      mod.innerHTML = `
        <div>
          <span class="mod-num">M${i.toString().padStart(2, "0")}</span>
          <span class="mod-time">${times[i - 1]}</span>
        </div>
        <h4>${escapeHtml(t(`mod.${i}.t`))}</h4>
        <p>${escapeHtml(t(`mod.${i}.d`))}</p>
      `;
      host.appendChild(mod);
    }
  }

  // -- Airtable form pages
  function renderFormPages() {
    const list = document.getElementById("form-pages-list");
    if (!list) return;
    list.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const li = document.createElement("li");
      li.textContent = t(`form.${i}`);
      list.appendChild(li);
    }
  }

  // -- Severity auto-set table
  function renderSeverityTable() {
    const body = document.getElementById("severity-body");
    if (!body) return;
    body.innerHTML = "";
    const rows = [
      { level: t("rubric.red.name"), levelClass: "red", trigger: t("sev.red.trigger"), action: t("sev.red.action") },
      { level: t("rubric.yellow.name"), levelClass: "yellow", trigger: t("sev.yellow.trigger"), action: t("sev.yellow.action") },
      { level: t("rubric.green.name"), levelClass: "green", trigger: t("sev.green.trigger"), action: t("sev.green.action") }
    ];
    rows.forEach(r => {
      const tr = document.createElement("tr");
      const color = r.levelClass === "red" ? "var(--risk-critical)"
        : r.levelClass === "yellow" ? "var(--risk-medium)"
        : "var(--risk-low)";
      tr.innerHTML = `
        <td class="role-name" style="color: ${color};">${escapeHtml(r.level)}</td>
        <td class="do-col">${escapeHtml(r.trigger)}</td>
        <td class="dont-col">${escapeHtml(r.action)}</td>
      `;
      body.appendChild(tr);
    });
  }

  // -- Regions
  function renderRegions() {
    const host = document.getElementById("regions-grid");
    if (!host) return;
    host.innerHTML = "";
    for (let i = 1; i <= 7; i++) {
      const card = document.createElement("div");
      card.className = "region-card";
      card.innerHTML = `
        <h4>${escapeHtml(t(`region.${i}.name`))}</h4>
        <p class="counties">${escapeHtml(t(`region.${i}.counties`))}</p>
        <p class="lead">${escapeHtml(t(`region.${i}.lead`))}</p>
      `;
      host.appendChild(card);
    }
  }

  // -- Onboarding checklist
  function renderOnboarding() {
    const list = document.getElementById("onboarding-list");
    if (!list) return;
    list.innerHTML = "";
    for (let i = 1; i <= 8; i++) {
      const li = document.createElement("li");
      li.textContent = t(`ob.${i}`);
      list.appendChild(li);
    }
  }

  // -- Sources
  function renderSources() {
    const host = document.getElementById("source-list");
    if (!host) return;
    host.innerHTML = SOURCES.map(s =>
      `<div>· <a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a></div>`
    ).join("");
  }

  // -- Theme toggle (shared pattern with other dashboards)
  function initTheme() {
    const btn = document.querySelector("[data-theme-toggle]");
    const root = document.documentElement;
    let mode = window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
    root.setAttribute("data-theme", mode);
    function setIcon() {
      btn.innerHTML = mode === "dark"
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
    setIcon();
    btn.addEventListener("click", () => {
      mode = mode === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", mode);
      setIcon();
    });
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // -- Boot
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    document.querySelectorAll(".lang-btn").forEach(b => {
      b.addEventListener("click", () => setLang(b.getAttribute("data-lang-btn")));
    });
    applyLang(getLang());
  });
})();
