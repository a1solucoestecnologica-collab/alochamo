(function () {
  const icon = {
    left:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>',
    right:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>',
  };

  function makeArrow(direction, track, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-scroll-arrow category-scroll-arrow-${direction}`;
    button.setAttribute("aria-label", direction === "left" ? `Rolar ${label} para a esquerda` : `Rolar ${label} para a direita`);
    button.innerHTML = icon[direction];
    button.addEventListener("click", () => {
      const distance = Math.max(track.clientWidth * 0.65, 260);
      track.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
    });
    return button;
  }

  function updateArrows(track, leftArrow, rightArrow) {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    leftArrow.disabled = track.scrollLeft <= 2;
    rightArrow.disabled = track.scrollLeft >= maxScroll - 2;
  }

  function attachScrollControls(track, host, label) {
    if (!track || !host || track.dataset.scrollControlsReady === "true") return;

    track.dataset.scrollControlsReady = "true";
    track.classList.add("category-scroll-track");

    const leftArrow = makeArrow("left", track, label);
    const rightArrow = makeArrow("right", track, label);
    host.append(leftArrow, rightArrow);

    const sync = () => updateArrows(track, leftArrow, rightArrow);
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    requestAnimationFrame(sync);
  }

  function setupCategoryScrolls() {
    const tracks = Array.from(document.querySelectorAll(".container-app.py-4.overflow-x-auto")).filter((track) => {
      return track.closest(".border-b.border-border.bg-surface") && track.querySelector(".flex.gap-4.min-w-max");
    });

    tracks.forEach((track) => {
      const band = track.closest(".border-b.border-border.bg-surface");
      if (!band || band.dataset.categoryScrollReady === "true") return;

      band.dataset.categoryScrollReady = "true";
      band.classList.add("category-scroll-band");
      attachScrollControls(track, band, "categorias");
    });
  }

  function isRecipeTrack(track) {
    const className = String(track.className || "");
    return (
      className.includes("grid-flow-col") &&
      className.includes("overflow-x-auto") &&
      className.includes("auto-cols-") &&
      !!track.querySelector('[style*="background:"]')
    );
  }

  function setupRecipeScrolls() {
    const tracks = Array.from(document.querySelectorAll(".overflow-x-auto")).filter(isRecipeTrack);

    tracks.forEach((track) => {
      if (track.dataset.recipeScrollReady === "true") return;

      track.dataset.recipeScrollReady = "true";
      const wrapper = document.createElement("div");
      wrapper.className = "recipe-scroll-wrap";
      track.parentNode.insertBefore(wrapper, track);
      wrapper.appendChild(track);

      attachScrollControls(track, wrapper, "receitas");
    });
  }

  function setupScrollControls() {
    setupCategoryScrolls();
    setupRecipeScrolls();
  }

  setupScrollControls();
  new MutationObserver(setupScrollControls).observe(document.documentElement, { childList: true, subtree: true });
})();
