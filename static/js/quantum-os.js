/* ═══════════════════════════════════════════════════════════
   QubitPage® Quantum OS — Main JavaScript Engine
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── State ───────────────────────────────────────────────
  const state = {
    windows: {},
    windowOrder: [],
    windowId: 0,
    gameScore: 0,
    gameLevel: 1,
    gameRound: null,
    ariaHistory: [],
    socket: null,
    // Auth
    user: null,       // current user profile or null
    isGuest: false,
  };

  const APP_META = {
    terminal:      { title: "Quantum Terminal",      icon: "⌨",  w: 700, h: 450 },
    "circuit-lab": { title: "Circuit Lab",           icon: "⚛",  w: 850, h: 550 },
    "quantum-game":{ title: "Quantum Oracle Game",   icon: "🎮", w: 650, h: 480 },
    "crypto-tools":{ title: "Crypto Tools",          icon: "🔐", w: 700, h: 520 },
    aria:          { title: "ARIA AI Assistant",      icon: "🤖", w: 600, h: 500 },
    docs:          { title: "Documentation",          icon: "📚", w: 900, h: 600 },
    settings:      { title: "System Settings",        icon: "⚙",  w: 600, h: 480 },
    "quantum-drug":{ title: "QuantumDrug Explorer",   icon: "🧬", w: 800, h: 580 },
    "quantum-luck":{ title: "Quantum Luck",          icon: "🎲", w: 720, h: 650 },
    "quantum-search":{ title: "Quantum Search",      icon: "🔍", w: 700, h: 520 },
    "medgemma-ai":   { title: "MedGemma AI",          icon: "🏥", w: 780, h: 620 },
    "quantumneuro":  { title: "QuantumNeuro GBM",    icon: "🧠", w: 900, h: 700 },
    "quantumtb":     { title: "QuantumTB",            icon: "🫁", w: 900, h: 700 },
    "diseases":      { title: "Disease Research Hub", icon: "\ud83c\udfe5", w: 1000, h: 750 },
    "training":      { title: "Training Results",     icon: "\ud83c\udfaf", w: 900, h: 650 },
    "competition":   { title: "Competition Submission",icon: "\ud83c\udfc6", w: 900, h: 700 },
    "notepad":       { title: "Notepad",              icon: "📝", w: 680, h: 520 },
    "docs-app":      { title: "QuantumMed Docs",      icon: "📚", w: 850, h: 650 },
    "medlab":        { title: "MedLab — Medical Cases",  icon: "🗂", w: 1100, h: 720 },
    "reports":       { title: "Discovery Reports",     icon: "📊", w: 1100, h: 750 },
    "medfiles":      { title: "Medical Files",        icon: "🗂️",  w: 1200, h: 760 },
  };

  // ══════════════════════════════════════════════════════════
  //  BOOT SEQUENCE
  // ══════════════════════════════════════════════════════════

  const bootMessages = [
    "Initializing quantum kernel...",
    "Loading Steane [[7,1,3]] error correction...",
    "Detecting IBM Quantum backends...",
    "Starting Stim simulator engine...",
    "Loading QPlang compiler v1.0.0...",
    "Initializing QBP transpiler...",
    "Connecting Gemini AI (ARIA Intelligence)...",
    "Calibrating virtual qubits...",
    "Starting decoder loop daemon...",
    "Mounting quantum filesystem...",
    "Boot complete. Welcome to QubitPage®.",
  ];

  function runBoot() {
    const bar = document.getElementById("boot-bar");
    const log = document.getElementById("boot-log");
    let i = 0;
    const interval = setInterval(() => {
      if (i >= bootMessages.length) {
        clearInterval(interval);
        bar.style.width = "100%";
        setTimeout(() => {
          document.getElementById("boot-screen").classList.add("hidden");
          // Check if user has a valid session cookie
          checkExistingSession();
        }, 600);
        return;
      }
      const pct = ((i + 1) / bootMessages.length) * 100;
      bar.style.width = pct + "%";
      log.textContent = bootMessages[i];
      i++;
    }, 280);
  }


  // ══════════════════════════════════════════════════════════
  //  AUTHENTICATION
  // ══════════════════════════════════════════════════════════

  function checkExistingSession() {
    fetch("/api/auth/profile")
      .then(r => r.json())
      .then(data => {
        if (data.authenticated && data.user) {
          loginSuccess(data.user);
        } else {
          showLoginScreen();
        }
      })
      .catch(() => showLoginScreen());
  }

  function showLoginScreen() {
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("desktop").classList.add("hidden");
    initLoginHandlers();
  }

  function loginSuccess(user) {
    state.user = user;
    state.isGuest = false;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("desktop").classList.remove("hidden");
    updateUserUI();
    initDesktop();
  }

  function guestLogin() {
    state.user = {
      username: "guest",
      display_name: "Guest",
      user_group: "guest",
      allowed_apps: ["terminal", "docs", "quantum-game", "settings"],
      has_gemini_key: false,
      has_groq_key: false,
      daily_usage_count: 0,
      daily_limit: 5,
    };
    state.isGuest = true;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("desktop").classList.remove("hidden");
    updateUserUI();
    initDesktop();
  }

  function updateUserUI() {
    const u = state.user;
    if (!u) return;

    // Taskbar user badge
    const badge = document.getElementById("user-badge");
    if (badge) {
      badge.style.display = "inline-flex";
      const nameEl = document.getElementById("user-name");
      if (nameEl) nameEl.textContent = u.display_name || u.username;
      const avatarEl = document.getElementById("user-avatar");
      if (avatarEl) avatarEl.textContent = u.user_group === "admin" ? "👑" : "👤";
    }

    // Start menu user info
    const startInfo = document.getElementById("start-user-info");
    if (startInfo) {
      startInfo.style.display = "block";
      document.getElementById("start-username").textContent = u.display_name || u.username;
      document.getElementById("start-usergroup").textContent = "(" + u.user_group + ")";
    }

    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn && !state.isGuest) {
      logoutBtn.style.display = "block";
    }

    // Filter desktop icons based on user permissions
    filterAppsByPermissions();
  }

  function filterAppsByPermissions() {
    const allowed = state.user ? state.user.allowed_apps || [] : [];
    const isAdmin = state.user && state.user.user_group === "admin";

    // Desktop icons
    document.querySelectorAll(".desktop-icon").forEach(el => {
      const app = el.dataset.app;
      if (app === "notepad" || isAdmin || allowed.includes(app)) {
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });

    // Start menu items
    document.querySelectorAll(".start-app").forEach(el => {
      const app = el.dataset.app;
      if (!app || app === "notepad" || isAdmin || allowed.includes(app)) {
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });
  }

  function initLoginHandlers() {
    // Only bind once
    if (initLoginHandlers._bound) return;
    initLoginHandlers._bound = true;

    // Switch forms
    document.getElementById("show-register").addEventListener("click", e => {
      e.preventDefault();
      document.getElementById("login-form").classList.add("hidden");
      document.getElementById("register-form").classList.remove("hidden");
    });
    document.getElementById("show-login").addEventListener("click", e => {
      e.preventDefault();
      document.getElementById("register-form").classList.add("hidden");
      document.getElementById("login-form").classList.remove("hidden");
    });

    // Guest
    document.getElementById("guest-login").addEventListener("click", e => {
      e.preventDefault();
      guestLogin();
    });

    // Login
    document.getElementById("login-btn").addEventListener("click", doLogin);
    document.getElementById("login-password").addEventListener("keydown", e => {
      if (e.key === "Enter") doLogin();
    });

    // Register
    document.getElementById("register-btn").addEventListener("click", doRegister);

    // Logout
    document.getElementById("logout-btn").addEventListener("click", doLogout);
  }

  function doLogin() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const errEl = document.getElementById("login-error");
    errEl.classList.add("hidden");

    if (!username || !password) {
      errEl.textContent = "Please enter username and password";
      errEl.classList.remove("hidden");
      return;
    }

    const btn = document.getElementById("login-btn");
    btn.disabled = true;
    btn.textContent = "Signing in...";

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then(r => r.json())
      .then(data => {
        btn.disabled = false;
        btn.textContent = "Sign In";
        if (data.success && data.user) {
          loginSuccess(data.user);
        } else {
          errEl.textContent = data.error || "Login failed";
          errEl.classList.remove("hidden");
        }
      })
      .catch(() => {
        btn.disabled = false;
        btn.textContent = "Sign In";
        errEl.textContent = "Connection error. Try again.";
        errEl.classList.remove("hidden");
      });
  }

  function doRegister() {
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const display = document.getElementById("reg-display").value.trim();
    const password = document.getElementById("reg-password").value;
    const password2 = document.getElementById("reg-password2").value;
    const errEl = document.getElementById("reg-error");
    errEl.classList.add("hidden");

    if (!username || !email || !password) {
      errEl.textContent = "All fields are required";
      errEl.classList.remove("hidden");
      return;
    }
    if (password !== password2) {
      errEl.textContent = "Passwords don't match";
      errEl.classList.remove("hidden");
      return;
    }
    if (password.length < 6) {
      errEl.textContent = "Password must be at least 6 characters";
      errEl.classList.remove("hidden");
      return;
    }

    const btn = document.getElementById("register-btn");
    btn.disabled = true;
    btn.textContent = "Creating account...";

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, display_name: display }),
    })
      .then(r => r.json())
      .then(data => {
        btn.disabled = false;
        btn.textContent = "Create Account";
        if (data.success && data.user) {
          loginSuccess(data.user);
        } else {
          errEl.textContent = data.error || "Registration failed";
          errEl.classList.remove("hidden");
        }
      })
      .catch(() => {
        btn.disabled = false;
        btn.textContent = "Create Account";
        errEl.textContent = "Connection error. Try again.";
        errEl.classList.remove("hidden");
      });
  }

  function doLogout() {
    fetch("/api/auth/logout", { method: "POST" })
      .then(() => {
        state.user = null;
        state.isGuest = false;
        // Close all windows
        Object.keys(state.windows).forEach(wid => closeWindow(wid));
        document.getElementById("desktop").classList.add("hidden");
        document.getElementById("login-form").classList.remove("hidden");
        document.getElementById("register-form").classList.add("hidden");
        document.getElementById("login-username").value = "";
        document.getElementById("login-password").value = "";
        showLoginScreen();
      });
  }

  // ══════════════════════════════════════════════════════════
  //  DESKTOP INIT
  // ══════════════════════════════════════════════════════════

  function initDesktop() {
    if (initDesktop._initialized) {
      initDesktopIcons();
      return;
    }
    initDesktop._initialized = true;

    initParticles();
    initClock();
    initSocket();
    initDesktopIcons();

    // Desktop icon double-click
    document.querySelectorAll(".desktop-icon").forEach((el) => {
      el.addEventListener("dblclick", () => openApp(el.dataset.app));
    });

    // Start menu
    document.getElementById("start-button").addEventListener("click", toggleStartMenu);
    document.querySelectorAll(".start-app").forEach((el) => {
      el.addEventListener("click", () => {
        openApp(el.dataset.app);
        toggleStartMenu();
      });
    });

    // Close start menu when clicking elsewhere
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("start-menu");
      if (!menu.classList.contains("hidden") &&
          !menu.contains(e.target) &&
          !document.getElementById("start-button").contains(e.target)) {
        menu.classList.add("hidden");
      }
    });
  }

  function initDesktopIcons() {
    const container = document.getElementById("desktop-icons");
    if (!container) return;

    const desktopRect = () => {
      const bar = document.getElementById("taskbar");
      const barHeight = bar ? bar.offsetHeight : 48;
      return {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: Math.max(220, window.innerHeight - barHeight - 6),
      };
    };

    const getKey = (el, idx) => {
      const app = el.dataset.app || "link";
      const labelEl = el.querySelector("span") || el.querySelector(".icon-label");
      const label = labelEl ? labelEl.textContent.trim() : String(idx);
      return `desktop-icon-pos:${app}:${label}`;
    };

    const placeDefault = () => {
      const visible = Array.from(container.querySelectorAll(".desktop-icon")).filter((el) => el.style.display !== "none");
      const gapX = 98;
      const gapY = 94;
      const marginX = 12;
      const marginY = 12;
      const rect = desktopRect();
      const cols = Math.max(1, Math.floor((rect.width - 24) / gapX));
      visible.forEach((el, i) => {
        const key = getKey(el, i);
        let pos = null;
        try { pos = JSON.parse(localStorage.getItem(key) || "null"); } catch (_) {}
        if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
          el.style.left = `${Math.max(marginX, Math.min(pos.x, rect.width - 92))}px`;
          el.style.top = `${Math.max(marginY, Math.min(pos.y, rect.height - 92))}px`;
          return;
        }
        const col = i % cols;
        const row = Math.floor(i / cols);
        el.style.left = `${marginX + col * gapX}px`;
        el.style.top = `${marginY + row * gapY}px`;
      });
    };

    const enableDrag = (el, idx) => {
      if (el.dataset.dragBound === "1") return;
      el.dataset.dragBound = "1";
      const key = getKey(el, idx);
      let moved = false;
      let downX = 0;
      let downY = 0;
      let startLeft = 0;
      let startTop = 0;

      el.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        moved = false;
        downX = e.clientX;
        downY = e.clientY;
        startLeft = el.offsetLeft;
        startTop = el.offsetTop;

        const onMove = (m) => {
          const dx = m.clientX - downX;
          const dy = m.clientY - downY;
          if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
          moved = true;
          el.classList.add("dragging");
          const rect = desktopRect();
          const nx = Math.max(6, Math.min(startLeft + dx, rect.width - el.offsetWidth - 6));
          const ny = Math.max(6, Math.min(startTop + dy, rect.height - el.offsetHeight - 6));
          el.style.left = `${nx}px`;
          el.style.top = `${ny}px`;
        };

        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          el.classList.remove("dragging");
          if (moved) {
            localStorage.setItem(key, JSON.stringify({ x: el.offsetLeft, y: el.offsetTop }));
          }
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });

      // Prevent opening app when drag occurred
      el.addEventListener("dblclick", (e) => {
        if (el.classList.contains("dragging")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    };

    const icons = Array.from(container.querySelectorAll(".desktop-icon"));
    icons.forEach((el, idx) => enableDrag(el, idx));
    placeDefault();
    window.addEventListener("resize", placeDefault);
  }

  function toggleStartMenu() {
    document.getElementById("start-menu").classList.toggle("hidden");
  }

  // ── Clock ─────────────────────────────────────────────────
  function initClock() {
    function updateClock() {
      const now = new Date();
      document.getElementById("clock").textContent =
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    updateClock();
    setInterval(updateClock, 30000);
  }

  // ── Particles background ─────────────────────────────────
  function initParticles() {
    const canvas = document.getElementById("particles-canvas");
    const ctx = canvas.getContext("2d");
    let W, H, particles = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      }
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.06 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── WebSocket ─────────────────────────────────────────────
  function initSocket() {
    try {
      state.socket = io({ transports: ["websocket", "polling"] });
      state.socket.on("system_message", (data) => {
        console.log("[QOS]", data.message);
      });
    } catch (e) {
      console.warn("WebSocket not available:", e);
    }
  }

  // ══════════════════════════════════════════════════════════
  //  WINDOW MANAGER
  // ══════════════════════════════════════════════════════════

  function openApp(appId) {
    // Permission check
    if (state.user && state.user.user_group !== "admin" && appId !== "notepad") {
      const allowed = state.user.allowed_apps || [];
      if (!allowed.includes(appId)) {
        alert("You don't have permission to open " + (APP_META[appId]?.title || appId) +
              ". Ask an admin to grant access.");
        return;
      }
    }

    // If already open, focus it
    for (const [wid, win] of Object.entries(state.windows)) {
      if (win.appId === appId) {
        focusWindow(wid);
        return;
      }
    }

    const meta = APP_META[appId];
    if (!meta) return;

    const wid = "win-" + (++state.windowId);
    const offsetX = 80 + (state.windowId % 5) * 30;
    const offsetY = 40 + (state.windowId % 5) * 30;

    const el = document.createElement("div");
    el.className = "os-window focused";
    el.id = wid;
    el.style.cssText = `left:${offsetX}px;top:${offsetY}px;width:${meta.w}px;height:${meta.h}px;z-index:${100 + state.windowId}`;

    el.innerHTML = `
      <div class="win-header">
        <span class="win-title">${meta.icon} ${meta.title}</span>
        <div class="win-controls">
          <button class="win-btn minimize" title="Minimize"></button>
          <button class="win-btn maximize" title="Maximize"></button>
          <button class="win-btn close" title="Close"></button>
        </div>
      </div>
      <div class="win-body"></div>
    `;

    // Load template
    const tpl = document.getElementById("tpl-" + appId);
    if (tpl) {
      el.querySelector(".win-body").appendChild(tpl.content.cloneNode(true));
    }

    document.getElementById("windows-container").appendChild(el);

    state.windows[wid] = { el, appId, minimized: false, maximized: false };
    state.windowOrder.push(wid);

    // Taskbar item
    addTaskbarItem(wid, meta);

    // Events
    el.querySelector(".win-btn.close").addEventListener("click", () => closeWindow(wid));
    el.querySelector(".win-btn.minimize").addEventListener("click", () => minimizeWindow(wid));
    el.querySelector(".win-btn.maximize").addEventListener("click", () => toggleMaximize(wid));
    el.addEventListener("mousedown", () => focusWindow(wid));

    // Drag
    makeDraggable(el, el.querySelector(".win-header"));

    // Resize
    makeResizable(el);

    focusWindow(wid);

    // Initialize app-specific logic
    setTimeout(() => initApp(appId, el), 50);
    // Expose globally for inter-app communication
    if (!window._qpOpenApp) window._qpOpenApp = openApp;
  }

  function closeWindow(wid) {
    const win = state.windows[wid];
    if (!win) return;
    win.el.remove();
    delete state.windows[wid];
    state.windowOrder = state.windowOrder.filter((id) => id !== wid);
    removeTaskbarItem(wid);
    // Focus next
    if (state.windowOrder.length > 0) {
      focusWindow(state.windowOrder[state.windowOrder.length - 1]);
    }
  }

  function minimizeWindow(wid) {
    const win = state.windows[wid];
    if (!win) return;
    win.minimized = true;
    win.el.classList.add("hidden");
  }

  function toggleMaximize(wid) {
    const win = state.windows[wid];
    if (!win) return;
    win.maximized = !win.maximized;
    win.el.classList.toggle("maximized", win.maximized);
  }

  function focusWindow(wid) {
    const win = state.windows[wid];
    if (!win) return;
    if (win.minimized) {
      win.minimized = false;
      win.el.classList.remove("hidden");
    }
    // Unfocus all
    for (const w of Object.values(state.windows)) {
      w.el.classList.remove("focused");
    }
    win.el.classList.add("focused");
    win.el.style.zIndex = 100 + (++state.windowId);

    // Update taskbar
    document.querySelectorAll(".taskbar-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.wid === wid);
    });
  }

  function addTaskbarItem(wid, meta) {
    const el = document.createElement("div");
    el.className = "taskbar-item active";
    el.dataset.wid = wid;
    el.innerHTML = `${meta.icon} ${meta.title}`;
    el.addEventListener("click", () => {
      const win = state.windows[wid];
      if (win && win.minimized) {
        focusWindow(wid);
      } else if (win && win.el.classList.contains("focused")) {
        minimizeWindow(wid);
      } else {
        focusWindow(wid);
      }
    });
    document.getElementById("taskbar-apps").appendChild(el);
  }

  function removeTaskbarItem(wid) {
    const el = document.querySelector(`.taskbar-item[data-wid="${wid}"]`);
    if (el) el.remove();
  }

  // ── Drag ──────────────────────────────────────────────────
  function makeDraggable(el, handle) {
    let startX, startY, origX, origY;
    handle.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("win-btn")) return;
      const win = Object.values(state.windows).find((w) => w.el === el);
      if (win && win.maximized) return;
      startX = e.clientX; startY = e.clientY;
      origX = el.offsetLeft; origY = el.offsetTop;
      function onMove(e2) {
        el.style.left = (origX + e2.clientX - startX) + "px";
        el.style.top = (origY + e2.clientY - startY) + "px";
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  // ── Resize ────────────────────────────────────────────────
  function makeResizable(el) {
    const grip = document.createElement("div");
    grip.style.cssText = "position:absolute;bottom:0;right:0;width:16px;height:16px;cursor:se-resize;z-index:10;";
    el.appendChild(grip);

    grip.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const startW = el.offsetWidth, startH = el.offsetHeight;
      function onMove(e2) {
        el.style.width = Math.max(400, startW + e2.clientX - startX) + "px";
        el.style.height = Math.max(300, startH + e2.clientY - startY) + "px";
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  // ══════════════════════════════════════════════════════════
  //  APP INITIALIZERS
  // ══════════════════════════════════════════════════════════

  function initApp(appId, winEl) {
    switch (appId) {
      case "terminal": initTerminal(winEl); break;
      case "circuit-lab": initCircuitLab(winEl); break;
      case "quantum-game": initQuantumGame(winEl); break;
      case "crypto-tools": initCryptoTools(winEl); break;
      case "aria": initAria(winEl); break;
      case "settings": initSettings(winEl); break;
      case "docs": initDocs(winEl); break;
      case "quantum-drug": initQuantumDrug(winEl); break;
      case "quantum-luck": initQuantumLuck(winEl); break;
      case "quantum-search": initQuantumSearch(winEl); break;
      case "medgemma-ai": initMedGemmaAI(winEl); break;
      case "quantumneuro": initQuantumNeuro(winEl); break;
      case "quantumtb": initQuantumTB(winEl); break;
      case "diseases": initDiseaseDashboard(winEl); break;
      case "training": initTrainingViewer(winEl); break;
      case "competition": initCompetitionView(winEl); break;
      case "notepad": initNotepad(winEl); break;
      case "docs-app": initDocsApp(winEl); break;
      case "medlab": initMedLab(winEl); break;
      case "reports": if(typeof initReports==="function") initReports(winEl); break;
        case "medfiles": if(typeof initMedFiles==="function") initMedFiles(winEl); break;
    }
  }

  // ══════════════════════════════════════════════════════════
  //  TERMINAL
  // ══════════════════════════════════════════════════════════

  function initNotepad(winEl) {
    const box = winEl.querySelector("#notepad-text");
    const status = winEl.querySelector("#notepad-status");
    const clearBtn = winEl.querySelector("#notepad-clear");
    if (!box || !status || !clearBtn) return;

    const key = state.user && state.user.username ? `qos:notepad:${state.user.username}` : "qos:notepad:guest";
    box.value = localStorage.getItem(key) || "";
    box.focus();

    let timer = null;
    const saveNow = () => {
      localStorage.setItem(key, box.value);
      const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      status.textContent = `Saved at ${t}`;
    };

    box.addEventListener("input", () => {
      status.textContent = "Typing...";
      if (timer) clearTimeout(timer);
      timer = setTimeout(saveNow, 350);
    });

    clearBtn.addEventListener("click", () => {
      box.value = "";
      saveNow();
      status.textContent = "Cleared";
      box.focus();
    });
  }

  function initTerminal(winEl) {
    const input = winEl.querySelector(".term-input");
    const output = winEl.querySelector(".term-output");

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim();
        input.value = "";
        if (!cmd) return;
        appendTerm(output, `qubit@os:~$ ${cmd}`, "");
        processCommand(cmd, output);
      }
    });

    input.focus();
  }

  function appendTerm(output, text, cls) {
    const line = document.createElement("div");
    line.className = "term-line " + cls;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function appendTermHTML(output, html) {
    const line = document.createElement("div");
    line.className = "term-line";
    line.innerHTML = html;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function processCommand(cmd, output) {
    const parts = cmd.toLowerCase().split(/\s+/);
    const base = parts[0];

    switch (base) {
      case "help":
        appendTermHTML(output, `
<span style="color:var(--accent)">Available commands:</span>
  help         — Show this help
  clear        — Clear terminal
  sysinfo      — System information
  backends     — List IBM Quantum backends
  simulate     — Run quantum circuit (bell/ghz/grover/superposition)
  compile      — Compile QPlang code
  qrng [bits]  — Generate quantum random numbers
  hash [text]  — SHA3-256 hash
  aria [msg]   — Ask ARIA AI
  version      — OS version
  echo [text]  — Echo text
        `);
        break;

      case "clear":
        output.innerHTML = "";
        break;

      case "version":
        appendTerm(output, "QubitPage® Quantum OS v1.0.0 — Genesis", "cyan");
        break;

      case "echo":
        appendTerm(output, parts.slice(1).join(" "), "");
        break;

      case "sysinfo":
        fetch("/api/system/info")
          .then((r) => r.json())
          .then((data) => {
            appendTermHTML(output, `
<span style="color:var(--accent)">System Information</span>
  OS:       ${data.os_name} v${data.os_version} (${data.os_codename})
  Stim:     ${data.has_stim ? "✓ v" + data.stim_version : "✗"}
  Qiskit:   ${data.has_qiskit ? "✓" : "✗"}
  IBM:      ${data.has_ibm ? "✓" : "✗"}
  QPlang:   ${data.has_qplang ? "✓" : "✗"}
  NumPy:    ${data.has_numpy ? "✓" : "✗"}
            `);
          })
          .catch(() => appendTerm(output, "Error fetching system info", "error"));
        break;

      case "backends":
        fetch("/api/system/backends")
          .then((r) => r.json())
          .then((data) => {
            if (data.data && data.data.backends) {
              data.data.backends.forEach((b) => {
                appendTerm(output, `  ${b.name.padEnd(20)} ${b.qubits}q  ${b.status}`, "green");
              });
            }
          })
          .catch(() => appendTerm(output, "Error listing backends", "error"));
        break;

      case "simulate": {
        const circuitType = parts[1] || "bell";
        appendTerm(output, `Simulating ${circuitType} circuit...`, "cyan");
        fetch("/api/quantum/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: circuitType, params: { shots: 1024 } }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.data) {
              appendTerm(output, `Results (${data.data.shots} shots):`, "green");
              for (const [state, count] of Object.entries(data.data.counts)) {
                const pct = ((count / data.data.shots) * 100).toFixed(1);
                const bar = "█".repeat(Math.round(pct / 3));
                appendTerm(output, `  |${state}⟩  ${bar} ${pct}%  (${count})`, "");
              }
            } else {
              appendTerm(output, data.error || "Simulation failed", "error");
            }
          })
          .catch(() => appendTerm(output, "Simulation error", "error"));
        break;
      }

      case "qrng": {
        const bits = parseInt(parts[1]) || 256;
        fetch("/api/crypto/qrng", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bits }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              appendTerm(output, `QRNG (${data.n_bits} bits):`, "green");
              appendTerm(output, "  " + data.hex, "cyan");
            } else {
              appendTerm(output, data.error || "QRNG failed", "error");
            }
          });
        break;
      }

      case "hash": {
        const text = parts.slice(1).join(" ");
        if (!text) { appendTerm(output, "Usage: hash <text>", "error"); break; }
        fetch("/api/crypto/hash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              appendTerm(output, `SHA3-256: ${data.hash}`, "green");
            }
          });
        break;
      }

      case "aria": {
        const msg = parts.slice(1).join(" ");
        if (!msg) { appendTerm(output, "Usage: aria <question>", "error"); break; }
        appendTerm(output, "ARIA is thinking...", "dim");
        fetch("/api/aria/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              appendTerm(output, `[ARIA/${data.model}]`, "purple");
              appendTerm(output, data.message, "");
            } else {
              appendTerm(output, "ARIA unavailable: " + data.message, "error");
            }
          });
        break;
      }

      default:
        appendTerm(output, `Command not found: ${base}. Type 'help' for commands.`, "error");
    }
  }

  // ══════════════════════════════════════════════════════════
  //  CIRCUIT LAB
  // ══════════════════════════════════════════════════════════

  function initCircuitLab(winEl) {
    const editor = winEl.querySelector(".cl-editor");
    const preset = winEl.querySelector(".cl-preset");
    const runBtn = winEl.querySelector("#cl-run");
    const compileBtn = winEl.querySelector("#cl-compile");
    const backendsBtn = winEl.querySelector("#cl-backends-btn");
    const backendsPanel = winEl.querySelector("#cl-backends-panel");
    const backendsClose = winEl.querySelector("#cl-backends-close");
    const mainContent = winEl.querySelector("#cl-main-content");
    const backendSelect = winEl.querySelector("#cl-backend-select");
    const statusEl = winEl.querySelector(".cl-status");
    const resultsEl = winEl.querySelector(".cl-results");

    const presets = {
      bell: "qreg q[2]\ncreg c[2]\n\nH q[0]\nCNOT q[0], q[1]\n\nmeasure q -> c",
      ghz: "qreg q[3]\ncreg c[3]\n\nH q[0]\nCNOT q[0], q[1]\nCNOT q[0], q[2]\n\nmeasure q -> c",
      superposition: "qreg q[4]\ncreg c[4]\n\nH q[0]\nH q[1]\nH q[2]\nH q[3]\n\nmeasure q -> c",
      grover: "qreg q[2]\ncreg c[2]\n\n# Grover's search\nH q[0]\nH q[1]\n\n# Oracle\nCZ q[0], q[1]\n\n# Diffusion\nH q[0]\nH q[1]\nX q[0]\nX q[1]\nCZ q[0], q[1]\nX q[0]\nX q[1]\nH q[0]\nH q[1]\n\nmeasure q -> c",
    };

    preset.addEventListener("change", () => {
      if (presets[preset.value]) editor.value = presets[preset.value];
    });

    // ── Load backends dropdown ──
    loadBackendDropdown(backendSelect);

    // ── Backends panel toggle ──
    backendsBtn.addEventListener("click", () => {
      backendsPanel.classList.toggle("hidden");
      mainContent.classList.toggle("hidden");
      if (!backendsPanel.classList.contains("hidden")) {
        loadBackendsList(winEl);
      }
    });
    backendsClose.addEventListener("click", () => {
      backendsPanel.classList.add("hidden");
      mainContent.classList.remove("hidden");
    });

    // ── Backends filters ──
    winEl.querySelectorAll(".cl-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        winEl.querySelectorAll(".cl-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filterBackendsList(winEl, btn.dataset.filter);
      });
    });

    // ── Test All button ──
    winEl.querySelector("#cl-test-all").addEventListener("click", () => {
      testAllBackends(winEl);
    });

    // ── Report button ──
    winEl.querySelector("#cl-report").addEventListener("click", () => {
      generateBackendsReport(winEl);
    });

    // Run simulation
    runBtn.addEventListener("click", () => {
      const circuitType = preset.value || "bell";
      statusEl.textContent = "Running...";
      statusEl.style.color = "var(--accent)";
      runBtn.disabled = true;

      fetch("/api/quantum/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: circuitType, params: { shots: 4096 } }),
      })
        .then((r) => r.json())
        .then((data) => {
          runBtn.disabled = false;
          if (data.success && data.data) {
            statusEl.textContent = `Done (${data.data.shots} shots)`;
            statusEl.style.color = "var(--accent-green)";
            renderResults(resultsEl, data.data);
          } else {
            statusEl.textContent = "Error";
            statusEl.style.color = "var(--accent-red)";
            resultsEl.innerHTML = `<div style="color:var(--accent-red)">${escapeHTML(data.error || "Unknown error")}</div>`;
          }
        })
        .catch(() => {
          runBtn.disabled = false;
          statusEl.textContent = "Error";
        });
    });

    // Compile QPlang
    compileBtn.addEventListener("click", () => {
      const source = editor.value;
      if (!source.trim()) return;
      statusEl.textContent = "Compiling...";

      fetch("/api/qplang/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            statusEl.textContent = "Compiled";
            statusEl.style.color = "var(--accent-green)";
            resultsEl.innerHTML = `
              <div style="margin-bottom:12px">
                <span style="color:var(--accent)">✓ Compiled successfully</span><br>
                <small style="color:var(--text-dim)">Qubits: ${data.data.n_qubits} | Cbits: ${data.data.n_cbits} | QEC Blocks: ${data.data.qec_blocks}</small>
              </div>
              <div style="color:var(--text-dim);font-size:11px;text-transform:uppercase;margin-bottom:4px">OpenQASM 3.0</div>
              <pre style="background:var(--bg-primary);padding:10px;border-radius:6px;font-size:12px;color:var(--accent-green);overflow:auto;max-height:300px">${escapeHTML(data.data.qasm)}</pre>
            `;
            if (data.data.warnings && data.data.warnings.length) {
              resultsEl.innerHTML += `<div style="color:var(--accent-orange);margin-top:8px">⚠ ${data.data.warnings.join("<br>")}</div>`;
            }
          } else {
            statusEl.textContent = "Error";
            statusEl.style.color = "var(--accent-red)";
            resultsEl.innerHTML = `<div style="color:var(--accent-red)">✗ ${escapeHTML(data.error || "Compilation failed")}</div>`;
          }
        });
    });
  }

  // ── Quantum Backends Browser Functions ──

  let _cachedBackends = [];

  function loadBackendDropdown(selectEl) {
    fetch("/api/quantum/backends")
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.backends) return;
        _cachedBackends = data.backends;
        selectEl.innerHTML = "";
        data.backends.forEach(b => {
          const opt = document.createElement("option");
          opt.value = b.id;
          const priceTag = b.pricing === "free" ? " (Free)" : b.pricing === "free_tier" ? " (Free Tier)" : " (Paid)";
          const typeTag = b.device_type === "qpu" ? " [QPU]" : " [SIM]";
          opt.textContent = b.name + typeTag + priceTag;
          opt.disabled = !b.selectable;
          if (!b.selectable) opt.textContent += " 🔒";
          selectEl.appendChild(opt);
        });
      });
  }

  function loadBackendsList(winEl) {
    const container = winEl.querySelector("#cl-backends-list");
    container.innerHTML = '<div style="color:var(--text-dim)">Loading backends...</div>';
    fetch("/api/quantum/backends")
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          container.innerHTML = '<div style="color:#ff6464">Failed to load backends</div>';
          return;
        }
        _cachedBackends = data.backends;
        renderBackendsList(container, data.backends);
      });
  }

  function renderBackendsList(container, backends) {
    container.innerHTML = backends.map(b => {
      const priceColor = b.pricing === "free" ? "#00ff88" : b.pricing === "free_tier" ? "#ffc800" : "#ff6464";
      const priceLabel = b.pricing === "free" ? "FREE" : b.pricing === "free_tier" ? "FREE TIER" : "PAID";
      const typeIcon = b.device_type === "qpu" ? "🔬" : "💻";
      const providerIcon = b.provider === "amazon_braket" ? "☁" : b.provider === "ibm_quantum" ? "💠" : "⚛";
      const statusColor = b.status === "online" ? "#00ff88" : b.status === "offline" ? "#ff6464" : "var(--text-dim)";
      const statusDot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${statusColor};margin-right:4px"></span>`;
      const lockIcon = b.selectable ? "" : '<span style="font-size:.8em;margin-left:4px" title="Disabled by admin">🔒</span>';

      return `<div class="backend-card" data-provider="${b.provider}" data-type="${b.device_type}" data-pricing="${b.pricing}" data-id="${b.id}"
        style="border:1px solid ${b.selectable ? 'rgba(0,212,255,.15)' : 'rgba(255,100,100,.1)'};border-radius:8px;padding:10px;background:${b.selectable ? 'rgba(0,212,255,.02)' : 'rgba(255,100,100,.02)'};display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:1em">${typeIcon}</span>
            <strong style="color:var(--accent);font-size:.85em">${escapeHTML(b.name)}</strong>
            <span style="font-size:.65em;padding:1px 6px;border-radius:8px;background:rgba(${priceColor === '#00ff88' ? '0,255,136' : priceColor === '#ffc800' ? '255,200,0' : '255,100,100'},.15);color:${priceColor};white-space:nowrap">${priceLabel}</span>
            <span style="font-size:.65em;padding:1px 6px;border-radius:8px;background:rgba(0,212,255,.1);color:var(--text-dim)">${b.device_type.toUpperCase()}</span>
            ${lockIcon}
          </div>
          <div style="font-size:.72em;color:var(--text-dim);margin-top:3px">${providerIcon} ${escapeHTML(b.provider_display)} | ${b.qubits} qubits | ${escapeHTML(b.technology || "")}</div>
          <div style="font-size:.68em;color:var(--text-dim);margin-top:2px">${escapeHTML(b.description || "")}</div>
          <div style="font-size:.66em;margin-top:2px;display:flex;gap:8px;flex-wrap:wrap">
            <span style="color:var(--text-dim)">💰 ${escapeHTML(b.price_info || "")}</span>
            <span style="color:var(--text-dim)">📍 ${escapeHTML(b.region || "")}</span>
            ${b.sdk_installed ? '<span style="color:#00ff88">SDK ✓</span>' : '<span style="color:#ff6464">SDK ✗</span>'}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          <div style="font-size:.72em">${statusDot}${b.status || "unknown"}</div>
          <button class="btn-secondary backend-test-btn" data-bid="${b.id}" style="font-size:.68em;padding:3px 8px;white-space:nowrap">🔍 Test</button>
        </div>
      </div>`;
    }).join("");

    // Test connection handlers
    container.querySelectorAll(".backend-test-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const bid = btn.dataset.bid;
        btn.disabled = true;
        btn.textContent = "Testing...";
        fetch("/api/quantum/test-backend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backend_id: bid }),
        })
          .then(r => r.json())
          .then(result => {
            btn.disabled = false;
            const statusDot = btn.closest(".backend-card").querySelector("div:last-child > div:first-child");
            if (result.success) {
              btn.textContent = "✅ Online";
              btn.style.color = "#00ff88";
              if (statusDot) statusDot.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00ff88;margin-right:4px"></span>online (${result.latency_ms}ms)`;
            } else {
              btn.textContent = "❌ " + (result.status || "Error");
              btn.style.color = "#ff6464";
              if (statusDot) statusDot.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff6464;margin-right:4px"></span>${result.status}`;
            }
            setTimeout(() => { btn.textContent = "🔍 Test"; btn.style.color = ""; }, 5000);
          })
          .catch(() => { btn.disabled = false; btn.textContent = "🔍 Test"; });
      });
    });
  }

  function filterBackendsList(winEl, filter) {
    const cards = winEl.querySelectorAll(".backend-card");
    cards.forEach(card => {
      const provider = card.dataset.provider;
      const type = card.dataset.type;
      const pricing = card.dataset.pricing;
      let show = true;
      if (filter === "simulator") show = type === "simulator";
      else if (filter === "qpu") show = type === "qpu";
      else if (filter === "free") show = pricing === "free" || pricing === "free_tier";
      else if (filter === "amazon_braket") show = provider === "amazon_braket";
      else if (filter === "ibm_quantum") show = provider === "ibm_quantum";
      card.style.display = show ? "" : "none";
    });
  }

  function testAllBackends(winEl) {
    const btn = winEl.querySelector("#cl-test-all");
    btn.disabled = true;
    btn.textContent = "Testing...";
    fetch("/api/quantum/test-all", { method: "POST", headers: { "Content-Type": "application/json" } })
      .then(r => r.json())
      .then(data => {
        btn.disabled = false;
        btn.textContent = "🔍 Test All";
        if (!data.success || !data.report) return;
        const providers = data.report.connection_tests.providers;
        let msg = "Connection Test Results:\n\n";
        for (const [prov, info] of Object.entries(providers)) {
          const icon = info.status === "online" ? "✅" : "❌";
          msg += `${icon} ${prov}: ${info.status} (${info.latency_ms}ms)\n   ${info.message}\n   SDK: ${info.sdk_installed ? "Installed" : "Not installed"} | Credentials: ${info.has_credentials ? "Set" : "Not set"}\n\n`;
        }
        alert(msg);
      })
      .catch(() => { btn.disabled = false; btn.textContent = "🔍 Test All"; });
  }

  function generateBackendsReport(winEl) {
    const reportEl = winEl.querySelector("#cl-backends-report");
    reportEl.classList.remove("hidden");
    reportEl.innerHTML = '<div style="color:var(--accent)">Generating report...</div>';
    fetch("/api/quantum/test-all", { method: "POST", headers: { "Content-Type": "application/json" } })
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.report) {
          reportEl.innerHTML = '<div style="color:#ff6464">Failed to generate report</div>';
          return;
        }
        const r = data.report;
        const providers = r.connection_tests.providers;
        reportEl.innerHTML = `
          <div style="border:1px solid rgba(0,212,255,.2);border-radius:8px;padding:12px;margin-top:10px;background:rgba(0,212,255,.03)">
            <h4 style="margin:0 0 8px;color:var(--accent)">📊 Quantum Backends Status Report</h4>
            <div style="font-size:.72em;color:var(--text-dim);margin-bottom:8px">${new Date(r.timestamp * 1000).toLocaleString()}</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
              <div style="background:rgba(0,255,136,.05);padding:8px;border-radius:6px;text-align:center">
                <div style="font-size:1.4em;font-weight:bold;color:#00ff88">${r.total_backends}</div>
                <div style="font-size:.7em;color:var(--text-dim)">Total Backends</div>
              </div>
              <div style="background:rgba(0,255,136,.05);padding:8px;border-radius:6px;text-align:center">
                <div style="font-size:1.4em;font-weight:bold;color:#ffc800">${r.enabled_for_users}</div>
                <div style="font-size:.7em;color:var(--text-dim)">Enabled for Users</div>
              </div>
              <div style="background:rgba(0,255,136,.05);padding:8px;border-radius:6px;text-align:center">
                <div style="font-size:1.4em;font-weight:bold;color:var(--accent)">${r.connection_tests.summary.online}/${r.connection_tests.summary.total}</div>
                <div style="font-size:.7em;color:var(--text-dim)">Providers Online</div>
              </div>
            </div>
            <div style="font-size:.78em;margin-bottom:6px"><strong>By Type:</strong> Simulators: ${r.by_type.simulator || 0} | QPU: ${r.by_type.qpu || 0}</div>
            <div style="font-size:.78em;margin-bottom:6px"><strong>By Pricing:</strong> Free: ${r.by_pricing.free || 0} | Free Tier: ${r.by_pricing.free_tier || 0} | Paid: ${r.by_pricing.paid || 0}</div>
            <div style="font-size:.78em;margin-bottom:6px"><strong>SDKs:</strong>
              Stim: ${r.sdk_status.stim.installed ? '✅ v' + r.sdk_status.stim.version : '❌'} |
              Braket: ${r.sdk_status.amazon_braket.installed ? '✅' : '❌'} |
              IBM: ${r.sdk_status.qiskit_ibm.installed ? '✅' : '❌'}
            </div>
            <hr style="border:none;border-top:1px solid rgba(0,212,255,.1);margin:8px 0">
            <h5 style="margin:6px 0;color:var(--accent)">Connection Tests</h5>
            ${Object.entries(providers).map(([prov, info]) => `
              <div style="display:flex;align-items:center;gap:8px;font-size:.78em;padding:4px 0">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${info.status === 'online' ? '#00ff88' : '#ff6464'}"></span>
                <strong>${prov}</strong>
                <span style="color:var(--text-dim)">${info.message}</span>
                <span style="color:var(--text-dim)">${info.latency_ms}ms</span>
              </div>
            `).join("")}
          </div>
        `;
      });
  }

  function renderResults(container, data) {
    const counts = data.counts || {};
    const total = data.shots || 1;
    let html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:12px">
      Backend: ${data.backend} | Qubits: ${data.n_qubits} | Shots: ${total}
    </div>`;

    for (const [state, count] of Object.entries(counts)) {
      const pct = ((count / total) * 100).toFixed(1);
      html += `
        <div class="result-bar-row">
          <span class="result-label">|${state}⟩</span>
          <div class="result-bar-track">
            <div class="result-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="result-pct">${pct}%</span>
        </div>`;
    }
    container.innerHTML = html;
  }

  // ══════════════════════════════════════════════════════════
  //  QUANTUM ORACLE GAME
  // ══════════════════════════════════════════════════════════

  function initQuantumGame(winEl) {
    const qgBackendSel = winEl.querySelector("#qg-backend-select"); if (qgBackendSel) loadBackendDropdown(qgBackendSel);
    // Tab switching for game panels
    winEl.querySelectorAll(".qg-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        winEl.querySelectorAll(".qg-tab").forEach(t => {
          t.classList.remove("active");
          t.style.background = "transparent";
          t.style.color = "var(--text-dim)";
          t.style.borderColor = "rgba(0,212,255,.2)";
        });
        tab.classList.add("active");
        tab.style.background = "var(--accent)";
        tab.style.color = "#000";
        tab.style.borderColor = "var(--accent)";
        winEl.querySelectorAll(".qg-tab-panel").forEach(p => p.classList.add("hidden"));
        const panelId = "qg-panel-" + tab.dataset.tab;
        const panel = winEl.querySelector("#" + panelId);
        if (panel) panel.classList.remove("hidden");
      });
    });

    // Initialize game stats in state
    if (!state.gameStreak) state.gameStreak = 0;
    if (!state.gameMaxStreak) state.gameMaxStreak = 0;
    if (!state.gameRoundsPlayed) state.gameRoundsPlayed = 0;
    if (!state.gameCorrect) state.gameCorrect = 0;

    const startBtn = winEl.querySelector("#qg-start");
    const arena = winEl.querySelector("#qg-arena");
    const controls = winEl.querySelector("#qg-controls");
    const hintEl = winEl.querySelector("#qg-hint");
    const optionsEl = winEl.querySelector("#qg-options");
    const feedbackEl = winEl.querySelector("#qg-feedback");
    const scoreEl = winEl.querySelector("#qg-score");
    const levelEl = winEl.querySelector("#qg-level");

    startBtn.addEventListener("click", () => startGameRound(winEl));
  }

  function startGameRound(winEl) {
    const arena = winEl.querySelector("#qg-arena");
    const controls = winEl.querySelector("#qg-controls");
    const hintEl = winEl.querySelector("#qg-hint");
    const optionsEl = winEl.querySelector("#qg-options");
    const feedbackEl = winEl.querySelector("#qg-feedback");

    arena.innerHTML = '<div class="qg-intro"><p style="color:var(--accent)">⏳ Preparing quantum state...</p></div>';
    controls.classList.add("hidden");
    feedbackEl.classList.add("hidden");

    fetch("/api/game/round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty: state.gameLevel }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          arena.innerHTML = '<div class="qg-intro"><p style="color:var(--accent-red)">Error starting round</p></div>';
          return;
        }
        const roundData = data.data;
        state.gameRound = roundData;

        // Build circuit gate display
        const gatesHTML = (roundData.gates_used || [])
          .map((g) => `<span class="qg-gate">${g}</span>`)
          .join('<span class="qg-wire">→</span>');

        // Show quantum state visualization with circuit
        arena.innerHTML = `
          <div style="text-align:center">
            <div style="font-size:48px;margin-bottom:12px;animation:orbit-spin 3s linear infinite">⚛</div>
            <p style="color:var(--accent-purple);font-size:18px;font-weight:600">Level ${roundData.difficulty} — ${roundData.difficulty === 1 ? 'Single Qubit' : roundData.difficulty === 2 ? 'Two Qubits' : roundData.difficulty === 3 ? 'Three Qubits' : roundData.difficulty + ' Qubits'}</p>
            <div class="qg-circuit-display">${gatesHTML || '<span class="qg-gate">I</span>'}</div>
            <p style="color:var(--text-dim);font-size:12px;margin-top:8px">Predict the most probable measurement outcome!</p>
          </div>
        `;

        // Show hint and options
        hintEl.textContent = roundData.hint;
        controls.classList.remove("hidden");

        // Generate options from actual probabilities
        const outcomes = Object.keys(roundData.actual_probabilities);
        // Add some decoy options
        const allOptions = new Set(outcomes);
        const nQubits = outcomes[0] ? outcomes[0].length : 1;
        const maxOptions = Math.min(6, Math.pow(2, nQubits));
        while (allOptions.size < maxOptions) {
          let decoy = "";
          for (let i = 0; i < nQubits; i++) decoy += Math.random() < 0.5 ? "0" : "1";
          allOptions.add(decoy);
        }

        // Shuffle options
        const shuffled = Array.from(allOptions).sort(() => Math.random() - 0.5);

        optionsEl.innerHTML = "";
        for (const opt of shuffled) {
          const btn = document.createElement("button");
          btn.className = "qg-option";
          btn.textContent = `|${opt}⟩`;
          btn.addEventListener("click", () => checkGameAnswer(opt, winEl));
          optionsEl.appendChild(btn);
        }
      });
  }

  function checkGameAnswer(predicted, winEl) {
    const arena = winEl.querySelector("#qg-arena");
    const feedbackEl = winEl.querySelector("#qg-feedback");
    const scoreEl = winEl.querySelector("#qg-score");
    const levelEl = winEl.querySelector("#qg-level");
    const optionsEl = winEl.querySelector("#qg-options");

    if (!state.gameRound) return;

    const probs = state.gameRound.actual_probabilities;
    const counts = state.gameRound.counts || {};
    const topOutcome = Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0];
    const correct = predicted === topOutcome;

    // Highlight buttons
    optionsEl.querySelectorAll(".qg-option").forEach((btn) => {
      const val = btn.textContent.replace(/[|⟩]/g, "");
      if (val === topOutcome) btn.classList.add("correct");
      else if (val === predicted && !correct) btn.classList.add("wrong");
      btn.style.pointerEvents = "none";
    });

    // Build probability histogram
    const sortedProbs = Object.entries(probs).sort((a, b) => b[1] - a[1]);
    const maxProb = sortedProbs[0][1];
    const histogramHTML = sortedProbs.map(([outcome, prob]) => {
      const pct = (prob * 100).toFixed(1);
      const barWidth = Math.max(4, (prob / maxProb) * 100);
      const isTop = outcome === topOutcome;
      const isPredicted = outcome === predicted;
      let barClass = "qg-prob-bar";
      if (isTop) barClass += " top";
      if (isPredicted && !correct) barClass += " wrong";
      return `<div class="qg-prob-row">
        <span class="qg-prob-label">|${outcome}⟩</span>
        <div class="qg-prob-track"><div class="${barClass}" style="width:${barWidth}%"></div></div>
        <span class="qg-prob-pct">${pct}%</span>
        <span class="qg-prob-count">(${counts[outcome] || 0}/1000)</span>
      </div>`;
    }).join("");

    // Show histogram in arena
    arena.innerHTML = `
      <div style="width:100%;max-width:500px">
        <p style="color:var(--accent);font-size:14px;margin-bottom:12px;text-align:center">📊 Measurement Results (1000 shots)</p>
        <div class="qg-histogram">${histogramHTML}</div>
        ${state.gameRound.explanation ? `<p class="qg-explanation">💡 ${state.gameRound.explanation}</p>` : ''}
      </div>
    `;

    feedbackEl.classList.remove("hidden");
    if (correct) {
      state.gameScore += state.gameLevel * 10;
      state.gameStreak = (state.gameStreak || 0) + 1;
      state.gameMaxStreak = Math.max(state.gameMaxStreak || 0, state.gameStreak);
      state.gameCorrect = (state.gameCorrect || 0) + 1;
      state.gameRoundsPlayed = (state.gameRoundsPlayed || 0) + 1;
      feedbackEl.className = "qg-feedback correct";
      const leveledUp = state.gameScore >= state.gameLevel * 30;
      feedbackEl.innerHTML = `✓ Correct! The most probable outcome was |${topOutcome}⟩ (+${state.gameLevel * 10} pts)`;
      if (leveledUp) {
        state.gameLevel = Math.min(state.gameLevel + 1, 5);
        feedbackEl.innerHTML += `<br><span style="color:var(--accent-purple)">🎉 LEVEL UP → Level ${state.gameLevel}!</span>`;
      }
    } else {
      feedbackEl.className = "qg-feedback wrong";
      state.gameStreak = 0;
      state.gameRoundsPlayed = (state.gameRoundsPlayed || 0) + 1;
      feedbackEl.innerHTML = `✗ The answer was |${topOutcome}⟩ with probability ${(probs[topOutcome] * 100).toFixed(1)}%`;
    }

    scoreEl.textContent = state.gameScore;
    const streakEl = winEl.querySelector("#qg-streak");
    if (streakEl) streakEl.textContent = state.gameStreak || 0;
    // Update stats panel
    const statsEl = winEl.querySelector("#qg-stats-content");
    if (statsEl && state.gameRoundsPlayed > 0) {
      const accuracy = ((state.gameCorrect / state.gameRoundsPlayed) * 100).toFixed(1);
      statsEl.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px">
          <div style="background:var(--surface2);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:1.6em;font-weight:bold;color:var(--accent)">${state.gameRoundsPlayed}</div>
            <div style="font-size:.75em;color:var(--text-dim)">Rounds Played</div>
          </div>
          <div style="background:var(--surface2);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:1.6em;font-weight:bold;color:#00ff88">${accuracy}%</div>
            <div style="font-size:.75em;color:var(--text-dim)">Accuracy</div>
          </div>
          <div style="background:var(--surface2);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:1.6em;font-weight:bold;color:var(--accent-purple)">🔥 ${state.gameStreak || 0}</div>
            <div style="font-size:.75em;color:var(--text-dim)">Current Streak</div>
          </div>
          <div style="background:var(--surface2);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:1.6em;font-weight:bold;color:#ffc800">⭐ ${state.gameMaxStreak || 0}</div>
            <div style="font-size:.75em;color:var(--text-dim)">Best Streak</div>
          </div>
        </div>
        <p style="color:var(--text-dim);font-size:.82em">Score: ${state.gameScore} | Level: ${state.gameLevel} | Correct: ${state.gameCorrect}/${state.gameRoundsPlayed}</p>
      `;
    }
    levelEl.textContent = state.gameLevel;

    // Next round button
    setTimeout(() => {
      feedbackEl.innerHTML += `<br><button class="btn-quantum" style="margin-top:12px">Next Round →</button>`;
      feedbackEl.querySelector(".btn-quantum").addEventListener("click", () => startGameRound(winEl));
    }, 500);
  }

  // ══════════════════════════════════════════════════════════
  //  CRYPTO TOOLS
  // ══════════════════════════════════════════════════════════

  function initCryptoTools(winEl) {
    const ctBackendSel = winEl.querySelector("#ct-backend-select"); if (ctBackendSel) loadBackendDropdown(ctBackendSel);
    // Tab switching
    winEl.querySelectorAll(".ct-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        winEl.querySelectorAll(".ct-tab").forEach((t) => t.classList.remove("active"));
        winEl.querySelectorAll(".ct-panel").forEach((p) => p.classList.add("hidden"));
        tab.classList.add("active");
        winEl.querySelector(`#ct-panel-${tab.dataset.tab}`).classList.remove("hidden");
      });
    });

    // Encrypt
    winEl.querySelector("#ct-enc-btn").addEventListener("click", () => {
      const text = winEl.querySelector("#ct-enc-input").value;
      if (!text) return;
      fetch("/api/crypto/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }).then((r) => r.json()).then((data) => {
        if (data.success) {
          winEl.querySelector("#ct-enc-result").innerHTML = `
            <div class="label">Algorithm</div><div class="value">${escapeHTML(data.algorithm)}</div>
            <div class="label">Ciphertext (hex)</div><div class="value">${escapeHTML(data.ciphertext_hex)}</div>
            <div class="label">Key (hex)</div><div class="value">${escapeHTML(data.key_hex)}</div>
            <div class="label">Key Source</div><div class="value">${escapeHTML(data.key_source)}</div>
          `;
        }
      });
    });

    // Decrypt
    winEl.querySelector("#ct-dec-btn").addEventListener("click", () => {
      const cipher = winEl.querySelector("#ct-dec-cipher").value;
      const key = winEl.querySelector("#ct-dec-key").value;
      if (!cipher || !key) return;
      fetch("/api/crypto/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext_hex: cipher, key_hex: key }),
      }).then((r) => r.json()).then((data) => {
        winEl.querySelector("#ct-dec-result").innerHTML = data.success
          ? `<div class="label">Plaintext</div><div class="value">${escapeHTML(data.plaintext)}</div>`
          : `<div style="color:var(--accent-red)">${escapeHTML(data.error)}</div>`;
      });
    });

    // Hash
    winEl.querySelector("#ct-hash-btn").addEventListener("click", () => {
      const text = winEl.querySelector("#ct-hash-input").value;
      if (!text) return;
      fetch("/api/crypto/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }).then((r) => r.json()).then((data) => {
        if (data.success) {
          winEl.querySelector("#ct-hash-result").innerHTML = `
            <div class="label">Algorithm</div><div class="value">${escapeHTML(data.algorithm)}</div>
            <div class="label">Hash</div><div class="value">${escapeHTML(data.hash)}</div>
          `;
        }
      });


    // Quantum Crack
    const crackBtn = winEl.querySelector("#ct-crack-btn");
    if (crackBtn) {
      crackBtn.addEventListener("click", () => {
        const text = winEl.querySelector("#ct-crack-input").value;
        if (!text) return;
        const res = winEl.querySelector("#ct-crack-result");
        res.innerHTML = '<div style="color:var(--accent)">⚡ Running Grover search...</div>';
        fetch("/api/crypto/quantum-crack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }).then(r => r.json()).then(data => {
          if (data.success) {
            res.innerHTML = `
              <div class="label">Original</div><div class="value">${escapeHTML(data.original_text)}</div>
              <div class="label">Hash</div><div class="value">${escapeHTML(data.hash)}</div>
              <div class="label">Found</div><div class="value" style="color:${data.match ? 'var(--accent-green)' : 'var(--accent-red)'}">${escapeHTML(data.found_bits)} ${data.match ? '✓ MATCH' : '✗'}</div>
              <div class="label">Algorithm</div><div class="value">${escapeHTML(data.algorithm)}</div>
              <div class="label">Classical Steps</div><div class="value">${data.classical_steps}</div>
              <div class="label">Quantum Steps</div><div class="value">${data.quantum_steps || data.quantum_steps_theoretical}</div>
              <div class="label">Speedup</div><div class="value" style="color:var(--accent-green)">${escapeHTML(data.speedup || data.speedup_theoretical)}</div>
              <div class="label">Backend</div><div class="value">${escapeHTML(data.backend)}</div>
              <div class="label">Time</div><div class="value">${data.time_ms}ms</div>
            `;
          } else {
            res.innerHTML = `<div style="color:var(--accent-red)">${escapeHTML(data.error || 'Crack failed')}</div>`;
          }
        });
      });
    }

    const calcBtn = winEl.querySelector("#ct-calc-btn");
    if (calcBtn) {
      calcBtn.addEventListener("click", () => {
        const algo = winEl.querySelector("#ct-calc-algo").value;
        const res = winEl.querySelector("#ct-calc-result");
        res.innerHTML = '<div style="color:var(--accent)">Calculating...</div>';
        fetch("/api/crypto/crack-calculator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ algorithm: algo }),
        }).then(r => r.json()).then(data => {
          if (data.success) {
            let html = `
              <div class="label">Algorithm</div><div class="value">${escapeHTML(data.algorithm)} (${data.key_bits}-bit)</div>
              <div class="label">Classical Brute Force</div><div class="value">${escapeHTML(data.classical.operations)} ops → ${escapeHTML(data.classical.time)}</div>
              <div class="label">Grover Attack</div><div class="value">${escapeHTML(data.grover.operations)} ops → ${escapeHTML(data.grover.time)}</div>
              <div class="label">Qubits Required</div><div class="value">${data.grover.qubits_required || 'N/A'}</div>`;
            if (data.shor) {
              html += `<div class="label">Shor Attack</div><div class="value">${escapeHTML(data.shor.operations)} ops → ${escapeHTML(data.shor.time)}</div>`;
              html += `<div class="label">Shor Qubits</div><div class="value">${data.shor.qubits_required}</div>`;
            }
            html += `<div class="label">Verdict</div><div class="value" style="color:${data.verdict === 'SAFE' ? 'var(--accent-green)' : 'var(--accent-red)'}"><strong>${data.verdict}</strong></div>`;
            html += `<div class="label">Recommendation</div><div class="value">${escapeHTML(data.recommendation)}</div>`;
            res.innerHTML = html;
          }
        });
      });
    }    });

    // QRNG
    winEl.querySelector("#ct-qrng-btn").addEventListener("click", () => {
      const bits = parseInt(winEl.querySelector("#ct-qrng-bits").value) || 256;
      fetch("/api/crypto/qrng", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bits }),
      }).then((r) => r.json()).then((data) => {
        if (data.success) {
          winEl.querySelector("#ct-qrng-result").innerHTML = `
            <div class="label">Source</div><div class="value">${escapeHTML(data.source)}</div>
            <div class="label">Bits Generated</div><div class="value">${data.n_bits}</div>
            <div class="label">Hex Output</div><div class="value">${escapeHTML(data.hex)}</div>
            <div class="label">Binary</div><div class="value" style="font-size:10px;word-break:break-all">${escapeHTML(data.random_bits)}</div>
          `;
        }
      });
    });

    // BB84
    winEl.querySelector("#ct-bb84-btn").addEventListener("click", () => {
      const keyLen = parseInt(winEl.querySelector("#ct-bb84-len").value) || 16;
      fetch("/api/crypto/bb84", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_length: keyLen }),
      }).then((r) => r.json()).then((data) => {
        if (data.success) {
          let stepsHtml = data.steps.map((s) =>
            `<div style="margin:4px 0"><span style="color:var(--accent)">${s.step}.</span> ${escapeHTML(s.action)}</div>`
          ).join("");
          winEl.querySelector("#ct-bb84-result").innerHTML = `
            <div class="label">Protocol</div><div class="value">${escapeHTML(data.protocol)}</div>
            <div class="label">Qubits Sent</div><div class="value">${data.alice_bits_sent}</div>
            <div class="label">Matching Bases</div><div class="value">${data.matching_bases}</div>
            <div class="label">Sifted Key</div><div class="value" style="font-size:16px;letter-spacing:2px">${escapeHTML(data.sifted_key)}</div>
            <div class="label" style="margin-top:12px">Protocol Steps</div>
            ${stepsHtml}
          `;
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  ARIA AI
  // ══════════════════════════════════════════════════════════

  function initAria(winEl) {
    const input = winEl.querySelector(".aria-input");
    const sendBtn = winEl.querySelector("#aria-send");
    const messages = winEl.querySelector(".aria-messages");

    function sendMessage() {
      const msg = input.value.trim();
      if (!msg) return;
      input.value = "";

      // User message
      addAriaMsg(messages, msg, "user");
      state.ariaHistory.push({ role: "user", content: msg });

      // Typing indicator
      const typingEl = document.createElement("div");
      typingEl.className = "aria-typing";
      typingEl.textContent = "ARIA is thinking...";
      messages.appendChild(typingEl);
      messages.scrollTop = messages.scrollHeight;

      fetch("/api/aria/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: state.ariaHistory.slice(-10) }),
      })
        .then((r) => r.json())
        .then((data) => {
          typingEl.remove();
          if (data.success) {
            addAriaMsg(messages, data.message, "bot", data.model);
            state.ariaHistory.push({ role: "assistant", content: data.message });
          } else {
            addAriaMsg(messages, "Sorry, I'm temporarily unavailable. Please try again.", "bot");
          }
        })
        .catch(() => {
          typingEl.remove();
          addAriaMsg(messages, "Connection error. Please check your network.", "bot");
        });
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }

  function addAriaMsg(container, text, type, model) {
    const el = document.createElement("div");
    el.className = `aria-msg ${type}`;
    const avatar = type === "bot" ? "⚛" : "👤";
    // Format bot messages with basic markdown
    let formattedText = escapeHTML(text);
    // Bold
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Code blocks
    formattedText = formattedText.replace(/```([\s\S]*?)```/g, "<pre>$1</pre>");
    // Inline code
    formattedText = formattedText.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Line breaks
    formattedText = formattedText.replace(/\n/g, "<br>");

    el.innerHTML = `
      <div class="aria-avatar">${avatar}</div>
      <div class="aria-bubble">
        ${type === "bot" && model ? `<small style="color:var(--text-dim)">${escapeHTML(model)}</small><br>` : ""}
        ${formattedText}
      </div>
    `;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  // ══════════════════════════════════════════════════════════
  //  SETTINGS
  // ══════════════════════════════════════════════════════════

  function initSettings(winEl) {
    // === Quantum Backend Mode Selector ===
    try {
      var sc = winEl.querySelector(".app-settings") || winEl.querySelector(".win-body") || winEl;
      if (sc) {
        var ms = document.createElement("div");
        ms.style.cssText = "margin:1rem;padding:1rem;background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.2);border-radius:8px";
        ms.innerHTML = '<h3 style="color:#00d4ff;margin-bottom:.5rem;font-size:.9rem">Quantum Backend Mode</h3>'
          + '<div style="display:flex;gap:.5rem;align-items:center">'
          + '<select id="settings-quantum-mode" style="flex:1;background:#12121e;color:#e0e0ff;border:1px solid #2a2a3e;border-radius:4px;padding:.4rem">'
          + '<option value="simulator">Simulator (Stim/Cirq - Free)</option>'
          + '<option value="real_ibm">Real IBM QPU (Credits Required)</option></select>'
          + '<button id="settings-mode-btn" style="background:#00d4ff;color:#000;border:none;border-radius:4px;padding:.4rem .8rem;font-weight:700;cursor:pointer">Save</button></div>'
          + '<div id="settings-mode-status" style="font-size:.8rem;color:#8888aa;margin-top:.3rem"></div>';
        sc.prepend(ms);
        fetch("/api/admin/quantum-mode").then(function(r){return r.json()}).then(function(d){
          if(d.mode) document.getElementById("settings-quantum-mode").value = d.mode;
        }).catch(function(){});
        document.getElementById("settings-mode-btn").addEventListener("click", function(){
          var mode = document.getElementById("settings-quantum-mode").value;
          var token = localStorage.getItem("qp_token");
          var headers = {"Content-Type":"application/json"};
          if(token) headers["Authorization"] = "Bearer " + token;
          fetch("/api/admin/quantum-mode", {method:"POST", headers:headers, body:JSON.stringify({mode:mode})})
            .then(function(r){return r.json()})
            .then(function(d){
              var st = document.getElementById("settings-mode-status");
              if(d.success) st.innerHTML = '<span style="color:#4ade80">Mode set to: ' + d.mode + '</span>';
              else st.innerHTML = '<span style="color:#f87171">' + (d.error||"Failed") + '</span>';
            });
        });
      }
    } catch(e) { console.warn("Settings mode selector:", e); }

    // ── Settings Tab Switching ──
    winEl.querySelectorAll(".settings-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        winEl.querySelectorAll(".settings-tab").forEach(t => {
          t.classList.remove("active");
          t.style.background = "transparent";
          t.style.color = "var(--text-dim)";
          t.style.border = "1px solid rgba(0,212,255,.2)";
        });
        tab.classList.add("active");
        tab.style.background = "var(--accent)";
        tab.style.color = "#000";
        tab.style.border = "1px solid var(--accent)";
        winEl.querySelectorAll(".settings-panel").forEach(p => p.classList.add("hidden"));
        const target = winEl.querySelector("#stab-" + tab.dataset.stab);
        if (target) target.classList.remove("hidden");
      });
    });

    // Show admin tab if user is admin
    if (state.user && state.user.user_group === "admin") {
      const adminBtn = winEl.querySelector("#admin-tab-btn");
      if (adminBtn) adminBtn.classList.remove("hidden");
    }

    // ── System Info Tab ──
    fetch("/api/system/info")
      .then((r) => r.json())
      .then((data) => {
        winEl.querySelector("#settings-info").innerHTML = `
          <div>OS: <span class="val">${data.os_name} v${data.os_version}</span></div>
          <div>Codename: <span class="val">${data.os_codename}</span></div>
          <div>Stim: <span class="val">${data.has_stim ? "✓ v" + data.stim_version : "✗"}</span></div>
          <div>Qiskit: <span class="val">${data.has_qiskit ? "✓" : "✗"}</span></div>
          <div>IBM Quantum: <span class="val">${data.has_ibm ? "✓ Connected" : "✗ Offline"}</span></div>
          <div>QPlang: <span class="val">${data.has_qplang ? "✓ Loaded" : "✗"}</span></div>
          <div>NumPy: <span class="val">${data.has_numpy ? "✓" : "✗"}</span></div>
        `;
      });

    // Backends
    fetch("/api/system/backends")
      .then((r) => r.json())
      .then((data) => {
        if (data.data && data.data.backends) {
          winEl.querySelector("#settings-backends").innerHTML = data.data.backends.map((b) =>
            `<div>${b.name} — <span style="color:var(--accent-green)">${b.qubits} qubits</span> (${b.status})</div>`
          ).join("");
        }
      });

    // Theme buttons
    winEl.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        winEl.querySelectorAll(".theme-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document.body.className = btn.dataset.theme === "quantum-dark" ? "" : "theme-" + btn.dataset.theme;
      });
    });

    // ── API Keys Tab ──
    if (!state.isGuest) {
      loadApiKeyStatus(winEl);
      initApiKeyHandlers(winEl);
    }

    // ── Profile Tab ──
    if (state.user) {
      const u = state.user;
      const pf = (id, val) => { const el = winEl.querySelector("#" + id); if (el) el.textContent = val; };
      pf("profile-username", u.username || "");
      pf("profile-email", u.email || "");
      pf("profile-group", u.user_group === "admin" ? "👑 Admin" : u.user_group === "premium" ? "⭐ Premium" : "👤 " + (u.user_group || "user"));
      pf("profile-apps", (u.allowed_apps || []).join(", "));
      pf("profile-created", u.created_at ? new Date(u.created_at * 1000).toLocaleDateString() : "—");

      // Usage
      const uc = winEl.querySelector("#usage-count");
      const ul = winEl.querySelector("#usage-limit");
      const ut = winEl.querySelector("#usage-total");
      const ub = winEl.querySelector("#usage-bar-fill");
      if (uc) uc.textContent = u.daily_usage_count || 0;
      if (ul) ul.textContent = u.daily_limit >= 999999 ? "∞" : u.daily_limit || 10;
      if (ut) ut.textContent = u.total_usage || 0;
      if (ub && u.daily_limit < 999999) {
        ub.style.width = Math.min(100, ((u.daily_usage_count || 0) / (u.daily_limit || 10)) * 100) + "%";
      } else if (ub) {
        ub.style.width = "0%";
      }
    }

    // ── Admin Tab ──
    if (state.user && state.user.user_group === "admin") {
      initAdminPanel(winEl);
    }
  }

  // ── API Key Management ──

  function loadApiKeyStatus(winEl) {
    fetch("/api/user/api-keys")
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.keys) return;
        ["gemini", "groq", "ibm", "aws_access", "aws_secret"].forEach(provider => {
          const info = data.keys[provider];
          const elId = provider.replace("_", "-");
          const statusEl = winEl.querySelector("#" + elId + "-key-status");
          const maskedEl = winEl.querySelector("#" + elId + "-key-masked");
          if (info && info.set) {
            if (statusEl) {
              statusEl.textContent = "✓ Set";
              statusEl.style.background = "rgba(0,255,136,.15)";
              statusEl.style.color = "#00ff88";
            }
            if (maskedEl) maskedEl.textContent = info.masked || "";
          } else {
            if (statusEl) {
              statusEl.textContent = "Not Set";
              statusEl.style.background = "rgba(255,100,100,.15)";
              statusEl.style.color = "#ff6464";
            }
            if (maskedEl) maskedEl.textContent = "";
          }
        });
      });
  }

  function initApiKeyHandlers(winEl) {
    // Standard key handlers (save + test)
    ["gemini", "groq", "ibm"].forEach(provider => {
      const saveBtn = winEl.querySelector("#save-" + provider + "-key");
      const testBtn = winEl.querySelector("#test-" + provider + "-key");
      const input = winEl.querySelector("#" + provider + "-key-input");

      if (saveBtn) {
        saveBtn.addEventListener("click", () => {
          const key = input.value.trim();
          if (!key) return;
          saveBtn.disabled = true;
          saveBtn.textContent = "...";
          fetch("/api/user/api-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, api_key: key }),
          })
            .then(r => r.json())
            .then(data => {
              saveBtn.disabled = false;
              saveBtn.textContent = "Save";
              if (data.success) {
                input.value = "";
                loadApiKeyStatus(winEl);
                fetch("/api/auth/profile").then(r => r.json()).then(d => {
                  if (d.user) state.user = d.user;
                });
              } else {
                alert(data.error || "Failed to save key");
              }
            });
        });
      }

      if (testBtn) {
        testBtn.addEventListener("click", () => {
          const key = input.value.trim();
          if (!key) { alert("Enter an API key to test"); return; }
          testBtn.disabled = true;
          testBtn.textContent = "Testing...";
          fetch("/api/user/test-key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, api_key: key }),
          })
            .then(r => r.json())
            .then(data => {
              testBtn.disabled = false;
              testBtn.textContent = "Test";
              alert(data.success ? "✅ " + data.message : "❌ " + (data.error || "Test failed"));
            })
            .catch(() => {
              testBtn.disabled = false;
              testBtn.textContent = "Test";
              alert("Connection error");
            });
        });
      }
    });

    // AWS key handlers (save only, no test button)
    ["aws_access", "aws_secret"].forEach(provider => {
      const elId = provider.replace("_", "-");
      const saveBtn = winEl.querySelector("#save-" + elId + "-key");
      const input = winEl.querySelector("#" + elId + "-key-input");
      if (saveBtn && input) {
        saveBtn.addEventListener("click", () => {
          const key = input.value.trim();
          if (!key) return;
          saveBtn.disabled = true;
          saveBtn.textContent = "...";
          fetch("/api/user/api-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, api_key: key }),
          })
            .then(r => r.json())
            .then(data => {
              saveBtn.disabled = false;
              saveBtn.textContent = "Save";
              if (data.success) {
                input.value = "";
                loadApiKeyStatus(winEl);
              } else {
                alert(data.error || "Failed to save key");
              }
            });
        });
      }
    });
  }

  // ── Admin Panel ──

  function initAdminPanel(winEl) {
    const refreshBtn = winEl.querySelector("#admin-refresh-users");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => loadAdminUsers(winEl));
    }
    loadAdminUsers(winEl);

    // Backend access control
    const enableAllBtn = winEl.querySelector("#admin-enable-all-backends");
    const disableAllBtn = winEl.querySelector("#admin-disable-all-backends");
    const refreshBackendsBtn = winEl.querySelector("#admin-refresh-backends");

    if (enableAllBtn) enableAllBtn.addEventListener("click", () => {
      enableAllBtn.disabled = true;
      fetch("/api/admin/backends/all", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true }),
      }).then(r => r.json()).then(d => {
        enableAllBtn.disabled = false;
        if (d.success) loadAdminBackends(winEl);
      });
    });

    if (disableAllBtn) disableAllBtn.addEventListener("click", () => {
      disableAllBtn.disabled = true;
      fetch("/api/admin/backends/all", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      }).then(r => r.json()).then(d => {
        disableAllBtn.disabled = false;
        if (d.success) loadAdminBackends(winEl);
      });
    });

    if (refreshBackendsBtn) refreshBackendsBtn.addEventListener("click", () => loadAdminBackends(winEl));

    loadAdminBackends(winEl);
  }

  function loadAdminBackends(winEl) {
    const container = winEl.querySelector("#admin-backends-list");
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text-dim)">Loading backends...</div>';

    Promise.all([
      fetch("/api/quantum/backends").then(r => r.json()),
      fetch("/api/admin/backends").then(r => r.json()),
    ]).then(([backendsData, settingsData]) => {
      if (!backendsData.success) {
        container.innerHTML = '<div style="color:#ff6464">Failed to load backends</div>';
        return;
      }
      const settings = settingsData.success ? settingsData.settings : {};
      const backends = backendsData.backends;

      // Group by provider
      const groups = {};
      backends.forEach(b => {
        const key = b.provider_display || b.provider;
        if (!groups[key]) groups[key] = [];
        groups[key].push(b);
      });

      let html = '';
      for (const [provider, items] of Object.entries(groups)) {
        html += `<div style="margin-bottom:10px">
          <div style="font-size:.82em;font-weight:bold;color:var(--accent);margin-bottom:4px;padding:4px 0;border-bottom:1px solid rgba(0,212,255,.1)">${escapeHTML(provider)} (${items.length})</div>`;
        items.forEach(b => {
          const setting = settings[b.id] || {};
          const enabled = setting.enabled_for_users || false;
          const priceColor = b.pricing === "free" ? "#00ff88" : b.pricing === "free_tier" ? "#ffc800" : "#ff6464";
          const priceLabel = b.pricing === "free" ? "FREE" : b.pricing === "free_tier" ? "FREE TIER" : "PAID";
          const typeLabel = b.device_type === "qpu" ? "🔬 QPU" : "💻 SIM";

          html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:rgba(0,212,255,.02);border-radius:4px;margin-bottom:3px">
            <label class="toggle-switch" style="position:relative;display:inline-block;width:36px;height:20px;flex-shrink:0">
              <input type="checkbox" class="admin-backend-toggle" data-bid="${b.id}" ${enabled ? 'checked' : ''} style="opacity:0;width:0;height:0">
              <span style="position:absolute;cursor:pointer;inset:0;background:${enabled ? '#00ff88' : 'rgba(255,255,255,.1)'};border-radius:20px;transition:.3s"></span>
            </label>
            <div style="flex:1;font-size:.75em">
              <strong style="color:${enabled ? 'var(--text)' : 'var(--text-dim)'}">${escapeHTML(b.name)}</strong>
              <span style="font-size:.85em;margin-left:4px;padding:0 4px;border-radius:4px;background:rgba(${priceColor === '#00ff88' ? '0,255,136' : priceColor === '#ffc800' ? '255,200,0' : '255,100,100'},.12);color:${priceColor}">${priceLabel}</span>
              <span style="font-size:.85em;color:var(--text-dim);margin-left:2px">${typeLabel}</span>
              <span style="font-size:.85em;color:var(--text-dim);margin-left:2px">${b.qubits}q</span>
            </div>
          </div>`;
        });
        html += '</div>';
      }
      container.innerHTML = html;

      // Toggle handlers
      container.querySelectorAll(".admin-backend-toggle").forEach(toggle => {
        toggle.addEventListener("change", () => {
          const bid = toggle.dataset.bid;
          const enabled = toggle.checked;
          const indicator = toggle.nextElementSibling;
          fetch("/api/admin/backends", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ backend_id: bid, enabled }),
          }).then(r => r.json()).then(d => {
            if (d.success && indicator) {
              indicator.style.background = enabled ? '#00ff88' : 'rgba(255,255,255,.1)';
            }
          });
        });
      });
    });
  }

  function loadAdminUsers(winEl) {
    const container = winEl.querySelector("#admin-users-list");
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text-dim)">Loading users...</div>';

    fetch("/api/admin/users")
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.users) {
          container.innerHTML = '<div style="color:#ff6464">Failed to load users</div>';
          return;
        }
        container.innerHTML = data.users.map(u => `
          <div class="admin-user-card" style="border:1px solid rgba(0,212,255,.12);border-radius:8px;padding:10px;background:rgba(0,212,255,.02)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div>
                <strong style="color:var(--accent);font-size:.9em">${escapeHTML(u.display_name || u.username)}</strong>
                <span style="color:var(--text-dim);font-size:.72em;margin-left:6px">${escapeHTML(u.username)}</span>
                <span style="font-size:.68em;margin-left:4px;padding:1px 6px;border-radius:8px;background:${
                  u.group === "admin" ? "rgba(255,200,0,.15);color:#ffc800" :
                  u.group === "premium" ? "rgba(168,85,247,.15);color:#a855f7" :
                  "rgba(0,212,255,.1);color:var(--text-dim)"
                }">${u.group}</span>
              </div>
              <div style="display:flex;gap:4px">
                ${u.has_gemini ? '<span title="Has Gemini key" style="font-size:.7em;opacity:.7">🧠</span>' : ''}
                ${u.has_groq ? '<span title="Has Groq key" style="font-size:.7em;opacity:.7">⚡</span>' : ''}
                <span style="font-size:.68em;color:var(--text-dim)">${u.is_active ? "✓" : "✗"}</span>
              </div>
            </div>
            <div style="font-size:.72em;color:var(--text-dim);margin-bottom:6px">
              ${escapeHTML(u.email)} | Usage: ${u.daily_usage}d / ${u.total_usage} total
              | Last: ${u.last_login ? new Date(u.last_login * 1000).toLocaleDateString() : "Never"}
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">
              ${["terminal","circuit-lab","quantum-game","crypto-tools","aria","docs","settings","quantum-drug"].map(app =>
                `<label style="font-size:.68em;display:flex;align-items:center;gap:2px;cursor:pointer">
                  <input type="checkbox" data-uid="${u.id}" data-app="${app}" class="admin-app-check"
                    ${u.allowed_apps.includes(app) ? "checked" : ""}>
                  ${app}
                </label>`
              ).join("")}
            </div>
            <div style="display:flex;gap:4px">
              <select class="admin-group-select" data-uid="${u.id}" style="padding:3px 6px;background:var(--surface);color:var(--text);border:1px solid rgba(0,212,255,.2);border-radius:4px;font-size:.72em">
                <option value="user" ${u.group === "user" ? "selected" : ""}>User</option>
                <option value="premium" ${u.group === "premium" ? "selected" : ""}>Premium</option>
                <option value="admin" ${u.group === "admin" ? "selected" : ""}>Admin</option>
              </select>
              <button class="btn-quantum admin-save-user" data-uid="${u.id}" style="font-size:.7em;padding:3px 10px">Save</button>
              ${u.group !== "admin" ? `<button class="btn-secondary admin-delete-user" data-uid="${u.id}" style="font-size:.7em;padding:3px 8px;color:#ff6464">Delete</button>` : ''}
            </div>
          </div>
        `).join("");

        // Save user handlers
        container.querySelectorAll(".admin-save-user").forEach(btn => {
          btn.addEventListener("click", () => {
            const uid = btn.dataset.uid;
            const apps = Array.from(container.querySelectorAll(`.admin-app-check[data-uid="${uid}"]:checked`))
              .map(c => c.dataset.app);
            const group = container.querySelector(`.admin-group-select[data-uid="${uid}"]`).value;
            btn.disabled = true;
            btn.textContent = "...";
            fetch("/api/admin/users/" + uid, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ allowed_apps: apps, user_group: group }),
            })
              .then(r => r.json())
              .then(d => {
                btn.disabled = false;
                btn.textContent = "Save";
                if (d.success) loadAdminUsers(winEl);
                else alert(d.error || "Update failed");
              });
          });
        });

        // Delete user handlers
        container.querySelectorAll(".admin-delete-user").forEach(btn => {
          btn.addEventListener("click", () => {
            if (!confirm("Delete this user? This cannot be undone.")) return;
            const uid = btn.dataset.uid;
            btn.disabled = true;
            fetch("/api/admin/users/" + uid, { method: "DELETE" })
              .then(r => r.json())
              .then(d => {
                if (d.success) loadAdminUsers(winEl);
                else alert(d.error || "Delete failed");
              });
          });
        });
      });
  }

  // ══════════════════════════════════════════════════════════
  //  DOCUMENTATION
  // ══════════════════════════════════════════════════════════

  const DOCS = {
    overview: `
<h1>QubitPage® Quantum OS</h1>
<p>The world's first web-based quantum operating system, bridging quantum hardware, AI, and human interaction.</p>
<h2>Architecture</h2>
<p>QubitPage OS creates a seamless bridge:</p>
<pre>Quantum Hardware → QUBIOS Kernel → AI Agent → Human Interface</pre>
<p>The OS is built on three layers:</p>
<ul>
  <li><strong>QPlang</strong> — Low-level quantum circuit language (.qpgl) with native error correction</li>
  <li><strong>QBP</strong> — High-level quantum markup language (.qbp) that transpiles to HTML/CSS/JS</li>
  <li><strong>QUBIOS</strong> — The kernel that orchestrates quantum hardware, decoders, and AI</li>
</ul>
<h2>Features</h2>
<ul>
  <li>⚛ <strong>Circuit Lab</strong> — Write and run quantum circuits instantly</li>
  <li>🎮 <strong>Quantum Oracle Game</strong> — The world's first quantum prediction game</li>
  <li>🔐 <strong>Crypto Tools</strong> — Quantum encryption, QRNG, BB84 key distribution</li>
  <li>🤖 <strong>ARIA AI</strong> — AI assistant powered by Groq + Gemini</li>
  <li>⌨ <strong>Terminal</strong> — Full quantum command line</li>
</ul>`,

    qplang: `
<h1>QPlang Language Reference</h1>
<p>QPlang is a quantum programming language with native error correction, built for the QubitPage OS.</p>
<h2>Basic Syntax</h2>
<pre>
# Declare registers
qreg q[7]
creg c[7]

# Apply gates
H q[0]           # Hadamard
X q[1]           # Pauli-X
CNOT q[0], q[1]  # Controlled-NOT
CZ q[0], q[1]    # Controlled-Z
S q[0]           # Phase gate
T q[0]           # T gate

# Measurement
measure q -> c
</pre>
<h2>Error Correction</h2>
<pre>
# Steane [[7,1,3]] encoding
steane q

# Run error correction cycle
refresh q

# Surface code escalation
escalate q to d=3

# Quantum teleportation
teleport q[0] -> q[7]
</pre>
<h2>Control Flow</h2>
<pre>
if c[0] == 1:
    X q[1]

for i in range(10):
    refresh q
</pre>
<h2>Functions</h2>
<pre>
def bell_pair(q0, q1):
    H q0
    CNOT q0, q1
</pre>`,

    qbp: `
<h1>QBP Markup Language</h1>
<p>QBP (.qbp) is a quantum markup language that transpiles to HTML/CSS/JS, enabling quantum-powered web interfaces.</p>
<h2>Example</h2>
<pre>
@page "Quantum Demo"
@theme quantum-dark

&lt;qapp&gt;
  &lt;qlayout type="sidebar"&gt;
    &lt;qsidebar&gt;
      &lt;qmenu&gt;
        &lt;qlink href="/circuit"&gt;Circuit Lab&lt;/qlink&gt;
        &lt;qlink href="/game"&gt;Game&lt;/qlink&gt;
      &lt;/qmenu&gt;
    &lt;/qsidebar&gt;
    &lt;qcontent&gt;
      &lt;qcircuit id="demo"&gt;
        H q[0]
        CNOT q[0], q[1]
        measure q -> c
      &lt;/qcircuit&gt;
      &lt;qresult circuit="demo"/&gt;
    &lt;/qcontent&gt;
  &lt;/qlayout&gt;
&lt;/qapp&gt;
</pre>
<h2>Tag Reference</h2>
<p>QBP supports 38 quantum UI tags including:</p>
<ul>
  <li><code>&lt;qapp&gt;</code> — Application root</li>
  <li><code>&lt;qpage&gt;</code> — Page container</li>
  <li><code>&lt;qcircuit&gt;</code> — Quantum circuit editor</li>
  <li><code>&lt;qresult&gt;</code> — Result visualization</li>
  <li><code>&lt;qgame&gt;</code> — Game container</li>
  <li><code>&lt;qai&gt;</code> — AI integration widget</li>
  <li><code>&lt;qtool&gt;</code> — Tool component</li>
</ul>`,

    qec: `
<h1>Quantum Error Correction</h1>
<p>QubitPage OS implements a multi-level error correction hierarchy.</p>
<h2>Steane Code [[7,1,3]]</h2>
<p>The core ECC unit uses the Steane code: 7 physical qubits encode 1 logical qubit with distance 3 (corrects 1 error).</p>
<pre>
H₁ H₂ H₃ = [ 1 0 1 0 1 0 1 ]
              [ 0 1 1 0 0 1 1 ]
              [ 0 0 0 1 1 1 1 ]
</pre>
<h2>Auto-Escalation</h2>
<p>When error rates exceed thresholds, QPlang automatically escalates:</p>
<ul>
  <li><strong>Level 0</strong>: [[4,2,2]] detection code (low noise)</li>
  <li><strong>Level 1</strong>: [[7,1,3]] Steane code (default)</li>
  <li><strong>Level 2</strong>: Surface code d=3 (17 qubits)</li>
  <li><strong>Level 3</strong>: Surface code d=5 (49 qubits)</li>
  <li><strong>Level 4</strong>: Surface code d=7 (97 qubits)</li>
</ul>
<h2>Decoders</h2>
<ul>
  <li><strong>Hamming Lookup</strong> — O(1) for Steane code</li>
  <li><strong>MWPM</strong> — Minimum-weight perfect matching via PyMatching</li>
  <li><strong>Collision Clustering</strong> — FPGA-ready, Union-Find based</li>
  <li><strong>Neural Decoder</strong> — CNN-based, ONNX exportable</li>
</ul>`,

    api: `
<h1>API Reference</h1>
<h2>System</h2>
<div class="api-endpoint"><span class="api-method get">GET</span> <code>/api/system/info</code> — System information</div>
<div class="api-endpoint"><span class="api-method get">GET</span> <code>/api/system/backends</code> — List IBM Quantum backends</div>
<h2>QPlang</h2>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/qplang/compile</code> — Compile QPlang source</div>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/qplang/tokenize</code> — Tokenize for syntax highlighting</div>
<h2>Quantum Simulation</h2>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/quantum/simulate</code> — Run circuit on Stim</div>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/quantum/execute</code> — Run on IBM hardware</div>
<h2>AI Assistant</h2>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/aria/chat</code> — Chat with ARIA</div>
<h2>Quantum Game</h2>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/game/round</code> — Get game round</div>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/game/check</code> — Check prediction</div>
<h2>Crypto Tools</h2>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/crypto/encrypt</code> — Quantum OTP encrypt</div>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/crypto/decrypt</code> — Quantum OTP decrypt</div>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/crypto/hash</code> — SHA3-256 hash</div>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/crypto/qrng</code> — Quantum random numbers</div>
<div class="api-endpoint"><span class="api-method post">POST</span> <code>/api/crypto/bb84</code> — BB84 key distribution demo</div>`,

    architecture: `
<h1>System Architecture</h1>
<h2>The Quantum Bridge</h2>
<pre>
┌─────────────┐    ┌───────────────┐    ┌──────────┐    ┌────────────┐
│   Quantum   │───▶│   QUBIOS      │───▶│   AI     │───▶│   Human    │
│  Hardware   │    │   Kernel      │    │  Agent   │    │  Interface │
│             │    │               │    │          │    │            │
│ IBM 127-156q│    │ QPlang + QEC  │    │ Groq     │    │ QBP → HTML │
│ Stim sim    │    │ Decoders      │    │ Gemini   │    │ Desktop OS │
│ AWS Braket  │    │ Refresh Loop  │    │ ARIA     │    │ No-code UI │
└─────────────┘    └───────────────┘    └──────────┘    └────────────┘
</pre>
<h2>Technology Stack</h2>
<ul>
  <li><strong>Backend</strong>: Python, Flask, SocketIO</li>
  <li><strong>Quantum</strong>: Stim, Qiskit, PyMatching, QPlang</li>
  <li><strong>AI</strong>: Groq (LLaMA 3.3-70B), Gemini 2.0 Flash</li>
  <li><strong>Frontend</strong>: QBP markup → HTML/CSS/JS</li>
  <li><strong>Hardware</strong>: IBM Quantum (127-156+ qubits), AWS Braket</li>
</ul>`,

    game: `
<h1>Quantum Oracle Game</h1>
<p>The world's first quantum prediction game! Test your quantum intuition by predicting measurement outcomes.</p>
<h2>How to Play</h2>
<ul>
  <li>The Oracle prepares a quantum state</li>
  <li>You receive a hint about the state</li>
  <li>Predict the most probable measurement outcome</li>
  <li>Score points for correct predictions</li>
  <li>Level up as you improve!</li>
</ul>
<h2>Difficulty Levels</h2>
<ul>
  <li><strong>Level 1</strong>: Single qubit (|0⟩ or |+⟩)</li>
  <li><strong>Level 2</strong>: Bell pairs (entangled 2-qubit states)</li>
  <li><strong>Level 3</strong>: GHZ states (3-qubit entanglement)</li>
  <li><strong>Level 4</strong>: Random circuits (mystery quantum states)</li>
  <li><strong>Level 5</strong>: Advanced 5-qubit circuits</li>
</ul>`,

    crypto: `
<h1>Quantum Crypto Tools</h1>
<h2>Quantum Encryption (OTP)</h2>
<p>Uses quantum random number generation to create one-time pad keys for information-theoretically secure encryption (Vernam cipher).</p>
<h2>BB84 Protocol</h2>
<p>Simulates the BB84 quantum key distribution protocol, demonstrating how quantum mechanics enables provably secure key exchange.</p>
<h2>QRNG</h2>
<p>Quantum Random Number Generator using Stim's quantum circuit simulation with Hadamard gates to produce truly random bits from quantum superposition.</p>
<h2>Post-Quantum Hash</h2>
<p>SHA3-256 (Keccak) hashing, resistant to both classical and quantum attacks.</p>`,
  };

  function initDocs(winEl) {
    const content = winEl.querySelector("#docs-content");
    content.innerHTML = DOCS.overview;

    winEl.querySelectorAll(".docs-link").forEach((link) => {
      link.addEventListener("click", () => {
        winEl.querySelectorAll(".docs-link").forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        const doc = link.dataset.doc;
        content.innerHTML = DOCS[doc] || "<p>Coming soon...</p>";
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  QUANTUMDRUG EXPLORER
  // ══════════════════════════════════════════════════════════

  function initQuantumDrug(winEl) {
    const qdBackendSel = winEl.querySelector("#qd-backend-select"); if (qdBackendSel) loadBackendDropdown(qdBackendSel);
    const qdState = { step: 1, diseaseId: "", moleculeId: "", diseaseName: "", moleculeName: "" };

    const panels = [1,2,3,4].map(i => winEl.querySelector("#qd-step-" + i));
    const steps = winEl.querySelectorAll(".qd-step");
    const prevBtn = winEl.querySelector("#qd-prev");
    const nextBtn = winEl.querySelector("#qd-next");

    function showStep(n) {
      qdState.step = n;
      panels.forEach((p, i) => p.classList.toggle("hidden", i !== n - 1));
      steps.forEach((s, i) => {
        s.classList.toggle("active", i === n - 1);
        s.classList.toggle("done", i < n - 1);
      });
      prevBtn.classList.toggle("hidden", n === 1);
      nextBtn.classList.toggle("hidden", n === 4 || (n === 1 && !qdState.diseaseId) || (n === 2 && !qdState.moleculeId));
    }

    prevBtn.addEventListener("click", () => { if (qdState.step > 1) showStep(qdState.step - 1); });
    nextBtn.addEventListener("click", () => { if (qdState.step < 4) showStep(qdState.step + 1); });

    // Step 1: Load diseases
    fetch("/api/med/diseases")
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        const grid = winEl.querySelector("#qd-diseases");
        grid.innerHTML = "";
        data.data.diseases.forEach(d => {
          const card = document.createElement("div");
          card.className = "qd-disease-card";
          card.innerHTML = `
            <h4>${escapeHTML(d.name)}</h4>
            <div class="qd-prev-text">${escapeHTML(d.prevalence)}</div>
            <div class="qd-prev-text" style="color:#ff6b6b;font-size:0.7em">${escapeHTML(d.mortality)}</div>
            <div class="qd-targets">${d.targets} molecular targets</div>
            <div style="font-size:0.65em;color:var(--text-dim);margin:4px 0;line-height:1.3">${escapeHTML(d.unmet_need_preview)}</div>
            <span class="qd-complexity ${d.complexity}">${d.complexity} complexity</span>
          `;
          card.addEventListener("click", () => {
            grid.querySelectorAll(".qd-disease-card").forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            qdState.diseaseId = d.id;
            qdState.diseaseName = d.name;
            nextBtn.classList.remove("hidden");
            loadMolecules(d.id);
          });
          grid.appendChild(card);
        });
      });

    function loadMolecules(diseaseId) {
      // Pre-load step 2 molecules
      fetch("/api/med/molecules?disease=" + encodeURIComponent(diseaseId))
        .then(r => r.json())
        .then(data => {
          if (!data.success) return;
          const list = winEl.querySelector("#qd-molecules");
          list.innerHTML = "";
          winEl.querySelector("#qd-selected-disease").innerHTML = `<strong>🧬 ${escapeHTML(qdState.diseaseName)}</strong> — Select a candidate molecule below`;
          data.data.molecules.forEach(m => {
            const isApproved = m.status.toLowerCase().includes("approved");
            const isPhase = m.status.toLowerCase().includes("phase");
            const badgeClass = isApproved ? "approved" : isPhase ? "novel" : "other";
            const affinityStr = m.binding_affinity_nm ? `Kd: ${m.binding_affinity_nm} nM` : '';
            const cidStr = m.pubchem_cid ? `PubChem: ${m.pubchem_cid}` : '';
            const card = document.createElement("div");
            card.className = "qd-mol-card";
            card.innerHTML = `
              <div class="qd-mol-info">
                <h4>${escapeHTML(m.name)}</h4>
                <small>${escapeHTML(m.type)} · ${escapeHTML(m.formula)} · MW: ${m.mw.toLocaleString()} Da · ${m.atoms} atoms</small>
                ${affinityStr || cidStr ? `<small style="color:var(--accent-green)">${affinityStr}${affinityStr && cidStr ? ' · ' : ''}${cidStr}</small>` : ''}
              </div>
              <span class="qd-mol-badge ${badgeClass}">${isApproved ? "FDA Approved" : m.status}</span>
            `;
            card.addEventListener("click", () => {
              list.querySelectorAll(".qd-mol-card").forEach(c => c.classList.remove("selected"));
              card.classList.add("selected");
              qdState.moleculeId = m.id;
              qdState.moleculeName = m.name;
              nextBtn.classList.remove("hidden");
              runScreening(m.id, diseaseId);
            });
            list.appendChild(card);
          });
        });
    }

    function runScreening(moleculeId, diseaseId) {
      const resultEl = winEl.querySelector("#qd-screening-result");
      resultEl.classList.remove("hidden");
      resultEl.innerHTML = '<div class="qd-loading">Screening molecule</div>';

      fetch("/api/med/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ molecule_id: moleculeId, disease_id: diseaseId }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.success) { resultEl.innerHTML = "Error: " + (data.error || "Unknown"); return; }
          const s = data.data.scores;
          const lip = data.data.lipinski;
          const sc = v => v === null || v === undefined ? 'score-na' : v >= 75 ? "score-high" : v >= 50 ? "score-med" : "score-low";
          const sv = v => v === null || v === undefined ? 'N/A' : v;
          let screenHTML = `
            <div class="qd-score-overall">
              <div class="qd-big-score ${sc(s.overall)}">${s.overall}/100</div>
              <div style="font-size:0.75em;color:var(--text-dim)">Overall Score</div>
            </div>
            <div class="qd-score-grid">
              <div class="qd-score-item"><div class="qd-score-val ${sc(s.binding_affinity)}">${sv(s.binding_affinity)}</div><div class="qd-score-label">Binding Affinity</div><div class="qd-score-note">${escapeHTML(s.binding_data || '')}</div></div>
              <div class="qd-score-item"><div class="qd-score-val ${sc(s.selectivity)}">${sv(s.selectivity)}</div><div class="qd-score-label">Selectivity</div><div class="qd-score-note">${escapeHTML(s.selectivity_note || '')}</div></div>
              <div class="qd-score-item"><div class="qd-score-val ${sc(s.druglikeness)}">${sv(s.druglikeness)}</div><div class="qd-score-label">Drug-likeness</div><div class="qd-score-note">${escapeHTML(s.druglikeness_note || '')}</div></div>
              <div class="qd-score-item"><div class="qd-score-val ${sc(s.quantum_relevance)}">${sv(s.quantum_relevance)}</div><div class="qd-score-label">Quantum Relevance</div></div>
              <div class="qd-score-item"><div class="qd-score-val ${sc(s.clinical_readiness)}">${sv(s.clinical_readiness)}</div><div class="qd-score-label">Clinical</div><div class="qd-score-note">${escapeHTML(s.clinical_note || '')}</div></div>
            </div>`;
          if (s.clinical_trials) {
            screenHTML += `<div style="font-size:0.72em;margin:8px 0 4px;padding:6px 8px;background:rgba(0,255,136,0.06);border-radius:6px;border-left:3px solid var(--accent-green)"><strong>Clinical Trial Data:</strong> ${escapeHTML(s.clinical_trials)}</div>`;
          }
          if (lip && lip.applicable && lip.details) {
            screenHTML += `<div style="margin:6px 0;font-size:0.72em"><strong>Lipinski Rule of Five:</strong> ${lip.violations} violation(s) — ${lip.drug_like ? '✅ Drug-like' : '⚠️ Poor oral bioavailability'}</div>`;
            screenHTML += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;font-size:0.65em">`;
            lip.details.forEach(d => {
              screenHTML += `<div style="text-align:center;padding:3px;background:${d.pass ? 'rgba(0,255,136,0.05)' : 'rgba(255,50,50,0.08)'};border-radius:4px">${d.pass ? '✅' : '❌'} ${d.property}: ${d.value} ${d.limit}</div>`;
            });
            screenHTML += `</div>`;
          } else if (lip && !lip.applicable) {
            screenHTML += `<div style="font-size:0.72em;margin:6px 0;color:var(--text-dim)">Lipinski: ${lip.reason}</div>`;
          }
          screenHTML += `<div class="qd-recommendation">${escapeHTML(data.data.recommendation)}</div>`;
          if (data.data.references && data.data.references.length) {
            screenHTML += `<div style="font-size:0.6em;color:var(--text-dim);margin-top:6px"><strong>Refs:</strong> ${data.data.references.map(r => escapeHTML(r)).join(' | ')}</div>`;
          }
          resultEl.innerHTML = screenHTML;
        });
    }

    // Step 3: Quantum analysis buttons
    winEl.querySelector("#qd-run-qec").addEventListener("click", () => runQuantum("qec"));
    winEl.querySelector("#qd-run-shadow").addEventListener("click", () => runQuantum("shadow"));
    winEl.querySelector("#qd-run-full").addEventListener("click", () => runQuantum("full"));

    function runQuantum(type) {
      if (!qdState.moleculeId) return;
      const resultEl = winEl.querySelector("#qd-quantum-result");
      resultEl.innerHTML = '<div class="qd-loading">Running quantum simulation</div>';

      fetch("/api/med/quantum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ molecule_id: qdState.moleculeId, type }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.success) { resultEl.innerHTML = "Error: " + (data.error || "Unknown"); return; }
          resultEl.innerHTML = renderQuantumResults(data.data);
        });
    }

    function renderQuantumResults(d) {
      let html = `<h4 style="color:var(--accent);margin:0 0 8px">⚛ Quantum Analysis: ${escapeHTML(d.molecule)}</h4>`;
      html += `<div style="font-size:0.7em;color:var(--text-dim)">Atoms: ${d.atoms} | Electrons: ${d.electrons}</div>`;

      if (d.qec_simulation) {
        const q = d.qec_simulation;
        if (q.simulated) {
          html += `<h4 style="color:var(--accent-green);margin:10px 0 4px">🛡 QEC Simulation</h4>`;
          html += `<div class="qd-qec-stats">
            <div class="qd-stat"><div class="qd-stat-label">Code Type</div><div class="qd-stat-value">${q.code_type}</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Distance</div><div class="qd-stat-value">${q.code_distance}</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Total Qubits</div><div class="qd-stat-value">${q.total_qubits}</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Syndrome Rounds</div><div class="qd-stat-value">${q.syndrome_rounds}</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Physical Error</div><div class="qd-stat-value">${(q.physical_error_rate * 100).toFixed(3)}%</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Logical Error</div><div class="qd-stat-value">${(q.logical_error_rate * 100).toFixed(3)}%</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Suppression</div><div class="qd-stat-value">${q.error_suppression}×</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Shots</div><div class="qd-stat-value">${q.shots.toLocaleString()}</div></div>
          </div>`;
          html += `<div class="qd-interpretation">${escapeHTML(q.interpretation)}</div>`;
        }
      }

      if (d.classical_shadow) {
        const cs = d.classical_shadow;
        if (cs.simulated) {
          html += `<h4 style="color:#a855f7;margin:10px 0 4px">🔬 Classical Shadow Tomography</h4>`;
          html += `<div class="qd-qec-stats">
            <div class="qd-stat"><div class="qd-stat-label">Method</div><div class="qd-stat-value" style="font-size:0.75em">${cs.method}</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Shadow Qubits</div><div class="qd-stat-value">${cs.n_qubits}</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Shadows</div><div class="qd-stat-value">${cs.n_shadows}</div></div>
            <div class="qd-stat"><div class="qd-stat-label">Observables</div><div class="qd-stat-value">${cs.pauli_observables_estimated}</div></div>
          </div>`;
          if (cs.sample_estimates) {
            html += `<div style="margin:6px 0;font-size:0.7em;color:var(--text-dim)">Sample Pauli expectations:</div>`;
            html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:0.7em">`;
            for (const [k, v] of Object.entries(cs.sample_estimates)) {
              const col = v > 0 ? 'var(--accent-green)' : v < 0 ? '#ff5050' : 'var(--text-dim)';
              html += `<div style="text-align:center"><span style="color:${col}">${v.toFixed(3)}</span><br><span style="color:var(--text-dim)">${k}</span></div>`;
            }
            html += `</div>`;
          }
          html += `<div class="qd-interpretation">${escapeHTML(cs.interpretation)}</div>`;
          html += `<div style="font-size:0.65em;color:var(--text-dim);margin-top:4px">Ref: ${cs.reference}</div>`;
        }
      }

      if (d.resource_estimate) {
        const r = d.resource_estimate;
        html += `<h4 style="color:#ffc832;margin:10px 0 4px">📊 Resource Estimate</h4>`;
        html += `<div class="qd-qec-stats">
          <div class="qd-stat"><div class="qd-stat-label">Qubits (JW)</div><div class="qd-stat-value">${r.qubits_jordan_wigner}</div></div>
          <div class="qd-stat"><div class="qd-stat-label">Qubits (BK)</div><div class="qd-stat-value">${r.qubits_bravyi_kitaev}</div></div>
          <div class="qd-stat"><div class="qd-stat-label">T-gates</div><div class="qd-stat-value">${r.t_gate_count.toLocaleString()}</div></div>
          <div class="qd-stat"><div class="qd-stat-label">Phys. Qubits</div><div class="qd-stat-value">${r.physical_qubits_needed.toLocaleString()}</div></div>
        </div>`;
        html += `<div class="qd-interpretation">Timeline: ${r.timeline}. Encoding: ${r.encoding}.</div>`;
      }

      return html;
    }

    // Step 4: Generate report
    winEl.querySelector("#qd-generate-report").addEventListener("click", () => {
      if (!qdState.diseaseId || !qdState.moleculeId) return;
      const contentEl = winEl.querySelector("#qd-report-content");
      contentEl.innerHTML = '<div class="qd-loading">Generating comprehensive report</div>';

      fetch("/api/med/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disease_id: qdState.diseaseId, molecule_id: qdState.moleculeId }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.success) { contentEl.innerHTML = "Error: " + (data.error || "Unknown"); return; }
          contentEl.innerHTML = renderReport(data.data);
        });
    });

    function renderReport(r) {
      let html = `<h2 style="color:var(--accent);margin:0 0 6px;font-size:1.1em">${escapeHTML(r.title)}</h2>`;
      html += `<div style="font-size:0.7em;color:var(--text-dim)">Report ID: ${r.report_id} | Generated: ${r.generated_at}</div>`;

      // Executive summary (markdown-ish rendering)
      if (r.executive_summary) {
        html += `<div class="qd-report-section">`;
        html += r.executive_summary
          .replace(/## (.*)/g, '<h3>$1</h3>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n\n/g, '<br><br>')
          .replace(/\n/g, '<br>');
        html += `</div>`;
      }

      // Screening scores
      if (r.screening && r.screening.scores) {
        const s = r.screening.scores;
        html += `<div class="qd-report-section"><h3>Drug Screening Scores</h3>`;
        html += `<div style="text-align:center;font-size:1.8em;font-weight:700;color:var(--accent)">${s.overall}/100</div>`;
        html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:0.75em;margin-top:6px">`;
        for (const [k, v] of [["Binding", s.binding_affinity], ["Selectivity", s.selectivity], ["Drug-likeness", s.druglikeness], ["Quantum Rel.", s.quantum_relevance], ["Clinical", s.clinical_readiness]]) {
          html += `<div style="text-align:center"><strong>${v !== null && v !== undefined ? v : 'N/A'}</strong><br>${k}</div>`;
        }
        html += `</div></div>`;
      }

      // QEC results
      if (r.quantum_qec && r.quantum_qec.qec_simulation && r.quantum_qec.qec_simulation.simulated) {
        const q = r.quantum_qec.qec_simulation;
        html += `<div class="qd-report-section"><h3>🛡 Quantum Error Correction</h3>`;
        html += `<div style="font-size:0.78em">Code: ${q.code_type} d=${q.code_distance} | `;
        html += `${q.total_qubits} qubits | ${q.syndrome_rounds} rounds | `;
        html += `Logical error: ${(q.logical_error_rate * 100).toFixed(4)}% | Suppression: ${q.error_suppression}×</div>`;
        html += `<div class="qd-interpretation">${escapeHTML(q.interpretation)}</div></div>`;
      }

      // Shadow results
      if (r.quantum_shadow && r.quantum_shadow.classical_shadow && r.quantum_shadow.classical_shadow.simulated) {
        const cs = r.quantum_shadow.classical_shadow;
        html += `<div class="qd-report-section"><h3>🔬 Classical Shadow Tomography</h3>`;
        html += `<div style="font-size:0.78em">${cs.n_qubits} qubits | ${cs.n_shadows} shadows | ${cs.pauli_observables_estimated} observables</div>`;
        html += `<div class="qd-interpretation">${escapeHTML(cs.interpretation)}</div></div>`;
      }

      // Resource estimate
      if (r.resource_estimate) {
        const re = r.resource_estimate;
        html += `<div class="qd-report-section"><h3>📊 Quantum Resource Estimate</h3>`;
        html += `<div style="font-size:0.78em">`;
        html += `Logical qubits: ${re.qubits_jordan_wigner} (JW) / ${re.qubits_bravyi_kitaev} (BK)<br>`;
        html += `Physical qubits: ${re.physical_qubits_needed.toLocaleString()}<br>`;
        html += `T-gate count: ${re.t_gate_count.toLocaleString()}<br>`;
        html += `Timeline: ${re.timeline}`;
        html += `</div></div>`;
      }

      html += `<div style="text-align:center;margin-top:12px;font-size:0.65em;color:var(--text-dim)">Generated by QubitPage® QuantumDrug Explorer | Powered by Stim ${HAS_STIM_VER || ""}</div>`;
      return html;
    }

    // AI Text Analysis
    const aiBtn = winEl.querySelector("#qd-ai-analyze");
    if (aiBtn) {
      aiBtn.addEventListener("click", () => {
        const text = winEl.querySelector("#qd-ai-text").value.trim();
        const atype = winEl.querySelector("#qd-ai-type").value;
        const resultEl = winEl.querySelector("#qd-ai-result");
        if (!text || text.length < 10) { resultEl.innerHTML = '<div style="color:#ff5050;font-size:0.8em">Please enter at least 10 characters of medical text.</div>'; return; }
        resultEl.innerHTML = '<div class="qd-loading">Analyzing with AI...</div>';
        fetch("/api/med/analyze-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, type: atype }),
        })
          .then(r => r.json())
          .then(data => {
            if (!data.success) { resultEl.innerHTML = '<div style="color:#ff5050;font-size:0.8em">Error: ' + escapeHTML(data.error || "Unknown") + '</div>'; return; }
            let html = '<div style="background:rgba(0,255,136,0.04);border:1px solid rgba(0,255,136,0.15);border-radius:8px;padding:12px;margin-top:8px">';
            html += '<h4 style="color:var(--accent);margin:0 0 8px;font-size:0.9em">🤖 AI Analysis Results</h4>';
            html += '<div style="font-size:0.65em;color:var(--text-dim);margin-bottom:6px">Model: ' + escapeHTML(data.data.model) + ' | Type: ' + escapeHTML(data.data.analysis_type) + '</div>';
            html += '<div style="font-size:0.8em;line-height:1.6;white-space:pre-wrap">' + escapeHTML(data.data.analysis) + '</div>';
            html += '</div>';
            resultEl.innerHTML = html;
          });
      });
    }

    // ═══ MODE TABS ═══════════════════════════════════════════
    const modeTabs = winEl.querySelectorAll(".qd-mode-tab");
    const modePanels = {
      pipeline: winEl.querySelector("#qd-mode-pipeline"),
      imaging: winEl.querySelector("#qd-mode-imaging"),
      research: winEl.querySelector("#qd-mode-research"),
      diagnostics: winEl.querySelector("#qd-mode-diagnostics"),
    };

    modeTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const mode = tab.dataset.mode;
        modeTabs.forEach(t => {
          const isActive = t.dataset.mode === mode;
          t.style.background = isActive ? "var(--accent)" : "transparent";
          t.style.color = isActive ? "#000" : "var(--text-dim)";
          t.style.borderColor = isActive ? "var(--accent)" : "rgba(0,212,255,.2)";
          t.classList.toggle("active", isActive);
        });
        Object.entries(modePanels).forEach(([k, p]) => {
          if (p) p.classList.toggle("hidden", k !== mode);
        });
      });
    });

    // ═══ MEDICAL IMAGE ANALYSIS ═══════════════════════════════
    const dropzone = winEl.querySelector("#qd-img-dropzone");
    const imgFileInput = winEl.querySelector("#qd-img-file");
    const imgPreview = winEl.querySelector("#qd-img-preview");
    const imgPreviewImg = winEl.querySelector("#qd-img-preview-img");
    const imgInfo = winEl.querySelector("#qd-img-info");
    const imgAnalyzeBtn = winEl.querySelector("#qd-img-analyze");
    const imgResultEl = winEl.querySelector("#qd-img-result");
    let selectedImageFile = null;

    if (dropzone && imgFileInput) {
      dropzone.addEventListener("click", () => imgFileInput.click());
      dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.style.borderColor = "var(--accent)"; dropzone.style.background = "rgba(0,212,255,.08)"; });
      dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = "rgba(0,212,255,.3)"; dropzone.style.background = "rgba(0,212,255,.03)"; });
      dropzone.addEventListener("drop", e => {
        e.preventDefault();
        dropzone.style.borderColor = "rgba(0,212,255,.3)";
        dropzone.style.background = "rgba(0,212,255,.03)";
        if (e.dataTransfer.files.length) handleImageFile(e.dataTransfer.files[0]);
      });
      imgFileInput.addEventListener("change", () => {
        if (imgFileInput.files.length) handleImageFile(imgFileInput.files[0]);
      });
    }

    function handleImageFile(file) {
      if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
        if (imgResultEl) imgResultEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">Unsupported format. Use JPEG, PNG, or WebP.</div>';
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        if (imgResultEl) imgResultEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">Image too large (max 20 MB).</div>';
        return;
      }
      selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        if (imgPreview) imgPreview.style.display = "block";
        if (imgPreviewImg) imgPreviewImg.src = e.target.result;
        if (imgInfo) imgInfo.textContent = `${file.name} — ${(file.size / 1024).toFixed(0)} KB — ${file.type}`;
      };
      reader.readAsDataURL(file);
      if (imgAnalyzeBtn) imgAnalyzeBtn.disabled = false;
      if (imgResultEl) imgResultEl.innerHTML = "";
    }

    if (imgAnalyzeBtn) {
      imgAnalyzeBtn.addEventListener("click", () => {
        if (!selectedImageFile) return;
        imgAnalyzeBtn.disabled = true;
        imgAnalyzeBtn.textContent = "⏳ Analyzing...";
        imgResultEl.innerHTML = '<div class="qd-loading">AI analyzing medical image...</div>';

        const formData = new FormData();
        formData.append("image", selectedImageFile);
        formData.append("type", winEl.querySelector("#qd-img-type").value);
        const ctx = winEl.querySelector("#qd-img-context").value.trim();
        if (ctx) formData.append("context", ctx);

        fetch("/api/med/analyze-image", { method: "POST", body: formData })
          .then(r => r.json())
          .then(data => {
            imgAnalyzeBtn.disabled = false;
            imgAnalyzeBtn.textContent = "⚛ Analyze Image";
            if (!data.success) {
              imgResultEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">Error: ' + escapeHTML(data.error || "Unknown") + '</div>';
              return;
            }
            let html = '<div style="background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.15);border-radius:8px;padding:12px;margin-top:4px">';
            html += '<h4 style="color:var(--accent);margin:0 0 6px;font-size:.9em">🩺 AI Image Analysis</h4>';
            html += '<div style="font-size:.65em;color:var(--text-dim);margin-bottom:6px">Model: ' + escapeHTML(data.data.model) + ' | ID: ' + escapeHTML(data.data.analysis_id) + '</div>';

            // Render analysis with basic markdown
            const analysis = data.data.analysis || "";
            html += '<div style="font-size:.8em;line-height:1.6">' + renderMd(analysis) + '</div>';

            // Matched diseases
            if (data.data.matched_diseases && data.data.matched_diseases.length) {
              html += '<div style="margin-top:10px;border-top:1px solid rgba(0,212,255,.1);padding-top:8px">';
              html += '<h4 style="color:var(--accent-green);margin:0 0 6px;font-size:.85em">🔗 Linked Diseases in Database</h4>';
              data.data.matched_diseases.forEach(m => {
                const confColor = m.confidence === 'HIGH' ? '#00ff88' : m.confidence === 'MODERATE' ? '#ffc832' : '#ff8850';
                html += '<div style="margin:4px 0;padding:6px 8px;background:rgba(0,255,136,.04);border-radius:6px;font-size:.78em;cursor:pointer" onclick="document.querySelector(\'[data-mode=pipeline]\').click();setTimeout(()=>{const cards=document.querySelectorAll(\'.qd-disease-card\');cards.forEach(c=>{if(c.textContent.includes(\'' + escapeHTML(m.disease_name) + '\')){c.click();c.scrollIntoView({behavior:\'smooth\'})}})},100)">';
                html += '<strong>' + escapeHTML(m.disease_name) + '</strong> ';
                html += '<span style="color:' + confColor + ';font-weight:bold;font-size:.85em">[' + m.confidence + ']</span><br>';
                html += '<span style="color:var(--text-dim)">Keywords: ' + m.matched_keywords.join(", ") + '</span><br>';
                html += '<span style="color:var(--accent);font-size:.85em">' + escapeHTML(m.action) + ' →</span>';
                html += '</div>';
              });
              html += '</div>';
            }

            // Disclaimer
            if (data.data.disclaimer) {
              html += '<div style="margin-top:8px;font-size:.65em;color:#ff8850;font-style:italic;border-top:1px solid rgba(255,136,80,.15);padding-top:6px">⚠️ ' + escapeHTML(data.data.disclaimer) + '</div>';
            }
            html += '</div>';
            imgResultEl.innerHTML = html;
          })
          .catch(err => {
            imgAnalyzeBtn.disabled = false;
            imgAnalyzeBtn.textContent = "⚛ Analyze Image";
            imgResultEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">Network error: ' + escapeHTML(err.message) + '</div>';
          });
      });
    }

    // ═══ LITERATURE SEARCH ════════════════════════════════════
    const rTabs = winEl.querySelectorAll(".qd-rtab");
    const rPanels = {
      pubmed: winEl.querySelector("#qd-rpanel-pubmed"),
      trials: winEl.querySelector("#qd-rpanel-trials"),
      fda: winEl.querySelector("#qd-rpanel-fda"),
      compound: winEl.querySelector("#qd-rpanel-compound"),
    };

    rTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const rt = tab.dataset.rtab;
        rTabs.forEach(t => {
          const isActive = t.dataset.rtab === rt;
          t.style.background = isActive ? "var(--accent)" : "transparent";
          t.style.color = isActive ? "#000" : "var(--text-dim)";
          t.style.borderColor = isActive ? "var(--accent)" : "rgba(0,212,255,.2)";
          t.classList.toggle("active", isActive);
        });
        Object.entries(rPanels).forEach(([k, p]) => {
          if (p) p.classList.toggle("hidden", k !== rt);
        });
      });
    });

    // PubMed Search
    const pubmedBtn = winEl.querySelector("#qd-pubmed-search");
    if (pubmedBtn) {
      pubmedBtn.addEventListener("click", () => {
        const query = winEl.querySelector("#qd-pubmed-query").value.trim();
        if (!query) return;
        const resEl = winEl.querySelector("#qd-pubmed-results");
        resEl.innerHTML = '<div class="qd-loading">Searching PubMed...</div>';
        fetch("/api/med/search/pubmed", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, max_results: 10 })
        }).then(r => r.json()).then(data => {
          if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
          if (!data.data.articles.length) { resEl.innerHTML = '<div style="color:var(--text-dim);font-size:.8em">No results found.</div>'; return; }
          let html = '<div style="font-size:.7em;color:var(--text-dim);margin-bottom:6px">' + data.data.total.toLocaleString() + ' total results — showing ' + data.data.returned + '</div>';
          data.data.articles.forEach(a => {
            html += '<div style="margin:6px 0;padding:8px;background:rgba(0,212,255,.03);border-radius:6px;border-left:3px solid var(--accent)">';
            html += '<a href="' + escapeHTML(a.url) + '" target="_blank" rel="noopener" style="color:var(--accent);font-size:.82em;font-weight:bold;text-decoration:none">' + escapeHTML(a.title) + '</a>';
            html += '<div style="font-size:.7em;color:var(--text-dim);margin-top:2px">' + escapeHTML(a.authors) + '</div>';
            html += '<div style="font-size:.7em;color:var(--accent-green)">' + escapeHTML(a.journal) + ' (' + escapeHTML(a.pub_date) + ')</div>';
            html += '<div style="font-size:.65em;color:var(--text-dim)">PMID: ' + escapeHTML(a.pmid) + (a.doi ? ' | ' + escapeHTML(a.doi) : '') + '</div>';
            html += '</div>';
          });
          resEl.innerHTML = html;
        });
      });
      winEl.querySelector("#qd-pubmed-query").addEventListener("keydown", e => { if (e.key === "Enter") pubmedBtn.click(); });
    }

    // ClinicalTrials Search
    const trialsBtn = winEl.querySelector("#qd-trials-search");
    if (trialsBtn) {
      trialsBtn.addEventListener("click", () => {
        const cond = winEl.querySelector("#qd-trials-query").value.trim();
        if (!cond) return;
        const status = winEl.querySelector("#qd-trials-status").value;
        const resEl = winEl.querySelector("#qd-trials-results");
        resEl.innerHTML = '<div class="qd-loading">Searching ClinicalTrials.gov...</div>';
        fetch("/api/med/search/trials", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition: cond, status, max_results: 10 })
        }).then(r => r.json()).then(data => {
          if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
          if (!data.data.trials.length) { resEl.innerHTML = '<div style="color:var(--text-dim);font-size:.8em">No trials found.</div>'; return; }
          let html = '<div style="font-size:.7em;color:var(--text-dim);margin-bottom:6px">' + data.data.total_returned + ' trials found</div>';
          data.data.trials.forEach(t => {
            const statusColor = t.status === "RECRUITING" ? "#00ff88" : t.status === "COMPLETED" ? "var(--accent)" : "#ffc832";
            html += '<div style="margin:6px 0;padding:8px;background:rgba(0,255,136,.03);border-radius:6px;border-left:3px solid ' + statusColor + '">';
            html += '<a href="' + escapeHTML(t.url) + '" target="_blank" rel="noopener" style="color:var(--accent);font-size:.82em;font-weight:bold;text-decoration:none">' + escapeHTML(t.title) + '</a>';
            html += '<div style="font-size:.7em;margin-top:2px"><span style="color:' + statusColor + ';font-weight:bold">' + escapeHTML(t.status) + '</span> | Phase: ' + escapeHTML(t.phase) + ' | Start: ' + escapeHTML(t.start_date) + '</div>';
            if (t.interventions.length) html += '<div style="font-size:.7em;color:var(--accent-green)">Interventions: ' + t.interventions.map(i => escapeHTML(i)).join(", ") + '</div>';
            if (t.brief_summary) html += '<div style="font-size:.68em;color:var(--text-dim);margin-top:3px">' + escapeHTML(t.brief_summary) + '</div>';
            html += '<div style="font-size:.65em;color:var(--text-dim)">' + escapeHTML(t.nct_id) + '</div>';
            html += '</div>';
          });
          resEl.innerHTML = html;
        });
      });
      winEl.querySelector("#qd-trials-query").addEventListener("keydown", e => { if (e.key === "Enter") trialsBtn.click(); });
    }

    // OpenFDA Search
    const fdaBtn = winEl.querySelector("#qd-fda-search");
    if (fdaBtn) {
      fdaBtn.addEventListener("click", () => {
        const drug = winEl.querySelector("#qd-fda-query").value.trim();
        if (!drug) return;
        const resEl = winEl.querySelector("#qd-fda-results");
        resEl.innerHTML = '<div class="qd-loading">Searching OpenFDA...</div>';
        fetch("/api/med/search/fda", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drug_name: drug, max_results: 10 })
        }).then(r => r.json()).then(data => {
          if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
          if (!data.data.events.length) { resEl.innerHTML = '<div style="color:var(--text-dim);font-size:.8em">No adverse events found.</div>'; return; }
          let html = '<div style="font-size:.7em;color:var(--text-dim);margin-bottom:6px">' + data.data.total_available.toLocaleString() + ' total reports for <strong>' + escapeHTML(drug) + '</strong></div>';
          data.data.events.forEach(ev => {
            const isSerious = ev.serious === "1";
            html += '<div style="margin:6px 0;padding:8px;background:' + (isSerious ? 'rgba(255,50,50,.04)' : 'rgba(0,212,255,.03)') + ';border-radius:6px;border-left:3px solid ' + (isSerious ? '#ff5050' : 'var(--accent)') + '">';
            html += '<div style="font-size:.8em;font-weight:bold;color:' + (isSerious ? '#ff5050' : 'var(--text)') + '">' + (isSerious ? '⚠️ SERIOUS' : 'Non-serious') + ' — Report ' + escapeHTML(ev.safety_report_id) + '</div>';
            html += '<div style="font-size:.7em;color:var(--text-dim)">Date: ' + escapeHTML(ev.receive_date) + '</div>';
            if (ev.reactions.length) html += '<div style="font-size:.7em;margin-top:3px"><strong>Reactions:</strong> ' + ev.reactions.map(r => escapeHTML(r)).join(", ") + '</div>';
            html += '</div>';
          });
          resEl.innerHTML = html;
        });
      });
      winEl.querySelector("#qd-fda-query").addEventListener("keydown", e => { if (e.key === "Enter") fdaBtn.click(); });
    }

    // PubChem Compound Lookup
    const compoundBtn = winEl.querySelector("#qd-compound-search");
    if (compoundBtn) {
      compoundBtn.addEventListener("click", () => {
        const name = winEl.querySelector("#qd-compound-query").value.trim();
        if (!name) return;
        const resEl = winEl.querySelector("#qd-compound-results");
        resEl.innerHTML = '<div class="qd-loading">Looking up in PubChem...</div>';
        fetch("/api/med/search/compound", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        }).then(r => r.json()).then(data => {
          if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
          const c = data.data;
          let html = '<div style="background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.15);border-radius:8px;padding:12px">';
          html += '<h4 style="color:var(--accent);margin:0 0 8px;font-size:.9em">' + escapeHTML(c.name) + '</h4>';
          html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;font-size:.78em">';
          if (c.cid) html += '<div><strong>PubChem CID:</strong> <a href="' + escapeHTML(c.url) + '" target="_blank" rel="noopener" style="color:var(--accent)">' + c.cid + '</a></div>';
          if (c.formula) html += '<div><strong>Formula:</strong> ' + escapeHTML(c.formula) + '</div>';
          if (c.mw) html += '<div><strong>MW:</strong> ' + c.mw + ' Da</div>';
          if (c.logp) html += '<div><strong>LogP:</strong> ' + c.logp + '</div>';
          if (c.smiles) html += '<div style="grid-column:1/-1"><strong>SMILES:</strong> <code style="font-size:.85em;color:var(--accent-green);word-break:break-all">' + escapeHTML(c.smiles) + '</code></div>';
          if (c.iupac_name) html += '<div style="grid-column:1/-1"><strong>IUPAC:</strong> <span style="font-size:.85em">' + escapeHTML(c.iupac_name) + '</span></div>';
          html += '</div></div>';
          resEl.innerHTML = html;
        });
      });
      winEl.querySelector("#qd-compound-query").addEventListener("keydown", e => { if (e.key === "Enter") compoundBtn.click(); });
    }

    // ═══ Diagnostics Tab System ═══
    const dTabs = winEl.querySelectorAll(".qd-dtab");
    const dPanels = {
      labreport: winEl.querySelector("#qd-dpanel-labreport"),
      symptoms: winEl.querySelector("#qd-dpanel-symptoms"),
      lab: winEl.querySelector("#qd-dpanel-lab"),
      interactions: winEl.querySelector("#qd-dpanel-interactions"),
      genetics: winEl.querySelector("#qd-dpanel-genetics"),
      who: winEl.querySelector("#qd-dpanel-who"),
      ontology: winEl.querySelector("#qd-dpanel-ontology"),
    };
    if (dTabs.length) {
      dTabs.forEach(tab => {
        tab.addEventListener("click", () => {
          dTabs.forEach(t => { t.style.background = "transparent"; t.style.color = "var(--text-dim)"; t.style.border = "1px solid rgba(0,212,255,.2)"; t.style.fontWeight = "normal"; t.classList.remove("active"); });
          tab.style.background = "var(--accent)"; tab.style.color = "#000"; tab.style.fontWeight = "bold"; tab.style.border = "1px solid var(--accent)"; tab.classList.add("active");
          Object.values(dPanels).forEach(p => { if (p) p.classList.add("hidden"); });
          const p = dPanels[tab.dataset.dtab];
          if (p) p.classList.remove("hidden");
        });
      });

      // ═══ Lab Report Upload & OCR Analysis ═══
      const dropzone = winEl.querySelector("#qd-report-dropzone");
      const fileInput = winEl.querySelector("#qd-report-file");
      const analyzeBtn = winEl.querySelector("#qd-report-analyze");
      const previewDiv = winEl.querySelector("#qd-report-preview");
      const previewImg = winEl.querySelector("#qd-report-preview-img");
      const fileNameEl = winEl.querySelector("#qd-report-filename");
      let selectedFile = null;

      if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());
        dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.style.borderColor = "var(--accent)"; dropzone.style.background = "rgba(0,212,255,.08)"; });
        dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = "rgba(0,212,255,.3)"; dropzone.style.background = "rgba(0,212,255,.02)"; });
        dropzone.addEventListener("drop", (e) => {
          e.preventDefault();
          dropzone.style.borderColor = "rgba(0,212,255,.3)"; dropzone.style.background = "rgba(0,212,255,.02)";
          if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; fileInput.dispatchEvent(new Event("change")); }
        });

        fileInput.addEventListener("change", () => {
          const f = fileInput.files[0];
          if (!f) return;
          selectedFile = f;
          fileNameEl.textContent = f.name + " (" + (f.size / 1024).toFixed(1) + " KB)";
          if (f.type && f.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => { previewImg.src = e.target.result; previewDiv.style.display = "block"; };
            reader.readAsDataURL(f);
          } else {
            previewImg.src = ""; previewDiv.style.display = "block";
            previewImg.style.display = "none";
            fileNameEl.innerHTML = "📄 <strong>" + escapeHTML(f.name) + "</strong> (" + (f.size / 1024).toFixed(1) + " KB)";
          }
          analyzeBtn.disabled = false;
          analyzeBtn.textContent = "📊 Analyze Lab Report";
        });
      }

      if (analyzeBtn) {
        analyzeBtn.addEventListener("click", () => {
          if (!selectedFile) return;
          const resEl = winEl.querySelector("#qd-report-results");
          analyzeBtn.disabled = true;
          analyzeBtn.textContent = "⏳ Analyzing... (OCR + AI diagnosis)";
          resEl.innerHTML = '<div class="qd-loading" style="padding:20px;text-align:center"><div style="font-size:1.5em;margin-bottom:8px">🔬</div>Extracting lab values via OCR...<br><span style="color:var(--text-dim);font-size:.8em">AI is reading your report, identifying values, and running comprehensive health analysis</span></div>';

          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("report_type", winEl.querySelector("#qd-report-type").value);
          const age = winEl.querySelector("#qd-report-age");
          const sex = winEl.querySelector("#qd-report-sex");
          const weight = winEl.querySelector("#qd-report-weight");
          const height = winEl.querySelector("#qd-report-height");
          const conditions = winEl.querySelector("#qd-report-conditions");
          if (age && age.value) formData.append("age", age.value);
          if (sex && sex.value) formData.append("sex", sex.value);
          if (weight && weight.value) formData.append("weight", weight.value);
          if (height && height.value) formData.append("height", height.value);
          if (conditions && conditions.value) formData.append("conditions", conditions.value);

          fetch("/api/med/lab-report", { method: "POST", body: formData })
            .then(r => r.json())
            .then(data => {
              analyzeBtn.disabled = false;
              analyzeBtn.textContent = "📊 Analyze Lab Report";
              if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em;padding:10px">' + escapeHTML(data.error) + '</div>'; return; }
              const d = data.data;
              let html = '<div style="font-size:.82em">';

              // Header info
              html += '<div style="background:rgba(0,212,255,.06);padding:10px;border-radius:8px;margin-bottom:10px">';
              html += '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">';
              html += '<div><strong style="color:var(--accent)">Report Type:</strong> ' + escapeHTML(d.report_type_detected || d.report_type) + '</div>';
              html += '<div><strong style="color:var(--accent)">Tests Found:</strong> ' + d.total_tests_found + '</div>';
              if (d.lab_facility && d.lab_facility !== "Unknown") html += '<div><strong>Lab:</strong> ' + escapeHTML(d.lab_facility) + '</div>';
              if (d.report_date && d.report_date !== "Unknown") html += '<div><strong>Date:</strong> ' + escapeHTML(d.report_date) + '</div>';
              html += '</div>';

              // Quick summary bar
              html += '<div style="display:flex;gap:12px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,212,255,.1)">';
              html += '<span style="color:#00ffaa">✓ Normal: <strong>' + (d.total_tests_found - d.abnormal_count - d.critical_count) + '</strong></span>';
              if (d.abnormal_count > 0) html += '<span style="color:#ffa500">↕ Abnormal: <strong>' + d.abnormal_count + '</strong></span>';
              if (d.critical_count > 0) html += '<span style="color:#ff0000">⚠️ Critical: <strong>' + d.critical_count + '</strong></span>';
              html += '</div></div>';

              // Critical alerts
              if (d.critical_values && d.critical_values.length) {
                html += '<div style="background:rgba(255,0,0,.08);border:1px solid rgba(255,0,0,.3);padding:10px;border-radius:8px;margin-bottom:10px">';
                html += '<h4 style="color:#ff0000;margin:0 0 6px">⚠️ CRITICAL VALUES — Seek Medical Attention</h4>';
                d.critical_values.forEach(v => {
                  html += '<div style="padding:3px 0;color:#ff6060">• <strong>' + escapeHTML(v.test) + '</strong>: ' + v.value + ' ' + escapeHTML(v.unit || '') + ' [' + v.flag + ']</div>';
                });
                html += '</div>';
              }

              // Tests by category
              if (d.tests_by_category && Object.keys(d.tests_by_category).length) {
                html += '<h4 style="color:var(--accent);margin:10px 0 6px">📋 Extracted Lab Values</h4>';
                const catIcons = {hematology:"🩸",metabolic:"🔥",lipid:"🫀",liver:"🟡",kidney:"💧",thyroid:"⚡",hormone:"🧬",vitamin:"💊",cardiac:"❤️",urine:"🧪",tumor_marker:"🎯",autoimmune:"🛡️",other:"📌"};
                const catNames = {hematology:"Hematology (CBC)",metabolic:"Metabolic Panel",lipid:"Lipid Panel",liver:"Liver Function",kidney:"Kidney Function",thyroid:"Thyroid Panel",hormone:"Hormones",vitamin:"Vitamins & Minerals",cardiac:"Cardiac Markers",urine:"Urinalysis",tumor_marker:"Tumor Markers",autoimmune:"Autoimmune Panel",other:"Other Tests"};
                for (const [cat, tests] of Object.entries(d.tests_by_category)) {
                  html += '<div style="margin-bottom:8px"><div style="font-weight:bold;color:var(--accent);margin-bottom:4px">' + (catIcons[cat]||"📌") + ' ' + (catNames[cat]||cat) + '</div>';
                  html += '<table style="width:100%;border-collapse:collapse;font-size:.9em">';
                  html += '<tr style="border-bottom:1px solid rgba(0,212,255,.15)"><th style="text-align:left;padding:3px 6px">Test</th><th style="padding:3px 6px">Value</th><th style="padding:3px 6px">Reference</th><th style="padding:3px 6px">Status</th></tr>';
                  tests.forEach(t => {
                    const flag = (t.flag || "N").toUpperCase();
                    const isAbn = flag === "H" || flag === "HIGH" || flag === "L" || flag === "LOW";
                    const isCrit = flag === "C" || flag === "HH" || flag === "LL" || flag === "CRITICAL";
                    const color = isCrit ? "#ff0000" : isAbn ? "#ffa500" : "#00ffaa";
                    const ref = (t.reference_low != null && t.reference_high != null) ? t.reference_low + " - " + t.reference_high : "N/A";
                    html += '<tr style="border-bottom:1px solid rgba(255,255,255,.03)">';
                    html += '<td style="padding:3px 6px">' + escapeHTML(t.name) + '</td>';
                    html += '<td style="padding:3px 6px;text-align:center;color:' + color + ';font-weight:bold">' + t.value + ' ' + escapeHTML(t.unit || '') + '</td>';
                    html += '<td style="padding:3px 6px;text-align:center;color:var(--text-dim)">' + ref + '</td>';
                    html += '<td style="padding:3px 6px;text-align:center">';
                    if (isCrit) html += '<span style="color:#ff0000;font-weight:bold">⚠️ CRITICAL</span>';
                    else if (flag === "H" || flag === "HIGH") html += '<span style="color:#ffa500">↑ High</span>';
                    else if (flag === "L" || flag === "LOW") html += '<span style="color:#ffa500">↓ Low</span>';
                    else html += '<span style="color:#00ffaa">✓</span>';
                    html += '</td></tr>';
                  });
                  html += '</table></div>';
                }
              }

              // Health Assessment (the big AI analysis)
              if (d.health_assessment) {
                const ha = d.health_assessment;
                html += '<div style="background:rgba(0,255,170,.04);border:1px solid rgba(0,255,170,.15);padding:12px;border-radius:8px;margin-top:12px">';
                html += '<h4 style="color:var(--accent-green);margin:0 0 8px">🤖 AI Health Assessment</h4>';

                if (ha.overall_health_score) html += '<div style="margin-bottom:8px"><strong>Overall Score:</strong> <span style="color:var(--accent);font-size:1.1em;font-weight:bold">' + escapeHTML(String(ha.overall_health_score)) + '</span></div>';
                if (ha.health_status) html += '<div style="margin-bottom:8px">' + escapeHTML(ha.health_status) + '</div>';

                // Health problems detected
                if (ha.health_problems_detected && ha.health_problems_detected.length) {
                  html += '<h5 style="color:#ff8844;margin:10px 0 4px">🔍 Health Problems Detected</h5>';
                  ha.health_problems_detected.forEach(p => {
                    const confColor = p.confidence === "high" ? "#ff4444" : p.confidence === "medium" ? "#ffa500" : "#888";
                    html += '<div style="background:rgba(255,136,68,.06);padding:8px;border-radius:6px;margin-bottom:4px;border-left:3px solid ' + confColor + '">';
                    html += '<strong>' + escapeHTML(p.condition) + '</strong>';
                    if (p.icd10) html += ' <span style="color:var(--text-dim)">(' + escapeHTML(p.icd10) + ')</span>';
                    html += ' <span style="color:' + confColor + '">[' + escapeHTML(p.confidence) + ']</span>';
                    if (p.evidence) html += '<div style="font-size:.9em;color:var(--text-dim);margin-top:2px">Evidence: ' + escapeHTML(p.evidence) + '</div>';
                    if (p.action) html += '<div style="font-size:.9em;color:var(--accent-purple);margin-top:2px">Action: ' + escapeHTML(p.action) + '</div>';
                    html += '</div>';
                  });
                }

                // Imbalances
                if (ha.imbalances && ha.imbalances.length) {
                  html += '<h5 style="color:#ffaa00;margin:10px 0 4px">⚖️ Imbalances Detected</h5>';
                  ha.imbalances.forEach(imb => {
                    html += '<div style="background:rgba(255,170,0,.06);padding:8px;border-radius:6px;margin-bottom:4px">';
                    html += '<strong style="color:#ffaa00">' + escapeHTML(imb.type || "") + ':</strong> ' + escapeHTML(imb.description);
                    if (imb.correction) html += '<div style="font-size:.9em;color:var(--accent);margin-top:2px">→ ' + escapeHTML(imb.correction) + '</div>';
                    html += '</div>';
                  });
                }

                // Organ function assessment
                if (ha.organ_function_assessment) {
                  html += '<h5 style="color:var(--accent);margin:10px 0 4px">🏥 Organ Function</h5>';
                  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px">';
                  const organIcons = {liver:"🟡",kidney:"💧",thyroid:"⚡",heart:"❤️",bone_marrow:"🦴",pancreas:"🔬",immune_system:"🛡️"};
                  for (const [organ, status] of Object.entries(ha.organ_function_assessment)) {
                    if (!status) continue;
                    const isNorm = String(status).toLowerCase().startsWith("normal");
                    const orgColor = isNorm ? "#00ffaa" : "#ffa500";
                    const orgLabel = organ.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    html += '<div style="padding:4px 8px;border-radius:4px;background:rgba(0,212,255,.03)">';
                    html += (organIcons[organ]||"•") + ' <strong>' + orgLabel + ':</strong> <span style="color:' + orgColor + '">' + escapeHTML(String(status)) + '</span></div>';
                  }
                  html += '</div>';
                }

                // Risk assessment
                if (ha.risk_assessment) {
                  html += '<h5 style="color:var(--accent);margin:10px 0 4px">📊 Risk Assessment</h5>';
                  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px">';
                  for (const [risk, val] of Object.entries(ha.risk_assessment)) {
                    if (!val) continue;
                    const riskLabel = risk.replace(/_risk/,"").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    const riskStr = String(val).toLowerCase();
                    const rColor = riskStr.startsWith("high") ? "#ff4444" : riskStr.startsWith("moderate") ? "#ffa500" : "#00ffaa";
                    html += '<div style="padding:4px 8px;border-radius:4px;background:rgba(0,212,255,.03)">';
                    html += '<strong>' + riskLabel + ':</strong> <span style="color:' + rColor + '">' + escapeHTML(String(val)) + '</span></div>';
                  }
                  html += '</div>';
                }

                // Diet recommendations
                if (ha.diet_recommendations && ha.diet_recommendations.length) {
                  html += '<h5 style="color:#00cc66;margin:10px 0 4px">🥗 Diet Recommendations</h5>';
                  ha.diet_recommendations.forEach(dr => {
                    html += '<div style="background:rgba(0,204,102,.06);padding:8px;border-radius:6px;margin-bottom:4px">';
                    html += '<strong style="color:#00cc66">' + escapeHTML(dr.recommendation) + '</strong>';
                    if (dr.reason) html += '<div style="font-size:.85em;color:var(--text-dim)">Because: ' + escapeHTML(dr.reason) + '</div>';
                    if (dr.foods_to_increase && dr.foods_to_increase.length) html += '<div style="font-size:.85em;color:#00ffaa">✅ Increase: ' + escapeHTML(dr.foods_to_increase.join(", ")) + '</div>';
                    if (dr.foods_to_avoid && dr.foods_to_avoid.length) html += '<div style="font-size:.85em;color:#ff6060">❌ Avoid: ' + escapeHTML(dr.foods_to_avoid.join(", ")) + '</div>';
                    html += '</div>';
                  });
                }

                // Supplement suggestions
                if (ha.supplement_suggestions && ha.supplement_suggestions.length) {
                  html += '<h5 style="color:#aa88ff;margin:10px 0 4px">💊 Supplement Suggestions</h5>';
                  ha.supplement_suggestions.forEach(s => {
                    html += '<div style="padding:4px 8px;background:rgba(170,136,255,.06);border-radius:6px;margin-bottom:3px">';
                    html += '<strong style="color:#aa88ff">' + escapeHTML(s.supplement) + '</strong>';
                    if (s.dosage) html += ' — ' + escapeHTML(s.dosage);
                    if (s.reason) html += '<div style="font-size:.85em;color:var(--text-dim)">' + escapeHTML(s.reason) + '</div>';
                    html += '</div>';
                  });
                }

                // Lifestyle recommendations
                if (ha.lifestyle_recommendations && ha.lifestyle_recommendations.length) {
                  html += '<h5 style="color:#44aaff;margin:10px 0 4px">🏃 Lifestyle Recommendations</h5>';
                  ha.lifestyle_recommendations.forEach(lr => {
                    html += '<div style="padding:4px 8px;border-radius:6px;margin-bottom:3px">';
                    html += '<strong style="color:#44aaff">' + escapeHTML(lr.area || "") + ':</strong> ' + escapeHTML(lr.recommendation);
                    html += '</div>';
                  });
                }

                // Follow-up plan
                if (ha.follow_up) {
                  html += '<h5 style="color:var(--accent);margin:10px 0 4px">📅 Follow-Up Plan</h5>';
                  html += '<div style="background:rgba(0,212,255,.04);padding:8px;border-radius:6px">';
                  if (ha.follow_up.urgency) {
                    const uColor = {emergency:"#ff0000",urgent:"#ff6600",soon:"#ffaa00",routine:"#00cc66"}[ha.follow_up.urgency] || "#888";
                    html += '<div><strong>Urgency:</strong> <span style="color:' + uColor + ';font-weight:bold">' + escapeHTML(ha.follow_up.urgency.toUpperCase()) + '</span></div>';
                  }
                  if (ha.follow_up.retest_in) html += '<div><strong>Retest in:</strong> ' + escapeHTML(ha.follow_up.retest_in) + '</div>';
                  if (ha.follow_up.additional_tests && ha.follow_up.additional_tests.length) html += '<div><strong>Additional tests:</strong> ' + escapeHTML(ha.follow_up.additional_tests.join(", ")) + '</div>';
                  if (ha.follow_up.specialist_referrals && ha.follow_up.specialist_referrals.length) html += '<div><strong>See specialist:</strong> ' + escapeHTML(ha.follow_up.specialist_referrals.join(", ")) + '</div>';
                  if (ha.follow_up.monitoring_plan) html += '<div><strong>Monitor:</strong> ' + escapeHTML(ha.follow_up.monitoring_plan) + '</div>';
                  html += '</div>';
                }

                // Findings detail
                if (ha.findings && ha.findings.length) {
                  html += '<details style="margin-top:10px"><summary style="cursor:pointer;color:var(--accent);font-size:.9em">📝 Detailed Findings (' + ha.findings.length + ')</summary>';
                  ha.findings.forEach(f => {
                    const sevColor = {critical:"#ff0000",severe:"#ff4444",moderate:"#ffa500",mild:"#ffcc00",normal:"#00ffaa"}[f.severity] || "#888";
                    html += '<div style="padding:4px 8px;margin:2px 0;border-left:3px solid ' + sevColor + '">';
                    html += '<strong>' + escapeHTML(f.category || "") + ':</strong> ' + escapeHTML(f.finding);
                    if (f.explanation) html += '<div style="font-size:.85em;color:var(--text-dim)">' + escapeHTML(f.explanation) + '</div>';
                    html += '</div>';
                  });
                  html += '</details>';
                }

                // Raw analysis fallback
                if (ha.raw_analysis) {
                  html += '<div style="margin-top:8px;white-space:pre-wrap;font-size:.85em;color:var(--text-secondary)">' + escapeHTML(ha.raw_analysis) + '</div>';
                }

                html += '</div>';
              }

              html += '<div style="margin-top:10px;color:var(--text-dim);font-size:.72em;font-style:italic">' + escapeHTML(d.disclaimer || '') + '</div>';
              html += '</div>';
              resEl.innerHTML = html;
            })
            .catch(err => {
              analyzeBtn.disabled = false;
              analyzeBtn.textContent = "📊 Analyze Lab Report";
              resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em;padding:10px">Error: ' + escapeHTML(err.message) + '</div>';
            });
        });
      }

      // Symptom Checker
      const symBtn = winEl.querySelector("#qd-sym-check");
      if (symBtn) {
        symBtn.addEventListener("click", () => {
          const syms = winEl.querySelector("#qd-sym-input").value.trim();
          if (!syms) return;
          const age = parseInt(winEl.querySelector("#qd-sym-age").value) || 40;
          const sex = winEl.querySelector("#qd-sym-sex").value;
          const resEl = winEl.querySelector("#qd-sym-results");
          resEl.innerHTML = '<div class="qd-loading">🩺 Analyzing symptoms...</div>';
          fetch("/api/med/symptoms", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symptoms: syms, age, sex })
          }).then(r => r.json()).then(data => {
            if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
            const d = data.data;
            let html = '<div style="font-size:.8em">';
            // Database matches
            if (d.database_matches && d.database_matches.length) {
              html += '<h4 style="color:var(--accent);margin:8px 0 4px">Database Matches:</h4>';
              d.database_matches.forEach(m => {
                html += '<div style="background:rgba(0,212,255,.04);padding:6px 8px;border-radius:6px;margin-bottom:4px">';
                html += '<strong style="color:var(--accent)">' + escapeHTML(m.disease) + '</strong>';
                html += ' <span style="color:var(--text-dim)">(ICD-10: ' + escapeHTML(m.icd10) + ')</span>';
                html += ' — Prevalence: ' + escapeHTML(m.prevalence);
                html += '</div>';
              });
            }
            // AI differential
            if (d.ai_differential) {
              html += '<h4 style="color:var(--accent-green);margin:12px 0 4px">🤖 AI Differential Diagnosis:</h4>';
              if (d.ai_differential.differential) {
                d.ai_differential.differential.forEach((dx, i) => {
                  const probColor = dx.probability === 'high' ? '#00ffaa' : dx.probability === 'medium' ? '#ffa500' : '#888';
                  html += '<div style="background:rgba(0,255,170,.04);padding:8px;border-radius:6px;margin-bottom:4px;border-left:3px solid ' + probColor + '">';
                  html += '<strong>' + (i+1) + '. ' + escapeHTML(dx.name) + '</strong>';
                  if (dx.icd10) html += ' <span style="color:var(--text-dim)">(' + escapeHTML(dx.icd10) + ')</span>';
                  html += ' <span style="color:' + probColor + '">[' + escapeHTML(dx.probability) + ']</span>';
                  if (dx.supporting_symptoms) html += '<div style="color:var(--text-dim);font-size:.9em;margin-top:2px">Supports: ' + escapeHTML(dx.supporting_symptoms.join(', ')) + '</div>';
                  if (dx.recommended_tests) html += '<div style="color:var(--accent-purple);font-size:.9em">Tests: ' + escapeHTML(dx.recommended_tests.join(', ')) + '</div>';
                  html += '</div>';
                });
              }
              if (d.ai_differential.red_flags && d.ai_differential.red_flags.length) {
                html += '<div style="background:rgba(255,64,96,.1);padding:8px;border-radius:6px;margin-top:8px"><strong style="color:#ff4060">⚠️ Red Flags:</strong><br>';
                d.ai_differential.red_flags.forEach(f => { html += '<div style="color:#ff6080;padding-left:12px">• ' + escapeHTML(f) + '</div>'; });
                html += '</div>';
              }
              if (d.ai_differential.triage_level) {
                const triageColor = {'emergency':'#ff0000','urgent':'#ff6600','soon':'#ffaa00','routine':'#00cc66'}[d.ai_differential.triage_level] || '#888';
                html += '<div style="margin-top:6px"><strong>Triage:</strong> <span style="color:' + triageColor + ';font-weight:bold">' + escapeHTML(d.ai_differential.triage_level.toUpperCase()) + '</span></div>';
              }
              if (d.ai_differential.raw_analysis) {
                html += '<div style="margin-top:8px;white-space:pre-wrap;font-size:.85em;color:var(--text-secondary)">' + escapeHTML(d.ai_differential.raw_analysis) + '</div>';
              }
            }
            html += '<div style="margin-top:8px;color:var(--text-dim);font-size:.75em;font-style:italic">' + escapeHTML(d.disclaimer || '') + '</div>';
            html += '</div>';
            resEl.innerHTML = html;
          });
        });
        winEl.querySelector("#qd-sym-input").addEventListener("keydown", e => { if (e.key === "Enter") symBtn.click(); });
      }

      // Lab Results Interpreter
      const labAddBtn = winEl.querySelector("#qd-lab-add");
      if (labAddBtn) {
        labAddBtn.addEventListener("click", () => {
          const container = winEl.querySelector("#qd-lab-inputs");
          const row = document.createElement("div");
          row.className = "qd-lab-row";
          row.style.cssText = "display:flex;gap:4px;margin-bottom:4px";
          row.innerHTML = '<input type="text" placeholder="Test name" class="qd-lab-name" style="flex:2;padding:5px;background:var(--surface);color:var(--text);border:1px solid rgba(0,212,255,.2);border-radius:6px;font-size:.8em">' +
            '<input type="number" step="any" placeholder="Value" class="qd-lab-value" style="flex:1;padding:5px;background:var(--surface);color:var(--text);border:1px solid rgba(0,212,255,.2);border-radius:6px;font-size:.8em">' +
            '<input type="text" placeholder="Unit" class="qd-lab-unit" style="width:70px;padding:5px;background:var(--surface);color:var(--text);border:1px solid rgba(0,212,255,.2);border-radius:6px;font-size:.8em">';
          container.appendChild(row);
        });
      }
      const labInterpret = winEl.querySelector("#qd-lab-interpret");
      if (labInterpret) {
        labInterpret.addEventListener("click", () => {
          const rows = winEl.querySelectorAll(".qd-lab-row");
          const tests = [];
          rows.forEach(row => {
            const name = row.querySelector(".qd-lab-name").value.trim();
            const value = row.querySelector(".qd-lab-value").value;
            const unit = row.querySelector(".qd-lab-unit").value.trim();
            if (name && value) tests.push({ name, value: parseFloat(value), unit });
          });
          if (!tests.length) return;
          const resEl = winEl.querySelector("#qd-lab-results");
          resEl.innerHTML = '<div class="qd-loading">🧪 Interpreting lab results...</div>';
          fetch("/api/med/lab", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tests })
          }).then(r => r.json()).then(data => {
            if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
            const d = data.data;
            let html = '<div style="font-size:.8em">';
            // Summary
            const s = d.summary;
            html += '<div style="display:flex;gap:12px;margin-bottom:10px;padding:8px;background:rgba(0,212,255,.04);border-radius:6px">';
            html += '<span>Total: <strong>' + s.total_tests + '</strong></span>';
            html += '<span style="color:#00ffaa">Normal: <strong>' + s.normal + '</strong></span>';
            html += '<span style="color:#ffa500">Abnormal: <strong>' + s.abnormal + '</strong></span>';
            if (s.critical > 0) html += '<span style="color:#ff0000">⚠️ Critical: <strong>' + s.critical + '</strong></span>';
            html += '</div>';
            // Individual results
            html += '<table style="width:100%;border-collapse:collapse;font-size:.9em">';
            html += '<tr style="border-bottom:1px solid rgba(0,212,255,.15)"><th style="text-align:left;padding:4px;color:var(--accent)">Test</th><th style="padding:4px">Value</th><th style="padding:4px">Reference</th><th style="padding:4px">Status</th></tr>';
            (d.tests || []).forEach(t => {
              const statusColor = t.status === 'normal' ? '#00ffaa' : t.status.includes('critical') ? '#ff0000' : '#ffa500';
              html += '<tr style="border-bottom:1px solid rgba(255,255,255,.04)">';
              html += '<td style="padding:4px">' + escapeHTML(t.test) + '</td>';
              html += '<td style="padding:4px;text-align:center;color:' + statusColor + '">' + t.value + ' ' + escapeHTML(t.unit || '') + '</td>';
              html += '<td style="padding:4px;text-align:center;color:var(--text-dim)">' + escapeHTML(t.reference_range || 'N/A') + '</td>';
              html += '<td style="padding:4px;text-align:center">' + escapeHTML(t.flag || '') + '</td>';
              html += '</tr>';
            });
            html += '</table>';
            // AI interpretation
            if (d.ai_interpretation) {
              html += '<h4 style="color:var(--accent-green);margin:12px 0 4px">🤖 AI Interpretation:</h4>';
              if (d.ai_interpretation.assessment) html += '<p style="margin:4px 0">' + escapeHTML(d.ai_interpretation.assessment) + '</p>';
              if (d.ai_interpretation.patterns && d.ai_interpretation.patterns.length) {
                html += '<div style="margin:4px 0"><strong>Patterns:</strong></div>';
                d.ai_interpretation.patterns.forEach(p => { html += '<div style="padding-left:12px;color:var(--accent-purple)">• ' + escapeHTML(p) + '</div>'; });
              }
              if (d.ai_interpretation.conditions_to_consider && d.ai_interpretation.conditions_to_consider.length) {
                html += '<div style="margin:4px 0"><strong>Consider:</strong></div>';
                d.ai_interpretation.conditions_to_consider.forEach(c => { html += '<div style="padding-left:12px">• ' + escapeHTML(c) + '</div>'; });
              }
              if (d.ai_interpretation.urgency) {
                const urgColor = {'emergency':'#ff0000','urgent':'#ff6600','soon':'#ffaa00','routine':'#00cc66'}[d.ai_interpretation.urgency] || '#888';
                html += '<div style="margin-top:6px"><strong>Urgency:</strong> <span style="color:' + urgColor + ';font-weight:bold">' + escapeHTML(d.ai_interpretation.urgency.toUpperCase()) + '</span></div>';
              }
              if (d.ai_interpretation.raw_analysis) {
                html += '<div style="margin-top:8px;white-space:pre-wrap;font-size:.85em;color:var(--text-secondary)">' + escapeHTML(d.ai_interpretation.raw_analysis) + '</div>';
              }
            }
            html += '<div style="margin-top:8px;color:var(--text-dim);font-size:.75em;font-style:italic">' + escapeHTML(d.disclaimer || '') + '</div>';
            html += '</div>';
            resEl.innerHTML = html;
          });
        });
      }

      // Drug Interactions
      const interactBtn = winEl.querySelector("#qd-interact-check");
      if (interactBtn) {
        interactBtn.addEventListener("click", () => {
          const drugs = winEl.querySelector("#qd-interact-input").value.trim();
          if (!drugs) return;
          const resEl = winEl.querySelector("#qd-interact-results");
          resEl.innerHTML = '<div class="qd-loading">💊 Checking interactions...</div>';
          fetch("/api/med/interactions", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ drugs })
          }).then(r => r.json()).then(data => {
            if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
            const d = data.data;
            let html = '<div style="font-size:.8em">';
            // FDA data per drug
            if (d.fda_data && d.fda_data.length) {
              html += '<h4 style="color:var(--accent);margin:8px 0 4px">FDA Drug Labels:</h4>';
              d.fda_data.forEach(drug => {
                html += '<div style="background:rgba(0,212,255,.04);padding:8px;border-radius:6px;margin-bottom:6px">';
                html += '<strong style="color:var(--accent)">' + escapeHTML(drug.drug) + '</strong>';
                html += '<div style="margin-top:4px;color:var(--text-secondary)">' + escapeHTML(drug.interaction_info.substring(0, 400)) + '</div>';
                if (drug.warnings !== 'N/A') html += '<div style="margin-top:4px;color:#ffa500">⚠️ ' + escapeHTML(drug.warnings.substring(0, 300)) + '</div>';
                html += '</div>';
              });
            }
            // AI analysis
            if (d.ai_interaction_analysis) {
              html += '<h4 style="color:var(--accent-green);margin:12px 0 4px">🤖 AI Interaction Analysis:</h4>';
              if (d.ai_interaction_analysis.interactions) {
                d.ai_interaction_analysis.interactions.forEach(ix => {
                  const sevColor = {major:'#ff0000',moderate:'#ffa500',minor:'#ffcc00',none:'#00cc66'}[ix.severity] || '#888';
                  html += '<div style="background:rgba(0,255,170,.04);padding:8px;border-radius:6px;margin-bottom:4px;border-left:3px solid ' + sevColor + '">';
                  html += '<strong>' + escapeHTML(ix.drug_pair || '') + '</strong>';
                  html += ' <span style="color:' + sevColor + '">[' + escapeHTML(ix.severity || 'unknown') + ']</span>';
                  if (ix.mechanism) html += '<div style="color:var(--text-secondary);margin-top:2px">' + escapeHTML(ix.mechanism) + '</div>';
                  if (ix.action) html += '<div style="color:var(--accent-purple)">Action: ' + escapeHTML(ix.action) + '</div>';
                  html += '</div>';
                });
              }
              if (d.ai_interaction_analysis.raw_analysis) {
                html += '<div style="margin-top:8px;white-space:pre-wrap;font-size:.85em;color:var(--text-secondary)">' + escapeHTML(d.ai_interaction_analysis.raw_analysis) + '</div>';
              }
            }
            html += '<div style="margin-top:8px;color:var(--text-dim);font-size:.75em;font-style:italic">' + escapeHTML(d.disclaimer || '') + '</div>';
            html += '</div>';
            resEl.innerHTML = html;
          });
        });
        winEl.querySelector("#qd-interact-input").addEventListener("keydown", e => { if (e.key === "Enter") interactBtn.click(); });
      }

      // Genetics (ClinVar)
      const genBtn = winEl.querySelector("#qd-gen-search");
      if (genBtn) {
        genBtn.addEventListener("click", () => {
          const gene = winEl.querySelector("#qd-gen-gene").value.trim();
          const condition = winEl.querySelector("#qd-gen-condition").value.trim();
          if (!gene && !condition) return;
          const resEl = winEl.querySelector("#qd-gen-results");
          resEl.innerHTML = '<div class="qd-loading">🧬 Searching ClinVar...</div>';
          fetch("/api/med/genetics", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gene, condition })
          }).then(r => r.json()).then(data => {
            if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
            const d = data.data;
            let html = '<div style="font-size:.8em">';
            html += '<div style="color:var(--text-dim);margin-bottom:8px">Found ' + d.count + ' of ' + (d.total_found || d.count) + ' variants</div>';
            if (d.variants && d.variants.length) {
              d.variants.forEach(v => {
                const sigColor = v.clinical_significance.toLowerCase().includes('pathogenic') ? '#ff4060' : v.clinical_significance.toLowerCase().includes('benign') ? '#00cc66' : '#ffa500';
                html += '<div style="background:rgba(0,212,255,.04);padding:8px;border-radius:6px;margin-bottom:4px;border-left:3px solid ' + sigColor + '">';
                html += '<strong style="color:var(--accent)">' + escapeHTML(v.title || 'Variant ' + v.clinvar_id) + '</strong>';
                html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px">';
                if (v.gene) html += '<span>Gene: <strong>' + escapeHTML(v.gene) + '</strong></span>';
                html += '<span style="color:' + sigColor + '">Significance: <strong>' + escapeHTML(v.clinical_significance) + '</strong></span>';
                if (v.variation_type) html += '<span>Type: ' + escapeHTML(v.variation_type) + '</span>';
                if (v.condition) html += '<span>Condition: ' + escapeHTML(v.condition) + '</span>';
                html += '</div>';
                html += '<div style="margin-top:2px"><a href="https://www.ncbi.nlm.nih.gov/clinvar/variation/' + v.clinvar_id + '/" target="_blank" rel="noopener" style="color:var(--accent);font-size:.85em">View in ClinVar →</a></div>';
                html += '</div>';
              });
            } else {
              html += '<div style="color:var(--text-dim)">No variants found for this query.</div>';
            }
            html += '</div>';
            resEl.innerHTML = html;
          });
        });
        winEl.querySelector("#qd-gen-gene").addEventListener("keydown", e => { if (e.key === "Enter") genBtn.click(); });
      }

      // WHO Data
      const whoBtn = winEl.querySelector("#qd-who-search");
      if (whoBtn) {
        whoBtn.addEventListener("click", () => {
          const indicator = winEl.querySelector("#qd-who-indicator").value;
          const country = winEl.querySelector("#qd-who-country").value.trim();
          const resEl = winEl.querySelector("#qd-who-results");
          resEl.innerHTML = '<div class="qd-loading">🌍 Fetching WHO data...</div>';
          fetch("/api/med/who", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ indicator, country })
          }).then(r => r.json()).then(data => {
            if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
            const d = data.data;
            let html = '<div style="font-size:.8em">';
            html += '<div style="color:var(--text-dim);margin-bottom:8px">' + escapeHTML(d.indicator) + ' — ' + escapeHTML(d.country_filter) + ' (' + d.record_count + ' records)</div>';
            if (d.records && d.records.length) {
              html += '<table style="width:100%;border-collapse:collapse">';
              html += '<tr style="border-bottom:1px solid rgba(0,212,255,.15)"><th style="text-align:left;padding:4px;color:var(--accent)">Country</th><th style="padding:4px">Year</th><th style="padding:4px">Value</th><th style="padding:4px">Sex</th></tr>';
              d.records.forEach(r => {
                html += '<tr style="border-bottom:1px solid rgba(255,255,255,.04)">';
                html += '<td style="padding:4px">' + escapeHTML(r.country) + '</td>';
                html += '<td style="padding:4px;text-align:center">' + escapeHTML(r.year) + '</td>';
                html += '<td style="padding:4px;text-align:center;color:var(--accent)">' + (r.value != null ? r.value : 'N/A') + '</td>';
                html += '<td style="padding:4px;text-align:center;color:var(--text-dim)">' + escapeHTML(r.sex || '') + '</td>';
                html += '</tr>';
              });
              html += '</table>';
            }
            html += '<div style="margin-top:8px;color:var(--text-dim);font-size:.75em">Source: ' + escapeHTML(d.source || 'WHO GHO') + '</div>';
            html += '</div>';
            resEl.innerHTML = html;
          });
        });
      }

      // Disease Ontology
      const ontoBtn = winEl.querySelector("#qd-onto-search");
      if (ontoBtn) {
        ontoBtn.addEventListener("click", () => {
          const query = winEl.querySelector("#qd-onto-query").value.trim();
          if (!query) return;
          const resEl = winEl.querySelector("#qd-onto-results");
          resEl.innerHTML = '<div class="qd-loading">📖 Searching Disease Ontology...</div>';
          fetch("/api/med/disease-ontology", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
          }).then(r => r.json()).then(data => {
            if (!data.success) { resEl.innerHTML = '<div style="color:#ff5050;font-size:.8em">' + escapeHTML(data.error) + '</div>'; return; }
            const d = data.data;
            let html = '<div style="font-size:.8em">';
            html += '<div style="color:var(--text-dim);margin-bottom:8px">' + d.count + ' results for "' + escapeHTML(d.query) + '"</div>';
            if (d.results && d.results.length) {
              d.results.forEach(r => {
                html += '<div style="background:rgba(0,212,255,.04);padding:8px;border-radius:6px;margin-bottom:4px">';
                html += '<strong style="color:var(--accent)">' + escapeHTML(r.name || r.id || 'Unknown') + '</strong>';
                if (r.id) html += ' <span style="color:var(--text-dim);font-size:.85em">(' + escapeHTML(r.id) + ')</span>';
                if (r.description) html += '<div style="color:var(--text-secondary);margin-top:4px">' + escapeHTML(r.description) + '</div>';
                if (r.synonyms && r.synonyms.length) html += '<div style="color:var(--text-dim);font-size:.85em;margin-top:2px">Synonyms: ' + escapeHTML(r.synonyms.slice(0, 5).join(', ')) + '</div>';
                html += '</div>';
              });
            } else {
              html += '<div style="color:var(--text-dim)">No results found.</div>';
            }
            html += '<div style="margin-top:8px;color:var(--text-dim);font-size:.75em">Source: ' + escapeHTML(d.source || 'Disease Ontology') + '</div>';
            html += '</div>';
            resEl.innerHTML = html;
          });
        });
        winEl.querySelector("#qd-onto-query").addEventListener("keydown", e => { if (e.key === "Enter") ontoBtn.click(); });
      }
    }

    function renderMd(text) {
      // Simple markdown-like renderer for AI output
      return text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/^## (.*)/gm, '<h3 style="color:var(--accent);margin:10px 0 4px;font-size:.95em">$1</h3>')
        .replace(/^### (.*)/gm, '<h4 style="color:var(--accent-green);margin:8px 0 3px;font-size:.88em">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*)/gm, '<div style="padding-left:12px">• $1</div>')
        .replace(/\n\n/g, '<br>')
        .replace(/\n/g, '<br>');
    }

    showStep(1);
  }

  // ══════════════════════════════════════════════════════════
  //  QUANTUM LUCK
  // ══════════════════════════════════════════════════════════

    function initQuantumLuck(winEl) {
      const qlBackendSel = winEl.querySelector("#ql-backend-select"); if (qlBackendSel) loadBackendDropdown(qlBackendSel);

      // ── Tab switching ──
      winEl.querySelectorAll(".ql-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          winEl.querySelectorAll(".ql-tab").forEach(t => {
            t.classList.remove("active");
            t.style.background = "var(--surface2)";
            t.style.color = "var(--text)";
          });
          winEl.querySelectorAll(".ql-panel").forEach(p => p.classList.add("hidden"));
          tab.classList.add("active");
          tab.style.background = "var(--accent)";
          tab.style.color = "#000";
          const panel = winEl.querySelector(`#ql-panel-${tab.dataset.tab}`);
          if (panel) panel.classList.remove("hidden");
        });
      });

      // ── Live Status ──
      function updateLiveStatus() {
        const dot = winEl.querySelector("#ql-live-dot");
        const label = winEl.querySelector("#ql-live-label");
        if (dot) dot.style.background = "#ff0";
        if (label) label.textContent = "checking...";
        fetch("/api/quantum/live-status").then(r => r.json()).then(data => {
          if (data.success) {
            const clr = data.total_online >= 3 ? "#0f0" : data.total_online >= 1 ? "#ff0" : "#f00";
            if (dot) dot.style.background = clr;
            if (label) label.textContent = `${data.free_online} free + ${data.paid_online} paid online`;
          }
        }).catch(() => {
          if (dot) dot.style.background = "#f00";
          if (label) label.textContent = "offline";
        });
      }
      updateLiveStatus();
      const statusInterval = setInterval(updateLiveStatus, 30000);
      winEl.querySelector("#ql-refresh-status")?.addEventListener("click", updateLiveStatus);

      // ── File Upload (drag & drop + click) ──
      const dropZone = winEl.querySelector("#ql-drop-zone");
      const fileInput = winEl.querySelector("#ql-file-input");
      const uploadStatus = winEl.querySelector("#ql-upload-status");
      let parsedDraws = null;

      if (dropZone && fileInput) {
        dropZone.addEventListener("click", () => fileInput.click());
        dropZone.addEventListener("dragover", e => {
          e.preventDefault();
          dropZone.style.borderColor = "var(--accent)";
          dropZone.style.background = "rgba(0,212,255,.1)";
        });
        dropZone.addEventListener("dragleave", () => {
          dropZone.style.borderColor = "rgba(0,212,255,.3)";
          dropZone.style.background = "rgba(0,212,255,.03)";
        });
        dropZone.addEventListener("drop", e => {
          e.preventDefault();
          dropZone.style.borderColor = "rgba(0,212,255,.3)";
          dropZone.style.background = "rgba(0,212,255,.03)";
          if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener("change", () => {
          if (fileInput.files.length > 0) handleFileUpload(fileInput.files[0]);
        });
      }

      function handleFileUpload(file) {
        if (uploadStatus) {
          uploadStatus.style.display = "block";
          uploadStatus.style.background = "rgba(0,212,255,.1)";
          uploadStatus.style.color = "var(--accent)";
          uploadStatus.innerHTML = `\u{1F4E4} Uploading <strong>${escapeHTML(file.name)}</strong> (${(file.size/1024).toFixed(1)} KB)...`;
        }
        const formData = new FormData();
        formData.append("file", file);
        fetch("/api/lottery/upload", {
          method: "POST",
          body: formData,
        }).then(r => r.json()).then(data => {
          if (data.success) {
            parsedDraws = data.draws;
            let maxN = 0;
            data.draws.forEach(d => d.forEach(n => { if (n > maxN) maxN = n; }));
            if (maxN > 0) winEl.querySelector("#ql-maxnum").value = maxN;
            if (data.draws.length > 0) {
              winEl.querySelector("#ql-npick").value = Math.min(data.draws[0].length, 10);
            }
            if (uploadStatus) {
              uploadStatus.style.background = "rgba(0,255,100,.1)";
              uploadStatus.style.color = "#0f0";
              uploadStatus.innerHTML = `\u2705 <strong>${data.total_draws}</strong> draws loaded from <strong>${escapeHTML(data.filename)}</strong><br>Format: ${escapeHTML(data.detected_format)} | ${data.numbers_per_draw} numbers/draw | ${data.lines_skipped} lines skipped`;
            }
            winEl.querySelector("#ql-draws").value = "";
            winEl.querySelector("#ql-draws").placeholder = `${data.total_draws} draws loaded from file. You can paste additional data here or just click Predict.`;
          } else {
            if (uploadStatus) {
              uploadStatus.style.background = "rgba(255,100,100,.1)";
              uploadStatus.style.color = "#f55";
              uploadStatus.innerHTML = `\u274C ${escapeHTML(data.error)}`;
            }
          }
        }).catch(err => {
          if (uploadStatus) {
            uploadStatus.style.background = "rgba(255,100,100,.1)";
            uploadStatus.style.color = "#f55";
            uploadStatus.innerHTML = `\u274C Upload failed: ${escapeHTML(err.message)}`;
          }
        });
      }

      // ── Predict Button ──
      winEl.querySelector("#ql-predict-btn").addEventListener("click", () => {
        let draws = parsedDraws;
        const text = winEl.querySelector("#ql-draws").value.trim();
        if (text) {
          draws = text.split("\n").map(line =>
            line.split(/[,;\s\t]+/).map(Number).filter(n => !isNaN(n) && n > 0)
          ).filter(d => d.length > 0);
        }
        if (!draws || draws.length < 10) {
          winEl.querySelector("#ql-predict-result").innerHTML = '<div style="color:#f55;padding:8px">Need at least 10 draws. Upload a file or paste data.</div>';
          return;
        }
        const nPick = parseInt(winEl.querySelector("#ql-npick").value) || 6;
        const maxNum = parseInt(winEl.querySelector("#ql-maxnum").value) || 49;
        const dualMode = winEl.querySelector("#ql-dual-mode")?.checked;
        const res = winEl.querySelector("#ql-predict-result");
        const backend = winEl.querySelector("#ql-backend-select")?.value || "simulator";

        if (dualMode) {
          res.innerHTML = '<div style="color:var(--accent);padding:10px;text-align:center">\u{1F52E} Running DUAL quantum analysis...<br><span style="font-size:.8em;color:var(--text-dim)">Free (Stim) + Paid (' + escapeHTML(backend) + ') in parallel</span></div>';
          fetch("/api/quantum-luck/dual-predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draws, n_pick: nPick, max_num: maxNum, paid_backend: backend }),
          }).then(r => r.json()).then(data => {
            if (data.success) {
              const c = data.comparison;
              const a = data.shared_analysis;
              function renderBalls(nums, bg) {
                return nums.map(n => `<span style="display:inline-block;width:2rem;height:2rem;line-height:2rem;text-align:center;background:${bg};color:#000;border-radius:50%;font-weight:700;margin:2px;font-size:.85em">${n}</span>`).join("");
              }
              let freeHTML = "";
              if (c.free && c.free.status === "completed") {
                freeHTML = `<div style="flex:1;min-width:180px;padding:8px;background:rgba(0,255,100,.05);border:1px solid rgba(0,255,100,.2);border-radius:8px">
                  <div style="font-weight:700;color:#0f0;margin-bottom:4px;font-size:.85em">\u{1F193} ${escapeHTML(c.free.backend)}</div>
                  <div style="text-align:center;margin:6px 0">${renderBalls(c.free.prediction, "#0f0")}</div>
                  <div style="font-size:.72em;color:var(--text-dim)">\u269B ${c.free.qubits}q | \u23F1 ${c.free.elapsed_seconds}s</div>
                </div>`;
              }
              let paidHTML = "";
              if (c.paid && c.paid.status === "completed") {
                const pcolor = c.paid.real_hardware ? "#00d4ff" : "#ff0";
                const plabel = c.paid.real_hardware ? "\u{1F52C} REAL HW" : "\u{1F4BB} SIM";
                paidHTML = `<div style="flex:1;min-width:180px;padding:8px;background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.2);border-radius:8px">
                  <div style="font-weight:700;color:${pcolor};margin-bottom:4px;font-size:.85em">${plabel} ${escapeHTML(c.paid.backend)}</div>
                  <div style="text-align:center;margin:6px 0">${renderBalls(c.paid.prediction, pcolor)}</div>
                  <div style="font-size:.72em;color:var(--text-dim)">\u269B ${c.paid.qubits}q${c.paid.total_qubits ? "/" + c.paid.total_qubits : ""} | \u23F1 ${c.paid.elapsed_seconds}s${c.paid.shots ? " | " + c.paid.shots + "sh" : ""}${c.paid.job_id ? "<br>Job: " + c.paid.job_id : ""}</div>
                </div>`;
              } else if (c.paid && c.paid.status === "error") {
                paidHTML = `<div style="flex:1;min-width:180px;padding:8px;background:rgba(255,100,100,.05);border:1px solid rgba(255,100,100,.2);border-radius:8px">
                  <div style="font-weight:700;color:#f55;margin-bottom:4px;font-size:.85em">\u274C ${escapeHTML(c.paid.backend)}</div>
                  <div style="font-size:.78em;color:#f55">${escapeHTML(c.paid.error)}</div>
                </div>`;
              }
              let overlap = [];
              if (c.free?.prediction && c.paid?.prediction) {
                overlap = c.free.prediction.filter(n => c.paid.prediction.includes(n));
              }
              res.innerHTML = `
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">${freeHTML}${paidHTML}</div>
                ${overlap.length > 0 ? '<div style="text-align:center;padding:4px;background:rgba(255,215,0,.1);border-radius:6px;margin-bottom:6px;font-size:.82em"><strong style="color:gold">\u{1F3AF} Overlap:</strong> ' + renderBalls(overlap, "gold") + '</div>' : ''}
                <div style="font-size:.75em;color:var(--text-dim)"><strong>Analysis:</strong> ${a.total_draws} draws | Hot: ${a.hot_numbers.join(", ")} | Overdue: ${a.overdue_numbers.map(o=>o.number+"("+o.gap+")").join(", ")}</div>
                <div style="margin-top:4px;padding:4px 8px;background:rgba(255,100,100,.08);border-radius:6px;font-size:.7em;color:#f55">${escapeHTML(data.disclaimer)}</div>`;
            } else {
              res.innerHTML = `<div style="color:#f55">${escapeHTML(data.error || "Unknown error")}</div>`;
            }
          }).catch(err => {
            res.innerHTML = `<div style="color:#f55">Error: ${escapeHTML(err.message)}</div>`;
          });
        } else {
          res.innerHTML = '<div style="color:var(--accent)">\u{1F52E} Analyzing patterns + quantum randomness...</div>';
          fetch("/api/quantum-luck/lottery-predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draws, n_pick: nPick, max_num: maxNum }),
          }).then(r => r.json()).then(data => {
            if (data.success) {
              const nums = data.prediction.map(n => `<span style="display:inline-block;width:2.2rem;height:2.2rem;line-height:2.2rem;text-align:center;background:var(--accent);color:#000;border-radius:50%;font-weight:700;margin:.15rem">${n}</span>`).join("");
              res.innerHTML = `
                <div style="text-align:center;margin:1rem 0">${nums}</div>
                <div class="label">Confidence</div><div class="value" style="color:var(--accent-red)">${escapeHTML(data.confidence)}</div>
                <div class="label">Hot Numbers</div><div class="value">${data.analysis.hot_numbers.join(", ")}</div>
                <div class="label">Overdue</div><div class="value">${data.analysis.overdue_numbers.map(o => o.number + " (gap:" + o.gap + ")").join(", ")}</div>
                <div class="label">Method</div><div class="value">${escapeHTML(data.scoring.method)}</div>
                <div class="label">Quantum Source</div><div class="value">Stim QRNG (${data.quantum_component.n_qubits} qubits)</div>
                <div style="margin-top:.5rem;padding:.5rem;background:rgba(255,100,100,.1);border-radius:6px;font-size:.8rem;color:var(--accent-red)">${escapeHTML(data.disclaimer)}</div>`;
            } else {
              res.innerHTML = `<div style="color:var(--accent-red)">${escapeHTML(data.error)}</div>`;
            }
          });
        }
      });

      // ── Auto Predict (Loto 5/40) ──
      winEl.querySelector("#ql-auto-predict-btn")?.addEventListener("click", () => {
        const res = winEl.querySelector("#ql-predict-result");
        res.innerHTML = '<div style="color:var(--accent);padding:10px;text-align:center">\u26A1 Auto-loading Loto 5/40 data + predicting...</div>';
        winEl.querySelector("#ql-npick").value = 6;
        winEl.querySelector("#ql-maxnum").value = 40;
        fetch("/api/quantum-luck/lottery-predict-auto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ n_pick: 6, max_num: 40, limit: 1000 }),
        }).then(r => r.json()).then(data => {
          if (data.success) {
            const nums = data.prediction.map(n => `<span style="display:inline-block;width:2.2rem;height:2.2rem;line-height:2.2rem;text-align:center;background:var(--accent);color:#000;border-radius:50%;font-weight:700;margin:.15rem">${n}</span>`).join("");
            res.innerHTML = `
              <div style="text-align:center;font-weight:700;color:var(--accent);margin-bottom:4px">\u26A1 Loto 5/40 Auto-Prediction (${data.draws_analyzed} draws)</div>
              <div style="text-align:center;margin:8px 0">${nums}</div>
              <div style="font-size:.8em;color:var(--text-dim)">Hot: ${data.analysis.hot_numbers.join(", ")} | Cold: ${data.analysis.cold_numbers.join(", ")}<br>Overdue: ${data.analysis.overdue_numbers.map(o=>o.number+"("+o.gap+")").join(", ")}</div>
              <div style="margin-top:6px;padding:4px 8px;background:rgba(255,100,100,.08);border-radius:6px;font-size:.72em;color:#f55">${escapeHTML(data.disclaimer)}</div>`;
          } else {
            res.innerHTML = `<div style="color:#f55">${escapeHTML(data.error)}</div>`;
          }
        });
      });

      // ── Dice & Coins ──
      winEl.querySelector("#ql-roll-btn").addEventListener("click", () => {
        const rtype = winEl.querySelector("#ql-rtype").value;
        const count = parseInt(winEl.querySelector("#ql-rcount").value) || 5;
        const res = winEl.querySelector("#ql-roll-result");
        res.innerHTML = '<div style="color:var(--accent)">\u{1F3B2} Rolling...</div>';
        fetch("/api/quantum-luck/random", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: rtype, count }),
        }).then(r => r.json()).then(data => {
          if (data.success) {
            const items = data.results.map(r => `<span style="display:inline-block;padding:.3rem .6rem;margin:.15rem;background:var(--surface2);border:1px solid var(--border);border-radius:6px;font-size:1.1rem">${r}</span>`).join("");
            res.innerHTML = `<div style="text-align:center;margin:1rem 0">${items}</div><div style="font-size:.8rem;color:var(--text-dim);text-align:center">Source: ${escapeHTML(data.source)}</div>`;
          }
        });
      });

      // ── Password ──
      winEl.querySelector("#ql-gen-pwd-btn").addEventListener("click", () => {
        const length = parseInt(winEl.querySelector("#ql-plen").value) || 20;
        const symbols = winEl.querySelector("#ql-psym").checked;
        const res = winEl.querySelector("#ql-pwd-result");
        res.innerHTML = '<div style="color:var(--accent)">\u{1F511} Generating...</div>';
        fetch("/api/quantum-luck/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ length, symbols }),
        }).then(r => r.json()).then(data => {
          if (data.success) {
            res.innerHTML = `
              <div style="font-family:monospace;font-size:1.1rem;word-break:break-all;padding:.5rem;background:var(--surface2);border-radius:6px;margin:.5rem 0;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent)">${escapeHTML(data.password)}</div>
              <div class="label">Entropy</div><div class="value">${data.entropy_bits} bits \u2014 ${escapeHTML(data.strength)}</div>
              <div class="label">Source</div><div class="value">${escapeHTML(data.source)}</div>
              <div style="font-size:.75rem;color:var(--text-dim)">Click password to copy</div>`;
          }
        });
      });

      // ── Randomness Proof ──
      winEl.querySelector("#ql-proof-btn").addEventListener("click", () => {
        const nBits = parseInt(winEl.querySelector("#ql-proof-bits").value) || 1000;
        const res = winEl.querySelector("#ql-proof-result");
        res.innerHTML = '<div style="color:var(--accent)">\u{1F4CA} Running NIST tests...</div>';
        fetch("/api/quantum-luck/randomness-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ n_bits: nBits }),
        }).then(r => r.json()).then(data => {
          if (data.success) {
            const tests = data.tests.map(t => `<div style="display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid var(--border)"><span>${escapeHTML(t.name)}</span><span style="color:${t.pass ? 'var(--accent-green)' : 'var(--accent-red)'}"><strong>${t.pass ? 'PASS' : 'FAIL'}</strong></span></div>`).join("");
            res.innerHTML = `
              <div style="font-size:1.2rem;font-weight:700;color:${data.overall_pass ? 'var(--accent-green)' : 'var(--accent-red)'};margin:.5rem 0">${data.overall_pass ? '\u2713 ALL TESTS PASSED' : '\u26A0 SOME TESTS FAILED'}</div>
              ${tests}
              <div style="margin-top:.5rem;font-size:.8rem;color:var(--text-dim)">Tested ${data.n_bits} bits from Stim QRNG</div>`;
          }
        });
      });

      // ── Balances Tab ──
      function loadBalances() {
        const res = winEl.querySelector("#ql-balances-result");
        if (!res) return;
        res.innerHTML = '<div style="text-align:center;color:var(--accent);padding:15px">\u23F3 Connecting to all quantum providers...</div>';
        fetch("/api/quantum/balances").then(r => r.json()).then(data => {
          if (!data.success) { res.innerHTML = '<div style="color:#f55">Failed to load</div>'; return; }
          const s = data.summary;
          let html = `<div style="padding:6px 10px;background:rgba(0,212,255,.08);border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-around;text-align:center">
            <div><strong style="color:var(--accent);font-size:1.3em">${s.connected_providers}</strong><br><span style="font-size:.72em;color:var(--text-dim)">Connected</span></div>
            <div><strong style="color:#0f0;font-size:1.3em">${s.online_backends}</strong><br><span style="font-size:.72em;color:var(--text-dim)">Online</span></div>
            <div><strong style="color:var(--text);font-size:1.3em">${s.total_backends}</strong><br><span style="font-size:.72em;color:var(--text-dim)">Total</span></div>
          </div>`;
          for (const [key, prov] of Object.entries(data.providers)) {
            const sc = prov.status === "connected" ? "#0f0" : prov.status === "error" ? "#f55" : "#888";
            const si = prov.status === "connected" ? "\u2705" : prov.status === "error" ? "\u274C" : "\u26AA";
            html += `<div style="padding:8px;background:var(--surface2);border-radius:6px;margin-bottom:6px;border-left:3px solid ${sc}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <strong style="color:${sc}">${si} ${escapeHTML(prov.provider)}</strong>
                <span style="font-size:.75em;padding:2px 8px;background:rgba(${prov.status==='connected'?'0,255,0':'255,0,0'},.1);border-radius:10px;color:${sc}">${prov.status.toUpperCase()}</span>
              </div>`;
            if (prov.plan) html += `<div style="font-size:.78em;color:var(--text-dim)">Plan: <strong>${escapeHTML(prov.plan)}</strong></div>`;
            if (prov.note) html += `<div style="font-size:.72em;color:var(--text-dim);margin-top:2px">${escapeHTML(prov.note)}</div>`;
            if (prov.version) html += `<div style="font-size:.72em;color:var(--text-dim)">v${escapeHTML(prov.version)}</div>`;
            if (prov.error) html += `<div style="font-size:.75em;color:#f55;margin-top:2px">${escapeHTML(prov.error)}</div>`;
            if (prov.backends && prov.backends.length > 0) {
              html += `<div style="margin-top:4px">`;
              prov.backends.forEach(b => {
                const bc = (b.status === "online" || b.status === "ONLINE") ? "#0f0" : "#888";
                html += `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:.75em;border-bottom:1px solid rgba(255,255,255,.05)"><span>${escapeHTML(b.name)}</span><span style="color:var(--text-dim)">${b.qubits ? b.qubits + "q" : ""} <span style="color:${bc}">\u25CF</span> ${b.status}${b.pending_jobs !== undefined ? " (" + b.pending_jobs + " queued)" : ""}</span></div>`;
              });
              html += `</div>`;
            }
            html += `</div>`;
          }
          res.innerHTML = html;
        }).catch(err => {
          res.innerHTML = `<div style="color:#f55">Error: ${escapeHTML(err.message)}</div>`;
        });
      }
      winEl.querySelector("#ql-refresh-balances")?.addEventListener("click", loadBalances);
      winEl.querySelectorAll(".ql-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          if (tab.dataset.tab === "balances") loadBalances();
        });
      });
    }

  // ══════════════════════════════════════════════════════════
  //  QUANTUM SEARCH
  // ══════════════════════════════════════════════════════════

  function initQuantumSearch(winEl) {
    const qsBackendSel = winEl.querySelector("#qs-backend-select"); if (qsBackendSel) loadBackendDropdown(qsBackendSel);
    // Tab switching
    winEl.querySelectorAll(".qs-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        winEl.querySelectorAll(".qs-tab").forEach(t => t.classList.remove("active"));
        winEl.querySelectorAll(".qs-panel").forEach(p => p.classList.add("hidden"));
        tab.classList.add("active");
        winEl.querySelector(`#qs-panel-${tab.dataset.tab}`).classList.remove("hidden");
      });
    });

    // Range slider display
    const slider = winEl.querySelector("#qs-nitems");
    const display = winEl.querySelector("#qs-nitems-val");
    if (slider && display) {
      slider.addEventListener("input", () => {
        display.textContent = parseInt(slider.value).toLocaleString() + " items";
      });
    }

    // Search demo
    winEl.querySelector("#qs-search-btn").addEventListener("click", () => {
      const nItems = parseInt(winEl.querySelector("#qs-nitems").value);
      const res = winEl.querySelector("#qs-search-result");
      res.innerHTML = '<div style="color:var(--accent)">⚡ Running classical vs quantum...</div>';
      fetch("/api/quantum-search/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n_items: nItems }),
      }).then(r => r.json()).then(data => {
        if (data.success) {
          const speedup = parseFloat(data.speedup);
          const barWidth = Math.min(speedup * 5, 100);
          res.innerHTML = `
            <div style="text-align:center;margin:1rem 0">
              <div style="font-size:2rem;font-weight:800;color:var(--accent)">${escapeHTML(data.speedup)} faster</div>
              <div style="color:var(--text-dim)">Quantum vs Classical</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0">
              <div style="background:var(--surface2);padding:1rem;border-radius:8px;border-left:3px solid var(--accent-red)">
                <div style="font-weight:700;color:var(--accent-red)">Classical</div>
                <div style="font-size:1.5rem;font-weight:800">${data.classical.steps.toLocaleString()}</div>
                <div style="font-size:.8rem;color:var(--text-dim)">${escapeHTML(data.classical.complexity)}</div>
              </div>
              <div style="background:var(--surface2);padding:1rem;border-radius:8px;border-left:3px solid var(--accent-green)">
                <div style="font-weight:700;color:var(--accent-green)">Quantum (Grover)</div>
                <div style="font-size:1.5rem;font-weight:800">${data.quantum.steps.toLocaleString()}</div>
                <div style="font-size:.8rem;color:var(--text-dim)">${escapeHTML(data.quantum.complexity)}</div>
              </div>
            </div>
            <div style="font-size:.85rem;color:var(--text-dim)">2-qubit demo: found |${escapeHTML(data.quantum.demo_result)}⟩ with ${(data.quantum.demo_success_prob*100).toFixed(1)}% probability</div>
          `;
        }
      });
    });

    // Benchmark
    winEl.querySelector("#qs-bench-btn").addEventListener("click", () => {
      const res = winEl.querySelector("#qs-bench-result");
      res.innerHTML = '<div style="color:var(--accent)">📊 Computing benchmarks...</div>';
      fetch("/api/quantum-search/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then(r => r.json()).then(data => {
        if (data.success) {
          const rows = data.benchmarks.map(b => `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:.4rem">${b.n_items.toLocaleString()}</td>
              <td style="padding:.4rem">${b.classical_steps.toLocaleString()}</td>
              <td style="padding:.4rem;color:var(--accent-green)">${b.quantum_steps.toLocaleString()}</td>
              <td style="padding:.4rem;color:var(--accent);font-weight:700">${b.speedup}×</td>
              <td style="padding:.4rem">${b.qubits_needed}</td>
            </tr>`).join("");
          res.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:.85rem">
              <thead><tr style="border-bottom:2px solid var(--accent)">
                <th style="text-align:left;padding:.4rem">Items</th>
                <th style="text-align:left;padding:.4rem">Classical</th>
                <th style="text-align:left;padding:.4rem">Quantum</th>
                <th style="text-align:left;padding:.4rem">Speedup</th>
                <th style="text-align:left;padding:.4rem">Qubits</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="margin-top:1rem;font-size:.85rem;color:var(--text-dim)">${escapeHTML(data.explanation)}</div>
          `;
        }
      });
    });
  }


  // Store stim version for reports
  let HAS_STIM_VER = "";
  fetch("/api/system/info").then(r => r.json()).then(d => { HAS_STIM_VER = d.stim_version || ""; });

  // ══════════════════════════════════════════════════════════
  //  UTILITIES
  // ══════════════════════════════════════════════════════════

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Start ───────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", runBoot);
  //  MEDGEMMA AI
  // ══════════════════════════════════════════════════════════

  function initMedGemmaAI(winEl) {
  const root = winEl.querySelector(".app-medgemma-ai");
  if (!root) return;

  // GPU status check
  fetch('/api/medgemma/health').then(r => r.json()).then(d => {
    const el = root.querySelector('#mg-gpu-status');
    if (d.status === 'ok' && d.model_loaded) {
      const gpu = d.gpu || {};
      el.innerHTML = `<span style="color:#0f0">● Online</span> — ${gpu.gpu || 'GPU'} | VRAM: ${gpu.vram_used_gb || '?'}/${gpu.vram_total_gb || '?'} GB | Uptime: ${Math.round((d.uptime_seconds||0)/60)}m`;
    } else {
      el.innerHTML = `<span style="color:#f44">● Offline</span> — ${d.error || 'Model not loaded'}`;
    }
  }).catch(() => {
    const el = root.querySelector('#mg-gpu-status');
    if (el) el.innerHTML = '<span style="color:#f44">● Unreachable</span> — GPU tunnel may be down';
  });

  // Tab switching
  root.querySelectorAll('.mg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      root.querySelectorAll('.mg-tab').forEach(t => {
        t.style.background = 'transparent';
        t.style.color = 'var(--text-dim)';
        t.style.borderColor = 'rgba(0,212,255,.2)';
        t.classList.remove('active');
      });
      tab.style.background = 'var(--accent)';
      tab.style.color = '#000';
      tab.style.borderColor = 'var(--accent)';
      tab.classList.add('active');
      root.querySelectorAll('.mg-panel').forEach(p => p.classList.add('hidden'));
      const panel = root.querySelector('#mg-mode-' + tab.dataset.mode);
      if (panel) panel.classList.remove('hidden');
    });
  });

  // Helper: render markdown-ish response
  function renderMD(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*)/gm, '<h4 style="color:var(--accent);margin:8px 0 4px">$1</h4>')
      .replace(/^## (.*)/gm, '<h3 style="color:var(--accent);margin:8px 0 4px">$1</h3>')
      .replace(/^- (.*)/gm, '<div style="padding-left:12px">• $1</div>')
      .replace(/^\d+\.\s+(.*)/gm, '<div style="padding-left:12px;margin:2px 0">$&</div>')
      .replace(/\n/g, '<br>');
  }

  // Helper: show result with stats
  function showResult(container, data, type) {
    if (data.error) {
      container.innerHTML = `<div style="padding:12px;background:rgba(255,0,0,.1);border:1px solid rgba(255,0,0,.3);border-radius:8px;color:#f66">${data.error}</div>`;
      return;
    }
    let html = '<div style="padding:12px;background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.15);border-radius:8px">';
    // Stats bar
    const stats = [];
    if (data.tokens) stats.push(`${data.tokens} tokens`);
    if (data.inference_time) stats.push(`${data.inference_time.toFixed(1)}s`);
    if (data.tokens_per_second) stats.push(`${data.tokens_per_second.toFixed(1)} tok/s`);
    if (data.type) stats.push(data.type);
    if (stats.length) {
      html += `<div style="font-size:.7em;color:var(--text-dim);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(0,212,255,.1)">⚡ ${stats.join(' • ')}</div>`;
    }
    // Content
    if (type === 'agent' && data.agent_plan) {
      const plan = data.agent_plan;
      if (plan.immediate_actions) {
        html += '<h4 style="color:#f90;margin:4px 0">🚨 Immediate Actions</h4>';
        plan.immediate_actions.forEach(a => { html += `<div style="padding-left:12px">• ${a}</div>`; });
      }
      if (plan.diagnostic_orders) {
        html += '<h4 style="color:var(--accent);margin:8px 0 4px">🔬 Diagnostic Orders</h4>';
        plan.diagnostic_orders.forEach(a => { html += `<div style="padding-left:12px">• ${a}</div>`; });
      }
      if (plan.treatment_plan) {
        html += '<h4 style="color:#0f0;margin:8px 0 4px">💊 Treatment Plan</h4>';
        plan.treatment_plan.forEach(a => { html += `<div style="padding-left:12px">• ${a}</div>`; });
      }
      if (plan.raw_response) {
        html += '<div style="margin-top:8px;font-size:.82em">' + renderMD(plan.raw_response) + '</div>';
      }
    } else if (type === 'quantum-med') {
      if (data.quantum_simulation) {
        html += '<h4 style="color:var(--accent);margin:4px 0">⚛ Quantum Simulation</h4>';
        html += `<pre style="font-size:.72em;background:var(--surface);padding:8px;border-radius:6px;overflow-x:auto;color:var(--text)">${JSON.stringify(data.quantum_simulation, null, 2)}</pre>`;
      }
      if (data.medgemma_interpretation) {
        html += '<h4 style="color:#0f0;margin:8px 0 4px">🧠 MedGemma Interpretation</h4>';
        const interp = data.medgemma_interpretation;
        html += '<div style="font-size:.82em">' + renderMD(interp.response || interp.raw_response || JSON.stringify(interp)) + '</div>';
      }
    } else {
      html += '<div style="font-size:.82em">' + renderMD(data.response || data.raw_response || JSON.stringify(data)) + '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // Helper: make API call
  async function mgAPI(endpoint, body, btn, resultEl, type) {
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Processing...';
    resultEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-dim)"><div style="font-size:1.5em;animation:spin 1s linear infinite;display:inline-block">⚛</div><br>MedGemma is thinking...<br><small>This may take 15-120 seconds</small></div>';
    try {
      const r = await fetch('/api/medgemma/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      showResult(resultEl, data, type);
    } catch (e) {
      resultEl.innerHTML = `<div style="padding:12px;background:rgba(255,0,0,.1);border:1px solid rgba(255,0,0,.3);border-radius:8px;color:#f66">Network error: ${e.message}</div>`;
    }
    btn.disabled = false;
    btn.textContent = origText;
  }

  // ── DIAGNOSE TAB ──
  const analyzeBtn = root.querySelector('#mg-analyze-btn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      const prompt = root.querySelector('#mg-analyze-text').value.trim();
      if (!prompt) return alert('Please enter clinical text.');
      const type = root.querySelector('#mg-analyze-type').value;
      const maxTokens = parseInt(root.querySelector('#mg-max-tokens').value) || 1024;
      mgAPI('analyze', { prompt, type, max_tokens: maxTokens }, analyzeBtn, root.querySelector('#mg-analyze-result'), 'analyze');
    });
  }

  // ── IMAGE TAB ──
  let imageB64 = null, imageMime = null;
  const dropzone = root.querySelector('#mg-img-dropzone');
  const fileInput = root.querySelector('#mg-img-file');
  const imgBtn = root.querySelector('#mg-img-analyze-btn');
  const preview = root.querySelector('#mg-img-preview');
  const thumb = root.querySelector('#mg-img-thumb');

  if (dropzone) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = 'var(--accent)'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'rgba(0,212,255,.3)'; });
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(0,212,255,.3)';
      if (e.dataTransfer.files.length) handleImgFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) handleImgFile(fileInput.files[0]); });
  }

  function handleImgFile(file) {
    if (file.size > 20 * 1024 * 1024) return alert('File too large (max 20 MB)');
    imageMime = file.type;
    const reader = new FileReader();
    reader.onload = e => {
      imageB64 = e.target.result.split(',')[1];
      thumb.src = e.target.result;
      preview.style.display = 'block';
      imgBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  if (imgBtn) {
    imgBtn.addEventListener('click', () => {
      if (!imageB64) return alert('Please upload an image first.');
      const imgType = root.querySelector('#mg-img-type').value;
      const prompt = root.querySelector('#mg-img-prompt').value.trim() || 'Analyze this medical image in detail.';
      mgAPI('analyze-image', { image_base64: imageB64, image_mime: imageMime, prompt, type: imgType }, imgBtn, root.querySelector('#mg-img-result'), 'image');
    });
  }

  // ── AGENT TAB ──
  const agentBtn = root.querySelector('#mg-agent-btn');
  if (agentBtn) {
    agentBtn.addEventListener('click', () => {
      const patientCase = root.querySelector('#mg-agent-case').value.trim();
      if (!patientCase) return alert('Please enter a patient case.');
      mgAPI('agent', { patient_case: patientCase }, agentBtn, root.querySelector('#mg-agent-result'), 'agent');
    });
  }

  // ── QUANTUM+MED TAB ──
  const qmBtn = root.querySelector('#mg-qm-btn');
  if (qmBtn) {
    qmBtn.addEventListener('click', () => {
      const molecule = root.querySelector('#mg-qm-molecule').value.trim();
      const disease = root.querySelector('#mg-qm-disease').value.trim();
      if (!molecule || !disease) return alert('Both molecule and disease are required.');
      const context = root.querySelector('#mg-qm-context').value.trim();
      mgAPI('quantum-med', { molecule, disease, context }, qmBtn, root.querySelector('#mg-qm-result'), 'quantum-med');
    });
  }
  }
})();
