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
  

    /* ── HERO: static placeholder graphic (swap via data-img on #heroCv) ── */


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
