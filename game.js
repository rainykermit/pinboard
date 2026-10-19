(() => {
  const $ = (id) => document.getElementById(id);
  const state = { x: 50, y: 50, darts: 5, score: 0, best: null, round: 1, sound: false, busy: false };
  const quips = [
    "Aim for greatness. Accidentally hit the printer.",
    "HR says this counts as team building.",
    "Precision is temporary. Confidence is forever.",
    "That dart has a better career plan than you.",
    "Somewhere, a spreadsheet just got nervous.",
    "A bold strategy. The board is filing a complaint.",
    "Olympic committee, please do not contact us."
  ];
  const $score = $("score"), $left = $("dartsLeft"), $best = $("best");
  const xTrack = $("xTrack"), yTrack = $("yTrack");

  function updateAim(axis, value, locked = false) {
    value = Math.max(0, Math.min(100, value));
    state[axis] = value;
    const prefix = axis === "x" ? "x" : "y";
    $(prefix + "Value").textContent = Math.round(value) + "%";
    $(prefix + "Cursor").style.left = value + "%";
    $(prefix + "Fill").style.width = value + "%";
    const track = axis === "x" ? xTrack : yTrack;
    track.classList.toggle("locked", locked);
    if (locked) track.dataset.locked = "true";
  }
  function setAimFromPointer(axis, event) {
    if (state.busy || state.darts <= 0) return;
    const track = axis === "x" ? xTrack : yTrack;
    const rect = track.getBoundingClientRect();
    const value = (event.clientX - rect.left) / rect.width * 100;
    updateAim(axis, value, true);
    const other = axis === "x" ? "y" : "x";
    const otherTrack = other === "x" ? xTrack : yTrack;
    if (!otherTrack.classList.contains("locked")) {
      // The bar the player hasn't selected keeps a gentle default position.
    }
    $("feedbackIcon").textContent = "✦";
    $("feedback").textContent = (axis === "x" ? "Horizontal" : "Vertical") + " aim locked. Set the other axis, or throw!";
    $("aimMarker").classList.remove("hidden");
    placeMarker();
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
  function throwDart() {
    if (state.busy || state.darts <= 0) return;
    state.busy = true;
    xTrack.classList.add("locked"); yTrack.classList.add("locked");
    const result = scoreFor(state.x, state.y);
    const dart = $("dart");
    dart.classList.remove("hidden");
    dart.style.left = state.x + "%";
    dart.style.top = state.y + "%";
    $("aimMarker").classList.add("hidden");
    state.score += result.points;
    state.darts--;
    state.best = state.best === null ? result.points : Math.max(state.best, result.points);
    $score.textContent = state.score;
    $left.textContent = state.darts;
    $best.textContent = state.best;
    $("feedbackIcon").textContent = result.icon;
    $("feedback").textContent = result.text + " +" + result.points + " points.";
    $("roundNum").textContent = String(6 - state.darts).padStart(2, "0");
    $("quip").textContent = quips[Math.floor(Math.random() * quips.length)];
    playTone(result.points === 100 ? 760 : result.points === 60 ? 570 : 300, .12);
    $("throwBtn").disabled = true;
    $("throwBtn").style.opacity = ".5";
    window.setTimeout(() => {
      state.busy = false;
      $("throwBtn").disabled = state.darts <= 0;
      $("throwBtn").style.opacity = state.darts <= 0 ? ".45" : "1";
      xTrack.classList.remove("locked"); yTrack.classList.remove("locked");
      xTrack.removeAttribute("data-locked"); yTrack.removeAttribute("data-locked");
      if (state.darts <= 0) finishGame();
    }, 550);
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
    $score.textContent = "0"; $left.textContent = "5"; $best.textContent = "—"; $("roundNum").textContent = "01";
    $("dart").classList.add("hidden"); $("aimMarker").classList.add("hidden"); $("endPanel").classList.add("hidden");
    $("feedbackIcon").textContent = "✦"; $("feedback").textContent = "Ready to make a questionable decision?";
    $("throwBtn").disabled = false; $("throwBtn").style.opacity = "1";
    [xTrack,yTrack].forEach(t => {t.classList.remove("locked");t.removeAttribute("data-locked");});
    updateAim("x",50); updateAim("y",50);
  }
  xTrack.addEventListener("click", e => setAimFromPointer("x", e));
  yTrack.addEventListener("click", e => setAimFromPointer("y", e));
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
})();