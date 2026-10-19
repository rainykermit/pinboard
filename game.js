(() => {
  const $ = (id) => document.getElementById(id);
  const state = {
    x: 50, y: 50, darts: 5, score: 0, best: null, sound: false,
    busy: false, lockedX: false, lockedY: false,
    phaseX: 0.4, phaseY: 2.0, lastTime: 0
  };
  const quips = [
    "Aim for greatness. Accidentally hit the printer.",
    "HR says this counts as team building.",
    "Precision is temporary. Confidence is forever.",
    "That dart has a better career plan than you.",
    "Somewhere, a spreadsheet just got nervous.",
    "A bold strategy. The board is filing a complaint.",
    "Olympic committee, please do not contact us."
  ];
  const xTrack = $("xTrack"), yTrack = $("yTrack");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateAim(axis, value, locked = false) {
    value = Math.max(0, Math.min(100, value));
    state[axis] = value;
    const prefix = axis;
    $(prefix + "Value").textContent = Math.round(value) + "%";
    $(prefix + "Cursor").style.left = value + "%";
    $(prefix + "Fill").style.width = value + "%";
    const track = axis === "x" ? xTrack : yTrack;
    track.classList.toggle("locked", locked);
    track.setAttribute("aria-valuenow", String(Math.round(value)));
  }
  function setAimFromPointer(axis, event) {
    if (state.busy || state.darts <= 0) return;
    const track = axis === "x" ? xTrack : yTrack;
    const rect = track.getBoundingClientRect();
    const value = (event.clientX - rect.left) / rect.width * 100;
    if (axis === "x") state.lockedX = true;
    else state.lockedY = true;
    updateAim(axis, value, true);
    track.querySelector(".track-label").textContent = "AIM LOCKED";
    $("feedbackIcon").textContent = "✦";
    $("feedback").textContent = (axis === "x" ? "Horizontal" : "Vertical") + " aim locked at " + Math.round(value) + "%. " +
      ((state.lockedX && state.lockedY) ? "Both axes locked — throw when ready!" : "Now lock the other moving bar.");
    $("aimMarker").classList.remove("hidden");
    placeMarker();
    playTone(530, .05);
  }
  function placeMarker() {
    const marker = $("aimMarker");
    marker.style.left = state.x + "%";
    marker.style.top = state.y + "%";
  }
  function scoreFor(x, y) {
    const dx = (x - 50) / 50, dy = (y - 50) / 50;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < .12) return { points: 100, text: "DIRECT HIT. Someone call the press.", icon: "💥" };
    if (distance < .34) return { points: 60, text: "Close enough. Act like you meant it.", icon: "🎯" };
    if (distance < .66) return { points: 25, text: "Technically nearby. We'll allow it.", icon: "🫡" };
    return { points: 5, text: "A creative miss. The wall is impressed.", icon: "🫠" };
  }
  function playTone(freq = 440, duration = .07) {
    if (!state.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "triangle"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
      osc.onended = () => ctx.close();
    } catch (_) {}
  }
  function resetLockState() {
    state.lockedX = false; state.lockedY = false;
    [xTrack, yTrack].forEach(t => {
      t.classList.remove("locked");
      const label = t.querySelector(".track-label");
      if (label) label.textContent = "CLICK TO LOCK";
    });
  }
  function throwDart() {
    if (state.busy || state.darts <= 0) return;
    // Throw uses the current positions even if a player chooses not to lock both axes.
    state.busy = true;
    state.lockedX = true; state.lockedY = true;
    xTrack.classList.add("locked"); yTrack.classList.add("locked");
    const targetX = state.x, targetY = state.y;
    const result = scoreFor(targetX, targetY);
    const dart = $("dart");
    dart.classList.remove("hidden", "stuck", "in-flight");
    // Start from the bottom edge, then animate into the selected point on the image.
    dart.style.transition = "none";
    dart.style.left = "50%";
    dart.style.top = "108%";
    dart.style.transform = "translate(-50%,-50%) rotate(-65deg) scale(.55)";
    $("aimMarker").classList.add("hidden");
    // Force a style/layout read so the browser commits the starting position.
    void dart.offsetWidth;
    requestAnimationFrame(() => {
      dart.classList.add("in-flight");
      dart.style.left = targetX + "%";
      dart.style.top = targetY + "%";
      dart.style.transform = "translate(-50%,-50%) rotate(18deg) scale(1.15)";
    });
    playTone(240, .08);
    window.setTimeout(() => {
      dart.classList.remove("in-flight");
      dart.classList.add("stuck");
      dart.style.left = targetX + "%";
      dart.style.top = targetY + "%";
      dart.style.transform = "translate(-50%,-50%) rotate(-38deg) scale(1)";
      state.score += result.points;
      state.darts--;
      state.best = state.best === null ? result.points : Math.max(state.best, result.points);
      $("score").textContent = state.score;
      $("dartsLeft").textContent = state.darts;
      $("best").textContent = state.best;
      $("feedbackIcon").textContent = result.icon;
      $("feedback").textContent = result.text + " +" + result.points + " points.";
      $("roundNum").textContent = String(6 - state.darts).padStart(2, "0");
      $("quip").textContent = quips[Math.floor(Math.random() * quips.length)];
      playTone(result.points === 100 ? 760 : result.points === 60 ? 570 : 300, .12);
      $("throwBtn").disabled = state.darts <= 0;
      $("throwBtn").style.opacity = state.darts <= 0 ? ".45" : "1";
      state.busy = false;
      if (state.darts <= 0) finishGame();
      else {
        resetLockState();
        $("feedback").textContent += " Next dart — catch the moving bars again!";
        $("aimMarker").classList.remove("hidden");
        placeMarker();
      }
    }, reducedMotion ? 80 : 680);
  }
  function finishGame() {
    let title, text;
    if (state.score >= 400) { title = "Certified Menace"; text = "A frankly suspicious performance. HR has been notified."; }
    else if (state.score >= 250) { title = "Office Legend"; text = "Your aim is sharp. Your calendar is still a disaster."; }
    else if (state.score >= 100) { title = "Promising Liability"; text = "You may keep the darts, but please return the stapler."; }
    else { title = "Creative Problem Solver"; text = "You missed the target but hit the vibes. That's something."; }
    $("endTitle").textContent = title;
    $("endText").textContent = text + " Final score: " + state.score + ".";
    $("endPanel").classList.remove("hidden");
  }
  function reset() {
    state.x = 50; state.y = 50; state.darts = 5; state.score = 0; state.best = null; state.busy = false;
    $("score").textContent = "0"; $("dartsLeft").textContent = "5"; $("best").textContent = "—"; $("roundNum").textContent = "01";
    $("dart").classList.add("hidden"); $("dart").classList.remove("in-flight","stuck");
    $("aimMarker").classList.add("hidden"); $("endPanel").classList.add("hidden");
    $("feedbackIcon").textContent = "✦"; $("feedback").textContent = "Catch the moving bars, lock your aim, and throw!";
    $("throwBtn").disabled = false; $("throwBtn").style.opacity = "1";
    resetLockState();
    updateAim("x",50); updateAim("y",50);
  }
  function animate(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const dt = Math.min((timestamp - state.lastTime) / 1000, .05);
    state.lastTime = timestamp;
    if (!state.busy && state.darts > 0) {
      // Triangular wave: steady left-right and up-down motion until each bar is clicked.
      if (!state.lockedX) {
        state.phaseX += dt * 1.15;
        const v = (Math.sin(state.phaseX) + 1) * 50;
        updateAim("x", v);
      }
      if (!state.lockedY) {
        state.phaseY += dt * 0.92;
        const v = (Math.sin(state.phaseY) + 1) * 50;
        updateAim("y", v);
      }
      if (!$("aimMarker").classList.contains("hidden")) placeMarker();
    }
    requestAnimationFrame(animate);
  }
  xTrack.addEventListener("click", e => setAimFromPointer("x", e));
  yTrack.addEventListener("click", e => setAimFromPointer("y", e));
  [ [xTrack, "x"], [yTrack, "y"] ].forEach(([track, axis]) => {
    track.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const rect = track.getBoundingClientRect();
        setAimFromPointer(axis, { clientX: rect.left + rect.width * state[axis] / 100 });
      }
    });
  });
  $("throwBtn").addEventListener("click", throwDart);
  $("restartBtn").addEventListener("click", reset);
  $("soundBtn").addEventListener("click", () => {
    state.sound = !state.sound;
    $("soundLabel").textContent = state.sound ? "Sound on" : "Sound off";
    $("soundBtn").style.borderColor = state.sound ? "var(--lime)" : "var(--line)";
    if (state.sound) playTone(560, .08);
  });
  document.addEventListener("keydown", e => {
    if (e.code === "Space" && !["BUTTON","INPUT"].includes(document.activeElement.tagName)) {
      e.preventDefault();
      if (!$("endPanel").classList.contains("hidden")) return;
      throwDart();
    }
  });
  updateAim("x",50); updateAim("y",50);
  $("feedback").textContent = "Catch the moving bars, lock your aim, and throw!";
  requestAnimationFrame(animate);
})();