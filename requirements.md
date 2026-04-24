# وثيقة المتطلبات — وكيل الذكاء الصوتي المتطور
# Requirements Document — Advanced Voice AI Agent

## المقدمة / Introduction

تطوير الملف `voice-nav.js` الحالي ليصبح وكيل ذكاء اصطناعي صوتي كامل ومتطور لموقع شركة **ROBOT HOUSE FZ LLC**. يدعم الوكيل اللغتين العربية والإنجليزية، ويتحكم في الصفحة بالكامل بالصوت، ويملأ كلمات المرور تلقائياً، ويتكامل مع Groq API للإجابة على أي سؤال بحرية كاملة.

The current `voice-nav.js` file is to be upgraded into a full advanced AI voice agent for the **ROBOT HOUSE FZ LLC** website. The agent supports Arabic and English, provides full voice-driven page control, auto-fills passwords, and integrates with Groq API to answer any question freely.

---

## المسرد / Glossary

- **Voice_Agent**: وكيل الذكاء الاصطناعي الصوتي — الـ JavaScript module الذي يدير الاستماع والتحدث والأوامر
- **Wake_Word**: كلمة الاستيقاظ — العبارة الصوتية التي تُنشّط الوكيل ("روبوت استيقظ" / "robot wake up")
- **STT**: Speech-to-Text — تقنية تحويل الكلام إلى نص (Web Speech API)
- **TTS**: Text-to-Speech — تقنية تحويل النص إلى كلام (SpeechSynthesis API)
- **Groq_API**: واجهة Groq البرمجية — مزود نموذج اللغة الكبير (LLM) المستخدم في الإجابات الحرة
- **Password_Modal**: نافذة كلمة المرور — العنصر `#rhPassModal` في الصفحة الذي يطلب كلمة المرور للمحتوى المحمي
- **Feasibility_Box**: قسم دراسات الجدوى المحمي — العنصر `#passwordBox` في قسم المستثمرين
- **Protected_Files**: الملفات المحمية — روابط PDF داخل `#protectedFilesList`
- **System_Prompt**: نص التهيئة المُرسَل إلى Groq_API مع كل محادثة ليعرّف الوكيل بالشركة
- **Theme**: ثيم الصفحة — نمط بصري يُطبَّق عبر `window.applyTheme()`
- **Video_Modal**: نافذة الفيديو — `#rh-video-modal` لعرض الفيديوهات
- **Image_Modal**: نافذة الصورة — `#rh-img-modal` لعرض الصور

---

## المتطلبات / Requirements

---

### المتطلب 1: كلمة الاستيقاظ والتحكم في النشاط
**Requirement 1: Wake Word & Activity Control**

**User Story (AR):** بوصفي زائراً للموقع، أريد تفعيل الوكيل بكلمة صوتية دون لمس أي زر، لكي أتحكم في الموقع بالصوت بالكامل.
**User Story (EN):** As a site visitor, I want to activate the agent with a voice command without touching any button, so that I can control the site entirely by voice.

#### معايير القبول / Acceptance Criteria

1. WHEN المستخدم يقول "روبوت استيقظ" أو "robot wake up" أو "wake up robot", THE Voice_Agent SHALL ينتقل إلى حالة النشاط (isAwake = true) ويبدأ الاستماع المستمر ويُصدر تأكيداً صوتياً.
2. WHILE الـ Voice_Agent في حالة النشاط, THE Voice_Agent SHALL يستمع لكل أمر صوتي ويعالجه.
3. WHILE الـ Voice_Agent ليس في حالة نشاط, THE Voice_Agent SHALL يتجاهل جميع الأوامر الصوتية باستثناء كلمة الاستيقاظ.
4. WHEN المستخدم يقول "توقف" أو "stop" أو "نم" أو "sleep", THE Voice_Agent SHALL ينتقل إلى حالة الراحة ويوقف الاستماع.
5. THE Voice_Agent SHALL لا يستجيب لأي أمر قبل سماع كلمة الاستيقاظ.
6. WHEN المستخدم يضغط على زر الميكروفون `#rh-mic` في الصفحة, THE Voice_Agent SHALL يتبادل بين حالة النشاط والراحة.

---

### المتطلب 2: فتح قسم دراسات الجدوى المحمي تلقائياً
**Requirement 2: Auto-Unlock Feasibility Studies Section**

**User Story (AR):** بوصفي مستثمراً، أريد أن يفتح الوكيل قسم دراسات الجدوى المحمي تلقائياً بالصوت، لكي أصل إلى الملفات دون الحاجة لإدخال كلمة المرور يدوياً.
**User Story (EN):** As an investor, I want the agent to auto-unlock the feasibility studies section by voice, so I can access the files without manually entering the password.

#### معايير القبول / Acceptance Criteria

1. WHEN المستخدم يطلب دراسات الجدوى أو الملفات المحمية صوتياً, THE Voice_Agent SHALL يتنقل إلى قسم المستثمرين `#investors`.
2. WHEN Voice_Agent يُنفّذ أمر فتح دراسات الجدوى, THE Voice_Agent SHALL يُدخِل قيمة `"123ALAMMIRI"` في حقل `#docPassword` ويُطلِق حدث النقر على الزر `#unlockBtn` برمجياً.
3. WHEN يتم إدخال كلمة المرور بنجاح, THE Voice_Agent SHALL يُعلن صوتياً بأن الملفات متاحة لمدة 30 ثانية ويقرأ أسماء الملفات المتاحة.
4. WHEN Voice_Agent يُعلن عن الملفات المتاحة, THE Voice_Agent SHALL يقول: "أي ملف تريد أن أحمّله لك؟ تحميل دراسة الجدوى 1، تحميل دراسة الجدوى 2، تحميل الترخيص".
5. WHEN المستخدم يطلب تحميل ملف محدد صوتياً, THE Voice_Agent SHALL ينقر على الرابط المقابل `#file1` أو `#file2` أو `#file3` برمجياً.
6. IF انتهت مهلة الـ 30 ثانية وأغلقت الملفات, THEN THE Voice_Agent SHALL يُعلم المستخدم صوتياً بانتهاء المهلة.
7. IF كان العنصر `#passwordBox` أو `#docPassword` غير موجود في الصفحة, THEN THE Voice_Agent SHALL يُعلم المستخدم صوتياً بعدم توفر القسم.

---

### المتطلب 3: فتح نافذة Food Truck / Shawarma المحمية تلقائياً
**Requirement 3: Auto-Unlock Food Truck & Shawarma Protected Window**

**User Story (AR):** بوصفي زائراً، أريد أن يفتح الوكيل نوافذ Food Truck وShawarma المحمية تلقائياً بكلمة المرور، لكي أصل إلى المحتوى دون تدخل يدوي.
**User Story (EN):** As a visitor, I want the agent to auto-unlock the Food Truck and Shawarma protected popups, so I can access the content without manual intervention.

#### معايير القبول / Acceptance Criteria

1. WHEN المستخدم يطلب فتح "فود تراك" أو "food truck" أو "شاورما" أو "shawarma" صوتياً, THE Voice_Agent SHALL يستدعي الدالة `window.rhOpenProtected('ft')` أو `window.rhOpenProtected('sw')` بحسب الطلب.
2. WHEN تفتح نافذة `#rhPassModal`, THE Voice_Agent SHALL يُدخِل قيمة `"123ALAMMIRI"` في حقل `#rhPassInput` ويستدعي الدالة `window.rhSubmitPass()` برمجياً بعد تأخير 300 مللي ثانية.
3. WHEN تنفتح الصفحة الخارجية بعد إدخال كلمة المرور, THE Voice_Agent SHALL يُعلن صوتياً أن المحتوى يُفتح.
4. IF لم تكن الدالة `window.rhOpenProtected` موجودة, THEN THE Voice_Agent SHALL يُعلم المستخدم صوتياً بعدم توفر الخاصية حالياً.

---

### المتطلب 4: System Prompt الكامل لمعلومات الشركة
**Requirement 4: Complete Company System Prompt**

**User Story (AR):** بوصفي مستخدماً، أريد أن يعرف الوكيل كل معلومات ROBOT HOUSE، لكي يجيبني بدقة على أي سؤال عن الشركة ومنتجاتها.
**User Story (EN):** As a user, I want the agent to know all ROBOT HOUSE information, so it can accurately answer any question about the company and its products.

#### معايير القبول / Acceptance Criteria

1. THE Voice_Agent SHALL يُضمّن في `SYSTEM_PROMPT` المُرسَل إلى Groq_API جميع المعلومات التالية:
   - معلومات الهوية: ROBOT HOUSE FZ LLC، الموقع: راس الخيمة، الإمارات العربية المتحدة
   - قسم من نحن: رؤية الشركة ورسالتها
   - المنتجات العشرة: المجمع السكني الذكي (480 شقة، 4 أبراج، كهرباء مجانية، إنترنت 5 سنوات)، المركبات المبتكرة (سيارة روبوت برمائية 50,000 دولار، طائرة كهربائية شفافة، قطار ذكي)، المنزل الذكي المتنقل (مضاد للرصاص، مقاوم للحريق، جدران تغير لونها)، المدرسة الذكية (42,000 م²، 10 طوابق)، المول التجاري الذكي، الجسر المعلق (الطابق 15، 1200 م²)، شاحنة الشاورما (24 قدم، 420 وجبة يومياً)، المزرعة الذكية (50,000 دجاجة شهرياً)، نقل المأكولات البحرية، مصنع التتبيلة السرية
   - المعلومات المالية: ROI من 43% إلى 72%، نقطة التعادل سنة واحدة
   - معلومات التواصل: info@robothousefzllc.com، m.alammiri@robothousefzllc.com، +962 7853 53408، +971 567952199
2. THE Voice_Agent SHALL يتضمن في SYSTEM_PROMPT توجيهاً صريحاً بالإجابة على أي سؤال في العالم بحرية كاملة مثل ChatGPT.
3. THE Voice_Agent SHALL يتضمن في SYSTEM_PROMPT توجيهاً بالرد بنفس لغة المستخدم (عربية أو إنجليزية).
4. THE Voice_Agent SHALL يحتفظ بسجل المحادثة (conversationHistory) بحد أقصى 16 رسالة متداولة مع كل طلب إلى Groq_API.

---

### المتطلب 5: التنقل الصوتي بين أقسام الصفحة
**Requirement 5: Voice Navigation Between Page Sections**

**User Story (AR):** بوصفي زائراً، أريد التنقل بين أقسام الصفحة بالصوت، لكي لا أحتاج إلى التمرير اليدوي.
**User Story (EN):** As a visitor, I want to navigate between page sections by voice, so I don't need to manually scroll.

#### معايير القبول / Acceptance Criteria

1. WHEN المستخدم يقول اسم قسم معروف مثل "الرئيسية" أو "home" أو "من نحن" أو "about" أو "المنتجات" أو "products", THE Voice_Agent SHALL يُمرّر الصفحة بسلاسة إلى القسم المقابل باستخدام `scrollIntoView`.
2. THE Voice_Agent SHALL يدعم التنقل إلى جميع الأقسام: home، about، products، technology، market، financials، investors، photo-album، testimonials، faq، contact.
3. WHEN تتم عملية التنقل, THE Voice_Agent SHALL يُعلن صوتياً بتأكيد التنقل.
4. IF لم يُوجد القسم المطلوب في الصفحة, THEN THE Voice_Agent SHALL يُبلّغ المستخدم صوتياً.

---

### المتطلب 6: تغيير الثيمات بالصوت
**Requirement 6: Voice Theme Switching**

**User Story (AR):** بوصفي مستخدماً، أريد تغيير ثيم الصفحة بالصوت، لكي أُخصّص تجربتي البصرية.
**User Story (EN):** As a user, I want to change the page theme by voice, so I can personalize my visual experience.

#### معايير القبول / Acceptance Criteria

1. WHEN المستخدم يطلب ثيماً صوتياً مثل "ثيم ذهبي" أو "gold" أو "ثيم أسود" أو "dark", THE Voice_Agent SHALL يستدعي `window.applyTheme()` بالقيمة المناسبة.
2. THE Voice_Agent SHALL يدعم على الأقل الثيمات التالية: gold-diamond، dark، white، white-natural.
3. WHEN يتم تغيير الثيم, THE Voice_Agent SHALL يُعلن صوتياً بتأكيد تغيير الثيم.
4. IF لم تكن الدالة `window.applyTheme` موجودة, THEN THE Voice_Agent SHALL يُعلم المستخدم صوتياً بعدم توفر هذه الخاصية.

---

### المتطلب 7: عرض الصور بالصوت
**Requirement 7: Voice Image Display**

**User Story (AR):** بوصفي زائراً، أريد عرض أي صورة من ألبوم الشركة بالصوت، لكي أستكشف الصور بسهولة.
**User Story (EN):** As a visitor, I want to display any company album image by voice, so I can browse photos easily.

#### معايير القبول / Acceptance Criteria

1. WHEN المستخدم يقول "اعرض صورة رقم X" أو "show image X" حيث X رقم بين 1 و140, THE Voice_Agent SHALL يُظهر الصورة المقابلة في نافذة Image_Modal.
2. WHEN تُعرض الصورة, THE Voice_Agent SHALL يُعلن صوتياً رقم الصورة المعروضة.
3. IF كان الرقم خارج النطاق 1–140, THEN THE Voice_Agent SHALL يُبلّغ المستخدم صوتياً بالنطاق الصحيح.
4. WHEN المستخدم يقول "اغلق" أو "close", THE Voice_Agent SHALL يُغلق نافذة العرض ويُعلن صوتياً بالإغلاق.

---

### المتطلب 8: عرض الفيديوهات بالصوت
**Requirement 8: Voice Video Playback**

**User Story (AR):** بوصفي زائراً، أريد تشغيل أي فيديو من قائمة الشركة بالصوت، لكي أتصفح محتوى الفيديو بحرية.
**User Story (EN):** As a visitor, I want to play any company video by voice, so I can freely browse video content.

#### معايير القبول / Acceptance Criteria

1. WHEN المستخدم يقول "اعرض الفيديوهات" أو "show videos" أو "قائمة الفيديو", THE Voice_Agent SHALL يعرض قائمة الفيديوهات المتاحة في نافذة Video_List_Modal ويقرأ أسماءها بالصوت.
2. THE Voice_Agent SHALL يدعم اختيار الفيديو برقمه (1–12) أو باسمه العربي أو الإنجليزي.
3. WHEN يختار المستخدم فيديو, THE Voice_Agent SHALL يُشغّله في Video_Modal ويُعلن اسمه صوتياً.
4. THE Voice_Agent SHALL يدعم جميع الفيديوهات المُعرَّفة في مصفوفة VIDEO_LIST بما فيها فيديوهات: الهيدر، من نحن، المجمع السكني، المركبات، لماذا نستثمر، الشقة الذكية، القطار الذكي، الاستثمار، الشاورما، المزرعة، الأسماك، التوابل.
5. WHILE قائمة الفيديوهات مفتوحة, THE Voice_Agent SHALL يبقى في حالة انتظار اختيار الفيديو (pendingVideoChoice = true).

---

### المتطلب 9: الإجابة الحرة عبر Groq API
**Requirement 9: Free-form Answers via Groq API**

**User Story (AR):** بوصفي مستخدماً، أريد أن يُجيب الوكيل على أي سؤال كما يفعل ChatGPT، لكي أحصل على معلومات كاملة بالصوت.
**User Story (EN):** As a user, I want the agent to answer any question like ChatGPT, so I can get comprehensive information by voice.

#### معايير القبول / Acceptance Criteria

1. WHEN لا يتطابق أمر المستخدم مع أي أمر تحكم محلي, THE Voice_Agent SHALL يُرسل النص إلى Groq_API باستخدام النموذج `llama-3.3-70b-versatile` مع System_Prompt الكامل.
2. WHEN تصل استجابة Groq_API, THE Voice_Agent SHALL يُعلنها صوتياً ويعرضها في Toast notification.
3. THE Voice_Agent SHALL يقتطع الرد الصوتي عند 400 حرف لتجنب الردود الطويلة جداً.
4. WHILE يُعالَج طلب Groq_API, THE Voice_Agent SHALL يعرض رسالة "جاري التفكير..." في الـ Toast.
5. IF حدث خطأ في الاتصال بـ Groq_API, THEN THE Voice_Agent SHALL يُعلم المستخدم صوتياً بخطأ الاتصال.
6. THE Voice_Agent SHALL لا يحذف أو يغير مفتاح API أو اسم النموذج أو رابط Groq_URL الموجودين في الكود الحالي.

---

### المتطلب 10: دعم اللغتين العربية والإنجليزية
**Requirement 10: Bilingual Arabic & English Support**

**User Story (AR):** بوصفي مستخدماً عربياً أو أجنبياً، أريد التحكم في الوكيل بكلا اللغتين، لكي تكون التجربة سلسة بغض النظر عن اللغة المستخدمة.
**User Story (EN):** As an Arabic or foreign user, I want to control the agent in both languages, so the experience is smooth regardless of the language used.

#### معايير القبول / Acceptance Criteria

1. THE Voice_Agent SHALL يكتشف لغة الموقع الحالية عبر `localStorage.getItem('site-lang')` ويُعيّن لغة STT وTTS بناءً عليها.
2. THE Voice_Agent SHALL يدعم الأوامر الصوتية باللغتين العربية والإنجليزية في وقت واحد بغض النظر عن لغة الموقع المحددة.
3. WHEN تكون لغة الموقع عربية, THE Voice_Agent SHALL يستخدم `ar-SA` لـ STT وTTS ويُنتج ردوداً ومؤشرات بالعربية.
4. WHEN تكون لغة الموقع إنجليزية, THE Voice_Agent SHALL يستخدم `en-US` لـ STT وTTS ويُنتج ردوداً ومؤشرات بالإنجليزية.
5. THE Voice_Agent SHALL يكتشف اللغة تلقائياً من نص الأمر الصوتي إذا كان الأمر بلغة مختلفة عن لغة الموقع.

---

### المتطلب 11: واجهة المستخدم للوكيل الصوتي
**Requirement 11: Voice Agent UI**

**User Story (AR):** بوصفي مستخدماً، أريد رؤية زر الميكروفون بحالاته المختلفة، لكي أعرف في أي وقت ما إذا كان الوكيل يستمع أو يتكلم أو نائم.
**User Story (EN):** As a user, I want to see the microphone button in its various states, so I always know whether the agent is listening, speaking, or idle.

#### معايير القبول / Acceptance Criteria

1. THE Voice_Agent SHALL يُنشئ زر الميكروفون `#rh-mic` ويُدرجه في شريط الأدوات بجوار `#theme-switcher`.
2. WHILE الوكيل في حالة النشاط (isAwake), THE Voice_Agent SHALL يعرض الزر بلون أخضر مع تأثير نبض.
3. WHILE الوكيل يستمع, THE Voice_Agent SHALL يعرض الزر بلون أحمر مع تأثير نبض.
4. WHILE الوكيل في حالة الراحة, THE Voice_Agent SHALL يعرض الزر بلون أزرق مائي بدون تأثير نبض.
5. THE Voice_Agent SHALL يدعم اختصار لوحة المفاتيح `Alt+M` لتبديل حالة الميكروفون.
6. THE Voice_Agent SHALL يعرض Toast notifications مؤقتة بالأسفل لإظهار النصوص المسموعة والردود.

---

### المتطلب 12: إصلاح الأخطاء الموجودة في الكود الحالي
**Requirement 12: Fix Existing Code Bugs**

**User Story (AR):** بوصفي مطوراً، أريد إصلاح الأخطاء القائمة في voice-nav.js، لكي يعمل الكود بشكل صحيح بدون أخطاء.
**User Story (EN):** As a developer, I want to fix existing bugs in voice-nav.js, so the code runs correctly without errors.

#### معايير القبول / Acceptance Criteria

1. THE Voice_Agent SHALL استبدال جميع استدعاءات الدالة غير المعرَّفة `startListening` بالدالة الصحيحة `startListen`.
2. THE Voice_Agent SHALL لا يحذف أي دالة أو متغير موجود في الكود الحالي.
3. THE Voice_Agent SHALL يحتفظ بجميع إعدادات الثوابت الموجودة: `GROQ_API_KEY`، `GROQ_MODEL`، `GROQ_URL`، `IMG_BASE`، `IMG_COUNT`، `VIDEO_LIST`، `NAV_MAP`، `THEME_MAP`.
