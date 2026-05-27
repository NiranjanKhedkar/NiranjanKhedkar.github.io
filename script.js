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
