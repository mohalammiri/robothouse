/* album.js — الصور من 1 إلى 137، PNG للأرقام المحددة */

// الأرقام التي امتدادها .png (من فحص المجلد الفعلي)
const pngImages = new Set([10, 12, 14, 16, 18, 20]);
const albumUrls = [];
for (let i = 1; i <= 137; i++) {
  const ext = pngImages.has(i) ? 'png' : 'jpg';
  albumUrls.push(`assets/images/${i}.${ext}`);
}

const albumImagesList = [];
let currentImageIndex = 0;

function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    if (!lightbox || !lightboxImg) return;
    lightbox.style.display = 'none';
    lightboxImg.src = '';
    document.body.style.overflow = '';
}

function attachLightboxHandlers() {
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.getElementById('lightboxClose');
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        const lightboxEl = document.getElementById('lightbox');
        if (!lightboxEl || lightboxEl.style.display !== 'flex') return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight' && albumImagesList.length) {
            currentImageIndex = (currentImageIndex + 1) % albumImagesList.length;
            document.getElementById('lightboxImg').src = albumImagesList[currentImageIndex];
        }
        if (e.key === 'ArrowLeft' && albumImagesList.length) {
            currentImageIndex = (currentImageIndex - 1 + albumImagesList.length) % albumImagesList.length;
            document.getElementById('lightboxImg').src = albumImagesList[currentImageIndex];
        }
    });
}

function initAlbum() {
    const swiperWrapper = document.getElementById('albumSwiperWrapper');
    if (!swiperWrapper) return;

    swiperWrapper.innerHTML = '';
    albumImagesList.length = 0;

    // أنشئ كل الـ slides دفعة واحدة — الصور تُحمّل lazy
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < albumUrls.length; i++) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        const img = document.createElement('img');
        // أول 12 صورة تُحمّل فوراً، الباقي lazy
        if (i < 12) {
            img.src = albumUrls[i];
        } else {
            img.dataset.src = albumUrls[i];
            img.loading = 'lazy';
        }
        img.alt = `صورة ${i + 1}`;
        img.style.cssText = 'cursor:zoom-in;width:100%;height:220px;object-fit:cover;border-radius:10px;display:block;background:#111;';

        // fallback: جرب الامتداد الآخر عند الخطأ
        img.onerror = function() {
            if (!this.dataset.fallbackTried) {
                this.dataset.fallbackTried = '1';
                const s = this.src || this.dataset.src || '';
                this.src = s.endsWith('.png') ? s.replace('.png','.jpg') : s.replace('.jpg','.png');
            } else {
                this.style.display = 'none'; // أخفِ الصورة المعطوبة
            }
        };

        const idx = i;
        img.addEventListener('click', () => {
            // تأكد من تحميل الصورة قبل فتح lightbox
            const realSrc = img.src || albumUrls[idx];
            currentImageIndex = idx;
            openLightbox(realSrc);
        });

        slide.appendChild(img);
        fragment.appendChild(slide);
        albumImagesList.push(albumUrls[i]);
    }

    swiperWrapper.appendChild(fragment);

    // Init Swiper
    if (typeof Swiper !== 'undefined') {
        try {
            const sw = new Swiper('.mySwiper', {
                loop: false,
                slidesPerView: 2,
                spaceBetween: 10,
                lazy: { loadPrevNext: true, loadPrevNextAmount: 3 },
                breakpoints: {
                    480:  { slidesPerView: 2, spaceBetween: 12 },
                    768:  { slidesPerView: 3, spaceBetween: 16 },
                    1024: { slidesPerView: 4, spaceBetween: 20 },
                    1400: { slidesPerView: 5, spaceBetween: 20 }
                },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                autoplay: { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true },
                on: {
                    // حمّل الصور الـ lazy عند الانتقال
                    slideChange: function() {
                        const slides = swiperWrapper.querySelectorAll('[data-src]');
                        const visible = this.activeIndex;
                        for (let j = Math.max(0, visible-2); j < Math.min(slides.length, visible+8); j++) {
                            const el = slides[j];
                            if (el && el.dataset.src) {
                                el.src = el.dataset.src;
                                delete el.dataset.src;
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.warn('Swiper init failed:', e);
        }
    }

    attachLightboxHandlers();
}

// Wait for both DOM and Swiper to be ready
function waitForSwiperAndInit() {
    if (typeof Swiper !== 'undefined') {
        initAlbum();
    } else {
        // Poll every 100ms until Swiper loads (max 5s)
        let attempts = 0;
        const poll = setInterval(() => {
            attempts++;
            if (typeof Swiper !== 'undefined') {
                clearInterval(poll);
                initAlbum();
            } else if (attempts > 50) {
                clearInterval(poll);
                console.warn('Swiper not loaded after 5s');
            }
        }, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForSwiperAndInit);
} else {
    waitForSwiperAndInit();
}