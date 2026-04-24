/*
  investors_lang.js
  Keeps #investors section bilingual and syncs immediately when site language toggles.
*/
(function () {
  function applyInvestorsLang(lang) {
    try {
      const isEn = (lang === 'en');
      // Titles
      const title = document.querySelector('#investors .section-title');
      if (title) title.textContent = isEn ? 'Investment Opportunities' : 'فرص الاستثمار';

      // Left column boxes
      const investBoxes = Array.from(document.querySelectorAll('#investors .invest-left .invest-box'));
      if (investBoxes[0]) {
        investBoxes[0].querySelector('.invest-title') && (investBoxes[0].querySelector('.invest-title').textContent = isEn ? 'Invest in the Future of Smart Real Estate' : 'استثمر في مستقبل العقارات الذكية');
        investBoxes[0].querySelector('.invest-text') && (investBoxes[0].querySelector('.invest-text').textContent = isEn ? 'Invest in smart, sustainable real estate with ROBOT HOUSE. High growth potential and managed risk within an innovative business model.' : 'استثمر في مستقبل العقارات الذكية والمستدامة مع ROBOT HOUSE. فرص نمو عالية ومخاطر محسوبة ضمن نموذج عمل مبتكر.');
      }
      if (investBoxes[1]) {
        investBoxes[1].querySelector('.invest-subtitle') && (investBoxes[1].querySelector('.invest-subtitle').textContent = isEn ? 'Attractive Returns' : 'عوائد جذابة');
        investBoxes[1].querySelector('.invest-text') && (investBoxes[1].querySelector('.invest-text').textContent = isEn ? 'Expected returns range from 43% to 72% depending on scenario, with upside from subscription and commercial services.' : 'عوائد استثمارية متوقعة بين 43% و72% حسب السيناريو، مع فرص لتعظيم الربح عبر خدمات الاشتراك والنمو التجاري.');
      }
      if (investBoxes[2]) {
        investBoxes[2].querySelector('.invest-subtitle') && (investBoxes[2].querySelector('.invest-subtitle').textContent = isEn ? 'Global Market' : 'سوق عالمي');
        investBoxes[2].querySelector('.invest-text') && (investBoxes[2].querySelector('.invest-text').textContent = isEn ? 'The smart home market is rapidly growing; ROBOT HOUSE is positioned to meet regional and global demand.' : 'سوق المنازل الذكية ينمو بسرعة؛ ROBOT HOUSE موضوعة لتلبية الطلب الإقليمي والعالمي.');
      }

      // Action buttons
      const contactBtn = document.querySelector('#investors .invest-actions .btn-primary');
      if (contactBtn) contactBtn.textContent = isEn ? 'Contact Investors Team' : 'تواصل مع فريق المستثمرين';
      const downloadBtn = document.querySelector('#investors .invest-actions .btn-outline, #downloadSummaryBtn');
      if (downloadBtn) downloadBtn.textContent = isEn ? 'Download Financial Summary (PDF)' : 'تحميل الملخص المالي (PDF)';

      // Translate the small widget labels above video (ابتكار - أمان - طاقة مجانية - AI مدمج)
      try {
        const widgetSpans = Array.from(document.querySelectorAll('#investors .invest-widgets .widget span'));
        if (widgetSpans && widgetSpans.length >= 4) {
          const enLabels = ['Innovation', 'Security', 'Free Energy', 'Built-in AI'];
          const arLabels = ['ابتكار', 'أمان', 'طاقة مجانية', 'AI مدمج'];
          widgetSpans.forEach((sp, idx) => {
            sp.textContent = isEn ? (enLabels[idx] || sp.textContent) : (arLabels[idx] || sp.textContent);
          });
        }
      } catch (e) {
        // ignore widget translation errors
      }

      // Password box header/desc/labels
      const pwdBox = document.getElementById('passwordBox');
      if (pwdBox) {
        const h3 = pwdBox.querySelector('h3');
        if (h3) h3.textContent = isEn ? 'Feasibility Studies (Password Protected)' : 'دراسات الجدوى (محمي بكلمة سر)';
        const desc = pwdBox.querySelector('.password-desc');
        if (desc) desc.textContent = isEn ? 'Request the password to download feasibility files by contacting us. After you receive it, enter it below to unlock files.' : 'يمكنكم طلب كلمة المرور لتحميل ملفات دراسات الجدوى بالتواصل معنا. بعد حصولك على كلمة المرور أدخلها أدناه لتحميل الملفات.';
        const label = pwdBox.querySelector('label[for="docPassword"]');
        if (label) label.textContent = isEn ? 'Enter password' : 'أدخل كلمة المرور';
        const unlockBtn = pwdBox.querySelector('#unlockBtn');
        if (unlockBtn) unlockBtn.title = isEn ? 'Unlock' : 'فتح';
        const filesList = pwdBox.querySelector('#protectedFilesList');
        if (filesList) filesList.style.display = filesList.style.display || 'none';
      }

      // Ensure direction for elements inside investors respects global dir
      const dir = (isEn ? 'ltr' : 'rtl');
      const investSection = document.getElementById('investors');
      if (investSection) investSection.setAttribute('dir', dir);

      // Translate the overlay CTA inside the investors video card
      try {
        const overlayCta = document.querySelector('#investors .invest-video-wrap .video-overlay .overlay-cta') ||
                           document.querySelector('#investors .video-overlay .overlay-cta') ||
                           document.querySelector('.video-overlay .overlay-cta');
        if (overlayCta) {
          overlayCta.textContent = isEn ? 'Limited Opportunity - Contact Now' : 'فرصة محدودة - تواصل الآن';
        }
      } catch (err) {
        // non-fatal
      }

      // Translate specific product texts inside the Market -> "Products" cards (localized on language toggle)
      try {
        // Mobile Smart Home card (first card in .card-grid)
        const mobileHomeTitle = document.querySelector('#market .card:nth-of-type(1) h4');
        const mobileHomeList = document.querySelectorAll('#market .card:nth-of-type(1) ul li');
        if (mobileHomeTitle) mobileHomeTitle.textContent = isEn ? 'Mobile Smart Home' : 'المنزل الذكي المتنقل';
        if (mobileHomeList && mobileHomeList.length >= 4) {
          mobileHomeList[0].textContent = isEn ? 'Bulletproof • Waterproof & Fire-resistant' : 'مضاد للرصاص، مقاوم للماء والحريق';
          mobileHomeList[1].textContent = isEn ? 'Smart in-wall components' : 'مكونات ذكية داخل الجدران';
          mobileHomeList[2].textContent = isEn ? 'Color-changing exterior walls' : 'جدران قابلة لتغيير اللون';
          mobileHomeList[3].textContent = isEn ? 'Full phone & AI control' : 'تحكم كامل بالهاتف والذكاء الاصطناعي';
        }

        // Amphibious Robot Car card (second card)
        const vehicleTitle = document.querySelector('#market .card:nth-of-type(2) h4');
        const vehicleList = document.querySelectorAll('#market .card:nth-of-type(2) ul li');
        if (vehicleTitle) vehicleTitle.textContent = isEn ? 'Amphibious Robot Car' : 'سيارة الروبوت البرمائية';
        if (vehicleList && vehicleList.length >= 4) {
          vehicleList[0].textContent = isEn ? 'Fuel-free — Hydraulic drive' : 'بدون وقود - محرك هيدروليكي';
          vehicleList[1].textContent = isEn ? 'Smart spherical wheels' : 'عجلات كروية ذكية';
          vehicleList[2].textContent = isEn ? 'Autonomous driving, submersible' : 'قيادة ذاتية، قابلة للغمر';
          vehicleList[3].textContent = isEn ? 'Payload > 3000 kg' : 'حمولة > 3000 كجم';
        }

        // Transparent Electric Aircraft card (third card)
        const aircraftTitle = document.querySelector('#market .card:nth-of-type(3) h4');
        const aircraftList = document.querySelectorAll('#market .card:nth-of-type(3) ul li');
        if (aircraftTitle) aircraftTitle.textContent = isEn ? 'Transparent Electric Aircraft' : 'طائرة كهربائية شفافة';
        if (aircraftList && aircraftList.length >= 4) {
          aircraftList[0].textContent = isEn ? 'Lightweight, highly durable airframe' : 'هيكل خفيف الوزن وعالي المتانة';
          aircraftList[1].textContent = isEn ? 'Movable wing for extended range' : 'جناح متحرك لمدى طيران طويل';
          aircraftList[2].textContent = isEn ? 'Safe autonomous flight' : 'طيران آمن وبدون طيار';
          aircraftList[3].textContent = isEn ? 'Capable of glide landings' : 'قادرة على الزلاق';
        }

        // Smart Train card (fourth card)
        const trainTitle = document.querySelector('#market .card:nth-of-type(4) h4');
        const trainList = document.querySelectorAll('#market .card:nth-of-type(4) ul li');
        if (trainTitle) trainTitle.textContent = isEn ? 'Smart Train' : 'القطار الذكي';
        if (trainList && trainList.length >= 4) {
          trainList[0].textContent = isEn ? 'Laser-guided, self-driving connected carriages' : 'عربات متصلة ذاتية القيادة بالليزر';
          trainList[1].textContent = isEn ? 'Flexible suspension and wheel system' : 'نظام تعليق وعجلات مرن';
          trainList[2].textContent = isEn ? 'Smart track & lighting control' : 'تحكم ذكي بالمسار والإضاءة';
          trainList[3].textContent = isEn ? 'High speed with low energy consumption' : 'سرعة عالية مع استهلاك منخفض للطاقة';
        }

        // "No direct competitor" tagline in stats area (ensure it's localized)
        const noCompEl = Array.from(document.querySelectorAll('#market .stat')).find(s => s.textContent && s.textContent.includes('لا منافس مباشر') || s.textContent.includes('No direct competitor'));
        if (noCompEl) {
          noCompEl.querySelector('p') && (noCompEl.querySelector('p').textContent = isEn ? 'No direct competitor with our unique integration' : 'بتكاملنا الفريد');
          // If the header h3 contains Arabic phrase, translate it too
          const h3 = noCompEl.querySelector('h3');
          if (h3) {
            if (isEn && h3.textContent.includes('لا منافس')) h3.textContent = 'No direct competitor';
            else if (!isEn && h3.textContent.includes('No direct')) h3.textContent = 'لا منافس مباشر';
          }
        }
      } catch (e) {
        console.warn('Market product translations failed', e);
      }
    } catch (e) {
      console.warn('applyInvestorsLang failed', e);
    }
  }

  // Initialize based on stored site-lang or page language
  function currentLang() {
    return (localStorage.getItem('site-lang') || document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar') || 'ar') === 'en' ? 'en' : 'ar';
  }

  // Listen for storage changes and custom toggles
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'site-lang') applyInvestorsLang(ev.newValue === 'en' ? 'en' : 'ar');
  });

  // Also observe local changes triggered by in-page toggles (site-lang-toggle)
  document.addEventListener('DOMContentLoaded', () => {
    applyInvestorsLang(currentLang());

    // Toggle products layout: side-by-side when English, stacked (default) when Arabic
    function setProductsLayout(lang) {
      try {
        const productsSection = document.getElementById('products');
        if (!productsSection) return;
        if (lang === 'en') {
          productsSection.classList.add('products-side-by-side');
        } else {
          productsSection.classList.remove('products-side-by-side');
        }
      } catch (e) { console.warn('setProductsLayout failed', e); }
    }

    // apply initial layout
    setProductsLayout(currentLang());

    const langBtn = document.getElementById('site-lang-toggle');
    if (langBtn) langBtn.addEventListener('click', () => {
      // defer to allow other site language handlers to update localStorage first
      setTimeout(() => {
        const langNow = currentLang();
        applyInvestorsLang(langNow);
        setProductsLayout(langNow);
      }, 260);
    });

    // respond to storage events (site-lang changes from other tabs)
    window.addEventListener('storage', (ev) => {
      if (ev.key === 'site-lang') {
        const langNow = ev.newValue === 'en' ? 'en' : 'ar';
        applyInvestorsLang(langNow);
        setProductsLayout(langNow);
      }
    });

    // In case site language is switched by other controls, poll once after short delay on page ready
    setTimeout(() => {
      const langNow = currentLang();
      applyInvestorsLang(langNow);
      setProductsLayout(langNow);
    }, 600);
  });
  // ============================================================
  //  FINANCIALS TRANSLATION SUPPORT
  // ============================================================
  function applyFinancialsLang(lang) {
    try {
      const isEn = (lang === 'en');

      // Section title
      const finTitle = document.querySelector('#financials .section-title');
      if (finTitle) finTitle.textContent = isEn ? 'Financials' : 'الجوانب المالية';

      // Intro paragraph
      const finIntro = document.querySelector('#financials .financial-intro');
      if (finIntro) {
        finIntro.textContent = isEn
          ? 'Financial overview for investors in the ROBOT HOUSE project'
          : 'الجوانب المالية للمستثمرين في مشروع ROBOT HOUSE';
      }

      // Numbered financial rectangles (explicit translations for each card)
      const finRects = Array.from(document.querySelectorAll('.financial-grid .financial-rect'));
      if (finRects && finRects.length) {
        const enHeaders = [
          '1. Exceptional Returns',
          '2. Diversified & Integrated Revenue Model',
          '3. Fast Break-even',
          '4. Sustainable Cash Flows',
          '5. Sustainability & Financial Excellence'
        ];
        const enBodies = [
          'Our projects achieve an ROI ranging from 43% to 72% across scenarios, reaching the highest end under peak sales; even conservative cases remain above 40%, making ROBOT HOUSE highly attractive in smart real estate.',
          'Sales of smart residential units, ongoing subscription services (5 years free internet, smart maintenance, AI education), commercial mall & restaurant income, and supporting products diversify revenue.',
          'Break-even is expected within the first year due to synchronized initial sales and activation of income-generating facilities.',
          'Subscription and complementary services provide recurring revenue post-sales; BOT partnerships deliver additional liquidity without overloading investor capital.',
          'Free solar energy lowers operating costs and increases long-term net profit; product diversification yields scale and improved margins.'
        ];
        const arHeaders = [
          '1. عوائد استثنائية',
          '2. نموذج إيرادات متنوع ومتكامل',
          '3. نقطة تعادل سريعة',
          '4. تدفقات نقدية مستدامة',
          '5. الاستدامة والتميز المالي'
        ];
        const arBodies = [
          'تحقق مشاريعنا عائدًا على الاستثمار (ROI) يتراوح بين 43% و72% في سيناريوهات مختلفة، مع الوصول إلى النسبة الأعلى عند تحقيق أقصى أسعار المبيعات. حتى في أكثر السيناريوهات تحفظًا، يظل العائد فوق 40%.',
          'بيع الوحدات السكنية الذكية، خدمات اشتراك مستمرة (إنترنت مجاني 5 سنوات، صيانة ذكية، تعليم بالـ AI)، إيرادات مول/مطاعم ومنتجات داعمة لزيادة مصادر الدخل.',
          'من المتوقع تحقيق نقطة التعادل خلال السنة الأولى من التشغيل بفضل تزامن تدفقات الشراء الأولية مع تشغيل المرافق المدرة للدخل.',
          'يوفر نموذج الاشتراك والخدمات التكميلية إيرادات متكررة بعد البيع، وشراكات BOT توفر سيولة إضافية دون إرهاق رأس المال.',
          'الاعتماد على الطاقة الشمسية يقلل التكاليف التشغيلية ويزيد صافي الأرباح على المدى الطويل، بينما يزيد تنويع المنتجات من هوامش الربح.'
        ];
        finRects.forEach((rect, idx) => {
          const head = rect.querySelector('.financial-head h3');
          const para = rect.querySelector('p');
          if (head) head.textContent = isEn ? enHeaders[idx] : arHeaders[idx];
          if (para) para.textContent = isEn ? enBodies[idx] : arBodies[idx];
        });
      }

      // Financial summary table headers and rows
      try {
        const thScenario = document.querySelector('.financial-table thead th:nth-child(1)');
        const thROI = document.querySelector('.financial-table thead th:nth-child(2)');
        const thAttract = document.querySelector('.financial-table thead th:nth-child(3)');
        if (thScenario) thScenario.textContent = isEn ? 'Scenario' : 'السيناريو';
        if (thROI) thROI.textContent = isEn ? 'Return on Investment' : 'العائد على الاستثمار';
        if (thAttract) thAttract.textContent = isEn ? 'Attractiveness' : 'تقييم الجاذبية';

        // rows
        const rows = Array.from(document.querySelectorAll('.financial-table tbody tr'));
        if (rows.length >= 3) {
          const enRows = [
            ['Low-cost construction scenario', 'Up to 70%', 'Very Good'],
            ['Average construction cost', 'Up to 53%', 'Excellent'],
            ['Conservative scenario', '40%', 'Very Good']
          ];
          const arRows = [
            ['سيناريو البناء منخفض التكلفة', 'Up to 70%', 'Very Good'],
            ['متوسط سعر البناء', 'Up to 53%', 'Excellent'],
            ['سيناريو متحفظ', '40%', 'Very Good']
          ];
          rows.forEach((r, i) => {
            const cells = r.querySelectorAll('td');
            if (cells && cells.length >= 3) {
              const data = isEn ? enRows[i] : arRows[i];
              cells[0].textContent = data[0];
              cells[1].innerHTML = data[1];
              cells[2].textContent = data[2];
            }
          });
        }
      } catch (e) { /* non-fatal */ }

      // ROI chart card title & legend
      const roiTitle = document.querySelector('.roi-chart-card h4');
      if (roiTitle) roiTitle.textContent = isEn ? 'Future ROI Chart' : 'مخطط العائد المستقبلي (ROI)';

      // small heading above the ROI table / financial summary: switch to English when site language is English
      const roiSummaryHeading = document.querySelector('#financials h3');
      if (roiSummaryHeading) {
        roiSummaryHeading.textContent = isEn
          ? 'Summary of ROI Scenarios'
          : 'ملخص سيناريوهات العائد على الاستثمار (ROI)';
      }

      const legendItems = Array.from(document.querySelectorAll('.roi-legend .legend-item'));
      if (legendItems.length >= 3) {
        const enLegend = ['Low-cost construction', 'Average construction', 'Conservative scenario'];
        const arLegend = ['سيناريو بناء منخفض التكلفة', 'متوسط سعر البناء', 'سيناريو متحفظ'];
        legendItems.forEach((it, idx) => {
          const dot = it.querySelector('.legend-dot');
          it.innerHTML = (dot ? dot.outerHTML + ' ' : '') + (isEn ? enLegend[idx] : arLegend[idx]);
        });
      }

      // Recovery panel title, small labels and center percent
      const recoveryTitle = document.querySelector('.recovery-panel .geom-content h4');
      if (recoveryTitle) recoveryTitle.textContent = isEn ? 'Recovery Speed Metrics' : 'مقاييس سرعة الاسترداد';
      const holoCenter = document.querySelector('.holo-center-label');
      if (holoCenter) holoCenter.textContent = '62%';
      const metricSmalls = Array.from(document.querySelectorAll('.holo-metric small'));
      if (metricSmalls.length >= 3) {
        const enMetric = ['Break-even', 'Return Range', 'Subscription Revenues'];
        const arMetric = ['نقطة تعادل', 'نطاق العائد', 'إيرادات اشتراكات'];
        metricSmalls.forEach((el, idx) => el.textContent = isEn ? enMetric[idx] : arMetric[idx]);
      }

      // Conclusion card header, grid items and CTA
      const conclusionHeader = document.querySelector('.conclusion-card .conclusion-header h3');
      if (conclusionHeader) conclusionHeader.textContent = isEn ? 'Conclusion:' : 'الخلاصة:';
      document.querySelectorAll('.conclusion-item').forEach((it) => {
        const icon = it.querySelector('i');
        const strong = it.querySelector('strong') || it.querySelector('div > strong');
        const small = it.querySelector('small');
        if (strong && small) {
          const txt = strong.textContent.trim();
          if (isEn) {
            if (txt.includes('تنوع')) { strong.textContent = 'Diversified Revenues'; small.textContent = 'Sales, subscriptions, services'; }
            else if (txt.includes('حماية')) { strong.textContent = 'Investor Protection'; small.textContent = 'Clear contracts & guarantees'; }
            else if (txt.includes('استدامة')) { strong.textContent = 'Sustainability'; small.textContent = 'Long-term operational savings'; }
          } else {
            // restore Arabic defaults where possible (keep short)
            if (txt.includes('Diversified') || txt.includes('Diversification')) { strong.textContent = 'تنوع الإيرادات'; small.textContent = 'مبيعات، اشتراكات، خدمات'; }
            else if (txt.includes('Investor') || txt.includes('Protection')) { strong.textContent = 'حماية المستثمر'; small.textContent = 'عقود واضحة وضمانات'; }
            else if (txt.includes('Sustainability')) { strong.textContent = 'استدامة'; small.textContent = 'توفير تشغيل طويل الأمد'; }
          }
        }
      });
      const conclusionCTA = document.querySelector('.conclusion-cta a');
      if (conclusionCTA) conclusionCTA.textContent = isEn ? 'Request Detailed Proposal' : 'اطلب العرض التفصيلي';
      const downloadBtns = Array.from(document.querySelectorAll('#downloadSummaryBtn, #downloadSummaryBtnAlt'));
      downloadBtns.forEach(b => { if (b) b.textContent = isEn ? 'Download Financial Summary (PDF)' : 'تحميل الملخص المالي (PDF)'; });

      // Note card header and widgets
      const noteHeader = document.querySelector('.note-card .note-header h3');
      if (noteHeader) noteHeader.textContent = isEn ? 'Note:' : 'ملاحظة:';
      const noteBadge = document.querySelector('.note-card .note-badge');
      if (noteBadge) noteBadge.textContent = isEn ? 'Important' : 'مهم';
      document.querySelectorAll('.note-widget').forEach((nw, idx) => {
        const span = nw.querySelector('span');
        if (!span) return;
        if (isEn) {
          const map = ['Trusted sources', 'Cost confidentiality', 'Quarterly updates'];
          span.textContent = map[idx] || span.textContent;
        } else {
          const mapAr = ['مصادر بيانات موثوقة', 'سرية التكاليف', 'تحديثات ربع سنوية'];
          span.textContent = mapAr[idx] || span.textContent;
        }
      });

      // Translate the main note paragraph (detailed note under financials)
      const notePara = document.querySelector('.note-card p');
      if (notePara) {
        if (isEn) {
          notePara.textContent = 'The figures above are derived from comprehensive, detailed studies while maintaining confidentiality of sensitive cost details; all scenarios ensure strong returns that outperform traditional real estate markets.';
        } else {
          notePara.textContent = 'الأرقام المذكورة أعلاه مستمدة من دراسات تفصيلية شاملة مع الحفاظ على سرية تفاصيل التكلفة الحساسة، وتضمن جميع السيناريوهات عوائد قوية تفوق ما يقدمه سوق العقارات التقليدي.';
        }
      }

      // Translate conclusion pill label and conclusion paragraph
      const conclusionPill = document.querySelector('.conclusion-card .conclusion-pill');
      if (conclusionPill) conclusionPill.textContent = isEn ? 'Sharable' : 'قابل للمشاركة';

      const conclusionPara = document.querySelector('.conclusion-card p');
      if (conclusionPara) {
        if (isEn) {
          conclusionPara.textContent = 'The ROBOT HOUSE project is not just a real estate development, but an integrated platform for living, working, and investing within a smart, sustainable environment. Its high returns and diversified revenue model make it the optimal choice for funds and investors seeking leading opportunities in the future of real estate.';
        } else {
          conclusionPara.textContent = 'مشروع ROBOT HOUSE ليس مجرد تطوير عقاري، بل منصة متكاملة للعيش والعمل والاستثمار ضمن بيئة ذكية ومستدامة. عوائده المرتفعة ونموذج إيراداته المتنوع يجعلانه الخيار الأمثل لصناديق الاستثمار والمستثمرين الباحثين عن فرص رائدة في مستقبل العقارات.';
        }
      }

      // Ensure direction attribute for financials sub-section respects overall site language
      const finSection = document.getElementById('financials');
      if (finSection) finSection.setAttribute('dir', isEn ? 'ltr' : 'rtl');

    } catch (e) {
      console.warn('applyFinancialsLang failed', e);
    }
  }

  // hook into site language changes and initialization
  document.addEventListener('DOMContentLoaded', () => {
    const current = (localStorage.getItem('site-lang') || document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar')) || 'ar';
    applyFinancialsLang(current === 'en' ? 'en' : 'ar');

    // site-lang-toggle may be used to switch languages; listen for storage events and clicks
    window.addEventListener('storage', (ev) => {
      if (ev.key === 'site-lang') applyFinancialsLang(ev.newValue === 'en' ? 'en' : 'ar');
    });
    const langBtn = document.getElementById('site-lang-toggle');
    if (langBtn) langBtn.addEventListener('click', () => {
      // defer slightly to allow other site language handlers to update localStorage first
      setTimeout(() => {
        const lang = (localStorage.getItem('site-lang') || document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar')) || 'ar';
        applyFinancialsLang(lang === 'en' ? 'en' : 'ar');
      }, 220);
    });
  });

})();