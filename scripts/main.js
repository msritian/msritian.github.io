async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "href" || k === "target" || k === "rel") node.setAttribute(k, v);
    else node.setAttribute(k, v);
  }
  const kids = Array.isArray(children) ? children : [children];
  kids.filter(Boolean).forEach(c => node.append(c.nodeType ? c : document.createTextNode(c)));
  return node;
}

function renderSocialLinks(links) {
  const container = document.getElementById("social-links");
  container.innerHTML = "";
  (links || []).forEach(l => {
    const a = el("a", { href: l.href, target: "_blank", rel: "noopener noreferrer" }, l.label);
    container.append(a);
  });
}

function renderContact(contact) {
  const ul = document.getElementById("contact-list");
  ul.innerHTML = "";
  (contact || []).forEach(c => {
    const left = el("span", {}, c.label);
    const right = c.href ? el("a", { href: c.href, target: "_blank", rel: "noopener noreferrer" }, c.value) : el("span", {}, c.value);
    ul.append(el("li", {}, [left, right]));
  });
}

function makeTagFilters(items, key, onChange) {
  const allTags = new Set(items.flatMap(i => i.tags || []));
  const filters = document.getElementById(key + "-filters");
  filters.innerHTML = "";
  if (!allTags.size) return;
  const btnAll = el("button", { class: "filter active" }, "All");
  btnAll.addEventListener("click", () => {
    filters.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btnAll.classList.add("active");
    onChange(null);
  });
  filters.append(btnAll);
  allTags.forEach(tag => {
    const btn = el("button", { class: "filter" }, tag);
    btn.addEventListener("click", () => {
      filters.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onChange(tag);
    });
    filters.append(btn);
  });
}

function renderWorks(works) {
  const grid = document.getElementById("works-grid");
  function draw(filterTag) {
    grid.innerHTML = "";
    (works || [])
      .filter(w => !filterTag || (w.tags || []).includes(filterTag))
      .sort((a,b) => (b.year || 0) - (a.year || 0))
      .forEach(w => {
        const titleNode = w.link
          ? el("a", { href: w.link, target: "_blank", rel: "noopener noreferrer" }, w.title)
          : document.createTextNode(w.title);
        const h3 = el("h3", {}, titleNode);
        const p = el("p", {}, w.description || "");
        const tags = el("div", { class: "badges" }, (w.tags || []).map(t => el("span", { class: "badge" }, t)));
        const meta = el("div", { class: "badges" }, [
          w.year ? el("span", { class: "badge" }, String(w.year)) : null,
          w.repo ? el("a", { class: "badge", href: w.repo, target: "_blank", rel: "noopener noreferrer" }, "Code") : null
        ]);
        grid.append(el("article", { class: "card" }, [h3, p, tags, meta]));
      });
  }
  makeTagFilters(works, "works", draw);
  draw(null);
}

function renderReading(reading) {
  const ul = document.getElementById("reading-list");
  const statuses = Array.from(new Set((reading || []).map(r => r.status).filter(Boolean)));
  function draw(filter) {
    ul.innerHTML = "";
    (reading || [])
      .filter(r => !filter || r.status === filter)
      .forEach(r => {
        const a = el("a", { href: r.href, target: "_blank", rel: "noopener noreferrer" }, r.title);
        const meta = el("div", { class: "meta" }, [
          r.authors?.length ? r.authors.join(", ") : "",
          r.source ? ` • ${r.source}` : "",
          r.status ? ` • ${r.status}` : ""
        ].join(""));
        const notes = r.notes ? el("div", { class: "meta" }, r.notes) : null;
        ul.append(el("li", {}, [a, meta, notes]));
      });
  }
  const filters = document.getElementById("reading-filters");
  filters.innerHTML = "";
  if (statuses.length) {
    const all = el("button", { class: "filter active" }, "All");
    all.addEventListener("click", () => {
      filters.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
      all.classList.add("active");
      draw(null);
    });
    filters.append(all);
    statuses.forEach(s => {
      const b = el("button", { class: "filter" }, s);
      b.addEventListener("click", () => {
        filters.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        draw(s);
      });
      filters.append(b);
    });
  }
  draw(null);
}

function setupScrollSpy() {
  const links = Array.from(document.querySelectorAll('[data-nav]'));
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const active = new Set();
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      const link = links.find(a => a.getAttribute('href') === `#${id}`);
      if (!link) return;
      if (entry.isIntersecting) {
        active.add(link);
      } else {
        active.delete(link);
      }
    });
    links.forEach(l => l.classList.remove('active'));
    const pick = links.find(l => active.has(l)) || null;
    if (pick) pick.classList.add('active');
  }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 1.0] });
  sections.forEach(s => obs.observe(s));
}

function renderTimeline(items) {
  const ul = document.getElementById("timeline-list");
  ul.innerHTML = "";
  (items || [])
    .sort((a,b) => (b.sort || 0) - (a.sort || 0))
    .forEach(i => {
      const title = el("strong", {}, i.role ? `${i.role} — ${i.company}` : i.title || i.company || "");
      const meta = el("div", { class: "meta" }, [i.location || "", (i.dates ? ` • ${i.dates}` : "")].join(""));
      const bullets = el("ul", { class: "t-bullets" }, (i.highlights || []).map(h => el("li", {}, h)));
      const body = el("div", { class: "t-body" }, [title, meta, bullets]);
      const date = el("div", { class: "t-date" }, i.dates || "");
      ul.append(el("li", {}, [date, body]));
    });
}

function renderEducation(items) {
  const ul = document.getElementById("education-list");
  ul.innerHTML = "";
  (items || []).forEach(e => {
    const title = el("strong", {}, `${e.degree} — ${e.school}`);
    const meta = el("div", { class: "meta" }, [e.location || "", e.dates ? ` • ${e.dates}` : "", e.gpa ? ` • GPA ${e.gpa}` : ""].join(""));
    ul.append(el("li", {}, [title, meta]));
  });
}

function renderSkills(groups) {
  const grid = document.getElementById("skills-grid");
  grid.innerHTML = "";
  (groups || []).forEach(g => {
    const h3 = el("h3", {}, g.title || "");
    const body = el("div", { class: "badges" }, (g.items || []).map(s => el("span", { class: "badge" }, s)));
    grid.append(el("article", { class: "card" }, [h3, body]));
  });
}

function renderProjects(projects) {
  const grid = document.getElementById("projects-grid");
  grid.innerHTML = "";
  (projects || []).forEach(p => {
    const titleNode = p.link ? el("a", { href: p.link, target: "_blank", rel: "noopener noreferrer" }, p.title) : el("span", {}, p.title || "");
    const h3 = el("h3", {}, titleNode);
    const desc = el("p", {}, p.description || "");
    const meta = el("div", { class: "badges" }, [
      p.org ? el("span", { class: "badge" }, p.org) : null,
      p.when ? el("span", { class: "badge" }, p.when) : null,
    ].filter(Boolean));
    const tags = el("div", { class: "badges" }, (p.tags || []).map(t => el("span", { class: "badge" }, t)));
    grid.append(el("article", { class: "card" }, [h3, desc, meta, tags]));
  });
}

async function boot() {
  try {
    const [profile, about, timeline, education, skills, projects] = await Promise.all([
      loadJSON("data/profile.json"),
      loadJSON("data/about.json").catch(() => ({})),
      loadJSON("data/timeline.json").catch(() => ([])),
      loadJSON("data/education.json").catch(() => ([])),
      loadJSON("data/skills.json").catch(() => ([])),
      loadJSON("data/projects.json").catch(() => ([])),
    ]);

  const elName = document.getElementById("name"); if (elName) elName.textContent = profile.name || "Shivam Mittal";
  const elFooterName = document.getElementById("footer-name"); if (elFooterName) elFooterName.textContent = profile.name || "Shivam Mittal";
  const elTag = document.getElementById("tagline"); if (elTag) elTag.textContent = profile.tagline || "";
  const elBio = document.getElementById("bio"); if (elBio) elBio.textContent = profile.bio || "";
    document.getElementById("year").textContent = new Date().getFullYear();
  if (profile.avatar) { const a = document.getElementById("avatar"); if (a) a.src = profile.avatar; }
  if (profile.avatar) { const ha = document.getElementById("hero-avatar"); if (ha) ha.src = profile.avatar; }
  if (about?.location) { const loc = document.getElementById("location"); if (loc) loc.textContent = about.location; }
  if (about?.location) { const mloc = document.getElementById("mini-location"); if (mloc) mloc.textContent = about.location; }
  const quote = about?.quote || "Build what you wish existed.";
  const q = document.getElementById("hero-quote-text");
  if (q) q.textContent = quote;
    if (about?.resume) {
      const a = document.getElementById("resume-link");
      a.href = about.resume;
    }

  renderSocialLinks(profile.links || []);
    // duplicate socials for top bar on large screens
    const top = document.getElementById("top-social");
    if (top) {
      (profile.links || []).forEach(l => {
        const a = el("a", { href: l.href, target: "_blank", rel: "noopener noreferrer" }, l.label);
        top.append(a);
      });
    }
    renderContact(profile.contact || []);
    renderTimeline(timeline || []);
    renderEducation(education || []);
    renderSkills(skills || []);
    renderProjects(projects || []);

    setupScrollSpy();
  } catch (e) {
    console.error(e);
    const host = document.querySelector("#timeline .container") || document.querySelector("main") || document.body;
    const warn = el("div", { class: "card" }, "Failed to load content. Please check your data/*.json files.");
    if (host?.prepend) host.prepend(warn);
  }
}

boot();
