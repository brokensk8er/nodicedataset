// shelf-reorder.js
// Shared long-press drag-to-reorder for shelf containers.
// Include via <script src="shelf-reorder.js"></script>
//
// Usage: add data-shelf-reorder="<localStorage-key>" to each container.
// Optional: data-shelf-wait-visible — defer listener init until the
//           element's 'hidden' class is removed (for auth-gated panels).

(function () {
  var HOLD_MS       = 400;
  var MOVE_CANCEL_H = 35;   // px horizontal — cancel on clear sideways-swipe
  var MOVE_CANCEL_V = 55;   // px vertical   — more permissive; natural thumb drift

  function setup(container) {
    var lsKey = container.getAttribute('data-shelf-reorder');
    var waitForVisible = container.hasAttribute('data-shelf-wait-visible');

    // ── Restore saved order on page load ──────────────────────────
    function restoreShelfOrder() {
      var saved;
      try { saved = JSON.parse(localStorage.getItem(lsKey)); } catch (e) {}
      if (!Array.isArray(saved) || !saved.length) return;
      // Snapshot non-shelf children before moving shelves so they
      // aren't displaced to the top of the container.
      var nonShelves = Array.from(container.children).filter(function (c) {
        return !c.classList.contains('shelf');
      });
      saved.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode === container) container.appendChild(el);
      });
      nonShelves.forEach(function (el) { container.appendChild(el); });
    }

    // ── Persist current DOM order ─────────────────────────────────
    function saveShelfOrder() {
      var ids = Array.from(container.querySelectorAll(':scope > .shelf'))
        .map(function (s) { return s.id; });
      localStorage.setItem(lsKey, JSON.stringify(ids));
    }

    // ── Wire long-press listeners on every shelf header ───────────
    function initReorder() {
      container.querySelectorAll('.shelf-header').forEach(function (header) {
        header.addEventListener('pointerdown', function (e) {
          if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
          var shelf = header.closest('.shelf');
          if (!shelf) return;

          var sx = e.clientX, sy = e.clientY;
          var holdStart = Date.now();
          var timer = null;

          function cleanup() {
            clearTimeout(timer);
            document.removeEventListener('pointermove',   onEarlyMove);
            document.removeEventListener('pointerup',     cleanup);
            document.removeEventListener('pointercancel', cleanup);
          }

          function onEarlyMove(ev) {
            // 50ms grace: skip the synthetic pointermove browsers fire
            // right after pointerdown (browser artifact, not real movement)
            if (Date.now() - holdStart < 50) return;
            var dx = ev.clientX - sx, dy = ev.clientY - sy;
            if (Math.abs(dx) > MOVE_CANCEL_H || Math.abs(dy) > MOVE_CANCEL_V) cleanup();
          }

          document.addEventListener('pointermove',   onEarlyMove);
          document.addEventListener('pointerup',     cleanup);
          document.addEventListener('pointercancel', cleanup);

          timer = setTimeout(function () {
            cleanup();
            startDrag(container, shelf, header, e.pointerId, sx, sy, saveShelfOrder);
          }, HOLD_MS);
        });
      });
    }

    // ── Init timing ───────────────────────────────────────────────
    restoreShelfOrder();

    if (waitForVisible && container.classList.contains('hidden')) {
      // MutationObserver fires when auth removes the 'hidden' class
      var obs = new MutationObserver(function () {
        if (!container.classList.contains('hidden')) {
          obs.disconnect();
          initReorder();
        }
      });
      obs.observe(container, { attributes: true, attributeFilter: ['class'] });
    } else {
      initReorder();
    }
  }

  // ── Handle the actual drag after long-press activates ────────
  function startDrag(container, shelf, header, pointerId, sx, sy, saveShelfOrder) {
    if (navigator.vibrate) navigator.vibrate(30);

    var rect        = shelf.getBoundingClientRect();
    var grabOffsetY = sy - rect.top;

    // Placeholder holds the empty slot while shelf is floating
    var ph = document.createElement('div');
    ph.className = 'shelf drag-placeholder';
    ph.style.height = rect.height + 'px';
    container.insertBefore(ph, shelf);

    // Lift shelf out of flow
    shelf.style.position = 'fixed';
    shelf.style.top      = rect.top  + 'px';
    shelf.style.left     = rect.left + 'px';
    shelf.style.width    = rect.width + 'px';
    shelf.style.zIndex   = '1000';
    shelf.style.margin   = '0';
    shelf.classList.add('dragging');
    header.classList.add('reorder-active');
    header.setPointerCapture(pointerId);

    function onMove(e) {
      e.preventDefault();
      shelf.style.top = (e.clientY - grabOffsetY) + 'px';

      var midY     = e.clientY;
      var siblings = Array.from(container.querySelectorAll(':scope > .shelf:not(.dragging)'));
      var insertRef = null;

      for (var i = 0; i < siblings.length; i++) {
        var r = siblings[i].getBoundingClientRect();
        if (midY < r.top + r.height / 2) { insertRef = siblings[i]; break; }
      }

      if (insertRef) {
        if (ph.nextSibling !== insertRef) container.insertBefore(ph, insertRef);
      } else {
        if (container.lastChild !== ph) container.appendChild(ph);
      }
    }

    function onUp() {
      shelf.style.position = '';
      shelf.style.top      = '';
      shelf.style.left     = '';
      shelf.style.width    = '';
      shelf.style.zIndex   = '';
      shelf.style.margin   = '';
      shelf.classList.remove('dragging');
      header.classList.remove('reorder-active');
      container.insertBefore(shelf, ph);
      ph.parentNode.removeChild(ph);

      saveShelfOrder();

      header.removeEventListener('pointermove',   onMove);
      header.removeEventListener('pointerup',     onUp);
      header.removeEventListener('pointercancel', onUp);

      // Suppress the click that fires immediately after pointerup so
      // the shelf doesn't accidentally toggle open/closed after a drag.
      header.addEventListener('click', function eatClick(ev) {
        ev.stopImmediatePropagation();
        header.removeEventListener('click', eatClick, true);
      }, { capture: true, once: true });
    }

    header.addEventListener('pointermove',   onMove);
    header.addEventListener('pointerup',     onUp);
    header.addEventListener('pointercancel', onUp);
  }

  // ── Auto-discover and init all reorder containers ───────────
  function init() {
    document.querySelectorAll('[data-shelf-reorder]').forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
