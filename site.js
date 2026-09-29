(() => {
    'use strict';

    // Motion tuning. Set a strength to 0 to disable that individual effect.
    const MOTION = Object.freeze({
        parallaxStrength: 1,
        maxParallaxPx: 80,
        tabletParallaxScale: 0.35,
        heroCursorPx: 10,
        cardTiltDegrees: 2.2,
        pointerEasing: 0.15,
        pointerHighlight: true
    });

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = matchMedia('(max-width: 850px)');
    const mobileScreen = matchMedia('(max-width: 600px)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const header = document.querySelector('.site-header');
    const menu = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');
    const motionButton = document.querySelector('#motion-toggle');
    const hero = document.querySelector('.hero-section');
    const heroCursor = document.querySelector('.hero-cursor');
    const lightbox = document.querySelector('#avatar-view');
    const portraitLink = document.querySelector('.profile-avatar-container');
    const parallax = [...document.querySelectorAll('[data-parallax]')];
    const sections = [...document.querySelectorAll('main section[id]')];
    const reveals = [...document.querySelectorAll('[data-reveal]')];
    const lanes = [...document.querySelectorAll('.cat-lane')];
    const cards = [...document.querySelectorAll('[data-tilt]')].map(element => ({
        element, wrapper: element.closest('.project-reveal'), visible: false,
        x: 0, y: 0, targetX: 0, targetY: 0, glowX: 0, glowY: 0,
        targetGlowX: 0, targetGlowY: 0, hovered: false, bounds: null
    }));
    const cursor = { x: 0, y: 0, targetX: 0, targetY: 0, bounds: null };
    const seen = new WeakSet();
    const controller = new AbortController();
    const { signal } = controller;
    let frame = 0;
    let paused = false;
    let suspended = false;
    let scrollDirty = true;
    let heroVisible = true;
    let lastSection = '';
    let scrollListening = false;
    let revealObserver;
    let visibilityObserver;
    let dialogOpen = false;
    let previousFocus;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const motionAllowed = () => !paused && !reducedMotion.matches && !document.hidden && !suspended;
    const cursorAllowed = () => motionAllowed() && finePointer.matches && !mobileScreen.matches;

    /* Navigation and forms are independent from animation enhancement. */
    function setMenu(open) {
        nav.classList.toggle('is-open', open);
        menu.setAttribute('aria-expanded', String(open));
    }
    menu.hidden = false;
    header.classList.add('menu-enhanced');
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'), { signal });
    nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); }, { signal });
    header.addEventListener('keydown', event => {
        if (event.key === 'Escape' && smallScreen.matches) { setMenu(false); menu.focus(); }
    }, { signal });
    document.addEventListener('click', event => {
        if (smallScreen.matches && !header.contains(event.target)) setMenu(false);
    }, { signal });
    document.querySelector('.contact-form').addEventListener('submit', event => event.preventDefault(), { signal });

    /* One scheduled frame handles scroll and eased pointer updates. No idle loop. */
    function scheduleFrame() {
        if (!frame && !document.hidden && !suspended) frame = requestAnimationFrame(render);
    }
    function ease(current, target) {
        return Math.abs(target - current) < 0.015 ? target : current + (target - current) * MOTION.pointerEasing;
    }
    function render() {
        frame = 0;
        if (document.hidden || suspended) return;
        if (scrollDirty) {
            scrollDirty = false;
            // Read layout before writing any transforms.
            const active = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 165) || sections[0];
            const scrollY = window.scrollY;
            if (active && active.id !== lastSection) {
                lastSection = active.id;
                nav.querySelectorAll('a').forEach(link => {
                    if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            }
            if (motionAllowed() && !mobileScreen.matches) {
                const strength = MOTION.parallaxStrength * (smallScreen.matches ? MOTION.tabletParallaxScale : 1);
                parallax.forEach(element => {
                    if (element.hasAttribute('data-parallax-hero') && !heroVisible) return;
                    const limit = Number(element.dataset.parallaxLimit || MOTION.maxParallaxPx);
                    const offset = clamp(scrollY * Number(element.dataset.parallax) * strength, -limit, limit);
                    element.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
                });
            }
        }
        if (!cursorAllowed()) return;
        let settling = false;
        if (heroVisible) {
            cursor.x = ease(cursor.x, cursor.targetX);
            cursor.y = ease(cursor.y, cursor.targetY);
            heroCursor.style.transform = `translate3d(${cursor.x.toFixed(2)}px, ${cursor.y.toFixed(2)}px, 0)`;
            settling ||= cursor.x !== cursor.targetX || cursor.y !== cursor.targetY;
        }
        cards.forEach(card => {
            if (!card.visible) return;
            card.x = ease(card.x, card.targetX);
            card.y = ease(card.y, card.targetY);
            card.element.style.setProperty('--tilt-x', `${card.x.toFixed(3)}deg`);
            card.element.style.setProperty('--tilt-y', `${card.y.toFixed(3)}deg`);
            settling ||= card.x !== card.targetX || card.y !== card.targetY;
            if (card.hovered && MOTION.pointerHighlight) {
                card.glowX = ease(card.glowX, card.targetGlowX);
                card.glowY = ease(card.glowY, card.targetGlowY);
                card.element.style.setProperty('--glow-x', `${card.glowX.toFixed(2)}px`);
                card.element.style.setProperty('--glow-y', `${card.glowY.toFixed(2)}px`);
                settling ||= card.glowX !== card.targetGlowX || card.glowY !== card.targetGlowY;
            }
        });
        if (settling) scheduleFrame();
    }

    function resetCard(card, immediate = false) {
        card.hovered = false;
        card.targetX = card.targetY = 0;
        card.bounds = null;
        card.element.classList.remove('is-hovered');
        if (immediate) {
            card.x = card.y = 0;
            ['--tilt-x', '--tilt-y', '--glow-x', '--glow-y'].forEach(property => card.element.style.removeProperty(property));
        }
    }
    function resetCursor(immediate = false) {
        cursor.targetX = cursor.targetY = 0;
        cursor.bounds = null;
        cards.forEach(card => resetCard(card, immediate));
        if (immediate) {
            cursor.x = cursor.y = 0;
            heroCursor.style.removeProperty('transform');
        }
    }
    function scrollChanged() {
        scrollDirty = true;
        resetCursor();
        scheduleFrame();
    }
    function listenScroll() {
        if (scrollListening) return;
        window.addEventListener('scroll', scrollChanged, { passive: true });
        scrollListening = true;
    }
    function stopScroll() {
        window.removeEventListener('scroll', scrollChanged);
        scrollListening = false;
        cancelAnimationFrame(frame);
        frame = 0;
    }

    /* Pointer effects use stable outer bounds, not a transformed card's bounds. */
    hero.addEventListener('pointermove', event => {
        if (!cursorAllowed() || !heroVisible || event.pointerType === 'touch') return;
        cursor.bounds ||= hero.getBoundingClientRect();
        const { left, top, width, height } = cursor.bounds;
        cursor.targetX = clamp((event.clientX - left) / width - 0.5, -0.5, 0.5) * MOTION.heroCursorPx * 2;
        cursor.targetY = clamp((event.clientY - top) / height - 0.5, -0.5, 0.5) * MOTION.heroCursorPx * 2;
        scheduleFrame();
    }, { passive: true, signal });
    hero.addEventListener('pointerleave', () => {
        cursor.targetX = cursor.targetY = 0;
        cursor.bounds = null;
        scheduleFrame();
    }, { signal });
    cards.forEach(card => {
        card.element.addEventListener('pointermove', event => {
            if (!cursorAllowed() || !card.visible || event.pointerType === 'touch') return;
            card.bounds ||= card.wrapper.getBoundingClientRect();
            const { left, top, width, height } = card.bounds;
            const x = clamp(event.clientX - left, 0, width);
            const y = clamp(event.clientY - top, 0, height);
            card.targetX = -(y / height - 0.5) * MOTION.cardTiltDegrees * 2;
            card.targetY = (x / width - 0.5) * MOTION.cardTiltDegrees * 2;
            card.targetGlowX = x;
            card.targetGlowY = y;
            if (!card.hovered) { card.glowX = x; card.glowY = y; }
            card.hovered = true;
            card.element.classList.toggle('is-hovered', MOTION.pointerHighlight);
            scheduleFrame();
        }, { passive: true, signal });
        card.element.addEventListener('pointerleave', () => { resetCard(card); scheduleFrame(); }, { signal });
        card.element.addEventListener('pointercancel', () => { resetCard(card, true); }, { signal });
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Tab') resetCursor(true);
    }, { signal });

    /* Nothing is hidden before the observer successfully requests an entrance. */
    function setupObservers() {
        revealObserver?.disconnect();
        visibilityObserver?.disconnect();
        if (!('IntersectionObserver' in window)) {
            // Static fallback: no unbounded work or hidden content on older browsers.
            reveals.forEach(element => element.classList.remove('is-entering'));
            return;
        }
        visibilityObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.target === hero) {
                    heroVisible = entry.isIntersecting;
                    if (!heroVisible) { cursor.x = cursor.y = cursor.targetX = cursor.targetY = 0; heroCursor.style.removeProperty('transform'); }
                    else { scrollDirty = true; scheduleFrame(); }
                } else if (entry.target.classList.contains('cat-lane')) {
                    entry.target.classList.toggle('is-in-view', entry.isIntersecting);
                } else {
                    const card = cards.find(item => item.wrapper === entry.target);
                    if (card) { card.visible = entry.isIntersecting; if (!card.visible) resetCard(card, true); }
                }
            });
        }, { threshold: 0 });
        [hero, ...lanes, ...cards.map(card => card.wrapper)].forEach(element => visibilityObserver.observe(element));
        if (!motionAllowed()) return;
        revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !seen.has(entry.target)) {
                    seen.add(entry.target);
                    if (motionAllowed()) entry.target.classList.add('is-entering');
                } else if (!entry.isIntersecting && seen.has(entry.target)) {
                    entry.target.classList.remove('is-entering');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.06 });
        reveals.filter(element => !seen.has(element)).forEach(element => revealObserver.observe(element));
    }
    reveals.forEach(element => element.addEventListener('animationend', event => {
        if (event.target !== element || event.animationName !== 'section-enter') return;
        element.classList.remove('is-entering');
        revealObserver?.unobserve(element);
    }, { signal }));

    function updateMotion() {
        resetCursor(true);
        parallax.forEach(element => element.style.removeProperty('transform'));
        reveals.forEach(element => element.classList.remove('is-entering'));
        document.body.classList.toggle('motion-paused', paused);
        motionButton.hidden = reducedMotion.matches;
        motionButton.setAttribute('aria-pressed', String(paused));
        motionButton.textContent = paused ? 'Resume animations' : 'Pause animations';
        // If enhancement cannot initialize, base content and static cats stay usable.
        try { setupObservers(); } catch {
            revealObserver?.disconnect();
            visibilityObserver?.disconnect();
            lanes.forEach(lane => lane.classList.remove('is-in-view'));
            reveals.forEach(element => element.classList.remove('is-entering'));
        }
        scrollDirty = true;
        scheduleFrame();
    }
    motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); }, { signal });
    reducedMotion.addEventListener('change', updateMotion, { signal });
    finePointer.addEventListener('change', updateMotion, { signal });
    smallScreen.addEventListener('change', () => { setMenu(false); updateMotion(); }, { signal });
    mobileScreen.addEventListener('change', updateMotion, { signal });
    window.addEventListener('resize', scrollChanged, { passive: true, signal });

    /* Existing photo viewer: focus management, Escape, and background inertness. */
    function syncLightbox() {
        const open = location.hash === '#avatar-view';
        if (open === dialogOpen) return;
        dialogOpen = open;
        const content = document.querySelector('.dashboard-container');
        const chat = document.querySelector('.portfolio-chat');
        if (open) {
            previousFocus = lightbox.contains(document.activeElement) || document.activeElement === document.body ? portraitLink : document.activeElement;
            content.inert = true;
            chat.inert = true;
            lightbox.querySelector('.avatar-close').focus({ preventScroll: true });
        } else {
            content.inert = false;
            chat.inert = false;
            (previousFocus && previousFocus !== document.body ? previousFocus : portraitLink).focus({ preventScroll: true });
        }
    }
    window.addEventListener('hashchange', syncLightbox, { signal });
    lightbox.addEventListener('keydown', event => {
        if (event.key === 'Escape') location.hash = 'home';
        if (event.key === 'Tab') { event.preventDefault(); lightbox.querySelector('.avatar-close').focus(); }
    }, { signal });

    /* Hidden tabs and back/forward navigation never leave an animation loop behind. */
    function suspend() {
        suspended = true;
        document.body.classList.add('tab-hidden');
        stopScroll();
        resetCursor(true);
        visibilityObserver?.disconnect();
        revealObserver?.disconnect();
    }
    function resume() {
        suspended = false;
        document.body.classList.remove('tab-hidden');
        listenScroll();
        updateMotion();
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); else resume(); }, { signal });
    window.addEventListener('pagehide', event => { suspend(); if (!event.persisted) controller.abort(); }, { signal });
    window.addEventListener('pageshow', event => { if (event.persisted) resume(); }, { signal });

    if (document.hidden) suspend();
    else { listenScroll(); updateMotion(); }
    syncLightbox();
})();
