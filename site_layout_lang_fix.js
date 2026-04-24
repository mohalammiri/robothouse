/*
  site_layout_lang_fix.js
  Preserves all content, improves bilingual handling (AR/EN),
  keeps language button in the same place as a widget,
  and forces video/text side-by-side layout in Products and Main Products.
*/
(function () {
  const PRODUCT_DATA = {
    ar: [
      {
        title: 'المجمع السكني الذكي',
        sub: '4 أبراج • 480 شقة فاخرة • 400م² • كهرباء مجانية • إنترنت 5 سنوات',
        desc: 'الوصف: 4 أبراج • 480 شقة فاخرة • 400م² • كهرباء مجانية • إنترنت 5 سنوات • تعليم ذكي للأطفال. 8 غرف نوم، 3 حمامات ذكية، جاكوزي، مطبخ ذكي.',
        features: ['480 شقة فاخرة بمساحات مرنة', 'شبكة طاقة شمسية مركزية', 'خدمات اشتراك للإنترنت والصيانة'],
        button: 'اطلب عرض سعر'
      },
      {
        title: 'المركبات المبتكرة',
        sub: 'سيارة روبوت برمائية • طائرة كهربائية شفافة • قطار ذكي',
        desc: 'الوصف: سيارة روبوت برمائية (50,000$) • طائرة شفافة كهربائية • قطار ليزر ذكي. عجلات كروية، حمولة >3000 كجم.',
        features: ['سيارة روبوت برمائية — سعر مرجعي: 50,000$', 'طائرة كهربائية شفافة قابلة للغوص الجوي', 'حلول نقل ذكي للمجمع'],
        button: 'تشغيل الفيديو'
      },
      {
        title: 'المنزل الذكي المتنقل',
        sub: 'مضاد للرصاص • مقاوم للماء والحريق • جدران قابلة لتغيير اللون',
        desc: 'الوصف: مضاد للرصاص، مقاوم للماء والحريق • مكونات ذكية داخل الجدران • مساحات متعددة قابلة للتعديل • جدران قابلة لتغيير اللون.',
        features: ['هندسة مرنة للمساحات الداخلية', 'مقاومة عالية ومواد متقدمة', 'تكامل كامل مع نظام AI للمستخدم'],
        button: 'اطلب عرض سعر'
      },
      {
        title: 'المدرسة الذكية',
        sub: '42,000م² • 10 طوابق • تعليم بالذكاء الاصطناعي',
        desc: 'الوصف: 42,000م² • 10 طوابق • تعليم بالذكاء الاصطناعي من الحضانة للجامعة.',
        features: ['برامج تعليمية مخصصة بالـ AI', 'مرافق بحث وتطوير متقدمة', 'بيئة تعليمية متصلة للمجتمع'],
        button: 'اطلب تفاصيل'
      },
      {
        title: 'المول التجاري الذكي',
        sub: 'محلات ذكية • طاقة مجانية • تجربة تسوق مبتكرة',
        desc: 'الوصف: محلات بأنظمة AI، طاقة مجانية، تجربة تسوق مبتكرة.',
        features: ['واجهات بيع ذكية وتحليلات سلوك العملاء', 'تكامل لوجستي داخلي للموردين', 'مساحات تجارية قابلة للتكيف'],
        button: 'تفاصيل إيجارية'
      },
      {
        title: 'الجسر المعلق',
        sub: 'الطابق 15 • 1,200م² • ربط الأبراج مع مرافق',
        desc: 'الوصف: الطابق 15، يربط الأبراج الأربعة، 1,200م²، سوبرماركت، مقهى، جلسات خارجية.',
        features: ['مساحات تجارية وخدمية مدمجة', 'تصميم يربط ويعزز التنقل بين الأبراج', 'مساحات عرض ومناظر خارجية'],
        button: 'اطلب مخطط'
      },
      {
        title: 'شاحنة الشاورما الذكية الفاخرة — ROBO SHAWARMA TRUCK',
        sub: 'شاحنة ضيافة كهربائية ذكية • طول 24 قدم • قدرة تشغيل 420 وجبة/يوم',
        desc: 'الوصف: أول شاحنة ضيافة كهربائية ذكية بطول 24 قدم، مزودة ببطارية 300kW، ألواح شمسية وتقنية V2G لتشغيل مستقر حتى 420 وجبة يوميًا، بمستوى فخامة مطعم متنقل.',
        features: ['4 مشاوي شاورما (لحم • دجاج • سجق • ديك رومي)', 'نظام تبريد ذكي بسعة 800 كجم', 'شاشة OLED 85 بوصة لعروض القائمة والإعلانات', 'نظام طلب بالذكاء الاصطناعي وتقطيع روبوتي', 'خدمة توصيل بالدرون ومخطط داخلي تفاعلي AR'],
        button: 'اطلب عرض الشاحنة'
      },
      {
        title: 'المزرعة الذكية وسلسلة التوريد — SMART FARM & SUPPLY CHAIN',
        sub: 'منظومة إنتاج غذائي آلية • مزرعة دواجن 50,000 دجاجة/شهر • تعبئة وتوزيع ذكي',
        desc: 'الوصف: نظام متكامل للإنتاج والتغذية والمراقبة الذكية لتخفيض التكلفة التشغيلية وتحسين الجودة مع إعادة تدوير المخلفات وتحويلها إلى وقود حيوي.',
        features: ['مزرعة دواجن آلية بطاقة 50,000 دجاجة شهريًا', 'تغذية آلية وتحكم مناخي ومراقبة صحة بالـ AI', 'تقليل النفايات بنسبة 45٪ وإعادة تدوير وتحويل السماد لوقود', 'مصنع التتبيلة السرية وتعبئة ذكية وشراكات توريد عالمية'],
        button: 'اطلب شراكة توريد'
      },
      {
        title: 'النقل البحري والمطعم الذكي — SEAFOOD MOBILITY & SMART RESTAURANT',
        sub: 'حل لوجستي ومطعم فاخر للمأكولات البحرية • نقل مبرد • طهي مباشر',
        desc: 'الوصف: حلول متكاملة لنقل المأكولات البحرية الحية وتقديمها داخل مطاعم ذكية فاخرة مع تحكم حراري دقيق، أنظمة أكسجين وفلترة متقدمة، ومراقبة GPS+IoT على مدار الساعة.',
        features: ['شاحنات نقل مبردة ومراقبة GPS + IoT 24/7', 'سلالات: سلمون • روبيان • كافيار (ستورجون)', 'أنظمة أكسجين متقدمة وفلترة مياه وتحكم حراري ±0.5°', 'مطعم ذكي مع AI ordering، روبوتات مطبخ وجدران قوائم رقمية'],
        button: 'استفسر عن الخدمة'
      }
    ],
    en: [
      {
        title: 'Smart Residential Complex',
        sub: '4 towers • 480 luxury apartments • 400m² • Free electricity • 5 years internet',
        desc: 'Description: 4 towers • 480 luxury apartments • 400m² • Free electricity • 5 years internet • Smart education for children. 8 bedrooms, 3 smart bathrooms, jacuzzi, smart kitchen.',
        features: ['480 luxury apartments with flexible spaces', 'Central solar power network', 'Subscription services for internet and maintenance'],
        button: 'Request Quotation'
      },
      {
        title: 'Innovative Vehicles',
        sub: 'Amphibious robot car • Transparent electric aircraft • Smart train',
        desc: 'Description: Amphibious robot car ($50,000) • Transparent electric aircraft • Smart laser train. Spherical wheels, payload >3000 kg.',
        features: ['Amphibious robot car — reference price: $50,000', 'Transparent electric aircraft with advanced mobility concept', 'Smart mobility solutions for the complex'],
        button: 'Play Video'
      },
      {
        title: 'Mobile Smart Home',
        sub: 'Bulletproof • Water and fire resistant • Color-changing walls',
        desc: 'Description: Bulletproof, water and fire resistant • Smart components inside the walls • Flexible multi-use spaces • Color-changing walls.',
        features: ['Flexible interior engineering', 'High resistance and advanced materials', 'Full integration with the user AI system'],
        button: 'Request Quotation'
      },
      {
        title: 'Smart School',
        sub: '42,000m² • 10 floors • AI-powered education',
        desc: 'Description: 42,000m² • 10 floors • AI-powered education from kindergarten to university.',
        features: ['AI-personalized educational programs', 'Advanced research and development facilities', 'A connected learning environment for the community'],
        button: 'Request Details'
      },
      {
        title: 'Smart Commercial Mall',
        sub: 'Smart shops • Free energy • Innovative shopping experience',
        desc: 'Description: AI-powered shops, free energy, and an innovative shopping experience.',
        features: ['Smart retail interfaces and customer behavior analytics', 'Integrated internal logistics for suppliers', 'Adaptable commercial spaces'],
        button: 'Leasing Details'
      },
      {
        title: 'Suspended Bridge',
        sub: 'Level 15 • 1,200m² • Connecting towers with facilities',
        desc: 'Description: Level 15, connecting the four towers, 1,200m², supermarket, café, and outdoor seating.',
        features: ['Integrated commercial and service spaces', 'Design that enhances movement between towers', 'Display spaces and open exterior views'],
        button: 'Request Plan'
      },
      {
        title: 'Luxury Smart Shawarma Truck — ROBO SHAWARMA TRUCK',
        sub: 'Smart electric hospitality truck • 24 ft • 420 meals/day capacity',
        desc: 'Description: The first luxury 24-ft smart electric hospitality truck, equipped with a 300kW battery, solar panels, and V2G technology for stable operation up to 420 meals per day at premium restaurant quality.',
        features: ['4 shawarma grills (beef • chicken • sausage • turkey)', 'Smart cooling system with 800 kg capacity', '85-inch OLED screen for menus and advertising', 'AI ordering system and robotic slicing', 'Drone delivery service and interactive AR interior plan'],
        button: 'Request Truck Brochure'
      },
      {
        title: 'Smart Farm & Supply Chain',
        sub: 'Automated food production system • Poultry farm 50,000 chickens/month • Smart packing & distribution',
        desc: 'Description: An integrated production, feeding, and smart monitoring system that reduces operating cost, improves quality, and recycles waste into biofuel.',
        features: ['Automated poultry farm with 50,000 chickens monthly capacity', 'Automatic feeding, climate control, and AI health monitoring', '45% waste reduction with recycling and manure-to-fuel conversion', 'Secret seasoning factory, smart packaging, and global supply partnerships'],
        button: 'Request Supply Partnership'
      },
      {
        title: 'Seafood Mobility & Smart Restaurant',
        sub: 'Logistics and premium seafood restaurant solution • Cold transport • Live cooking',
        desc: 'Description: Integrated solutions for transporting live seafood and serving it in premium smart restaurants with precise thermal control, advanced oxygen and filtration systems, and 24/7 GPS + IoT monitoring.',
        features: ['Refrigerated transport trucks with 24/7 GPS + IoT monitoring', 'Species: salmon • shrimp • caviar (sturgeon)', 'Advanced oxygen systems, water filtration, and ±0.5° thermal control', 'Smart restaurant with AI ordering, kitchen robots, and digital menu walls'],
        button: 'Inquire About Service'
      }
    ]
  };

  const MARKET_DATA = {
    ar: {
      title: 'المنتجات الرئيسية',
      cards: [
        {
          title: 'المنزل الذكي المتنقل',
          features: ['مضاد للرصاص، مقاوم للماء والحريق', 'مكونات ذكية داخل الجدران', 'جدران قابلة لتغيير اللون', 'تحكم كامل بالهاتف والذكاء الاصطناعي']
        },
        {
          title: 'سيارة الروبوت البرمائية',
          features: ['بدون وقود - محرك هيدروليكي', 'عجلات كروية ذكية', 'قيادة ذاتية، قابلة للغمر', 'حمولة > 3000 كجم']
        },
        {
          title: 'طائرة كهربائية شفافة',
          features: ['هيكل خفيف الوزن وعالي المتانة', 'جناح متحرك لمدى طيران طويل', 'طيران آمن وبدون طيار', 'قادرة على الزلاق']
        },
        {
          title: 'القطار الذكي',
          features: ['عربات متصلة ذاتية القيادة بالليزر', 'نظام تعليق وعجلات مرن', 'تحكم ذكي بالمسار والإضاءة', 'سرعة عالية مع استهلاك منخفض للطاقة']
        }
      ]
    },
    en: {
      title: 'Main Products',
      cards: [
        {
          title: 'Mobile Smart Home',
          features: ['Bulletproof, water and fire resistant', 'Smart components inside the walls', 'Color-changing walls', 'Full phone and AI control']
        },
        {
          title: 'Amphibious Robot Car',
          features: ['No fuel - hydraulic engine', 'Smart spherical wheels', 'Autonomous driving, submersible', 'Payload > 3000 kg']
        },
        {
          title: 'Transparent Electric Aircraft',
          features: ['Lightweight, highly durable structure', 'Moving wing for long flight range', 'Safe unmanned flight', 'Capable of gliding']
        },
        {
          title: 'Smart Train',
          features: ['Laser-guided self-driving connected cars', 'Flexible suspension and wheel system', 'Smart track and lighting control', 'High speed with low energy consumption']
        }
      ]
    }
  };

  function currentLang() {
    return localStorage.getItem('site-lang') || document.documentElement.lang || 'ar';
  }

  function setDirection(lang) {
    const dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.setAttribute('dir', dir);
  }

  function styleLanguageButton(lang) {
    const btn = document.getElementById('site-lang-toggle');
    const label = document.getElementById('site-lang-label');
    if (!btn || !label) return;
    btn.setAttribute('title', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    label.textContent = lang === 'ar' ? 'EN' : 'ع';
  }

  function applyProducts(lang) {
    const data = PRODUCT_DATA[lang] || PRODUCT_DATA.ar;
    const cards = document.querySelectorAll('#products .product-window');
    cards.forEach((card, index) => {
      const item = data[index];
      if (!item) return;

      const title = card.querySelector('.pw-title');
      const sub = card.querySelector('.pw-sub');
      const desc = card.querySelector('.pw-content p');
      const features = card.querySelectorAll('.pw-features li');
      const actionBtn = card.querySelector('.pw-actions .btn-primary, .pw-actions .btn-outline');

      if (title) title.textContent = item.title;
      if (sub) sub.textContent = item.sub;
      if (desc) desc.textContent = item.desc;
      features.forEach((li, i) => {
        if (item.features[i] !== undefined) li.textContent = item.features[i];
      });
      if (actionBtn) actionBtn.textContent = item.button;
    });
  }

  function applyMarket(lang) {
    const data = MARKET_DATA[lang] || MARKET_DATA.ar;
    const blockTitle = document.querySelector('#market .info-card h3');
    if (blockTitle) blockTitle.textContent = data.title;

    const cards = document.querySelectorAll('#market .card-grid .card');
    cards.forEach((card, index) => {
      const item = data.cards[index];
      if (!item) return;
      const title = card.querySelector('h4');
      const lis = card.querySelectorAll('ul li');
      if (title) title.textContent = item.title;
      lis.forEach((li, i) => {
        if (item.features[i] !== undefined) li.textContent = item.features[i];
      });
    });
  }

  function applyStaticUi(lang) {
    const isEn = lang === 'en';

    const productsTitle = document.querySelector('#products .section-title');
    if (productsTitle) productsTitle.textContent = isEn ? 'Our Products' : 'منتجاتنا';

    const aboutTitle = document.querySelector('#about .section-title');
    if (aboutTitle) aboutTitle.textContent = isEn ? 'About Us' : 'من نحن';

    const marketTitle = document.querySelector('#market .section-title');
    if (marketTitle) marketTitle.textContent = isEn ? 'Market & Forecasts' : 'السوق والتوقعات';

    const watchBtn = document.getElementById('watchBtn');
    if (watchBtn) watchBtn.innerHTML = `<i class="fas fa-play-circle"></i> ${isEn ? 'Watch Presentation' : 'شاهد العرض'}`;

    const faqInput = document.getElementById('faqSearch');
    if (faqInput) faqInput.placeholder = isEn ? 'Search for your question here...' : 'ابحث عن سؤالك هنا...';

    const weather = document.getElementById('weather-text');
    if (weather && isEn && weather.textContent.trim() === 'غيوم متفرقة') weather.textContent = 'Partly Cloudy';
    if (weather && !isEn && weather.textContent.trim() === 'Partly Cloudy') weather.textContent = 'غيوم متفرقة';
  }

  function tuneVideos() {
    document.querySelectorAll('#products video, #market video').forEach((video) => {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('preload', 'metadata');
      if (!video.hasAttribute('controls')) video.setAttribute('controls', '');
    });
  }

  // Ensure the specific "Global Spice Import" product switches media side based on language:
  // - Arabic: video on the LEFT (default)
  // - English: video on the RIGHT (add .media-right)
  function toggleSpiceLayout(lang) {
    try {
      // find the product window by matching pw-title text (Arabic label present in DOM)
      const nodes = Array.from(document.querySelectorAll('.product-window .pw-title'));
      if (!nodes.length) return;
      const targetArabic = '🌍 استيراد التوابل العالمية — مصنع التتبيلة السرية';
      // find the product-window element that contains the Arabic title
      let targetCard = null;
      nodes.forEach((n) => {
        if (n.textContent && n.textContent.trim().includes(targetArabic)) {
          targetCard = n.closest('.product-window');
        }
      });
      // If not found by Arabic string (page may have been translated), try matching by English title
      if (!targetCard) {
        const targetEnglish = '🌍 استيراد التوابل العالمية — مصنع التتبيلة السرية'; // fallback same string if bilingual replaced later
        nodes.forEach((n) => {
          if (n.textContent && n.textContent.trim().includes(targetEnglish)) {
            targetCard = n.closest('.product-window');
          }
        });
      }
      if (!targetCard) return;
      // For Arabic keep default (video left) -> remove media-right; for English add media-right
      if (lang === 'en') targetCard.classList.add('media-right');
      else targetCard.classList.remove('media-right');
    } catch (e) {
      console.warn('toggleSpiceLayout failed', e);
    }
  }

  // Apply English/Arabic text specifically for the Global Spice Import product window
  function applySpiceTranslation(lang) {
    try {
      const isEn = lang === 'en';
      // find the product-window that references "استيراد التوابل" or the emoji title
      // accomodate either current-language content (search by included Arabic phrase or emoji)
      const nodes = Array.from(document.querySelectorAll('.product-window .pw-title'));
      let spiceCard = null;
      for (const n of nodes) {
        const txt = (n.textContent || '').trim();
        if (!txt) continue;
        if (txt.includes('استيراد التوابل') || txt.toLowerCase().includes('spice import') || txt.includes('Spice')) {
          spiceCard = n.closest('.product-window');
          break;
        }
      }
      if (!spiceCard) {
        // fallback: try to match by pw-sub text
        const subs = Array.from(document.querySelectorAll('.product-window .pw-sub'));
        for (const s of subs) {
          const t = (s.textContent || '').trim();
          if (t.includes('توزيع عالمي') || t.toLowerCase().includes('global distribution') || t.includes('مصنع التتبيلة')) {
            spiceCard = s.closest('.product-window');
            break;
          }
        }
      }
      if (!spiceCard) return;

      // content selectors inside the spice product card
      const titleEl = spiceCard.querySelector('.pw-title');
      const subEl = spiceCard.querySelector('.pw-sub');
      const descP = spiceCard.querySelector('.pw-content p');
      const features = spiceCard.querySelectorAll('.pw-features li');
      const actionsPrimary = spiceCard.querySelector('.pw-actions .btn-primary');
      const actionsOutline = spiceCard.querySelector('.pw-actions .btn-outline');

      if (isEn) {
        if (titleEl) titleEl.textContent = '🌍 Global Spice Import — Secret Marinade Factory';
        if (subEl) subEl.textContent = 'Integrated Import System • Exclusive Blends • Smart Packaging • Global Distribution';
        if (descP) descP.textContent = 'We provide a fully integrated import system for the finest spices sourced from various countries around the world through direct partnerships with trusted suppliers and certified farms, ensuring continuous supply and consistent quality throughout the year.';
        if (features && features.length >= 6) {
          features[0].textContent = '🌿 Pure Organic Spices';
          features[1].textContent = '🤝 Direct Partnerships with Countries of Origin';
          features[2].textContent = '🍍🥭 100% Natural Fruit Blend';
          features[3].textContent = '📦 Smart & Secure Packaging';
          features[4].textContent = '🌐 Global Distribution & Logistics Continuity';
          features[5].textContent = '🛡 Registered Patent';
        }
        if (actionsPrimary) actionsPrimary.textContent = 'Request Quote';
        if (actionsOutline) actionsOutline.textContent = 'Request a Marinade Sample';

        // append extra descriptive paragraph if not present
        const extraSelector = spiceCard.querySelector('.pw-content .spice-extra-desc');
        if (!extraSelector) {
          const p = document.createElement('p');
          p.className = 'spice-extra-desc';
          p.style.color = '#cfeff4';
          p.style.marginTop = '8px';
          p.textContent = 'The Secret Marinade Factory produces innovative and exclusive blends developed to the highest standards, combining Eastern and international flavors through unique secret formulations that give the product a distinctive and unforgettable character. The supply chain has been strategically designed to ensure an uninterrupted flow of raw materials, supported by smart import and storage plans that enable future expansion.';
          descP.parentNode.insertBefore(p, descP.nextSibling);
        } else {
          extraSelector.textContent = 'The Secret Marinade Factory produces innovative and exclusive blends developed to the highest standards, combining Eastern and international flavors with unique secret recipes that give the product a distinctive and unforgettable identity. The supply chain is strategically designed to ensure uninterrupted access to raw materials, supported by smart import and storage plans that drive future expansion.';
        }
      } else {
        // restore Arabic phrasing (keeps original Arabic copy from the page)
        if (titleEl) titleEl.textContent = '🌍 استيراد التوابل العالمية — مصنع التتبيلة السرية';
        if (subEl) subEl.textContent = 'منظومة استيراد متكاملة • خلطات حصرية • تعبئة ذكية • توزيع عالمي';
        if (descP) descP.textContent = 'نوفّر منظومة استيراد متكاملة لأجود أنواع التوابل من مختلف دول العالم، عبر شراكات مباشرة مع الموردين والمزارع المعتمدة، لضمان استمرارية التوريد وجودة ثابتة على مدار العام.';
        if (features && features.length >= 6) {
          features[0].textContent = '🌿 توابل عضوية نقية';
          features[1].textContent = '🤝 شراكات مباشرة مع دول المنشأ';
          features[2].textContent = '🍍🥭 خلطة فواكه طبيعية 100٪';
          features[3].textContent = '📦 تعبئة ذكية وآمنة';
          features[4].textContent = '🌐 توزيع عالمي واستمرارية لوجستية';
          features[5].textContent = '🛡 براءة اختراع مسجلة';
        }
        if (actionsPrimary) actionsPrimary.textContent = 'اطلب معلومات عن الاستيراد';
        if (actionsOutline) actionsOutline.textContent = 'اطلب عينة من التتبيلة';

        // remove the extra English paragraph if present
        const extraSelector = spiceCard.querySelector('.pw-content .spice-extra-desc');
        if (extraSelector) extraSelector.remove();
      }
    } catch (e) {
      console.warn('applySpiceTranslation failed', e);
    }
  }

  function applyAll(lang) {
    setDirection(lang);
    styleLanguageButton(lang);
    applyStaticUi(lang);
    applyProducts(lang);
    applyMarket(lang);
    tuneVideos();
    // ensure the spice product layout is set after DOM text replacements
    toggleSpiceLayout(lang);
    // apply explicit spice translation so the Global Spice Import card has correct English copy
    applySpiceTranslation(lang);
    document.body.classList.toggle('site-en', lang === 'en');
    document.body.classList.toggle('site-ar', lang !== 'en');
  }

  function boot() {
    applyAll(currentLang());

    const langBtn = document.getElementById('site-lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        window.setTimeout(() => {
          applyAll(currentLang() === 'en' ? 'en' : 'ar');
        }, 10);
      });
    }

    window.addEventListener('storage', () => applyAll(currentLang()));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) applyAll(currentLang());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
