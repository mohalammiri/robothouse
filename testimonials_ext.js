/*
  testimonials_ext.js
  - Adds two extra testimonial slides (bilingual) to the existing Swiper markup if not present.
  - Keeps the pulse/widget labels bilingual and updates them immediately on language toggle.
  - Ensures testimonial widget area remains visible (doesn't disappear) and updates when language changes.
*/

(function () {
  // Add two extra slides if they're not already present
  function ensureExtraSlides() {
    try {
      const wrapper = document.getElementById('albumSwiperWrapper'); // may be used elsewhere; using safe query below for testimonials
      const testimonialWrapper = document.querySelector('.testimonial-swiper .swiper-wrapper');
      if (!testimonialWrapper) return;

      // Count existing testimonial slides
      const existing = testimonialWrapper.querySelectorAll('.swiper-slide').length;
      // If less than 9 slides, append two more testimonial slides (keeps structure consistent)
      if (existing >= 9) return;

      const extras = [
        {
          ar: {
            text: 'الخدمات الذكية في المجمع تعطي شعوراً حقيقيًا بالراحة وتقليل العبء اليومي. انصح الجميع بالتجربة.',
            author: 'سلمى النجار'
          },
          en: {
            text: 'The smart services in the complex provide a real sense of comfort and reduce daily burdens. I recommend everyone to try it.',
            author: 'Salma Al Najjar'
          }
        },
        {
          ar: {
            text: 'التصميم والبيئة المستدامة يجعلان الاستثمار هنا قراراً ذكياً.',
            author: 'مروان الخطيب'
          },
          en: {
            text: 'The design and sustainable environment make investing here a smart decision.',
            author: 'Marwan Al Khatib'
          }
        }
      ];

      extras.forEach((item) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
          <div class="testimonial-card">
            <i class="fas fa-quote-right"></i>
            <p>${item.ar.text}</p>
            <div class="meta">
              <div class="stars">★★★★★</div>
              <button class="heart-btn" aria-label="like"><i class="fas fa-heart"></i></button>
            </div>
            <h4>${item.ar.author}</h4>
          </div>
        `;
        testimonialWrapper.appendChild(slide);
      });

      // If Swiper instance already exists, try to update/re-init safely
      try {
        if (window.Swiper && document.querySelector('.testimonial-swiper').swiper) {
          const sw = document.querySelector('.testimonial-swiper').swiper;
          sw.update();
        } else {
          // try to init if not initialized (defensive)
          new Swiper('.testimonial-swiper', {
            slidesPerView: 1,
            spaceBetween: 24,
            loop: true,
            autoplay: { delay: 4500, disableOnInteraction: false },
            navigation: { nextEl: '.testimonial-next', prevEl: '.testimonial-prev' },
            pagination: { el: '.testimonial-swiper .swiper-pagination', clickable: true },
            breakpoints: { 900: { slidesPerView: 1.2 }, 1200: { slidesPerView: 1.4 } }
          });
        }
      } catch (e) {
        // ignore; Swiper will pick up slides on next init
      }
    } catch (e) {
      console.warn('ensureExtraSlides failed', e);
    }
  }

  // Update testimonial slides and widgets when language toggles
  function updateTestimonialTexts(lang) {
    try {
      // Map of the first 9 testimonial texts (fallback if page had different content)
      const mapping = [
        {
          ar: { text: 'ROBOT HOUSE هو حقاً مستقبل العيش. التكنولوجيا مذهلة والراحة لا تضاهى. أنا سعيد جداً بكوني جزءاً من هذا المشروع الرائد.', author: 'أحمد العمري' },
          en: { text: 'ROBOT HOUSE is truly the future of living. The technology is amazing and the comfort is unmatched. I am very happy to be part of this pioneering project.', author: 'Ahmed Al Omari' }
        },
        {
          ar: { text: 'تجربة فريدة من نوعها! كل شيء ذكي ومريح. أحب بشكل خاص نظام الطاقة المجانية والمرافق المتكاملة.', author: 'فاطمة الزهراني' },
          en: { text: 'A unique experience! Everything is smart and comfortable. I especially love the free energy system and integrated facilities.', author: 'Fatima Al-Zahrani' }
        },
        {
          ar: { text: 'المنازل فائقة الجودة والابتكار في كل زاوية. الدعم ممتاز والفريق متعاون جداً. أوصي به بشدة.', author: 'خالد سعيد' },
          en: { text: 'Homes of exceptional quality and innovation at every corner. Support is excellent and the team is very helpful. Highly recommended.', author: 'Khalid Saeed' }
        },
        {
          ar: { text: 'لم أتخيل أبداً أن يكون العيش بهذا الرفاهية والذكاء. الأمان ممتاز والبيئة مثالية للعائلات.', author: 'ليلى محمود' },
          en: { text: 'I never imagined living with such luxury and intelligence. Security is excellent and the environment is perfect for families.', author: 'Laila Mahmoud' }
        },
        {
          ar: { text: 'مشروع طموح ومستقبل واعد. أرى أن ROBOT HOUSE سيغير مفهوم الحياة العصرية في المنطقة والعالم.', author: 'يوسف العلي' },
          en: { text: 'An ambitious project with a promising future. I believe ROBOT HOUSE will redefine modern living in the region and the world.', author: 'Youssef Al Ali' }
        },
        {
          ar: { text: 'الخدمات الذكية في المجمع تعطي شعوراً حقيقيًا بالراحة وتقليل العبء اليومي. انصح الجميع بالتجربة.', author: 'سلمى النجار' },
          en: { text: 'The smart services in the complex provide a real sense of comfort and reduce daily burdens. I recommend everyone to try it.', author: 'Salma Al Najjar' }
        },
        {
          ar: { text: 'التصميم والبيئة المستدامة يجعلان الاستثمار هنا قراراً ذكياً.', author: 'مروان الخطيب' },
          en: { text: 'The design and sustainable environment make investing here a smart decision.', author: 'Marwan Al Khatib' }
        },
        // Ensure there are at least 9 entries; extra slides added above reuse these last two entries
      ];

      // Update visible slides (up to mapping length)
      const slides = Array.from(document.querySelectorAll('.testimonial-swiper .swiper-slide .testimonial-card'));
      slides.forEach((card, idx) => {
        const entry = mapping[idx] || mapping[mapping.length - 1];
        const txt = entry ? entry[lang].text : card.querySelector('p')?.textContent;
        const author = entry ? entry[lang].author : card.querySelector('h4')?.textContent;
        if (txt) {
          const p = card.querySelector('p');
          if (p) p.textContent = txt;
          else {
            const newP = document.createElement('p');
            newP.textContent = txt;
            const meta = card.querySelector('.meta');
            if (meta) card.insertBefore(newP, meta);
          }
        }
        if (author) {
          const h4 = card.querySelector('h4');
          if (h4) h4.textContent = author;
          else {
            const newH = document.createElement('h4');
            newH.textContent = author;
            card.appendChild(newH);
          }
        }
      });

      // Update the pulse widgets below testimonials to be bilingual
      const pulseWidgets = document.querySelectorAll('.testimonial-widgets .pulse-widget');
      const labels = (lang === 'en') ? ['Top Rated', 'Beloved', 'Fast Response'] : ['Top Rated', 'محبوب', 'سريع الاستجابة'];
      pulseWidgets.forEach((pw, i) => {
        const span = pw.querySelector('span');
        if (span) span.textContent = labels[i] || labels[labels.length - 1];
      });

      // Ensure widgets remain visible
      const widgetsWrap = document.querySelector('.testimonial-widgets');
      if (widgetsWrap) widgetsWrap.style.display = widgetsWrap.style.display === 'none' ? '' : widgetsWrap.style.display;
    } catch (e) {
      console.warn('updateTestimonialTexts failed', e);
    }
  }

  // Hook into site language toggle button to update texts when language changes
  function bindLangToggle() {
    try {
      const langBtn = document.getElementById('site-lang-toggle');
      if (!langBtn) return;
      // On click, the main toggler in siteLanguageInit will have already changed localStorage; do update afterwards
      langBtn.addEventListener('click', () => {
        setTimeout(() => {
          const lang = (localStorage.getItem('site-lang') || document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar')) || 'ar';
          updateTestimonialTexts(lang === 'en' ? 'en' : 'ar');
        }, 220);
      });

      // Also respond to programmatic toggles (siteLanguageInit sets localStorage)
      window.addEventListener('storage', (ev) => {
        if (ev.key === 'site-lang') {
          const lang = ev.newValue || 'ar';
          updateTestimonialTexts(lang === 'en' ? 'en' : 'ar');
        }
      });
    } catch (e) {
      console.warn('bindLangToggle failed', e);
    }
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    ensureExtraSlides();
    // initial update based on current language
    const current = localStorage.getItem('site-lang') || (document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar')) || 'ar';
    updateTestimonialTexts(current === 'en' ? 'en' : 'ar');
    bindLangToggle();
  });

})();