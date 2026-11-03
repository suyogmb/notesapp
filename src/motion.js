// Lightweight motion layer for the Stitch design: hero float + parallax,
// scroll reveals, active nav highlighting and the mobile menu.
// Everything is skipped when the visitor prefers reduced motion.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Hero: floating phones/stickers + mouse parallax ---------- */
function initHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero || reduceMotion) return;

  const items = [...hero.querySelectorAll("[data-depth]")].map((el, i) => ({
    el,
    depth: parseFloat(el.dataset.depth) || 0,
    float: el.dataset.float,
    phase: i * 1.3,
  }));
  // Phones float more, stickers bob less, background blobs only parallax.
  const amp = { phone1: 9, phone2: 12, phone3: 10, sticker: 6 };
  const period = { phone1: 6.2, phone2: 5, phone3: 5.6, sticker: 4.2 };

  const stage = hero.querySelector('[data-float="phone2"]')?.parentElement;
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let visible = true;
  let frame = 0;

  if (finePointer) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    hero.addEventListener("pointerleave", () => {
      target.x = 0;
      target.y = 0;
    });
  }

  function tick(t) {
    const s = t / 1000;
    current.x += (target.x - current.x) * 0.06;
    current.y += (target.y - current.y) * 0.06;
    for (const it of items) {
      const a = amp[it.float] || 0;
      const p = period[it.float] || 5;
      const bob = a * Math.sin((s * 2 * Math.PI) / p + it.phase);
      const px = current.x * it.depth * 14;
      const py = current.y * it.depth * 10;
      it.el.style.translate = `${px.toFixed(2)}px ${(py + bob).toFixed(2)}px`;
    }
    if (stage) {
      stage.style.transform = `perspective(1400px) rotateY(${(current.x * 6).toFixed(2)}deg) rotateX(${(-current.y * 4).toFixed(2)}deg)`;
    }
    frame = visible ? requestAnimationFrame(tick) : 0;
  }

  // Only animate while the hero is on screen.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame) frame = requestAnimationFrame(tick);
  }).observe(hero);
}

/* ---------- Technology marquee ----------
   Two identical tracks scroll by their own width + gap, so they must match
   and each must be at least as wide as the screen, or a gap shows. */
function initMarquee() {
  const [track, copy] = document.querySelectorAll("[data-marquee-track]");
  if (!track || !copy) return;
  const chips = [...track.children];
  const minWidth = Math.max(window.screen.width, window.innerWidth);
  for (let i = 0; i < 10 && track.scrollWidth < minWidth; i++) {
    chips.forEach((c) => track.append(c.cloneNode(true)));
  }
  copy.replaceChildren(...[...track.children].map((c) => c.cloneNode(true)));
  // Keep the speed constant (~60px/s) however many chips there are.
  const seconds = Math.round(track.scrollWidth / 60);
  track.style.animationDuration = copy.style.animationDuration = `${seconds}s`;
}

/* ---------- Scroll reveals with stagger ---------- */
function initReveal() {
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const targets = new Set();
  for (const section of document.querySelectorAll("main section:not([data-hero])")) {
    const container = section.firstElementChild;
    if (!container) continue;
    for (const child of container.children) {
      if (child.classList.contains("grid")) {
        [...child.children].forEach((c, i) => {
          c.style.setProperty("--reveal-delay", `${Math.min(i, 6) * 0.08}s`);
          targets.add(c);
        });
      } else {
        targets.add(child);
      }
    }
    // Card grids nested one level deeper also stagger.
    for (const grid of container.querySelectorAll(":scope > * > .grid")) {
      [...grid.children].forEach((c, i) => {
        c.style.setProperty("--reveal-delay", `${Math.min(i, 6) * 0.08}s`);
        targets.add(c);
      });
    }
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  for (const el of targets) {
    // Don't hide a parent and its child at the same time.
    if ([...targets].some((o) => o !== el && o.contains(el) && !o.classList.contains("grid"))) {
      continue;
    }
    el.classList.add("reveal");
    io.observe(el);
  }
}

/* ---------- Active nav link ---------- */
function initActiveNav() {
  const nav = document.querySelector("header nav[data-active-classes]");
  if (!nav) return;
  const active = nav.dataset.activeClasses.split(/\s+/).filter(Boolean);
  const inactive = ["text-on-surface-variant", "hover:text-on-surface", "text-label-lg"];
  const links = [...document.querySelectorAll("header a[data-path]")].filter((a) => a.hash);

  function setActive(id) {
    for (const a of nav.querySelectorAll("a[data-path]")) {
      const on = a.dataset.path === id;
      active.forEach((c) => a.classList.toggle(c, on));
      inactive.forEach((c) => a.classList.toggle(c, !on));
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
  }

  const sections = [...new Set(links.map((a) => a.dataset.path))]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
    },
    // A section is "active" when it crosses the upper-middle of the viewport.
    { rootMargin: "-35% 0px -60% 0px" }
  );
  sections.forEach((s) => io.observe(s));
}

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;
  const icon = toggle.querySelector(".material-symbols-outlined");
  const set = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (icon) icon.textContent = open ? "close" : "menu";
  };
  toggle.addEventListener("click", () => set(menu.hidden));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) set(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
  });
}

export function initMotion() {
  initMobileMenu();
  initMarquee();
  initActiveNav();
  initReveal();
  initHero();
}
