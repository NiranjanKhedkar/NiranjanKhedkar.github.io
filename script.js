// ── GLOBE LOADER ──────────────────────────────────────────────
(function () {
  const canvas = document.getElementById('globeCanvas');
  const ctx    = canvas.getContext('2d');

  const SIZE = 200, DPR = 2;
  ctx.scale(DPR, DPR);
  const CX = SIZE / 2, CY = SIZE / 2, R = 64;

  const projection = d3.geoOrthographic()
    .scale(R).translate([CX, CY]).clipAngle(90);
  const path       = d3.geoPath(projection, ctx);
  const graticule  = d3.geoGraticule10();

  let land = null, countries = null, animId = null;

  const particles = Array.from({ length: 70 }, () => {
    const rad = R + 6 + Math.random() * 24;
    return {
      a: Math.random() * Math.PI * 2, r: rad,
      speed: (0.012 + (R + 30 - rad) / 2600) * (0.8 + Math.random() * 0.4),
      len: 0.12 + Math.random() * 0.5,
      alpha: 0.06 + Math.random() * 0.22,
      wob: Math.random() * Math.PI * 2
    };
  });

  function drawWhirl(t) {
    ctx.lineCap = 'round';
    for (const p of particles) {
      p.a += p.speed;
      const r = p.r + Math.sin(t * 0.0011 + p.wob) * 3;
      ctx.beginPath();
      ctx.arc(CX, CY, r, p.a, p.a + p.len);
      ctx.strokeStyle = `rgba(26,26,26,${p.alpha})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  }

  let rotation = 0;
  function render() {
    const t = performance.now();
    ctx.clearRect(0, 0, SIZE, SIZE);
    rotation += 0.32;
    projection.rotate([rotation, -18, 0]);
    drawWhirl(t);
    ctx.beginPath(); path({ type: 'Sphere' });
    ctx.strokeStyle = 'rgba(26,26,26,0.55)'; ctx.lineWidth = 1; ctx.stroke();
    if (land) {
      ctx.beginPath(); path(graticule);
      ctx.strokeStyle = 'rgba(26,26,26,0.10)'; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.beginPath(); path(land);
      ctx.fillStyle = 'rgba(26,26,26,0.14)'; ctx.fill();
      ctx.beginPath(); path(countries);
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.6; ctx.stroke();
    }
    animId = requestAnimationFrame(render);
  }

  function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.style.display = 'none';
      if (animId) cancelAnimationFrame(animId);
    }, 560);
  }

  const startTime = performance.now();
  function scheduleHide() {
    const elapsed = performance.now() - startTime;
    setTimeout(hideLoader, Math.max(0, 900 - elapsed));
  }

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(world => {
      countries = topojson.feature(world, world.objects.countries);
      land = topojson.merge(world, world.objects.countries.geometries);
      render();
    })
    .catch(() => render());

  if (document.readyState === 'complete') {
    scheduleHide();
  } else {
    window.addEventListener('load', scheduleHide);
  }

  // Hard cap — never block for more than 4s
  setTimeout(hideLoader, 4000);
})();

// ── THEME TOGGLE ──────────────────────────────────────────────
const html = document.documentElement;
const themeBtn = document.getElementById('themeBtn');

// Theme already set by inline head script; just wire up the toggle
themeBtn.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
});


// ── MOBILE NAV ────────────────────────────────────────────────
const navBurger = document.getElementById('navBurger');
const navLinks  = document.getElementById('navLinks');

navBurger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── ACTIVE NAV ON SCROLL ──────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const links    = document.querySelectorAll('.nav-links a');

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(l => l.classList.remove('active'));
    const match = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
    if (match) match.classList.add('active');
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => io.observe(s));

// ── BLOG ──────────────────────────────────────────────────────
const readerOverlay = document.getElementById('readerOverlay');
const readerContent = document.getElementById('readerContent');
const readerBarDate = document.getElementById('readerBarDate');

function formatPostDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadBlogPosts() {
  const grid = document.getElementById('blogGrid');
  try {
    const res = await fetch('assets/blog/index.json');
    if (!res.ok) throw new Error();
    const posts = await res.json();
    if (!posts.length) {
      grid.innerHTML = '<p class="blog-empty">No posts yet — add a <code>.md</code> file and an entry in <code>assets/blog/index.json</code>.</p>';
      return;
    }
    grid.innerHTML = posts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(p => `
        <article class="blog-card" data-slug="${p.slug}">
          <div class="blog-card-top">
            <time class="blog-date">${formatPostDate(p.date)}</time>
            <div class="blog-tags">${(p.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
          </div>
          <h3 class="blog-title">${p.title}</h3>
          <p class="blog-desc">${p.description}</p>
          <span class="blog-read">Read →</span>
        </article>
      `).join('');
    grid.querySelectorAll('.blog-card').forEach(card => {
      const meta = posts.find(p => p.slug === card.dataset.slug);
      card.addEventListener('click', () => openPost(card.dataset.slug, meta));
    });
  } catch {
    grid.innerHTML = '<p class="blog-empty">Blog requires a local server to load posts. Run: <code>python -m http.server 8080</code></p>';
  }
}

async function openPost(slug, meta) {
  readerContent.innerHTML = '<p style="color:var(--text-muted)">Loading…</p>';
  readerBarDate.textContent = meta ? formatPostDate(meta.date) : '';
  readerOverlay.classList.add('open');
  readerOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  readerOverlay.scrollTop = 0;

  try {
    const res = await fetch(`assets/blog/${slug}.md`);
    if (!res.ok) throw new Error();
    const md = await res.text();
    readerContent.innerHTML = marked.parse(md);
  } catch {
    readerContent.innerHTML = '<p>Could not load post.</p>';
  }
}

function closeReader() {
  readerOverlay.classList.remove('open');
  readerOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.getElementById('readerBack').addEventListener('click', closeReader);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && readerOverlay.classList.contains('open')) closeReader();
});

loadBlogPosts();
