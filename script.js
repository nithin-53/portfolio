/* ============================================
   NITHIN R — PORTFOLIO
   All Interactions, Animations & Logic
   ============================================ */

(function () {
    'use strict';

    /* ---- STATE ---- */
    const state = {
        loaded: false,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        isMobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        mouseX: 0,
        mouseY: 0,
    };

    /* ---- UTILITIES ---- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const lerp = (a, b, t) => a + (b - a) * t;

    /* ============================================================
       1. BOOT SEQUENCE
       ============================================================ */
    function initBootSequence() {
        const loader = $('#loader');
        const terminal = $('#loader-terminal');
        const termBody = $('#terminal-body');
        const identityCanvas = $('#identity-canvas');

        if (!loader || state.reducedMotion) {
            skipBoot();
            return;
        }

        const lines = [
            { text: '> initializing_nithin.dev', delay: 0 },
            { text: '> loading_profile...', suffix: ' done', delay: 400 },
            { text: '> loading_projects...', suffix: ' done', delay: 700 },
            { text: '> loading_skills...', suffix: ' done', delay: 1000 },
            { text: '> establishing_connection...', suffix: ' done', delay: 1300 },
            { text: '> system_ready', suffix: ' ✓', delay: 1700, isGreen: true },
        ];

        lines.forEach((line) => {
            const el = document.createElement('div');
            el.classList.add('term-line');
            el.innerHTML = `<span class="green-text">${line.text}</span>${line.suffix ? `<span class="dim">${line.suffix}</span>` : ''}`;
            termBody.appendChild(el);
        });

        const lineEls = $$('.term-line', termBody);

        lines.forEach((line, i) => {
            setTimeout(() => {
                if (state.loaded) return;
                lineEls[i].classList.add('visible');
            }, line.delay);
        });

        const totalBootTime = 2200;

        setTimeout(() => {
            if (state.loaded) return;
            terminal.classList.add('fade-out');
            runIdentityReveal(identityCanvas, () => skipBoot());
        }, totalBootTime);

        // Skip handlers
        let skipped = false;
        function handleSkip() {
            if (skipped) return;
            skipped = true;
            skipBoot();
        }

        const skipBtn = $('#loader-skip');
        if (skipBtn) skipBtn.addEventListener('click', handleSkip);
        document.addEventListener('keydown', handleSkip, { once: true });
        loader.addEventListener('click', (e) => {
            if (e.target !== skipBtn) handleSkip();
        });
    }

    function skipBoot() {
        if (state.loaded) return;
        state.loaded = true;
        document.body.classList.add('loaded');
        document.body.classList.remove('no-scroll');
        initAfterLoad();
    }

    /* ---- PARTICLE IDENTITY REVEAL ---- */
    function runIdentityReveal(canvas, onComplete) {
        if (!canvas || state.reducedMotion || state.isMobile) {
            setTimeout(onComplete, 600);
            return;
        }

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        const fontSize = Math.min(w * 0.2, 200);
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NR', w / 2, h / 2);

        const imageData = ctx.getImageData(0, 0, w * dpr, h * dpr);
        const targets = [];
        const gap = 4;

        for (let y = 0; y < h * dpr; y += gap * dpr) {
            for (let x = 0; x < w * dpr; x += gap * dpr) {
                const i = (y * w * dpr + x) * 4;
                if (imageData.data[i + 3] > 128) {
                    targets.push({ x: x / dpr, y: y / dpr });
                }
            }
        }

        ctx.clearRect(0, 0, w, h);
        canvas.classList.add('active');

        const maxParticles = Math.min(targets.length, 600);
        const step = Math.max(1, Math.floor(targets.length / maxParticles));
        const particles = [];

        for (let i = 0; i < targets.length; i += step) {
            const t = targets[i];
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                tx: t.x, ty: t.y,
                sx: 0, sy: 0,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.5,
            });
        }

        let phase = 'gather';
        let startTime = performance.now();
        const gatherDuration = 1200;
        const holdDuration = 500;
        const scatterDuration = 800;

        function animate(now) {
            const elapsed = now - startTime;
            ctx.clearRect(0, 0, w, h);

            if (phase === 'gather') {
                const t = Math.min(elapsed / gatherDuration, 1);
                const ease = 1 - Math.pow(1 - t, 3);
                particles.forEach((p) => {
                    p.x = lerp(p.x, p.tx, ease * 0.15 + 0.01);
                    p.y = lerp(p.y, p.ty, ease * 0.15 + 0.01);
                    ctx.fillStyle = `rgba(182, 255, 92, ${p.alpha * ease})`;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                });
                if (t >= 1) {
                    phase = 'hold';
                    startTime = now;
                    particles.forEach((p) => {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * Math.max(w, h) * 0.8 + 200;
                        p.sx = p.tx + Math.cos(angle) * dist;
                        p.sy = p.ty + Math.sin(angle) * dist;
                    });
                }
            } else if (phase === 'hold') {
                particles.forEach((p) => {
                    ctx.fillStyle = `rgba(182, 255, 92, ${p.alpha})`;
                    ctx.fillRect(p.tx, p.ty, p.size, p.size);
                });
                if (elapsed >= holdDuration) { phase = 'scatter'; startTime = now; }
            } else if (phase === 'scatter') {
                const t = Math.min(elapsed / scatterDuration, 1);
                const ease = t * t;
                particles.forEach((p) => {
                    const x = lerp(p.tx, p.sx, ease);
                    const y = lerp(p.ty, p.sy, ease);
                    ctx.fillStyle = `rgba(182, 255, 92, ${p.alpha * (1 - t)})`;
                    ctx.fillRect(x, y, p.size, p.size);
                });
                if (t >= 1) { onComplete(); return; }
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    /* ============================================================
       2. PARTICLE BACKGROUND
       ============================================================ */
    function initParticles() {
        if (state.reducedMotion) return;

        const canvas = $('#particle-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        let w, h;
        let particles = [];
        const count = state.isMobile ? 25 : 60;
        let visible = true;

        function resize() {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        }

        function createParticles() {
            particles = [];
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: Math.random() * 2 + 0.5,
                    alpha: Math.random() * 0.3 + 0.1,
                });
            }
        }

        function draw() {
            if (!visible) { requestAnimationFrame(draw); return; }

            ctx.clearRect(0, 0, w, h);

            particles.forEach((p) => {
                if (!state.isTouch) {
                    const dx = p.x - state.mouseX;
                    const dy = p.y - state.mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        const force = (120 - dist) / 120 * 0.5;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }
                }

                p.vx *= 0.98;
                p.vy *= 0.98;
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(182, 255, 92, ${p.alpha})`;
                ctx.fill();
            });

            // Connection lines (desktop)
            if (!state.isMobile) {
                ctx.strokeStyle = 'rgba(182, 255, 92, 0.04)';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        if (dx * dx + dy * dy < 18000) {
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }
                }
            }

            requestAnimationFrame(draw);
        }

        document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

        resize();
        createParticles();
        draw();
        window.addEventListener('resize', resize);
    }

    /* ============================================================
       3. CUSTOM CURSOR
       ============================================================ */
    function initCursor() {
        if (state.isTouch || state.isMobile || state.reducedMotion) return;

        const dot = $('#cursor-dot');
        const glow = $('#cursor-glow');
        if (!dot || !glow) return;

        let dotX = 0, dotY = 0;
        let glowX = 0, glowY = 0;
        let shown = false;

        document.addEventListener('mousemove', (e) => {
            state.mouseX = e.clientX;
            state.mouseY = e.clientY;
            if (!shown) {
                shown = true;
                dot.classList.add('visible');
                glow.classList.add('visible');
            }
        });

        const hoverTargets = 'a, button, [data-cursor="pointer"], .skill-bar-item, .cert-preview, .tag';

        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(hoverTargets)) {
                dot.classList.add('hover');
                glow.classList.add('hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(hoverTargets)) {
                dot.classList.remove('hover');
                glow.classList.remove('hover');
            }
        });

        function animateCursor() {
            dotX = lerp(dotX, state.mouseX, 0.2);
            dotY = lerp(dotY, state.mouseY, 0.2);
            glowX = lerp(glowX, state.mouseX, 0.1);
            glowY = lerp(glowY, state.mouseY, 0.1);

            dot.style.left = dotX + 'px';
            dot.style.top = dotY + 'px';
            glow.style.left = glowX + 'px';
            glow.style.top = glowY + 'px';

            requestAnimationFrame(animateCursor);
        }

        animateCursor();
    }

    /* ============================================================
       4. NAVIGATION
       ============================================================ */
    function initNavigation() {
        const header = $('#nav-header');
        const hamburger = $('#hamburger');
        const mobileMenu = $('#mobile-menu');
        const navLinks = $$('.nav-link');
        const mobileLinks = $$('.mobile-link');
        const sections = $$('section[id]');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });

        // Active section
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navLinks.forEach((link) => {
                        link.classList.toggle('active', link.dataset.section === id);
                    });
                }
            });
        }, { threshold: 0.2, rootMargin: '-80px 0px -40% 0px' });

        sections.forEach((sec) => observer.observe(sec));

        // Hamburger
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen);
            mobileMenu.setAttribute('aria-hidden', !isOpen);
            document.body.classList.toggle('no-scroll', isOpen);
        });

        mobileLinks.forEach((link) => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('no-scroll');
            });
        });

        // Smooth scroll
        [...navLinks, ...mobileLinks].forEach((link) => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = $(href);
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    /* ============================================================
       5. HERO CODE EDITOR (now in About)
       ============================================================ */
    function initCodeEditor() {
        const editorBody = $('#editor-body');
        if (!editorBody) return;

        const codeLines = [
            { num: 1, content: '<span class="syn-kw">const</span> <span class="syn-fn">nithin</span> <span class="syn-br">=</span> <span class="syn-br">{</span>' },
            { num: 2, content: '  <span class="syn-prop">name</span><span class="syn-br">:</span> <span class="syn-str">"Nithin R"</span><span class="syn-br">,</span>' },
            { num: 3, content: '  <span class="syn-prop">role</span><span class="syn-br">:</span> <span class="syn-str">"Web Developer"</span><span class="syn-br">,</span>' },
            { num: 4, content: '  <span class="syn-prop">education</span><span class="syn-br">:</span> <span class="syn-str">"B.E. Computer Science"</span><span class="syn-br">,</span>' },
            { num: 5, content: '  <span class="syn-prop">skills</span><span class="syn-br">:</span> <span class="syn-arr">[</span><span class="syn-str">"Java"</span><span class="syn-br">,</span> <span class="syn-str">"Python"</span><span class="syn-br">,</span> <span class="syn-str">"JS"</span><span class="syn-arr">]</span><span class="syn-br">,</span>' },
            { num: 6, content: '  <span class="syn-prop">focus</span><span class="syn-br">:</span> <span class="syn-str">"Building real-world apps"</span><span class="syn-br">,</span>' },
            { num: 7, content: '  <span class="syn-prop">available</span><span class="syn-br">:</span> <span class="syn-bool">true</span>' },
            { num: 8, content: '<span class="syn-br">};</span>' },
            { num: 9, content: '' },
            { num: 10, content: '<span class="syn-cm">// Build. Learn. Improve.</span>' },
        ];

        let currentLine = 0;
        let editorStarted = false;

        // Only start when editor is visible
        const editorObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !editorStarted) {
                    editorStarted = true;
                    setTimeout(addLine, 300);
                    editorObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        editorObserver.observe(editorBody.closest('.editor-window'));

        function addLine() {
            if (currentLine >= codeLines.length) {
                const lastLine = editorBody.lastElementChild;
                if (lastLine) {
                    const content = lastLine.querySelector('.line-content');
                    if (content) content.innerHTML += '<span class="editor-cursor"></span>';
                }
                return;
            }

            const line = codeLines[currentLine];
            const el = document.createElement('div');
            el.classList.add('code-line');
            el.innerHTML = `<span class="line-num">${line.num}</span><span class="line-content">${line.content}</span>`;
            el.style.opacity = '0';
            el.style.transform = 'translateX(-5px)';
            editorBody.appendChild(el);

            requestAnimationFrame(() => {
                el.style.transition = 'opacity 0.3s, transform 0.3s';
                el.style.opacity = '1';
                el.style.transform = 'translateX(0)';
            });

            currentLine++;
            setTimeout(addLine, 180);
        }
    }

    /* ============================================================
       6. SCROLL REVEAL
       ============================================================ */
    function initScrollReveal() {
        const allReveal = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale');

        if (state.reducedMotion) {
            allReveal.forEach((el) => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay || '0', 10);
                    setTimeout(() => entry.target.classList.add('visible'), delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        allReveal.forEach((el) => observer.observe(el));
    }

    /* ============================================================
       7. SKILL BAR ANIMATION
       ============================================================ */
    function initSkillBars() {
        const fills = $$('.skill-bar-fill');

        if (state.reducedMotion) {
            fills.forEach((fill) => {
                fill.style.width = fill.dataset.width + '%';
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const fill = entry.target;
                    const width = fill.dataset.width;
                    // Small delay for stagger effect
                    const index = fills.indexOf(fill);
                    setTimeout(() => {
                        fill.style.width = width + '%';
                        fill.classList.add('animated');
                    }, index * 80);
                    observer.unobserve(fill);
                }
            });
        }, { threshold: 0.3 });

        fills.forEach((fill) => observer.observe(fill));
    }

    /* ============================================================
       8. COUNTER ANIMATION (Hero Stats)
       ============================================================ */
    function initCounters() {
        const counters = $$('[data-count]');

        if (state.reducedMotion) {
            counters.forEach((el) => { el.textContent = el.dataset.count; });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count, 10);
                    animateCounter(el, target);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach((el) => observer.observe(el));

        function animateCounter(el, target) {
            const duration = 1500;
            const start = performance.now();

            function tick(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(ease * target);
                el.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = target;
                }
            }

            requestAnimationFrame(tick);
        }
    }

    /* ============================================================
       9. PROJECT CARDS 3D TILT
       ============================================================ */
    function initProjectTilt() {
        if (state.isTouch || state.isMobile || state.reducedMotion) return;

        const cards = $$('[data-tilt]');

        cards.forEach((card) => {
            const glow = card.querySelector('.project-glow');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
                card.style.transition = 'transform 0.1s ease';

                if (glow) {
                    glow.style.left = x + 'px';
                    glow.style.top = y + 'px';
                }
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
                card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            });
        });
    }

    /* ============================================================
       10. MAGNETIC BUTTONS
       ============================================================ */
    function initMagneticButtons() {
        if (state.isTouch || state.isMobile || state.reducedMotion) return;

        const buttons = $$('.magnetic');

        buttons.forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;

                // Set ripple position
                const rippleX = ((e.clientX - rect.left) / rect.width) * 100;
                const rippleY = ((e.clientY - rect.top) / rect.height) * 100;
                btn.style.setProperty('--ripple-x', rippleX + '%');
                btn.style.setProperty('--ripple-y', rippleY + '%');
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.transition = 'transform 0.15s ease';
            });
        });
    }

    /* ============================================================
       11. CERTIFICATE LIGHTBOX
       ============================================================ */
    function initLightbox() {
        const lightbox = $('#lightbox');
        const overlay = $('#lightbox-overlay');
        const closeBtn = $('#lightbox-close');
        const lightboxImg = $('#lightbox-img');
        const lightboxTitle = $('#lightbox-title');

        if (!lightbox) return;

        $$('.cert-view-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                openLightbox(btn.dataset.cert, btn.dataset.certTitle);
            });
        });

        $$('.cert-preview').forEach((preview) => {
            preview.addEventListener('click', () => {
                const btn = preview.closest('.cert-card').querySelector('.cert-view-btn');
                if (btn) openLightbox(btn.dataset.cert, btn.dataset.certTitle);
            });
        });

        function openLightbox(src, title) {
            lightboxImg.src = src;
            lightboxImg.alt = title;
            lightboxTitle.textContent = title;
            lightbox.classList.add('open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');
            closeBtn.focus();
        }

        function closeLightbox() {
            lightbox.classList.remove('open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
        }

        closeBtn.addEventListener('click', closeLightbox);
        overlay.addEventListener('click', closeLightbox);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
        });
    }

    /* ============================================================
       12. CONTACT FORM
       ============================================================ */
    function initContactForm() {
        const form = $('#contact-form');
        if (!form) return;

        const nameInput = $('#form-name');
        const emailInput = $('#form-email');
        const messageInput = $('#form-message');
        const submitBtn = $('#form-submit');
        const statusEl = $('#form-status');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        [nameInput, emailInput, messageInput].forEach((input) => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                const group = input.closest('.form-group');
                if (group.classList.contains('has-error')) validateField(input);
                input.classList.remove('error');
            });
        });

        function validateField(input) {
            const group = input.closest('.form-group');
            let valid = input.type === 'email'
                ? emailRegex.test(input.value.trim())
                : input.value.trim().length > 0;
            group.classList.toggle('has-error', !valid);
            input.classList.toggle('error', !valid);
            return valid;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameValid = validateField(nameInput);
            const emailValid = validateField(emailInput);
            const messageValid = validateField(messageInput);

            if (!nameValid || !emailValid || !messageValid) return;

            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            statusEl.className = 'form-status';
            statusEl.style.display = 'none';

            setTimeout(() => {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                statusEl.className = 'form-status success';
                statusEl.textContent = '✓ Message received! Note: Backend integration is not yet configured. Please reach out via email for now.';
                statusEl.style.display = 'block';
                form.reset();
                setTimeout(() => { statusEl.style.display = 'none'; }, 8000);
            }, 1500);
        });
    }

    /* ============================================================
       13. PARALLAX
       ============================================================ */
    function initParallax() {
        if (state.reducedMotion || state.isMobile) return;

        const heroPhoto = $('.hero-photo-wrapper');
        const aboutEditor = $('.about-editor');

        window.addEventListener('scroll', () => {
            const y = window.scrollY;

            if (heroPhoto && y < window.innerHeight) {
                heroPhoto.style.transform = `translateY(${y * 0.06}px)`;
            }

            if (aboutEditor) {
                const rect = aboutEditor.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const offset = (rect.top - window.innerHeight / 2) * 0.03;
                    aboutEditor.style.transform = `translateY(${offset}px)`;
                }
            }
        }, { passive: true });
    }

    /* ============================================================
       14. TEXT SCRAMBLE EFFECT
       ============================================================ */
    function initTextScramble() {
        if (state.reducedMotion) return;

        const elements = $$('[data-scramble]');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';

        elements.forEach((el) => {
            const originalText = el.textContent;
            let isAnimated = false;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !isAnimated) {
                        isAnimated = true;
                        scrambleText(el, originalText);
                        observer.unobserve(el);
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(el);
        });

        function scrambleText(el, finalText) {
            let iteration = 0;
            const totalIterations = finalText.length * 3;

            const interval = setInterval(() => {
                el.textContent = finalText
                    .split('')
                    .map((char, i) => {
                        if (char === ' ') return ' ';
                        if (i < iteration / 3) return finalText[i];
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('');

                iteration++;
                if (iteration > totalIterations) {
                    el.textContent = finalText;
                    clearInterval(interval);
                }
            }, 30);
        }
    }

    /* ============================================================
       INITIALIZATION
       ============================================================ */
    document.body.classList.add('no-scroll');
    initBootSequence();
    initNavigation();
    initCursor();

    function initAfterLoad() {
        initParticles();
        initCodeEditor();
        initScrollReveal();
        initSkillBars();
        initCounters();
        initProjectTilt();
        initMagneticButtons();
        initLightbox();
        initContactForm();
        initParallax();
        initTextScramble();
    }

    document.addEventListener('mousemove', (e) => {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
    }, { passive: true });

})();
