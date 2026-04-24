/* video_toggle.js
   Toggle the "Advanced Smart Apartment" video between square (ربعـي) and expanded (normal)
   - Click the video to expand to normal size; click again to revert to square.
   - Adds a small badge for accessibility and ESC key closes.
*/
(function () {
  function qs(sel) { return document.querySelector(sel); }
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(() => {
    const container = qs('.hologram-card');
    if (!container) return;

    // find the smart apartment video inside the hologram-card
    const vid = container.querySelector('.about-video');
    if (!vid) return;

    // add a small badge/button for toggle (for accessibility)
    let badge = container.querySelector('.ap-toggle-badge');
    if (!badge) {
      badge = document.createElement('button');
      badge.className = 'ap-toggle-badge';
      badge.type = 'button';
      badge.setAttribute('aria-pressed', 'false');
      badge.title = 'تكبير / تصغير الفيديو';
      badge.innerHTML = `<i class="fas fa-expand"></i><span style="font-size:0.86rem;direction:ltr;">View</span>`;
      container.style.position = container.style.position || 'relative';
      container.appendChild(badge);
    }

    // helper to expand
    function expand() {
      vid.classList.add('expanded');
      document.body.classList.add('ap-video-open');
      badge.setAttribute('aria-pressed', 'true');
      badge.innerHTML = `<i class="fas fa-compress"></i><span style="font-size:0.86rem;direction:ltr;">Close</span>`;
      // scroll video into view for mobile
      setTimeout(() => vid.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
    function collapse() {
      vid.classList.remove('expanded');
      document.body.classList.remove('ap-video-open');
      badge.setAttribute('aria-pressed', 'false');
      badge.innerHTML = `<i class="fas fa-expand"></i><span style="font-size:0.86rem;direction:ltr;">View</span>`;
    }
    function toggle() { (vid.classList.contains('expanded') ? collapse : expand)(); }

    // click handlers on video and badge
    vid.addEventListener('click', (e) => {
      // ignore clicks on native controls (if controls attribute visible)
      if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button'))) return;
      toggle();
    });
    badge.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });

    // ESC key closes expanded view
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && vid.classList.contains('expanded')) collapse();
    });

    // when expanded, prevent page from scrolling behind it on mobile by locking overscroll
    const observer = new MutationObserver(() => {
      if (vid.classList.contains('expanded')) {
        document.documentElement.style.overscrollBehavior = 'none';
      } else {
        document.documentElement.style.overscrollBehavior = '';
      }
    });
    observer.observe(vid, { attributes: true, attributeFilter: ['class'] });

    // ensure initial state is square (in case CSS loads later)
    collapse();
  });
})();