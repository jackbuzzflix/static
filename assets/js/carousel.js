/** Mouse dragging enhances native touch scrolling and keyboard access. */
export function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach((root, index) => {
    const track = root.querySelector('.carousel-track');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let gesture = null;
    let suppressClick = false;

    // Buttons and keyboard navigation share the actual spacing between cards.
    const move = direction => {
      const cards = track.querySelectorAll('.card');
      if (!cards.length) return;
      const first = cards[0].getBoundingClientRect();
      const step = cards.length > 1
        ? cards[1].getBoundingClientRect().left - first.left
        : first.width;
      track.scrollBy({ left:direction * step,
        behavior:reduced.matches ? 'instant' : 'smooth' });
    };
    track.id ||= `carousel-track-${index + 1}`;
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    const buttons = [-1, 1].map(direction => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', direction < 0 ? 'Previous items' : 'Next items');
      button.setAttribute('aria-controls', track.id);
      button.textContent = direction < 0 ? '‹' : '›';
      button.addEventListener('click', () => move(direction));
      controls.append(button);
      return button;
    });
    root.append(controls);
    const updateButtons = () => {
      buttons[0].disabled = track.scrollLeft <= 1;
      buttons[1].disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    };
    track.addEventListener('scroll', updateButtons, { passive:true });
    new ResizeObserver(updateButtons).observe(track);
    updateButtons();

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
      move(event.key === 'ArrowLeft' ? -1 : 1);
    });
  });
}
