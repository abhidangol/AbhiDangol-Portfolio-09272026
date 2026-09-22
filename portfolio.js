(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    const desktop = matchMedia('(min-width:861px)');
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const dprOf = () => Math.min(window.devicePixelRatio || 1, 2);

    const INK = '#0A0A0A', WHITE = '#FFFFFF', SOFT = '#F2F2F2', ACCENT = '#FF4A1C';

    /* text-roll labels */
    $$('.roll').forEach(el => { const t = el.textContent; el.innerHTML = `<span>${t}</span><span aria-hidden="true">${t}</span>`; });

    /* ════════════════════════════════════════════
       HALFTONE ENGINE
       sample(x, y) returns ink density 0..1 and may set OR = true
       to paint that dot in the accent colour.
       ════════════════════════════════════════════ */
    let OR = false;
    // function renderDots(ctx, W, H, cell, sample, fg, bg, floor = 0) {
    //     ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    //     const pf = new Path2D(), po = new Path2D();
    //     const rowH = cell * .866, rows = Math.ceil(H / rowH) + 1, cols = Math.ceil(W / cell) + 1;
    //     for (let r = 0; r < rows; r++) {
    //         const y = r * rowH, off = (r & 1) ? cell / 2 : 0;
    //         for (let c = 0; c < cols; c++) {
    //             const x = c * cell + off;
    //             OR = false;
    //             let v = sample(x, y);
    //             if (v < floor) v = floor;
    //             if (v <= .012) continue;
    //             const rad = cell * .66 * Math.sqrt(v > 1 ? 1 : v);
    //             const p = OR ? po : pf;
    //             p.moveTo(x + rad, y); p.arc(x, y, rad, 0, 6.2832);
    //         }
    //     }
    //     ctx.fillStyle = fg; ctx.fill(pf);
    //     ctx.fillStyle = ACCENT; ctx.fill(po);
    // }

    // function fitCanvas(cv) {
    //     const r = cv.getBoundingClientRect(), d = dprOf();
    //     const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    //     cv.width = w * d; cv.height = h * d;
    //     const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    //     return { ctx, w, h };
    // }

    /* ── HERO: static placeholder graphic (swap via data-img on #heroCv) ── */
    // const heroCv = $('#heroCv');
    // function initHero() {
    //     if (heroCv.dataset.img) {
    //         const img = new Image(); img.src = heroCv.dataset.img; img.loading = 'eager';
    //         img.alt = heroCv.dataset.alt || 'Portrait photo';
    //         heroCv.replaceWith(img); return;
    //     }
    //     const f = fitCanvas(heroCv), { ctx, w: W, h: H } = f;
    //     const s = Math.min(W, H), cell = W < 600 ? 10 : 13;
    //     const cx = W * .46, cy = H * .5, r1 = s * .34, r2 = s * .1;
    //     renderDots(ctx, W, H, cell, (x, y) => {
    //         const d = Math.hypot(x - cx, y - cy);
    //         if (d > r1) return 0;
    //         return clamp(.16 + (1 - d / r1) * 1.05 + (d < r2 ? .3 : 0), 0, 1);
    //     }, WHITE, INK, .05);
    // }
    // initHero();

    /* ── halftone scenes: static, reused by project cards and process frames ── */
    // const SCENES = {
    //     sphere: (x, y) => { const d = Math.hypot(x, y); return d > .34 ? 0 : clamp(.08 + Math.hypot(x + .13, y + .13) * 1.55, 0, 1); },
    //     rings: (x, y) => { const d = Math.hypot(x, y); return d > .43 ? 0 : .5 + .5 * Math.sin(d * 40); },
    //     moon: (x, y) => Math.hypot(x, y) < .33 && Math.hypot(x - .14, y - .05) > .29 ? 1 : 0,
    //     wave: (x, y, ar, u, v) => (.5 + .5 * Math.sin(x * 20 + Math.sin(y * 8) * 2.4)) * (.35 + .65 * v),
    //     grad: (x, y, ar, u, v) => clamp(u * 1.25 - .1 + (v - .5) * .3, 0, 1),
    //     bars: (x, y, ar, u, v) => (Math.floor(u * 9) % 2 === 0) ? clamp(v * 1.1, 0, 1) : 0,
    //     grid: (x, y, ar, u, v) => ((Math.floor(u * 8) + Math.floor(v * 6)) & 1) ? .9 : .22,
    //     stripes: (x, y) => .5 + .5 * Math.sin((x + y) * 44),
    //     blobs: (x, y) => { let s = 0; for (const [bx, by, R] of [[-.14, .06, .13], [.1, -.05, .16], [.02, .16, .1]]) s += R * R / ((x - bx) ** 2 + (y - by) ** 2 + .0009); return clamp((s - .7) * 1.1, 0, 1); },
    //     arch: (x, y) => { if (Math.abs(x) > .2) return 0; const inside = y < -.1 ? Math.hypot(x, y + .1) < .2 : y <= .32; return inside ? clamp(.25 + (y + .3) * 1.4, 0, 1) : 0; },
    // };

    // const THEMES = { light: [INK, WHITE], grey: [INK, SOFT], dark: [WHITE, INK] };
    // function letterSampler(ch) {
    //     const W = 120, H = 90, c = document.createElement('canvas'); c.width = W; c.height = H;
    //     const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    //     g.fillStyle = '#fff'; g.font = "800 92px Archivo, 'Arial Black', Impact, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    //     g.fillText(ch, W / 2, H * .82);
    //     const d = g.getImageData(0, 0, W, H).data;
    //     return (u, v) => { const i = ((Math.min(H - 1, Math.floor(v * H)) * W) + Math.min(W - 1, Math.floor(u * W))) * 4; return d[i] / 255; };
    // }
    // function drawScene(ctx, w, h, cell, scene, letter, fg, bg) {
    //     const ar = w / h;
    //     renderDots(ctx, w, h, cell, (x, y) => {
    //         const u = x / w, v = y / h;
    //         return letter ? letter(u, v) : scene((u - .5) * ar, v - .5, ar, u, v);
    //     }, fg, bg);
    // }

    /* ── PROJECT CARDS: one static halftone scene per card (or a real image via data-img) ── */
    // function initTiles() {
    //     $$('.cv canvas').forEach(cv => {
    //         if (cv.dataset.img) {
    //             const img = new Image(); img.src = cv.dataset.img; img.loading = 'lazy';
    //             const cap = cv.closest('figure,article'); const nm = cap && cap.querySelector('b,h3');
    //             img.alt = cv.dataset.alt || ((nm ? nm.textContent : 'Project') + ' preview');
    //             cv.replaceWith(img); return;
    //         }
    //         const [fg, bg] = THEMES[cv.dataset.theme] || THEMES.light;
    //         cv.parentElement.style.setProperty('--bg', bg);
    //         const { ctx, w, h } = fitCanvas(cv);
    //         const scene = cv.dataset.scene === 'letter' ? null : SCENES[cv.dataset.scene] || SCENES.rings;
    //         const letter = cv.dataset.scene === 'letter' ? letterSampler(cv.dataset.letter || 'A') : null;
    //         drawScene(ctx, w, h, +cv.dataset.cell || 8, scene, letter, fg, bg);
    //     });
    // }
    // const ready = document.fonts && document.fonts.load ? Promise.race([document.fonts.load("800 92px Archivo"), new Promise(r => setTimeout(r, 1500))]) : Promise.resolve();
    // ready.then(initTiles);

    /* ── PROCESS: one static image per step; the visible frame changes as you scroll ── */
    // const pframes = $$('.pframe');
    // function initProcFrames() {
    //     pframes.forEach(frame => {
    //         const cv = $('canvas', frame); if (!cv) return;
    //         if (cv.dataset.img) {
    //             const img = new Image(); img.src = cv.dataset.img; img.loading = 'lazy'; img.alt = cv.dataset.alt || '';
    //             cv.replaceWith(img); return;
    //         }
    //         const [fg, bg] = THEMES[cv.dataset.theme] || THEMES.dark;
    //         const { ctx, w, h } = fitCanvas(cv);
    //         const scene = cv.dataset.scene === 'letter' ? null : SCENES[cv.dataset.scene] || SCENES.rings;
    //         const letter = cv.dataset.scene === 'letter' ? letterSampler(cv.dataset.letter || 'A') : null;
    //         drawScene(ctx, w, h, 12, scene, letter, fg, bg);
    //     });
    // }
    // initProcFrames();

    /* ── marquees ── */
    const marquees = [];
    $$('.marquee').forEach(el => {
        const track = $('.track', el), set = $('.set', el);
        if (reduce) return;
        const unit = set.innerHTML; let guard = 0;
        while (set.offsetWidth < Math.max(innerWidth, screen.width) * 1.25 && guard++ < 14) set.insertAdjacentHTML('beforeend', unit);
        const clone = set.cloneNode(true); clone.setAttribute('aria-hidden', 'true');
        $$('a,button', clone).forEach(n => n.tabIndex = -1);
        track.appendChild(clone);
        marquees.push({ el, track, set, speed: +el.dataset.speed || 60, vel: el.hasAttribute('data-velocity'), pause: el.hasAttribute('data-hover-pause'), canDrag: el.hasAttribute('data-drag'), drag: false, anim: null, cur: 1, hover: false });
    });
    function build(m) {
        const dist = m.set.offsetWidth; if (!dist) return;
        const rate = m.anim ? m.cur : 1;
        if (m.anim) m.anim.cancel();
        m.anim = m.track.animate([{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${-dist}px,0,0)` }], { duration: dist / m.speed * 1000, iterations: Infinity });
        m.anim.playbackRate = rate;
    }
    marquees.forEach(build);
    if (document.fonts) document.fonts.ready.then(() => marquees.forEach(build));
    const mio = new IntersectionObserver(es => es.forEach(e => {
        const m = marquees.find(x => x.el === e.target);
        if (m && m.anim) e.isIntersecting ? m.anim.play() : m.anim.pause();
    }), { rootMargin: '120px' });
    marquees.forEach(m => mio.observe(m.el));

    /* ── scroll system ── */
    // const header = $('.site-header');
    // const svcs = $$('.svc'), steps = $$('.pstep'), spins = $$('.spin');
    // const curEl = $('#procCur'), nameEl = $('#procName');
    // const tops = new Map();
    // let lastY = scrollY, ticking = false, menuOpen = false, boost = 0, curIdx = 0, rateRaf = 0;

    /* ── scroll system ── */
    const header = $('.site-header');
    const svcs = $$('.svc');
    const steps = $$('.pstep');
    const pframes = $$('.pframe');
    const spins = $$('.spin');

    const curEl = $('#procCur');
    const nameEl = $('#procName');

    const tops = new Map();

    let lastY = scrollY;
    let ticking = false;
    let menuOpen = false;
    let boost = 0;
    let curIdx = 0;
    let rateRaf = 0;


    function measure() { svcs.forEach(c => { c.style.removeProperty('--s'); tops.set(c, parseFloat(getComputedStyle(c).top) || 0); }); }
    measure();

    function stackFX() {
        if (!desktop.matches || reduce) { svcs.forEach(c => { c.style.removeProperty('--s'); c.style.removeProperty('--dim'); }); return; }
        const vh = innerHeight;
        const p = svcs.map((c, j) => j === 0 ? 0 : clamp((vh - c.getBoundingClientRect().top) / (vh - tops.get(c)), 0, 1));
        svcs.forEach((c, i) => {
            let d = 0; for (let j = i + 1; j < svcs.length; j++) d += p[j];
            c.style.setProperty('--s', (1 - .03 * d).toFixed(4));
            c.style.setProperty('--dim', (.06 * d).toFixed(3));
        });
    }
    function processIdx() {
        let idx = 0;
        steps.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .55) idx = i; });
        if (idx !== curIdx) {
            curIdx = idx;
            steps.forEach((s, i) => s.classList.toggle('on', i === idx));
            pframes.forEach((f, i) => f.classList.toggle('on', i === idx));
            curEl.textContent = String(idx + 1).padStart(2, '0');
            nameEl.textContent = steps[idx].dataset.name;
        }
    }
    /* one controller eases every marquee toward its target speed:
       0 while hovered/focused (data-hover-pause), otherwise 1 plus a scroll-speed boost */
    function kickRates() { if (!rateRaf) rateRaf = requestAnimationFrame(rateTick); }
    function rateTick() {
        boost *= .93; if (boost < .02) boost = 0;
        let busy = boost > 0;
        marquees.forEach(m => {
            if (!m.anim) return;
            const target = (m.drag || (m.pause && m.hover) ? 0 : 1) * (m.vel ? 1 + boost : 1);
            m.cur += (target - m.cur) * .14;
            if (Math.abs(target - m.cur) > .004) busy = true; else m.cur = target;
            m.anim.playbackRate = m.cur;
        });
        rateRaf = busy ? requestAnimationFrame(rateTick) : 0;
    }
    marquees.filter(m => m.pause).forEach(m => {
        const on = v => () => { m.hover = v; kickRates(); };
        m.el.addEventListener('pointerenter', on(true));
        m.el.addEventListener('pointerleave', on(false));
        m.el.addEventListener('focusin', on(true));
        m.el.addEventListener('focusout', on(false));
    });

    /* ── drag / swipe / horizontal-wheel scrolling for the projects strip ──
       While the user is in control we drive the animation's playhead directly
       (eased for smoothness), coast with inertia on release, then hand back to
       hover-pause or autoplay. The strip loops seamlessly in both directions. */
    marquees.filter(m => m.canDrag).forEach(m => {
        const el = m.el; el.classList.add('draggable');
        let mode = 'idle', tC = 0, tT = 0, vel = 0, last = 0, raf = 0, wheelTO = 0;
        let down = false, moved = false, suppress = false, sx = 0, tStart = 0, pid = null;
        const wrap = t => { const d = m.anim.effect.getComputedTiming().duration; return ((t % d) + d) % d; };
        const ms = px => px * 1000 / m.speed;                       /* pixels -> animation time */
        function begin() {
            if (!m.anim) return false;
            if (mode === 'idle') { tC = tT = +m.anim.currentTime || 0; vel = 0; }
            m.drag = true; m.cur = 0; m.anim.playbackRate = 0;
            if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
            return true;
        }
        function finish() { mode = 'idle'; m.drag = false; raf = 0; el.classList.remove('dragging'); kickRates(); }
        function loop(now) {
            const dt = Math.min(64, Math.max(1, now - last)); last = now;
            if (mode === 'follow') {
                const prev = tC; tC += (tT - tC) * (1 - Math.exp(-dt / 55));
                vel = vel * .6 + ((tC - prev) / dt) * .4;
            } else if (mode === 'inertia') {
                tC += vel * dt; vel *= Math.exp(-dt / 340);
                if (Math.abs(vel) < 1) { m.anim.currentTime = wrap(tC); finish(); return; }
            }
            m.anim.currentTime = wrap(tC);
            raf = requestAnimationFrame(loop);
        }
        el.addEventListener('pointerdown', e => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            down = true; moved = false; suppress = false; sx = e.clientX; pid = e.pointerId;
            if (mode === 'inertia') { mode = 'follow'; tT = tC; vel = 0; }   /* catch a flick */
        });
        el.addEventListener('pointermove', e => {
            if (!down || e.pointerId !== pid) return;
            if (!moved) {
                if (Math.abs(e.clientX - sx) < 5) return;
                if (!begin()) return;
                moved = true; suppress = true; mode = 'follow'; tStart = tT; sx = e.clientX;
                el.classList.add('dragging');
                try { el.setPointerCapture(pid); } catch (_) { }
            }
            tT = tStart - ms(e.clientX - sx);
        });
        const up = e => {
            if (!down || e.pointerId !== pid) return;
            down = false;
            try { el.releasePointerCapture(pid); } catch (_) { }
            if (!moved) return;
            mode = 'inertia'; el.classList.remove('dragging');
        };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('click', e => { if (suppress) { e.preventDefault(); e.stopPropagation(); suppress = false; } }, true);
        el.addEventListener('dragstart', e => e.preventDefault());
        el.addEventListener('wheel', e => {                          /* trackpad / shift+wheel */
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || !m.anim) return;
            e.preventDefault();
            if (!begin()) return;
            if (mode === 'inertia') { tT = tC; vel = 0; }
            mode = 'follow'; tT += ms(e.deltaX);
            clearTimeout(wheelTO); wheelTO = setTimeout(() => { if (!down) mode = 'inertia'; }, 120);
        }, { passive: false });
    });

    function update() {
        ticking = false;
        const y = scrollY, dy = y - lastY;
        if (!menuOpen) {
            if (dy > 2 && y > 320) header.classList.add('hide');
            else if (dy < -2) header.classList.remove('hide');
        }
        if (!reduce) {
            boost = Math.min(4, Math.max(boost, Math.abs(dy) / 22));
            if (boost > .05) kickRates();
            spins.forEach(s => s.style.transform = `rotate(${(y * .12) % 360}deg)`);
        }
        lastY = y;
        stackFX(); processIdx();
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    // let rz; addEventListener('resize', () => {
    //     clearTimeout(rz);
    //     rz = setTimeout(() => { marquees.forEach(build); initHero(); initTiles(); initProcFrames(); measure(); update(); }, 200);
    // });

    let rz; addEventListener('resize', () => {
        clearTimeout(rz);
        rz = setTimeout(() => {
            marquees.forEach(build);
            measure();
            update();
        }, 200);
    });

    /* ── mobile menu ── */
    const burger = $('#burger'), menu = $('#menu');
    function setMenu(open) {
        menuOpen = open;
        menu.classList.toggle('open', open);
        menu.setAttribute('aria-hidden', String(!open));
        burger.setAttribute('aria-expanded', String(open));
        burger.textContent = open ? 'Close' : 'Menu';
        document.body.classList.toggle('menu-open', open);
        document.body.classList.toggle('lock', open);
        if (open) header.classList.remove('hide');
    }
    burger.addEventListener('click', () => setMenu(!menuOpen));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    desktop.addEventListener('change', () => { if (desktop.matches) setMenu(false); measure(); update(); });

    /* ── footer bits ── */
    $('#year').textContent = new Date().getFullYear();
    $('#toTop').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
})();
