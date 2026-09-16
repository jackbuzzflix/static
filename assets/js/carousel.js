/** Mouse dragging enhances native touch scrolling and keyboard access. */
export function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(root => {
    const track = root.querySelector('.carousel-track');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let gesture = null;
    let suppressClick = false;

    track.addEventListener('dragstart', event => event.preventDefault());
    track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      suppressClick = false;
      gesture = { id: event.pointerId, x: event.clientX, left: track.scrollLeft, moved: false };
    });
    track.addEventListener('pointermove', event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const delta = event.clientX - gesture.x;
      if (!gesture.moved && Math.abs(delta) < 5) return;
      if (!gesture.moved) {
        gesture.moved = true;
        track.setPointerCapture(event.pointerId);
        track.classList.add('is-dragging');
      }
      event.preventDefault();
      track.scrollLeft = gesture.left - delta;
    });
    const finish = event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      suppressClick = gesture.moved;
      const id = gesture.id;
      gesture = null;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(id)) track.releasePointerCapture(id);
    };
    track.addEventListener('pointerup', finish);
    track.addEventListener('pointercancel', finish);
    track.addEventListener('lostpointercapture', finish);
    track.addEventListener('pointerleave', () => {
      if (gesture && !gesture.moved) gesture = null;
    });
    track.addEventListener('click', event => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);
    track.addEventListener('keydown', event => {
      suppressClick = false;
      if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const card = track.querySelector('.card');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      track.scrollBy({ left: event.key === 'ArrowLeft' ? -step : step,
        behavior: reduced.matches ? 'instant' : 'smooth' });
    });
  });
}
