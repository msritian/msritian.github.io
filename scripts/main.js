async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function el(tag, attrs = {}, children = []) {
  const svgTags = new Set(["svg","path","rect","circle","line","polyline","polygon","g"]); 
  const node = svgTags.has(tag) ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "href" || k === "target" || k === "rel" || k === "viewBox" || k === "fill" || k === "stroke" || k === "stroke-width" || k === "aria-hidden") node.setAttribute(k, v);
    else node.setAttribute(k, v);
  }
  const kids = Array.isArray(children) ? children : [children];
  kids.filter(Boolean).forEach(c => node.append(c.nodeType ? c : document.createTextNode(c)));
  return node;
}

function renderSocialLinks(links) {
  const container = document.getElementById("social-links");
  if (!container) return;
  container.innerHTML = "";
  (links || []).forEach(l => {
    const a = el("a", { href: l.href, target: "_blank", rel: "noopener noreferrer" }, l.label);
    container.append(a);
  });
}

function renderContact(contact) {
  const linksBox = document.getElementById("contact-links");
  if (!linksBox) return;
  linksBox.innerHTML = "";

  const makeIcon = (label) => {
    const lower = (label || "").toLowerCase();
    if (lower.includes("github")) {
      return el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, [
        el("path", { d: "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.55l-.02-2.02c-3.2.7-3.87-1.54-3.87-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.75-1.57-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.27 1.19-3.07-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.17.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.48 3.17-1.17 3.17-1.17.64 1.59.24 2.77.12 3.06.74.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.37-5.26 5.65.42.36.8 1.07.8 2.16l-.01 3.2c0 .31.21.67.8.55A11.5 11.5 0 0 0 12 .5z", fill: "currentColor" })
      ]);
    }
    if (lower.includes("linkedin")) {
      return el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, [
        el("path", { d: "M20.45 20.45h-3.57v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.32V9h3.42v1.56h.05c.48-.91 1.66-1.85 3.41-1.85 3.65 0 4.33 2.4 4.33 5.53v6.21zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z", fill: "currentColor" })
      ]);
    }
    if (lower.includes("email") || lower.includes("mail")) {
      return el("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "aria-hidden": "true" }, [
        el("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }),
        el("path", { d: "m3 7 9 6 9-6" })
      ]);
    }
    return null;
  };

  (contact || [])
    .filter(c => (c.label || "").toLowerCase() !== "alt email")
    .forEach(c => {
      const icon = makeIcon(c.label);
      const text = c.value || c.label;
      const isEmail = (c.label || "").toLowerCase().includes("email") || (c.label || "").toLowerCase().includes("mail");
      const href = c.href || (isEmail && c.value ? `mailto:${c.value}` : "#");
      const attrs = { href };
      if (href.startsWith("http")) {
        attrs.target = "_blank";
        attrs.rel = "noopener noreferrer";
      }
      const a = el("a", attrs, [icon, el("span", {}, text)].filter(Boolean));
      linksBox.append(a);
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

function renderTimeline(items) {
  const ul = document.getElementById("timeline-list");
  if (!ul) return;
  ul.innerHTML = "";
  (items || [])
    .sort((a,b) => (b.sort || 0) - (a.sort || 0))
    .forEach((i, idx) => {
      const side = idx % 2 === 0 ? 'left' : 'right';
  const cardTitle = i.role ? `${i.role} — ${i.company}` : (i.company || i.title || "");
      const h3 = el("h3", {}, cardTitle);
      // Remove dates from inside cards; keep only location here
      const meta = el("div", { class: "meta" }, i.location || "");
      const bullets = el("ul", {}, (i.highlights || []).map(h => el("li", {}, h)));
      const card = el("div", { class: "t-card" }, [h3, meta, bullets]);
  const date = el("div", { class: "t-date" }, i.dates ? el("span", {}, i.dates) : "");
      const dotMid = el("div", { class: "t-col mid" }, el("div", { class: "t-dot" }));
      let leftCol, rightCol;
      if (side === 'left') {
        leftCol = el("div", { class: "t-col left" }, [card]);
        rightCol = el("div", { class: "t-col right" }, [date]);
      } else {
        leftCol = el("div", { class: "t-col left" }, [date]);
        rightCol = el("div", { class: "t-col right" }, [card]);
      }
      const li = el("li", { class: `t-item ${side}` }, [leftCol, dotMid, rightCol]);
      ul.append(li);
    });
}

function renderEducation(items) {
  const ul = document.getElementById("education-list");
  if (!ul) return;
  ul.innerHTML = "";
  (items || []).forEach((e, idx) => {
    const title = el("strong", {}, `${e.degree} — ${e.school}`);
    const meta = el("div", { class: "meta" }, [e.location || "", e.dates ? ` • ${e.dates}` : "", e.gpa ? ` • GPA ${e.gpa}` : ""].join(""));
    const li = el("li", {}, [title, meta]);
    if (Array.isArray(e.tags) && e.tags.length) {
      const label = el("span", { class: "edu-label" }, "Coursework:");
      const badges = el("div", { class: "badges" }, e.tags.map(t => el("span", { class: "badge" }, t)));
      li.append(label, badges);
    }
    ul.append(li);
  });
}

function renderSkills(groups) {
  const grid = document.getElementById("skills-grid");
  if (!grid) return;
  grid.innerHTML = "";
  (groups || []).forEach(g => {
    const h3 = el("h3", {}, g.title || "");
    const body = el("div", { class: "badges" }, (g.items || []).map(s => el("span", { class: "badge" }, s)));
    grid.append(el("article", { class: "card" }, [h3, body]));
  });
}

function renderProjects(projects) {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;
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

// Safe no-op: prevent runtime errors if scroll spy isn't implemented yet
function setupScrollSpy(){ /* intentionally empty */ }

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
  const quote = about?.quote || "Engineering Intelligent Systems for Real-World Impact";
  const q = document.getElementById("hero-quote-text");
  if (q) q.textContent = quote;
    if (about?.resume) {
      const note = document.getElementById("resume-note");
      if (note) {
        note.innerHTML = "";
        const icon = el("span", { class: "icon", "aria-hidden": "true" }, "📝");
        const text = el("span", {});
        // Build as a single inline run so there is no extra gap before the period
        let resumeHref = about.resume;
        const ver = about.resumeVersion || new Date().toISOString().slice(0,10);
        if (resumeHref && !resumeHref.includes("?")) resumeHref = `${resumeHref}?v=${encodeURIComponent(ver)}`;
        text.append(
          el("span", { class: "muted" }, "You can find my Resume "),
          el("a", { href: resumeHref, target: "_blank", rel: "noopener noreferrer" }, "here"),
          el("span", { class: "muted" }, ".")
        );
        note.append(icon, text);
      }
    }

  renderSocialLinks(profile.links || []);
    // duplicate socials for top bar on large screens
    const top = document.getElementById("top-social");
    if (top) {
      top.innerHTML = "";
      // Map known labels to icons
      const makeIcon = (label) => {
        const lower = (label || "").toLowerCase();
        if (lower.includes("github")) {
          return el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, [
            el("path", { d: "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.55l-.02-2.02c-3.2.7-3.87-1.54-3.87-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.75-1.57-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.27 1.19-3.07-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.17.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.48 3.17-1.17 3.17-1.17.64 1.59.24 2.77.12 3.06.74.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.37-5.26 5.65.42.36.8 1.07.8 2.16l-.01 3.2c0 .31.21.67.8.55A11.5 11.5 0 0 0 12 .5z", fill: "currentColor" })
          ]);
        }
        if (lower.includes("linkedin")) {
          return el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, [
            el("path", { d: "M20.45 20.45h-3.57v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.32V9h3.42v1.56h.05c.48-.91 1.66-1.85 3.41-1.85 3.65 0 4.33 2.4 4.33 5.53v6.21zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z", fill: "currentColor" })
          ]);
        }
        if (lower.includes("phone") || lower.includes("tel")) {
          return el("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "aria-hidden": "true" }, [
            el("path", { d: "M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.18 2 2 0 0 1 4.11 1h2a2 2 0 0 1 2 1.72c.12.86.32 1.7.58 2.5a2 2 0 0 1-.45 2.11L7.1 8.9a16 16 0 0 0 6 6l1.57-1.14a2 2 0 0 1 2.11-.45c.8.26 1.64.46 2.5.58A2 2 0 0 1 22 16.92z" })
          ]);
        }
        if (lower.includes("email") || lower.includes("mail")) {
          return el("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "aria-hidden": "true" }, [
            el("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }),
            el("path", { d: "m3 7 9 6 9-6" })
          ]);
        }
        return null;
      };
      const headerLinks = (profile.links || []).filter((l, idx, arr) => {
        const lower = (l.label || "").toLowerCase();
        if (lower.includes("alt email")) return false; // remove alt email from header
        if (lower.includes("email") || lower.includes("mail")) {
          const first = arr.findIndex(x => (x.label || "").toLowerCase().includes("email") || (x.label || "").toLowerCase().includes("mail"));
          return idx === first; // keep only the first email-like link
        }
        return true;
      });
      headerLinks.forEach(l => {
        const icon = makeIcon(l.label);
        const classes = ["icon-btn"]; if (icon){
          const lower = (l.label || "").toLowerCase();
          if (lower.includes("github")) classes.push("icon-github");
          else if (lower.includes("linkedin")) classes.push("icon-linkedin");
          else if (lower.includes("phone") || l.href?.startsWith("tel:")) classes.push("icon-phone");
          else classes.push("icon-mail");
        }
        const lowerLabel = (l.label || "").toLowerCase();
        const isPhone = lowerLabel.includes("phone") || l.href?.startsWith("tel:");
        const isEmail = lowerLabel.includes("email") || lowerLabel.includes("mail") || l.href?.startsWith("mailto:");
        const emailDisplay = isEmail ? (l.href?.replace(/^mailto:/, "") || l.title || l.label) : null;
        const title = isEmail ? emailDisplay : (l.title || l.label);

        if (isPhone || isEmail) {
          // Render as visible, copyable pill with icon and text (no tooltip)
          const pillClasses = ["contact-pill"]; // custom style for visible text
          if (classes.includes("icon-phone")) pillClasses.push("icon-phone");
          else if (classes.includes("icon-mail")) pillClasses.push("icon-mail");

          const displayText = isPhone ? (l.href?.replace(/^tel:/, "") || l.title || l.label)
                                      : (emailDisplay || l.label);

          const pill = el("span", { class: pillClasses.join(" ") }, [
            icon || document.createTextNode(""),
            el("span", { class: "contact-text" }, displayText)
          ]);
          top.append(pill);
        } else {
          const attrs = { class: classes.join(" "), href: l.href, title };
          if (l.href && (l.href.startsWith("http") || l.href.startsWith("mailto:"))) { attrs.target = "_blank"; attrs.rel = "noopener noreferrer"; }
          const a = el("a", attrs, [
            icon || document.createTextNode(l.label),
            el("span", { class: "sr-only" }, title)
          ]);
          top.append(a);
        }
      });
    }
    renderContact(profile.contact || []);
    renderTimeline(timeline || []);
    renderEducation(education || []);
    renderSkills(skills || []);
    renderProjects(projects || []);

    // Render hero summary chips if provided
    const summaryEl = document.getElementById("hero-summary");
    const summaryItems = about?.summary || [];
    if (summaryEl && Array.isArray(summaryItems) && summaryItems.length) {
      summaryEl.innerHTML = "";
      summaryItems.forEach(s => summaryEl.append(el("span", { class: "badge" }, s)));
    }

    // Availability banner
    const availWrap = document.getElementById("availability");
    if (availWrap && about?.availability) {
      const horn = el("span", { class: "icon", "aria-hidden": "true" }, "📣");
  const mail = el("span", { class: "icon", "aria-hidden": "true" }, "📥");
      availWrap.innerHTML = "";
      const line1 = el("div", { class: "line" }, [horn, el("div", { class: "emph" }, about.availability.headline)]);
      // Change CTA to scroll to the contact form instead of opening mail
      const contactHref = "#contact";
      const ctaLink = el("a", { href: contactHref }, about.availability.cta || "Email me");
      // Smooth scroll and focus the first input for convenience
      ctaLink.addEventListener("click", (e) => {
        e.preventDefault();
        const section = document.getElementById("contact");
        if (section?.scrollIntoView) section.scrollIntoView({ behavior: "smooth", block: "start" });
        // Focus after a tick so the element exists in view
        setTimeout(() => {
          const first = document.getElementById("cf-name") || section?.querySelector("input, textarea, button");
          if (first && typeof first.focus === "function") first.focus();
        }, 350);
      });
      const line2 = el("div", { class: "line muted" }, [mail, ctaLink]);
      availWrap.append(line1, line2);
    }

    // Contact extras: render location like reference (subhead + row, no border box)
    const locWrap = document.querySelector('.contact-left .location');
    if (locWrap) {
      locWrap.innerHTML = "";
      if (about?.location) {
        const sub = el("h4", { class: "contact-subhead" }, "Location");
        const pin = el("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "aria-hidden": "true" }, [
          el("path", { d: "M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10" }),
          el("circle", { cx: "12", cy: "11", r: "2.5" })
        ]);
        const row = el("div", { class: "location-row" }, [pin, el("span", {}, about.location)]);
        locWrap.append(sub, row);
      }
    }
    // Let the native form submission handle POST to FormSubmit

    setupScrollSpy();
  } catch (e) {
    console.error(e);
    const host = document.querySelector("#timeline .container") || document.querySelector("main") || document.body;
    const warn = el("div", { class: "card" }, "Failed to load content. Please check your data/*.json files.");
    if (host?.prepend) host.prepend(warn);
  }
}

boot();
