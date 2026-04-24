/* complete_bilingual_translation.js
   Exact bilingual overlay for Arabic/English without changing layout or design.
*/
(function () {
  const pairs = [
  [
    "ROBOT HOUSE - SMART LIVING FUTURE - INNOVATION & TECHNOLOGY - مدينة ذكية متكاملة",
    "ROBOT HOUSE - SMART LIVING FUTURE - INNOVATION & TECHNOLOGY - Integrated Smart City"
  ],
  [
    "أخبار ROBOT HOUSE",
    "ROBOT HOUSE News"
  ],
  [
    "الرئيسية",
    "Home"
  ],
  [
    "من نحن",
    "About"
  ],
  [
    "المنتجات",
    "Products"
  ],
  [
    "التقنيات",
    "Technology"
  ],
  [
    "السوق",
    "Market"
  ],
  [
    "المالية",
    "Financials"
  ],
  [
    "الاستثمار",
    "Investors"
  ],
  [
    "الألبوم",
    "Photo Album"
  ],
  [
    "تواصل",
    "Contact"
  ],
  [
    "ROBΟT HOUSE — منظومة ابتكار متكاملة",
    "ROBΟT HOUSE — Integrated Innovation Ecosystem"
  ],
  [
    "ROBOT HOUSE هي شركة رائدة في ابتكار نماذج الحياة المستقبلية، تتبنى رؤية جريئة لتأسيس أول منظومة ذكية متكاملة بالكامل في العالم العربي، حيث تلتقي الرفاهية بالتكنولوجيا، وتندمج الاستدامة مع الذكاء الاصطناعي في كل تفصيل من تفاصيل الحياة اليومية.",
    "ROBOT HOUSE is a leading company in shaping future lifestyle models, pursuing a bold vision to build the first fully integrated intelligent ecosystem in the Arab world, where luxury meets technology and sustainability is integrated with AI into every detail of daily life."
  ],
  [
    "نحن شركة خاصة ذات مسؤولية محدودة، متخصصة في تطوير أنظمة سكنية، تشغيلية، وضيافية ذكية تعتمد على أحدث تقنيات الذكاء الاصطناعي، الطاقة النظيفة، والأتمتة المتقدمة، بهدف بناء مشاريع ريادية ذات قابلية توسع عالمية وعائد استثماري مرتفع.",
    "We are a private limited company specialized in developing smart residential, operational, and hospitality systems using AI, clean energy, and advanced automation to build scalable flagship projects with high ROI potential."
  ],
  [
    "نحن لا نقدم منتجًا واحدًا، بل نبني نظامًا اقتصاديًا وتقنيًا متكاملًا يبدأ من الإنتاج والتوريد، ويمتد إلى التشغيل والخدمات والمدينة الذكية.",
    "We do not offer a single product; we build a complete economic and technical system from production and supply to operation, services, and the smart city."
  ],
  [
    "المنازل الذكية والمدن المستقبلية",
    "Smart Homes & Future Cities"
  ],
  [
    "حلول شاملة للتخطيط العمراني، البنية التحتية الذكية وإدارة المجمعات.",
    "Comprehensive solutions for urban planning, smart infrastructure, and community management."
  ],
  [
    "شاحنات الضيافة الكهربائية الذكية والمطاعم المتنقلة",
    "Smart Electric Hospitality Trucks & Mobile Restaurants"
  ],
  [
    "نماذج متنقلة متصلة بالـ AI لتجربة ضيافة متطورة وفعّالة.",
    "AI-connected mobile hospitality units for a premium efficient dining experience."
  ],
  [
    "شاحنات الشاورما والمشاوي الفاخرة",
    "Luxury Shawarma & Grill Trucks"
  ],
  [
    "سلاسل مطاعم متنقلة بعمليات متمتعة وقياس أداء في الزمن الحقيقي.",
    "Mobile restaurant chains with automated operations and real-time performance metrics."
  ],
  [
    "المطاعم الذكية وروبوتات المطبخ",
    "Smart Restaurants & Kitchen Robots"
  ],
  [
    "أتمتة كاملة للمطابخ، روبوتات تحضير وتقديم متكاملة.",
    "Full kitchen automation with integrated robotic prep and service."
  ],
  [
    "مزارع الدواجن الآلية بطاقة تشغيل كبيرة",
    "Automated Poultry Farms — High Throughput"
  ],
  [
    "حلول زراعية ذات كفاءة تشغيلية عالية ومراقبة ذكية للحاضنات والتغذية.",
    "High-efficiency agricultural solutions with AI incubation and feeding control."
  ],
  [
    "نقل المأكولات البحرية الحية",
    "Live Seafood Transport"
  ],
  [
    "سلاسل تبريد ونقل متقدمة للسمك والروبيان والكافيار.",
    "Advanced cold-chain transport for fish, shrimp and caviar."
  ],
  [
    "استيراد التوابل ومصنع التتبيلة والخلطات السرية",
    "Spice Import & Secret Marinade Factory"
  ],
  [
    "مصنع التتبيلة السرية ينتج خلطات مبتكرة وحصرية تم تطويرها وفق معايير عالية، تجمع بين النكهات الشرقية والعالمية بتركيبات سرية مميزة تمنح المنتج طابعًا فريدًا لا يُنسى. تم تصميم سلسلة الإمداد لضمان عدم انقطاع المواد الخام مع خطط استيراد وتخزين ذكية تدعم التوسع المستقبلي.",
    "The Secret Marinade Factory produces innovative and exclusive blends developed to the highest standards, combining Eastern and international flavors with unique secret recipes that give our products a distinctive and unforgettable identity. The supply chain is strategically designed to ensure an uninterrupted flow of raw materials, supported by smart import and storage plans that enable future expansion."
  ],
  [
    "شبكة توريد عالمية ومصانع تصنيع بخصائص جودة وسرية عالية.",
    "Global supply network and manufacturing with high-quality, confidential blends."
  ],
  [
    "أنظمة التوصيل الذكي والدرون",
    "Smart Delivery & Drone Systems"
  ],
  [
    "لوجستيات متصلة بالـ AI لتسليم سريع وآمن داخل المجمعات والمدن.",
    "AI-connected logistics for fast and secure deliveries inside complexes and cities."
  ],
  [
    "الطاقة الشمسية والتخزين الذكي",
    "Solar Power & Intelligent Storage"
  ],
  [
    "حلول توزيع طاقة متجددة مع نظم تخزين وإدارة ذكية للشبكات المحلية.",
    "Renewable distribution with smart storage and local grid management."
  ],
  [
    "المركبات البرمائية والطائرات الكهربائية المستقبلية",
    "Amphibious Vehicles & Future Electric Aircraft"
  ],
  [
    "بحث وتطوير في مركبات متعددة الاستخدام للطيران والسطح والماء.",
    "R&D for multi-mode vehicles for air, land and water."
  ],
  [
    "حلول النقل الذكي والبنية الحضرية",
    "Smart Mobility & Urban Infrastructure"
  ],
  [
    "تكامل النقل، الجسور المعلقة والأنظمة التي تحسّن التنقل داخل المدن الذكية.",
    "Integrated transport, suspended bridges and systems that enhance mobility in smart cities."
  ],
  [
    "المجمع السكني الذكي",
    "Smart Residential Complex"
  ],
  [
    "4 أبراج • 480 شقة فاخرة • 400م² • كهرباء مجانية • إنترنت 5 سنوات",
    "4 towers • 480 luxury apartments • 400 m² • Free electricity • 5 years internet"
  ],
  [
    "الوصف: 4 أبراج • 480 شقة فاخرة • 400م² • كهرباء مجانية • إنترنت 5 سنوات • تعليم ذكي للأطفال. 8 غرف نوم، 3 حمامات ذكية، جاكوزي، مطبخ ذكي.",
    "Description: 4 towers • 480 luxury apartments • 400 m² • Free electricity • 5 years internet • Smart education for children. 8 bedrooms, 3 smart bathrooms, jacuzzi, smart kitchen."
  ],
  [
    "480 شقة فاخرة بمساحات مرنة",
    "480 flexible luxury apartments"
  ],
  [
    "شبكة طاقة شمسية مركزية",
    "Central solar power network"
  ],
  [
    "خدمات اشتراك للإنترنت والصيانة",
    "Subscription services for internet and maintenance"
  ],
  [
    "المركبات المبتكرة",
    "Innovative Vehicles"
  ],
  [
    "سيارة روبوت برمائية • طائرة كهربائية شفافة • قطار ذكي",
    "Amphibious robot car • Transparent electric aircraft • Smart train"
  ],
  [
    "الوصف: سيارة روبوت برمائية (50,000$) • طائرة شفافة كهربائية • قطار ليزر ذكي. عجلات كروية، حمولة >3000 كجم.",
    "Description: Amphibious robot car ($50,000) • Transparent electric aircraft • Laser smart train. Spherical wheels, payload >3000 kg."
  ],
  [
    "المنزل الذكي المتنقل",
    "Mobile Smart Home"
  ],
  [
    "مضاد للرصاص • مقاوم للماء والحريق • جدران قابلة لتغيير اللون",
    "Bulletproof • Waterproof & Fire-resistant • Color-change walls"
  ],
  [
    "الوصف: مضاد للرصاص، مقاوم للماء والحريق • مكونات ذكية داخل الجدران • مساحات متعددة قابلة للتعديل • جدران قابلة لتغيير اللون.",
    "Description: Bulletproof, waterproof and fire-resistant • Smart in-wall components • Reconfigurable spaces • Color-changing exterior walls."
  ],
  [
    "المدرسة الذكية",
    "Smart School"
  ],
  [
    "42,000م² • 10 طوابق • تعليم بالذكاء الاصطناعي",
    "42,000 m² • 10 floors • AI-powered education"
  ],
  [
    "المول التجاري الذكي",
    "Smart Commercial Mall"
  ],
  [
    "محلات ذكية • طاقة مجانية • تجربة تسوق مبتكرة",
    "Smart shops • Free energy • Innovative shopping experience"
  ],
  [
    "الجسر المعلق",
    "Suspended Bridge"
  ],
  [
    "الطابق 15 • 1,200م² • ربط الأبراج مع مرافق",
    "Level 15 • 1,200 m² • Connects the towers with amenities"
  ],
  [
    "شاحنة الشاورما الذكية الفاخرة — ROBO SHAWARMA TRUCK",
    "Luxury Smart Shawarma Truck — ROBO SHAWARMA TRUCK"
  ],
  [
    "شاحنة ضيافة كهربائية ذكية • طول 24 قدم • قدرة تشغيل 420 وجبة/يوم",
    "Smart electric hospitality truck • 24 ft • Capacity 420 meals/day"
  ],
  [
    "الوصف: أول شاحنة ضيافة كهربائية ذكية بطول 24 قدم، مزودة ببطارية 300kW، ألواح شمسية وتقنية V2G لتشغيل مستقر حتى 420 وجبة يوميًا، بمستوى فخامة مطعم متنقل.",
    "Description: The first luxury smart electric hospitality truck (24 ft), with a 300 kW battery, solar panels and V2G enabling stable operation up to 420 meals/day—a luxury mobile dining experience."
  ],
  [
    "المزرعة الذكية وسلسلة التوريد — SMART FARM & SUPPLY CHAIN",
    "Smart Farm & Supply Chain"
  ],
  [
    "منظومة إنتاج غذائي آلية • مزرعة دواجن 50,000 دجاجة/شهر • تعبئة وتوزيع ذكي",
    "Automated food production system • 50,000 chickens/month • Smart packing & distribution"
  ],
  [
    "النقل البحري والمطعم الذكي — SEAFOOD MOBILITY & SMART RESTAURANT",
    "Seafood Mobility & Smart Restaurant"
  ],
  [
    "حل لوجستي ومطعم فاخر للمأكولات البحرية • نقل مبرد • طهي مباشر",
    "Logistics solution & luxury seafood restaurant • Refrigerated transport • Live cooking"
  ],
  [
    "الذكاء الاصطناعي AI",
    "Artificial Intelligence (AI)"
  ],
  [
    "تحليل بيانات",
    "Data Analytics"
  ],
  [
    "تحكم أوتوماتيكي",
    "Automated Control"
  ],
  [
    "الطاقة الشمسية",
    "Solar Energy"
  ],
  [
    "تخزين ذكي",
    "Smart Storage"
  ],
  [
    "ألواح شفافة",
    "Transparent Panels"
  ],
  [
    "التعلم العميق",
    "Deep Learning"
  ],
  [
    "تخصيص المناهج",
    "Personalized Curriculum"
  ],
  [
    "تحسين تجربة",
    "Experience Optimization"
  ],
  [
    "إنترنت الأشياء IoT",
    "Internet of Things (IoT)"
  ],
  [
    "شبكة موحدة",
    "Unified Network"
  ],
  [
    "مراقبة لحظية",
    "Real-time Monitoring"
  ],
  [
    "النانو والجرافين",
    "Nano & Graphene"
  ],
  [
    "مواد ذكية",
    "Smart Materials"
  ],
  [
    "تعديل سطحي",
    "Surface Tuning"
  ],
  [
    "ألواح PE الأكريليكية",
    "PE Acrylic Panels"
  ],
  [
    "عازل فعال",
    "Efficient Insulation"
  ],
  [
    "مقاومة الصدمات",
    "Impact Resistance"
  ],
  [
    "الشقة الذكية المتطورة",
    "Advanced Smart Apartment"
  ],
  [
    "استمتع بتجربة سكنية متكاملة تعتمد على الذكاء الاصطناعي، الأمان الذكي، وترشيد الطاقة.",
    "Enjoy an integrated residential experience powered by AI, smart security, and energy efficiency."
  ],
  [
    "الذكاء الاصطناعي",
    "Artificial Intelligence"
  ],
  [
    "الإضاءة الذكية",
    "Smart Lighting"
  ],
  [
    "الأمان المتكامل",
    "Integrated Security"
  ],
  [
    "ترشيد الطاقة",
    "Energy Efficiency"
  ],
  [
    "الطاقة والبيئة",
    "Energy & Environment"
  ],
  [
    "إسمنت مولّد كهرباء",
    "Power-generating Cement"
  ],
  [
    "تدوير مخلفات متقدم",
    "Advanced Waste Recycling"
  ],
  [
    "فلترة مياه متقدمة",
    "Advanced Water Filtration"
  ],
  [
    "السوق والتوقعات",
    "Market & Forecasts"
  ],
  [
    "$1.6 تريليون",
    "$1.6 Trillion"
  ],
  [
    "حجم السوق المتوقع بحلول 2030",
    "Projected market size by 2030"
  ],
  [
    "نمو سنوي 28%",
    "28% CAGR"
  ],
  [
    "للمنازل الذكية عالمياً",
    "for smart homes globally"
  ],
  [
    "المنتجات الرئيسية",
    "Key Products"
  ],
  [
    "الجوانب المالية",
    "Financials"
  ],
  [
    "الخلاصة:",
    "Conclusion:"
  ],
  [
    "اطلب العرض التفصيلي",
    "Request Detailed Proposal"
  ],
  [
    "تحميل الملخص المالي (PDF)",
    "Download Financial Summary (PDF)"
  ],
  [
    "استثمر في مستقبل العقارات الذكية",
    "Invest in the Future of Smart Real Estate"
  ],
  [
    "تواصل مع فريق المستثمرين",
    "Contact Investors Team"
  ],
  [
    "تواصل معنا",
    "Contact Us"
  ],
  [
    "البريد الإلكتروني العام",
    "General Email"
  ],
  [
    "اتصل بفريق ROBOT HOUSE",
    "Contact the ROBOT HOUSE Team"
  ],
  [
    "دراسات الجدوى (محمي بكلمة سر)",
    "Feasibility Studies (Password Protected)"
  ],
  [
    "أدخل كلمة المرور",
    "Enter password"
  ],
  [
    "ألبوم الصور",
    "Photo Album"
  ],
  [
    "آراء العملاء",
    "Testimonials"
  ],
  [
    "الأسئلة الشائعة",
    "FAQ"
  ],
  [
    "ابحث عن سؤالك هنا...",
    "Search your question..."
  ],
  [
    "رأس الخيمة، الإمارات | ROBOT HOUSE FZ LLC",
    "Ras Al Khaimah, UAE | ROBOT HOUSE FZ LLC"
  ],
  [
    "السيناريو",
    "Scenario"
  ],
  [
    "العائد على الاستثمار",
    "ROI"
  ],
  [
    "تقييم الجاذبية",
    "Attractiveness"
  ],
  [
    "سيناريو البناء منخفض التكلفة",
    "Low-cost construction scenario"
  ],
  [
    "متوسط سعر البناء",
    "Average construction cost"
  ],
  [
    "سيناريو متحفظ",
    "Conservative scenario"
  ],
  [
    "مخطط العائد المستقبلي (ROI)",
    "Future ROI Chart"
  ],
  [
    "مقاييس سرعة الاسترداد",
    "Recovery Speed Metrics"
  ],
  [
    "تحقق مشاريعنا عائدًا على الاستثمار (ROI) يتراوح بين 43% و72% في سيناريوهات مختلفة، مع الوصول إلى النسبة الأعلى عند تحقيق أقصى أسعار المبيعات. حتى في أكثر السيناريوهات تحفظًا، يظل العائد فوق 40%، مما يجعل ROBOT HOUSE من أكثر الفرص جاذبية في قطاع العقارات الذكية.",
    "1. Exceptional Returns\\nOur projects achieve an ROI ranging from 43% to 72% across scenarios, reaching the highest end under peak sales pricing. Even in conservative cases, returns remain above 40%, positioning ROBOT HOUSE as one of the most attractive opportunities in the smart real estate sector."
  ],
  [
    "بيع الوحدات السكنية الذكية (480 شقة فاخرة بمساحة 400 متر مربع لكل منها). خدمات اشتراك مستمرة (إنترنت مجاني 5 سنوات، صيانة ذكية، تعليم ذكي للأطفال)، فرص تجارية في المولات والمطاعم وقاعات الفعاليات، ومنتجات داعمة تزيد من مصادر الدخل.",
    "2. Diversified, Integrated Revenue Model\\nSale of smart residential units (480 luxury apartments, ~400 m² each). Recurring subscription services (5 years free internet, smart maintenance, AI education), commercial opportunities in malls, restaurants and event spaces, and supporting products that expand revenue streams."
  ],
  [
    "من المتوقع تحقيق نقطة التعادل خلال السنة الأولى من التشغيل بفضل تزامن تدفقات الشراء الأولية مع تشغيل المرافق المدرة للدخل.",
    "3. Fast Break-even\\nThe project is expected to reach break-even within the first year of operation thanks to synchronized initial sales cashflows and the activation of income-generating facilities."
  ],
  [
    "يوفر نموذج الاشتراك والخدمات التكميلية إيرادات متكررة بعد مرحلة البيع الأولية، ودعم التوسع عبر شراكات البناء والتشغيل والتحويل (BOT) يؤمن سيولة إضافية دون إرهاق ميزانيات المستثمرين.",
    "4. Sustainable Cash Flows\\nThe subscription and complementary service model delivers recurring revenues post-sales, and BOT (Build-Operate-Transfer) partnerships provide additional liquidity without overburdening investor capital."
  ],
  [
    "الاعتماد على الطاقة الشمسية المجانية يقلل تكاليف التشغيل ويزيد صافي الأرباح على المدى الطويل، بينما يحقق تنويع المنتجات (منازل، سيارات، طائرات، قطارات) وفورات حجم وهوامش ربح أعلى.",
    "5. Sustainability & Financial Excellence\\nFree solar energy reduces operating costs and increases long-term net profitability, while product diversification (homes, vehicles, aircraft, trains) yields scale advantages and higher profit margins."
  ],
  [
    "ROBOT HOUSE هو حقاً مستقبل العيش. التكنولوجيا مذهلة والراحة لا تضاهى. أنا سعيد جداً بكوني جزءاً من هذا المشروع الرائد.",
    "ROBOT HOUSE is truly the future of living. The technology is amazing and the comfort is unmatched. I am very happy to be part of this pioneering project."
  ],
  [
    "تجربة فريدة من نوعها! كل شيء ذكي ومريح. أحب بشكل خاص نظام الطاقة المجانية والمرافق المتكاملة.",
    "A unique experience! Everything is smart and comfortable. I especially love the free energy system and integrated facilities."
  ],
  [
    "المنازل فائقة الجودة والابتكار في كل زاوية. الدعم ممتاز والفريق متعاون جداً. أوصي به بشدة.",
    "Homes of exceptional quality and innovation at every corner. Support is excellent and the team is very helpful. Highly recommended."
  ],
  [
    "لم أتخيل أبداً أن يكون العيش بهذا الرفاهية والذكاء. الأمان ممتاز والبيئة مثالية للعائلات.",
    "I never imagined living with such luxury and intelligence. Security is excellent and the environment is perfect for families."
  ],
  [
    "مشروع طموح ومستقبل واعد. أرى أن ROBOT HOUSE سيغير مفهوم الحياة العصرية في المنطقة والعالم.",
    "An ambitious project with a promising future. I believe ROBOT HOUSE will redefine modern living in the region and the world."
  ],
  [
    "الخدمات الذكية في المجمع تعطي شعوراً حقيقيًا بالراحة وتقليل العبء اليومي. انصح الجميع بالتجربة.",
    "The smart services in the complex provide a real sense of comfort and reduce daily burdens. I recommend everyone to try it."
  ],
  [
    "التصميم والبيئة المستدامة يجعلان الاستثمار هنا قراراً ذكياً.",
    "The design and sustainable environment make investing here a smart decision."
  ],
  [
    "ع",
    "EN"
  ],
  [
    "ملخص سيناريوهات العائد على الاستثمار (ROI)",
    "Summary of ROI Scenarios"
  ],
  [
    "التبديل إلى العربية",
    "Switch to English"
  ],
  [
    "منتجاتنا",
    "Our Products"
  ],
  [
    "شاهد العرض",
    "Watch Presentation"
  ],
  [
    "فرص الاستثمار",
    "Investment Opportunities"
  ],
  [
    "استثمر في مستقبل العقارات الذكية والمستدامة مع ROBOT HOUSE. فرص نمو عالية ومخاطر محسوبة ضمن نموذج عمل مبتكر.",
    "Invest in smart, sustainable real estate with ROBOT HOUSE. High growth potential and managed risk within an innovative business model."
  ],
  [
    "عوائد جذابة",
    "Attractive Returns"
  ],
  [
    "عوائد استثمارية متوقعة بين 43% و72% حسب السيناريو، مع فرص لتعظيم الربح عبر خدمات الاشتراك والنمو التجاري.",
    "Expected returns range from 43% to 72% depending on scenario, with upside from subscription and commercial services."
  ],
  [
    "سوق عالمي",
    "Global Market"
  ],
  [
    "سوق المنازل الذكية ينمو بسرعة؛ ROBOT HOUSE موضوعة لتلبية الطلب الإقليمي والعالمي.",
    "The smart home market is rapidly growing; ROBOT HOUSE is positioned to meet regional and global demand."
  ],
  [
    "يمكنكم طلب كلمة المرور لتحميل ملفات دراسات الجدوى بالتواصل معنا. بعد حصولك على كلمة المرور أدخلها أدناه لتحميل الملفات.",
    "Request the password to download feasibility files by contacting us. After you receive it, enter it below to unlock files."
  ],
  [
    "فتح",
    "Unlock"
  ],
  [
    "فرصة محدودة - تواصل الآن",
    "Limited Opportunity - Contact Now"
  ],
  [
    "مضاد للرصاص، مقاوم للماء والحريق",
    "Bulletproof • Waterproof & Fire-resistant"
  ],
  [
    "مكونات ذكية داخل الجدران",
    "Smart in-wall components"
  ],
  [
    "جدران قابلة لتغيير اللون",
    "Color-changing exterior walls"
  ],
  [
    "تحكم كامل بالهاتف والذكاء الاصطناعي",
    "Full phone & AI control"
  ],
  [
    "سيارة الروبوت البرمائية",
    "Amphibious Robot Car"
  ],
  [
    "بدون وقود - محرك هيدروليكي",
    "Fuel-free — Hydraulic drive"
  ],
  [
    "عجلات كروية ذكية",
    "Smart spherical wheels"
  ],
  [
    "قيادة ذاتية، قابلة للغمر",
    "Autonomous driving, submersible"
  ],
  [
    "حمولة > 3000 كجم",
    "Payload > 3000 kg"
  ],
  [
    "طائرة كهربائية شفافة",
    "Transparent Electric Aircraft"
  ],
  [
    "هيكل خفيف الوزن وعالي المتانة",
    "Lightweight, highly durable airframe"
  ],
  [
    "جناح متحرك لمدى طيران طويل",
    "Movable wing for extended range"
  ],
  [
    "طيران آمن وبدون طيار",
    "Safe autonomous flight"
  ],
  [
    "قادرة على الزلاق",
    "Capable of glide landings"
  ],
  [
    "القطار الذكي",
    "Smart Train"
  ],
  [
    "عربات متصلة ذاتية القيادة بالليزر",
    "Laser-guided, self-driving connected carriages"
  ],
  [
    "نظام تعليق وعجلات مرن",
    "Flexible suspension and wheel system"
  ],
  [
    "تحكم ذكي بالمسار والإضاءة",
    "Smart track & lighting control"
  ],
  [
    "سرعة عالية مع استهلاك منخفض للطاقة",
    "High speed with low energy consumption"
  ],
  [
    "بتكاملنا الفريد",
    "No direct competitor with our unique integration"
  ],
  [
    "الجوانب المالية للمستثمرين في مشروع ROBOT HOUSE",
    "Financial overview for investors in the ROBOT HOUSE project"
  ],
  [
    "ملاحظة:",
    "Note:"
  ],
  [
    "مهم",
    "Important"
  ],
  [
    "قابل للمشاركة",
    "Sharable"
  ],
  [
    "ROBOT HOUSE FZ LLC | مدينة ذكية متكاملة",
    "ROBOT HOUSE FZ LLC | Integrated Smart City"
  ],
  [
    "غيوم متفرقة",
    "Partly Cloudy"
  ],
  [
    "منظومتنا: إنتاج — تشغيل — مدينة ذكية",
    "Our Ecosystem: Production — Operations — Smart City"
  ],
  [
    "ROBOT HOUSE ليست مجرد شركة، بل منظومة ابتكار متكاملة تعيد تعريف أسلوب الحياة، الضيافة، الغذاء، النقل، والبنية الحضرية في المستقبل.",
    "ROBOT HOUSE is not just a company, but an integrated innovation ecosystem redefining lifestyle, hospitality, food, mobility, and urban infrastructure in the future."
  ],
  [
    "مرحباً بكم في Robot House",
    "Welcome to Robot House"
  ],
  [
    "ريادة في الحلول الذكية للمنازل والمشاريع المستقبلية",
    "Leadership in Smart Solutions for Homes and Future Projects"
  ],
  [
    "اطلب عرض سعر",
    "Request Quote"
  ],
  [
    "سيارة روبوت برمائية — سعر مرجعي: 50,000$",
    "Amphibious Robot Car — Reference Price: $50,000"
  ],
  [
    "طائرة كهربائية شفافة قابلة للغوص الجوي",
    "Transparent Electric Aircraft Capable of Aerial Diving"
  ],
  [
    "حلول نقل ذكي للمجمع",
    "Smart Mobility Solutions for the Complex"
  ],
  [
    "تشغيل الفيديو",
    "Play Video"
  ],
  [
    "متصفحك لا يدعم عرض الفيديو.",
    "Your browser does not support video playback."
  ],
  [
    "هندسة مرنة للمساحات الداخلية",
    "Flexible Interior Space Engineering"
  ],
  [
    "مقاومة عالية ومواد متقدمة",
    "High Resistance and Advanced Materials"
  ],
  [
    "تكامل كامل مع نظام AI للمستخدم",
    "Full Integration with the User AI System"
  ],
  [
    "الوصف: 42,000م² • 10 طوابق • تعليم بالذكاء الاصطناعي من الحضانة للجامعة.",
    "Description: 42,000 m² • 10 floors • AI-powered education from kindergarten to university."
  ],
  [
    "برامج تعليمية مخصصة بالـ AI",
    "AI-Personalized Educational Programs"
  ],
  [
    "مرافق بحث وتطوير متقدمة",
    "Advanced Research and Development Facilities"
  ],
  [
    "بيئة تعليمية متصلة للمجتمع",
    "A Connected Learning Environment for the Community"
  ],
  [
    "اطلب تفاصيل",
    "Request Details"
  ],
  [
    "الوصف: محلات بأنظمة AI، طاقة مجانية، تجربة تسوق مبتكرة.",
    "Description: Retail units with AI systems, free energy, and an innovative shopping experience."
  ],
  [
    "واجهات بيع ذكية وتحليلات سلوك العملاء",
    "Smart Retail Fronts and Customer Behavior Analytics"
  ],
  [
    "تكامل لوجستي داخلي للموردين",
    "Internal Logistics Integration for Suppliers"
  ],
  [
    "مساحات تجارية قابلة للتكيف",
    "Adaptable Commercial Spaces"
  ],
  [
    "تفاصيل إيجارية",
    "Leasing Details"
  ],
  [
    "الوصف: الطابق 15، يربط الأبراج الأربعة، 1,200م²، سوبرماركت، مقهى، جلسات خارجية.",
    "Description: Level 15, connecting the four towers, 1,200 m², supermarket, café, and outdoor seating."
  ],
  [
    "مساحات تجارية وخدمية مدمجة",
    "Integrated Commercial and Service Spaces"
  ],
  [
    "تصميم يربط ويعزز التنقل بين الأبراج",
    "A Design that Connects and Enhances Mobility Between the Towers"
  ],
  [
    "مساحات عرض ومناظر خارجية",
    "Display Spaces and Outdoor Views"
  ],
  [
    "اطلب مخطط",
    "Request Layout"
  ],
  [
    "4 مشاوي شاورما (لحم • دجاج • سجق • ديك رومي)",
    "4 Shawarma Grills (Beef • Chicken • Sausage • Turkey)"
  ],
  [
    "نظام تبريد ذكي بسعة 800 كجم",
    "Smart Cooling System with 800 kg Capacity"
  ],
  [
    "شاشة OLED 85 بوصة لعروض القائمة والإعلانات",
    "85-inch OLED Screen for Menu Displays and Advertising"
  ],
  [
    "نظام طلب بالذكاء الاصطناعي وتقطيع روبوتي",
    "AI Ordering System and Robotic Slicing"
  ],
  [
    "خدمة توصيل بالدرون ومخطط داخلي تفاعلي AR",
    "Drone Delivery Service and Interactive AR Interior Plan"
  ],
  [
    "اطلب عرض الشاحنة",
    "Request Truck Proposal"
  ],
  [
    "الوصف: نظام متكامل للإنتاج والتغذية والمراقبة الذكية لتخفيض التكلفة التشغيلية وتحسين الجودة مع إعادة تدوير المخلفات وتحويلها إلى وقود حيوي.",
    "Description: An integrated system for production, feeding, and smart monitoring to reduce operating costs and improve quality, with waste recycling and conversion into biofuel."
  ],
  [
    "مزرعة دواجن آلية بطاقة 50,000 دجاجة شهريًا",
    "Automated Poultry Farm with Capacity of 50,000 Chickens per Month"
  ],
  [
    "تغذية آلية وتحكم مناخي ومراقبة صحة بالـ AI",
    "Automated Feeding, Climate Control, and AI Health Monitoring"
  ],
  [
    "تقليل النفايات بنسبة 45٪ وإعادة تدوير وتحويل السماد لوقود",
    "45% Waste Reduction with Recycling and Fertilizer-to-Fuel Conversion"
  ],
  [
    "مصنع التتبيلة السرية وتعبئة ذكية وشراكات توريد عالمية",
    "Secret Marinade Factory, Smart Packaging, and Global Supply Partnerships"
  ],
  [
    "اطلب شراكة توريد",
    "Request a Supply Partnership"
  ],
  [
    "الوصف: حلول متكاملة لنقل المأكولات البحرية الحية وتقديمها داخل مطاعم ذكية فاخرة مع تحكم حراري دقيق، أنظمة أكسجين وفلترة متقدمة، ومراقبة GPS+IoT على مدار الساعة.",
    "Description: Integrated solutions for transporting live seafood and serving it inside luxury smart restaurants with precise thermal control, advanced oxygen and filtration systems, and 24/7 GPS+IoT monitoring."
  ],
  [
    "شاحنات نقل مبردة ومراقبة GPS + IoT 24/7",
    "Refrigerated Transport Trucks with 24/7 GPS + IoT Monitoring"
  ],
  [
    "سلالات: سلمون • روبيان • كافيار (ستورجون)",
    "Varieties: Salmon • Shrimp • Caviar (Sturgeon)"
  ],
  [
    "أنظمة أكسجين متقدمة وفلترة مياه وتحكم حراري ±0.5°",
    "Advanced Oxygen Systems, Water Filtration, and Thermal Control ±0.5°"
  ],
  [
    "مطعم ذكي مع AI ordering، روبوتات مطبخ وجدران قوائم رقمية",
    "Smart Restaurant with AI Ordering, Kitchen Robots, and Digital Menu Walls"
  ],
  [
    "استفسر عن الخدمة",
    "Inquire About the Service"
  ],
  [
    "التقنيات المستخدمة",
    "Technologies Used"
  ],
  [
    "يتحكم في أنظمة المنازل الذكية، الأمان البيومتري، التعليم، وتجربة التسوق.",
    "Controls smart home systems, biometric security, education, and the shopping experience."
  ],
  [
    "اعتماد كامل على الطاقة الشمسية لتوفير كهرباء مجانية ومستدامة.",
    "Full reliance on solar energy to provide free and sustainable electricity."
  ],
  [
    "مدمج في أنظمة التعليم الذكي داخل الشقق والمدرسة.",
    "Integrated into smart education systems inside the apartments and the school."
  ],
  [
    "يربط جميع الأجهزة والأنظمة داخل المجمع لبيئة متكاملة.",
    "Connects all devices and systems within the complex for an integrated environment."
  ],
  [
    "تسمح بتغيير لون المنزل ومقاومة العوامل البيئية.",
    "Allows changing the house color and resisting environmental factors."
  ],
  [
    "بديل زجاجي مقاوم للصدمات، عازل حراريًا وصوتيًا، يقلل تكاليف الكهرباء بنسبة 30%.",
    "An impact-resistant glass alternative, thermally and acoustically insulating, reducing electricity costs by 30%."
  ],
  [
    "Mobile Smart Home video inserted for الشقة الذكية المتطورة",
    "Mobile Smart Home video inserted for Advanced Smart Apartment"
  ],
  [
    "لا منافس مباشر",
    "No Direct Competitor"
  ],
  [
    "1. عوائد استثنائية",
    "1. Exceptional Returns"
  ],
  [
    "2. نموذج إيرادات متنوع ومتكامل",
    "2. Diversified and Integrated Revenue Model"
  ],
  [
    "3. نقطة تعادل سريعة",
    "3. Fast Break-even Point"
  ],
  [
    "4. تدفقات نقدية مستدامة",
    "4. Sustainable Cash Flows"
  ],
  [
    "5. الاستدامة والتميز المالي",
    "5. Sustainability and Financial Excellence"
  ],
  [
    "سيناريو بناء منخفض التكلفة",
    "Low-cost Construction Scenario"
  ],
  [
    "الأرقام المذكورة أعلاه مستمدة من دراسات تفصيلية شاملة مع الحفاظ على سرية تفاصيل التكلفة الحساسة، وتضمن جميع السيناريوهات عوائد قوية تفوق ما يقدمه سوق العقارات التقليدي.",
    "The figures above are derived from comprehensive detailed studies while preserving the confidentiality of sensitive cost details, and all scenarios ensure strong returns that exceed what the traditional real estate market offers."
  ],
  [
    "مصادر بيانات موثوقة",
    "Reliable Data Sources"
  ],
  [
    "سرية التكاليف",
    "Cost Confidentiality"
  ],
  [
    "تحديثات ربع سنوية",
    "Quarterly Updates"
  ],
  [
    "سنة",
    "Year"
  ],
  [
    "نقطة تعادل",
    "Break-even Point"
  ],
  [
    "نطاق العائد",
    "Return Range"
  ],
  [
    "متكرر",
    "Recurring"
  ],
  [
    "إيرادات اشتراكات",
    "Subscription Revenue"
  ],
  [
    "مشروع ROBOT HOUSE ليس مجرد تطوير عقاري، بل منصة متكاملة للعيش والعمل والاستثمار ضمن بيئة ذكية ومستدامة. عوائده المرتفعة ونموذج إيراداته المتنوع يجعلانه الخيار الأمثل لصناديق الاستثمار والمستثمرين الباحثين عن فرص رائدة في مستقبل العقارات.",
    "The ROBOT HOUSE project is not merely a real estate development, but an integrated platform for living, working, and investing within a smart and sustainable environment. Its high returns and diversified revenue model make it the ideal choice for investment funds and investors seeking leading opportunities in the future of real estate."
  ],
  [
    "تنوع الإيرادات",
    "Revenue Diversification"
  ],
  [
    "مبيعات، اشتراكات، خدمات",
    "Sales, Subscriptions, Services"
  ],
  [
    "حماية المستثمر",
    "Investor Protection"
  ],
  [
    "عقود واضحة وضمانات",
    "Clear Contracts and Guarantees"
  ],
  [
    "استدامة",
    "Sustainability"
  ],
  [
    "توفير تشغيل طويل الأمد",
    "Long-term Operational Savings"
  ],
  [
    "ابتكار",
    "Innovation"
  ],
  [
    "أمان",
    "Security"
  ],
  [
    "طاقة مجانية",
    "Free Energy"
  ],
  [
    "AI مدمج",
    "Built-in AI"
  ],
  [
    "📄 تحميل دراسة الجدوى 1 (PDF)",
    "📄 Download Feasibility Study 1 (PDF)"
  ],
  [
    "📄 تحميل دراسة الجدوى 2 (PDF)",
    "📄 Download Feasibility Study 2 (PDF)"
  ],
  [
    "📄 تحميل الترخيص (PDF)",
    "📄 Download License (PDF)"
  ],
  [
    "أحمد العمري",
    "Ahmad Al-Omari"
  ],
  [
    "فاطمة الزهراني",
    "Fatimah Al-Zahrani"
  ],
  [
    "خالد سعيد",
    "Khaled Saeed"
  ],
  [
    "ليلى محمود",
    "Laila Mahmoud"
  ],
  [
    "يوسف العلي",
    "Yousef Al Ali"
  ],
  [
    "سلمى النجار",
    "Salma Al-Najjar"
  ],
  [
    "مروان الخطيب",
    "Marwan Al-Khatib"
  ],
  [
    "محبوب",
    "Popular"
  ],
  [
    "سريع الاستجابة",
    "Responsive"
  ],
  [
    "يسعدنا تواصلكم معنا للاستفسار عن المشروع، فرص الاستثمار، أو الشراكات المحتملة.",
    "We are pleased to hear from you regarding the project, investment opportunities, or potential partnerships."
  ],
  [
    "البريد المباشر",
    "Direct Email"
  ],
  [
    "الهاتف (الأردن)",
    "Phone (Jordan)"
  ],
  [
    "الهاتف (الإمارات)",
    "Phone (UAE)"
  ],
  [
    "الموقع",
    "Location"
  ],
  [
    "عرض الخريطة",
    "View Map"
  ],
  [
    "الاسم الكامل",
    "Full Name"
  ],
  [
    "البريد الإلكتروني",
    "Email Address"
  ],
  [
    "رقم الهاتف",
    "Phone Number"
  ],
  [
    "نوع الطلب",
    "Inquiry Type"
  ],
  [
    "استفسار عام",
    "General Inquiry"
  ],
  [
    "شراكة",
    "Partnership"
  ],
  [
    "استثمار",
    "Investment"
  ],
  [
    "طلب عرض سعر",
    "Request Quote"
  ],
  [
    "رسالتك",
    "Your Message"
  ],
  [
    "إرسال الرسالة",
    "Send Message"
  ],
  [
    "رؤية مستقبلية لمجمعات سكنية ذكية ومتكاملة، تجمع بين الفخامة، الاستدامة، والتكنولوجيا المتطورة لخلق بيئة معيشية لا مثيل لها.",
    "A future vision for integrated smart residential communities that combine luxury, sustainability, and advanced technology to create an unmatched living environment."
  ],
  [
    "مساعد ROBOT HOUSE الذكي",
    "ROBOT HOUSE Smart Assistant"
  ],
  [
    "الروبوت:",
    "Bot:"
  ],
  [
    "مرحبا! كيف يمكنني مساعدتك في مشروع المدن الذكية؟",
    "Hello! How can I help you with the smart city project?"
  ],
  [
    "مرحباً! كيف يمكنني مساعدتك في مشروع المدن الذكية؟",
    "Hello! How can I help you with the smart city project?"
  ],
  [
    "إرسال",
    "Send"
  ],
  [
    "اكتب سؤالك...",
    "Type your question..."
  ],
  [
    "تبديل اللغة",
    "Switch Language"
  ],
  [
    "❌ الرجاء إدخال كلمة المرور.",
    "❌ Please enter the password."
  ],
  [
    "✔️ تم فتح الملفات مؤقتًا لمدة 30 ثانية.",
    "✔️ Files have been unlocked temporarily for 30 seconds."
  ],
  [
    "⏳ انتهت المهلة. تم إغلاق الملفات تلقائيًا.",
    "⏳ Time expired. The files were locked automatically."
  ],
  [
    "✔️ تم التحقق — روابط التنزيل مُمكّنة الآن.",
    "✔️ Verified — download links are now enabled."
  ],
  [
    "❌ كلمة مرور خاطئة. تواصل معنا لطلب كلمة المرور.",
    "❌ Incorrect password. Contact us to request the password."
  ],
  [
    "✅ تم إرسال رسالتك، سيتواصل معك فريق ROBOT HOUSE قريباً.",
    "✅ Your message has been sent. The ROBOT HOUSE team will contact you soon."
  ],
  [
    "أنت",
    "You"
  ],
  [
    "يمكنك الاستفسار عن الاستثمار (عائد يصل إلى 94%)، المنتجات، أو طلب كلمة المرور لدراسة الجدوى.",
    "You can ask about investment (with returns up to 94%), the products, or request the password for the feasibility study."
  ],
  [
    "سعر",
    "Price"
  ],
  [
    "تكلفة",
    "Cost"
  ],
  [
    "أسعار الشقق تنافسية، وسعر السيارة البرمائية 50,000 دولار. تواصل مع المبيعات للحصول على عرض سعر مفصل.",
    "Apartment prices are competitive, and the amphibious vehicle is priced at $50,000. Contact sales for a detailed quotation."
  ],
  [
    "عائد",
    "Return"
  ],
  [
    "العائد على الاستثمار يتراوح بين 43% و94% حسب السيناريو. يمكننا إرسال المستعرض المالي عبر البريد.",
    "Return on investment ranges between 43% and 94% depending on the scenario. We can send the financial overview by email."
  ],
  [
    "كلمة المرور",
    "Password"
  ],
  [
    "كلمة المرور لدراسة الجدوى: RoboFuture2025 (يمكنك تجربتها في قسم الاستثمار).",
    "The password for the feasibility study is: RoboFuture2025 (you can try it in the investment section)."
  ],
  [
    "روبوت HOUSE",
    "ROBOT HOUSE Bot"
  ],
  [
    "كتم / تشغيل الصوت",
    "Mute / Unmute Sound"
  ],
  [
    "مستوى الصوت",
    "Volume Level"
  ],
  [
    "تصغير الفيديو",
    "Zoom Out Video"
  ],
  [
    "تكبير الفيديو",
    "Zoom In Video"
  ],
  [
    "تكبير النافذة",
    "Expand Window"
  ],
  [
    "إعادة الضبط",
    "Reset"
  ],
  [
    "ادخل اسمك",
    "Enter your name"
  ],
  [
    "ادخل بريدك",
    "Enter your email"
  ],
  [
    "ادخل رقم هاتفك",
    "Enter your phone number"
  ],
  [
    "اكتب رسالتك هنا...",
    "Write your message here..."
  ]
];
  const arToEn = new Map(pairs);
  const enToAr = new Map(pairs.map(([ar, en]) => [en, ar]));
  const ATTRS = ['placeholder', 'title', 'aria-label', 'value', 'alt'];

  function normalize(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function currentLang() {
    const saved = localStorage.getItem('site-lang') || document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar') || 'ar';
    return saved === 'en' ? 'en' : 'ar';
  }

  function translate(value, lang) {
    const key = normalize(value);
    if (!key) return value;
    if (lang === 'en') return arToEn.get(key) || value;
    return enToAr.get(key) || value;
  }

  function setLanguageChrome(lang) {
    const dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.setAttribute('dir', dir);
    document.body.classList.toggle('site-en', lang === 'en');
    document.body.classList.toggle('site-ar', lang !== 'en');

    const btn = document.getElementById('site-lang-toggle');
    const label = document.getElementById('site-lang-label');
    if (btn && label) {
      btn.setAttribute('title', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
      btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
      label.textContent = lang === 'ar' ? 'EN' : 'ع';
    }
  }

  function replaceTextNodes(lang) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(tag)) return NodeFilter.FILTER_REJECT;
        const value = normalize(node.nodeValue);
        return value ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const updates = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const translated = translate(node.nodeValue, lang);
      if (translated !== node.nodeValue) updates.push([node, translated]);
    }
    updates.forEach(([node, translated]) => {
      node.nodeValue = translated;
    });
  }

  function replaceAttributes(lang) {
    document.querySelectorAll('*').forEach((el) => {
      ATTRS.forEach((attr) => {
        if (!el.hasAttribute(attr)) return;
        const current = el.getAttribute(attr);
        const translated = translate(current, lang);
        if (translated !== current) el.setAttribute(attr, translated);
      });
      if (el.tagName === 'OPTION') {
        const translated = translate(el.textContent, lang);
        if (translated !== el.textContent) el.textContent = translated;
      }
    });
  }

  function replaceTitle(lang) {
    const translated = translate(document.title, lang);
    if (translated) document.title = translated;
  }

  function replaceImageAlts(lang) {
    document.querySelectorAll('img').forEach((img, index) => {
      const current = img.getAttribute('alt') || '';
      const trimmed = normalize(current);
      if (/^صورة\s+\d+$/.test(trimmed) && lang === 'en') {
        img.setAttribute('alt', trimmed.replace(/^صورة\s+(\d+)$/, 'Image $1'));
      } else if (/^Image\s+\d+$/i.test(trimmed) && lang === 'ar') {
        img.setAttribute('alt', trimmed.replace(/^Image\s+(\d+)$/i, 'صورة $1'));
      } else if (!trimmed) {
        img.setAttribute('alt', lang === 'en' ? `Image ${index + 1}` : `صورة ${index + 1}`);
      }
    });
  }

  function apply(lang) {
    const safeLang = lang === 'en' ? 'en' : 'ar';
    setLanguageChrome(safeLang);
    replaceTitle(safeLang);
    replaceTextNodes(safeLang);
    replaceAttributes(safeLang);
    replaceImageAlts(safeLang);
    window.dispatchEvent(new CustomEvent('site-language-applied', { detail: { lang: safeLang } }));
  }

  let scheduled = false;
  function scheduleApply(lang) {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply(lang || currentLang());
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    scheduleApply(currentLang());
    const observer = new MutationObserver(() => scheduleApply(currentLang()));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

    const langBtn = document.getElementById('site-lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        setTimeout(() => scheduleApply(currentLang()), 30);
      });
    }
  });

  window.addEventListener('storage', (event) => {
    if (!event.key || event.key === 'site-lang') scheduleApply(currentLang());
  });

  window.addEventListener('site-language-applied', (event) => {
    const lang = event?.detail?.lang || currentLang();
    if ((lang === 'en' && document.documentElement.dir !== 'ltr') || (lang !== 'en' && document.documentElement.dir !== 'rtl')) {
      setLanguageChrome(lang);
    }
  });

  window.__robotHouseExactBilingualApply = apply;
})();
