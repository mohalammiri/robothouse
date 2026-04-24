# وثيقة التصميم — وكيل الذكاء الصوتي المتطور
# Design Document — Advanced Voice AI Agent (ROBOT HOUSE)
<!-- v2 — updated with full SYSTEM_PROMPT, password unlock logic, wake-word design, bug fix, and correctness properties -->

---

## Overview

يُعدَّل ملف `voice-nav.js` الحالي ليصبح وكيل ذكاء اصطناعي صوتي متكامل. اسم الوكيل هو **ROBOT HOUSE** — مطابق لاسم الشركة. الوكيل مبني كـ IIFE (Immediately Invoked Function Expression) بلغة JavaScript خالصة، يعمل مباشرةً في المتصفح دون أي تبعيات خارجية سوى Web Speech API وGroq API.

- الوكيل في وضع السكون افتراضياً عند تحميل الصفحة.
- يُنشَّط بعبارة **"روبوت استيقظ"** وبعدها يبقى في وضع الاستماع المستمر حتى يُعطى أمر النوم.
- يجيب على أي سؤال في العالم بحرية كاملة عبر Groq API (llama-3.3-70b-versatile).
- يفتح المحتوى المحمي تلقائياً بكلمة المرور `123ALAMMIRI` دون تدخل يدوي.

### قرارات التصميم الرئيسية

- **اسم المساعد**: "ROBOT HOUSE" مُعرَّف في `SYSTEM_PROMPT` ويُستخدَم في جميع ردوده.
- **السكون الافتراضي**: `isAwake = false` عند التحميل — يتجاهل كل الأوامر إلا كلمة الاستيقاظ.
- **الاستماع المستمر**: بعد الاستيقاظ، تُعيد دورة STT تشغيل نفسها تلقائياً في `r.onend` و`u.onend` دون الحاجة لأي ضغطة زر.
- **الأولوية الهرمية للأوامر**: كلمة الاستيقاظ ← النوم ← الإغلاق ← الصور ← الفيديو ← التنقل ← الثيمات ← فتح المحتوى المحمي ← Groq API.
- **عدم حذف أي كود**: جميع الثوابت والدوال الموجودة تُحتفَظ وتُوسَّع فقط.
- **إصلاح الخطأ**: الكود الحالي يستدعي `startListening` (غير معرَّفة) في `speak()`. يجب استبدالها بـ `startListen` في كل موضع.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  voice-nav.js  (IIFE)                   │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐   ┌────────────┐  │
│  │  Web Speech  │───▶│  Command     │──▶│  Groq API  │  │
│  │  API (STT)   │    │  Processor   │   │  (LLM)     │  │
│  └──────────────┘    └──────┬───────┘   └────────────┘  │
│                             │                           │
│         ┌───────────────────┼───────────────────┐       │
│         ▼           ▼       ▼       ▼           ▼       │
│    Navigation   Password  Media  Theme      Speech      │
│    (NAV_MAP)    Unlocker  Modal  Switcher   Synthesis   │
│                           ┌─────┐           (TTS)       │
│                           │Img  │                       │
│                           │Video│                       │
│                           └─────┘                       │
└─────────────────────────────────────────────────────────┘
```

### دورة حياة الأوامر

```
المستخدم يتكلم
       │
       ▼
SpeechRecognition.onresult
       │
       ▼
processCommand(text)
       │
       ├─ هل isAwake = false؟
       │        ├─ نعم: هل wake word؟ → isAwake=true → speak()
       │        └─ لا: تجاهل تام
       │
       └─ isAwake = true:
            ├─ sleep word → isAwake=false
            ├─ close → closeAll()
            ├─ image N → openImg(N)
            ├─ video list → showVideoList()
            ├─ pendingVideoChoice → openVideo()
            ├─ nav keyword → scrollIntoView()
            ├─ theme keyword → applyTheme()
            ├─ feasibility / password unlock → unlockDocs()
            ├─ food truck / shawarma → unlockProtected()
            └─ fallback → askGroq()
```

---

## Components and Interfaces

### 1. Constants (محتفَظ بها كما هي)

```javascript
GROQ_API_KEY  — string   // مفتاح Groq API (لا يُعدَّل)
GROQ_MODEL    — string   // 'llama-3.3-70b-versatile' (لا يُعدَّل)
GROQ_URL      — string   // endpoint URL (لا يُعدَّل)
IMG_BASE      — string   // قاعدة رابط الصور
IMG_COUNT     — number   // 140
VIDEO_LIST    — Array    // 12 فيديو
NAV_MAP       — Object   // خريطة أسماء الأقسام
THEME_MAP     — Object   // خريطة أسماء الثيمات
SYSTEM_PROMPT — string   // موسَّع بمعلومات الشركة الكاملة
```

### 2. State Variables

```javascript
isAwake          — boolean  // حالة اليقظة
isListening      — boolean  // حالة الاستماع النشط
isSpeaking       — boolean  // حالة النطق
recognition      — SpeechRecognition | null
conversationHistory — Array // سجل المحادثة (max 16)
pendingVideoChoice  — boolean // انتظار اختيار فيديو
```

### 3. Core Functions

| الدالة | الوصف |
|--------|-------|
| `init()` | نقطة الدخول — تُحقن CSS، DOM، زر الميك، STT |
| `processCommand(text)` | مُعالج الأوامر المركزي |
| `startListen()` | تشغيل جولة STT جديدة |
| `stopListen()` | إيقاف STT |
| `toggleMic()` | تبديل الحالة بضغطة زر |
| `speak(text, cb)` | TTS مع استئناف الاستماع تلقائياً بـ `startListen` (وليس `startListening`) |
| `showToast(msg, dur)` | إشعار مؤقت |
| `updateMic()` | تحديث CSS class للزر |
| `openImg(n)` | فتح Image Modal |
| `openVideo(url, title)` | فتح Video Modal |
| `showVideoList()` | عرض قائمة الفيديوهات |
| `closeAll()` | إغلاق جميع النوافذ |

### 4. New Functions (إضافات جديدة)

| الدالة | الوصف |
|--------|-------|
| `unlockDocs()` | حقن كلمة المرور في `#docPassword` والنقر على `#unlockBtn` |
| `unlockProtected(type)` | استدعاء `window.rhOpenProtected(type)` وحقن `#rhPassInput` |
| `askGroq(text)` | إرسال النص إلى Groq API وقراءة الرد |

### 5. DOM Elements (المُنشأة بواسطة الوكيل)

| العنصر | الغرض |
|--------|-------|
| `#rh-mic` | زر الميكروفون في شريط الأدوات |
| `#rh-toast` | إشعارات النص المؤقتة |
| `#rh-video-modal` | نافذة تشغيل الفيديو |
| `#rh-img-modal` | نافذة عرض الصور |
| `#rh-vlist-modal` | قائمة الفيديوهات |

---

## Data Models

### SYSTEM_PROMPT الكامل

هذا هو نص التهيئة الكامل الذي يُرسَل مع كل طلب إلى Groq API. يجب أن يُستبدَل به محتوى `SYSTEM_PROMPT` الحالي في `voice-nav.js`:

```javascript
var SYSTEM_PROMPT = `أنت وكيل ذكاء اصطناعي صوتي فائق الذكاء اسمك ROBOT HOUSE.
تمثّل شركة ROBOT HOUSE FZ LLC في رأس الخيمة، الإمارات العربية المتحدة.

=== من نحن ===
شركة ROBOT HOUSE FZ LLC شركة تقنية مبتكرة تجمع بين الذكاء الاصطناعي والهندسة المعمارية
الذكية لتقديم حلول متكاملة في السكن والمواصلات والتغذية والزراعة والتعليم والتجارة.
رؤيتنا: بناء مستقبل أكثر ذكاءً وراحةً واستدامة للإنسانية.
رسالتنا: تحويل الأفكار الثورية إلى واقع ملموس يخدم المجتمعات حول العالم.

=== المنتجات العشرة ===
1. المجمع السكني الذكي
   - 480 شقة موزعة على 4 أبراج
   - مساحة الشقة 400م²
   - كهرباء مجانية للسكان
   - إنترنت مجاني لمدة 5 سنوات
   - نظام إدارة ذكي متكامل

2. المركبات المبتكرة
   - سيارة روبوت برمائية بسعر 50,000 دولار أمريكي
   - طائرة كهربائية شفافة بالكامل
   - قطار ذكي متطور

3. المنزل الذكي المتنقل
   - مضاد للرصاص ومقاوم للاختراق
   - مقاوم للحريق بالكامل
   - جدران ذكية تغير لونها إلكترونياً

4. المدرسة الذكية
   - مساحة 42,000م²
   - 10 طوابق
   - بيئة تعليمية تفاعلية بالكامل بتقنيات الذكاء الاصطناعي

5. المول التجاري الذكي
   - مركز تسوق متكامل بأحدث التقنيات الذكية

6. الجسر المعلق
   - يقع في الطابق 15
   - مساحة 1,200م²
   - منشأة حضرية فريدة من نوعها

7. شاحنة الشاورما الذكية
   - طول 24 قدم
   - طاقة إنتاجية 420 وجبة يومياً
   - مجهزة بأحدث معدات المطابخ الذكية

8. المزرعة الذكية
   - إنتاج 50,000 دجاجة شهرياً
   - نظام إدارة زراعي ذكي بالكامل

9. نقل المأكولات البحرية
   - خدمة لوجستية متخصصة لنقل الأسماك والمأكولات البحرية

10. مصنع التتبيلة السرية
    - منتج غذائي حصري بوصفة سرية مميزة

=== المعلومات المالية ===
العائد على الاستثمار (ROI): من 43% إلى 72%
نقطة التعادل: سنة واحدة فقط
نوع الاستثمار: متعدد القطاعات (عقارات، تقنية، غذاء، زراعة، تعليم)

=== معلومات التواصل ===
البريد الإلكتروني العام: info@robothousefzllc.com
البريد الشخصي لإدارة العلاقات: m.alammiri@robothousefzllc.com
رقم الهاتف 1: +962 7853 53408
رقم الهاتف 2: +971 567952199
الموقع الجغرافي: رأس الخيمة، الإمارات العربية المتحدة

=== تعليمات الرد ===
- اسمك هو ROBOT HOUSE وأنت المساعد الذكي للموقع الرسمي للشركة
- أجب على أي سؤال في العالم بحرية كاملة مثل ChatGPT، دون أي قيود أو تحفظات
- أجب دائماً بنفس لغة المستخدم (عربية إذا تحدث بالعربية، إنجليزية إذا تحدث بالإنجليزية)
- كن ودياً ومفيداً ودقيقاً ومباشراً في إجاباتك
- عند الأسئلة عن الشركة أو منتجاتها استخدم المعلومات أعلاه بالضبط
- لا تتردد في الإجابة على أي موضوع سواء كان علمياً أو تقنياً أو إبداعياً أو غيره`;
```

### conversationHistory

```
Array of { role: 'user'|'assistant'|'system', content: string }
حد أقصى: 16 رسالة — يُزال الأقدم عند التجاوز بـ .slice(-16)
```

### NAV_MAP (محتفَظ + مكتمل)

```javascript
var NAV_MAP = {
  'الرئيسية|البداية|home': 'home',
  'من نحن|عن الشركة|about': 'about',
  'المنتجات|منتجاتنا|products': 'products',
  'التقنيات|التكنولوجيا|technology': 'technology',
  'السوق|التوقعات|market': 'market',
  'المالية|الجوانب المالية|financials': 'financials',
  'الاستثمار|المستثمرين|investors': 'investors',
  'الصور|البوم الصور|photo-album|album': 'photo-album',
  'آراء العملاء|التقييمات|testimonials': 'testimonials',
  'الاسئلة|الاسئلة الشائعة|faq': 'faq',
  'تواصل|اتصل بنا|contact': 'contact'
};
```

### THEME_MAP (محتفَظ)

```javascript
var THEME_MAP = {
  'ذهبي|ذهب|الذهبي|ملكي|gold': 'gold-diamond',
  'اسود|داكن|الاسود|dark': 'dark',
  'ابيض|فاتح|الابيض|white': 'white',
  'زجاجي|الزجاجي|glass': 'white-natural'
};
```

### منطق فتح قسم دراسات الجدوى (unlockDocs)

دالة `unlockDocs()` تنفّذ التسلسل التالي بالكامل برمجياً:

```
unlockDocs():
  1. el = document.getElementById('investors')
     IF !el → speak('قسم المستثمرين غير موجود') ; RETURN
  2. el.scrollIntoView({ behavior:'smooth', block:'start' })
  3. boxEl = document.getElementById('passwordBox')
     IF !boxEl → speak('قسم دراسات الجدوى غير متاح حالياً') ; RETURN
  4. docPass = document.getElementById('docPassword')
     IF !docPass → speak('حقل كلمة المرور غير موجود') ; RETURN
  5. unlockBtn = document.getElementById('unlockBtn')
     IF !unlockBtn → speak('زر الفتح غير موجود') ; RETURN
  6. docPass.value = '123ALAMMIRI'
  7. unlockBtn.click()   // يُطلَق حدث click برمجياً
  8. speak('تم فتح الملفات. أي ملف تريد أن أحمّله لك؟
            تحميل دراسة الجدوى 1، تحميل دراسة الجدوى 2، تحميل الترخيص.')
  9. _closeTimer = setTimeout(function() {
       speak('انتهت مهلة الوصول للملفات.')
     }, 30000)   // 30 ثانية

أوامر تحميل الملفات (بعد فتح القسم):
  - "تحميل دراسة الجدوى 1" | "file 1" | "ملف 1"
      → document.getElementById('file1').click()
  - "تحميل دراسة الجدوى 2" | "file 2" | "ملف 2"
      → document.getElementById('file2').click()
  - "تحميل الترخيص" | "file 3" | "ملف 3" | "license"
      → document.getElementById('file3').click()
```

### منطق فتح نوافذ Food Truck & Shawarma (unlockProtected)

دالة `unlockProtected(type)` حيث `type = 'ft'` أو `'sw'`:

```
unlockProtected(type):
  1. IF typeof window.rhOpenProtected !== 'function'
       → speak('خاصية فتح المحتوى المحمي غير متاحة حالياً') ; RETURN
  2. window.rhOpenProtected(type)
     // تفتح هذه الدالة نافذة #rhPassModal
  3. setTimeout(function() {
       passInput = document.getElementById('rhPassInput')
       IF passInput:
         passInput.value = '123ALAMMIRI'
       IF typeof window.rhSubmitPass === 'function':
         window.rhSubmitPass()
     }, 300)   // تأخير 300ms لإتاحة الوقت لـ Modal يفتح
  4. speak(type === 'ft' ?
       'جاري فتح صفحة الفود تراك' :
       'جاري فتح صفحة الشاورما')

الأوامر المُشغِّلة لـ unlockProtected:
  - "فود تراك" | "food truck" | "فودتراك"  → unlockProtected('ft')
  - "شاورما" | "shawarma" | "شاحنة الشاورما" → unlockProtected('sw')
```

### إصلاح Bug: startListening → startListen

الكود الحالي في `speak()` يستدعي `startListening` وهي دالة غير معرَّفة. الدالة الصحيحة هي `startListen`. يوجد موضعان يجب إصلاحهما:

```javascript
// الكود الخاطئ (موجود في الملف الحالي في u.onend و u.onerror):
if(isAwake&&!isListening) setTimeout(startListening,500);

// الكود الصحيح:
if(isAwake&&!isListening) setTimeout(startListen,500);
```

يجب البحث عن `startListening` في كامل الملف واستبداله بـ `startListen` في كل مكان.

---

## Correctness Properties

*الخاصية (Property) هي سمة أو سلوك يجب أن يكون صحيحاً عبر جميع حالات تنفيذ النظام الصحيحة — وهي تمثّل جسراً بين المواصفات المقروءة والضمانات القابلة للتحقق آلياً.*

### تقييم التكرار بين الخصائص

بعد مراجعة جميع الخصائص المحتملة:

- **Property 1** و **Property 2** متكاملتان وليستا متكررتين (واحدة تختبر التفعيل، والأخرى تختبر التجاهل).
- **Property 6** و **Property 7** تُغطيان جانبَين مختلفَين من نفس الميزة (نطاق صحيح vs خاطئ) — لا تكرار.
- متطلبات كلمة المرور (2.2، 3.2) اختبارات مثال وليست خصائص عالمية — لا تدخل هنا.
- **Property 9** (Groq fallback) و **Property 2** (sleeping agent) قد تبدو متداخلتين لكنهما تختبران حالتَي isAwake مختلفتَين.

### Property 1: Wake Word Activates Agent

*For any* string matching the wake-word pattern (`روبوت استيقظ` / `robot wake up` / `wake up robot`), calling `processCommand` with that string while `isAwake = false` SHALL set `isAwake = true` and SHALL NOT leave the agent in sleep state.

**Validates: Requirements 1.1, 1.5**

---

### Property 2: Sleeping Agent Ignores All Non-Wake Commands

*For any* text string that does NOT match the wake-word pattern, when `isAwake = false`, calling `processCommand` SHALL produce no side effects — no DOM navigation, no modal state change, no Groq API fetch call, no TTS invocation.

**Validates: Requirements 1.3, 1.5**

---

### Property 3: Conversation History Never Exceeds 16 Messages

*For any* sequence of N user messages where N > 16, after processing each message the `conversationHistory` array length SHALL never exceed 16. The oldest messages are discarded first.

**Validates: Requirements 4.4**

---

### Property 4: Navigation Keyword Maps to Correct Section

*For any* keyword present in `NAV_MAP` keys (split by `|`), a `processCommand` call with that keyword while `isAwake = true` SHALL trigger `scrollIntoView` on the DOM element whose `id` matches the corresponding `NAV_MAP` value.

**Validates: Requirements 5.1, 5.2**

---

### Property 5: Theme Keyword Calls applyTheme with Correct Value

*For any* keyword present in `THEME_MAP` keys (split by `|`), a `processCommand` call with that keyword while `isAwake = true` SHALL invoke `window.applyTheme` with the exact string value mapped in `THEME_MAP` — no other value is acceptable.

**Validates: Requirements 6.1, 6.2**

---

### Property 6: Valid Image Number Opens Correct Image

*For any* integer N in the range [1, 140], calling `openImg(N)` SHALL set `#rh-modal-img.src` to `IMG_BASE + N + '.jpg'` and add class `rh-open` to `#rh-img-modal`.

**Validates: Requirements 7.1, 7.2**

---

### Property 7: Out-of-Range Image Number is Rejected Without Opening Modal

*For any* integer N where N < 1 or N > 140, processing an image command with N SHALL invoke `speak()` with an out-of-range error message AND SHALL NOT add class `rh-open` to `#rh-img-modal`.

**Validates: Requirements 7.3**

---

### Property 8: Video Index in Range Plays the Correct Video

*For any* integer i in [1, 12], when `pendingVideoChoice = true` and `processCommand` receives the string `String(i)`, `openVideo` SHALL be called with `VIDEO_LIST[i-1].url` and the corresponding title (`ar` or `en` depending on site language).

**Validates: Requirements 8.2**

---

### Property 9: Unmatched Command Triggers Groq API Fetch

*For any* text string that does NOT match any local command pattern (wake, sleep, close, image, video, navigation, theme, password unlock) while `isAwake = true`, calling `processCommand` SHALL invoke `fetch(GROQ_URL, ...)` exactly once with that text as a user message in the request body.

**Validates: Requirements 9.1**

---

### Property 10: TTS Is Always Truncated at 400 Characters

*For any* string of any length passed to `speak()`, the `SpeechSynthesisUtterance` text SHALL be at most 400 characters, enforced by `.substring(0, 400)` before the utterance is created.

**Validates: Requirements 9.3**

---

### Property 11: Bilingual Commands Execute Regardless of Site Language

*For any* command keyword that exists in `NAV_MAP` or `THEME_MAP` (whether Arabic or English), `processCommand` SHALL correctly identify and execute the intended action regardless of the value returned by `localStorage.getItem('site-lang')`.

**Validates: Requirements 10.2**

---

## Error Handling

| الحالة | السلوك |
|--------|--------|
| `#docPassword` غير موجود | `speak('قسم دراسات الجدوى غير متاح حالياً')` |
| `#unlockBtn` غير موجود | `speak('زر الفتح غير موجود')` |
| `window.rhOpenProtected` غير موجودة | `speak('خاصية فتح المحتوى غير متاحة حالياً')` |
| `window.applyTheme` غير موجودة | `speak('خاصية تغيير الثيم غير متاحة حالياً')` |
| رقم الصورة خارج النطاق | `speak('الرقم يجب أن يكون بين 1 و 140')` |
| القسم المطلوب غير موجود في DOM | `speak('القسم غير موجود في الصفحة')` |
| خطأ Groq API (network/timeout) | `speak('خطأ في الاتصال، حاول مرة أخرى')` |
| المتصفح لا يدعم SpeechRecognition | الوكيل يعمل بالنقر على `#rh-mic` فقط، بدون STT |
| المتصفح لا يدعم SpeechSynthesis | الأوامر تعمل صامتة مع Toast فقط |
| `recognition.onerror` (no-speech) | إعادة تشغيل `startListen` بعد 1000ms دون رسالة خطأ |
| `recognition.onerror` (other) | `showToast('خطأ في الميكروفون')` + إعادة تشغيل |

---

## Testing Strategy

### أنواع الاختبارات

#### 1. Unit Tests (اختبارات مبنية على الأمثلة)

تُركّز على السيناريوهات المحددة والحالات الطرفية:

| الحالة المُختبَرة | السلوك المتوقع |
|---|---|
| كلمات النوم `['توقف', 'stop', 'نم', 'sleep']` | `isAwake = false` |
| `toggleMic()` مرتين | العودة إلى الحالة الأصلية |
| SYSTEM_PROMPT يحتوي `'ROBOT HOUSE FZ LLC'` | `assert(SYSTEM_PROMPT.includes('ROBOT HOUSE FZ LLC'))` |
| SYSTEM_PROMPT يحتوي `'info@robothousefzllc.com'` | assert |
| SYSTEM_PROMPT يحتوي `'43%'` و `'420 وجبة'` | assert |
| `VIDEO_LIST.length` | `=== 12` |
| `NAV_MAP` يحتوي جميع الـ 11 section IDs | assert |
| `THEME_MAP` يحتوي `gold-diamond, dark, white, white-natural` | assert |
| `getLang()` يقرأ من localStorage | mock localStorage |
| `closeAll()` يُزيل `rh-open` ويوقف الفيديو | DOM check |
| خطأ Groq API | `speak` تُستدعى برسالة خطأ |
| الكود لا يحتوي `startListening` | grep على نص الملف |
| `unlockDocs()` مع DOM وهمي | `docPassword.value === '123ALAMMIRI'` و `unlockBtn.click` |
| `unlockDocs()` بدون `#docPassword` | `speak` تُستدعى برسالة الخطأ المناسبة |
| `unlockProtected('ft')` | `window.rhOpenProtected` تُستدعى بـ `'ft'` |
| `unlockProtected('sw')` بدون `window.rhOpenProtected` | `speak` تُستدعى برسالة عدم التوفر |
| بعد 300ms من `unlockProtected` | `rhPassInput.value === '123ALAMMIRI'` و `rhSubmitPass()` تُستدعى |

#### 2. Property-Based Tests (اختبارات الخصائص)

تستخدم مكتبة **fast-check** (JavaScript/npm) مع حد أدنى **100 تكرار** لكل خاصية.

```javascript
// تهيئة bيئة الاختبار
let mockIsAwake, mockSpokenTexts, mockFetchCalls, mockScrolledIds, mockAppliedThemes;
beforeEach(() => {
  mockIsAwake = false;
  mockSpokenTexts = [];
  mockFetchCalls = [];
  mockScrolledIds = [];
  mockAppliedThemes = [];
  // mock speak, fetch, DOM, window.applyTheme
});

// Feature: voice-ai-agent, Property 1: Wake Word Activates Agent
fc.assert(fc.property(
  fc.constantFrom('روبوت استيقظ', 'robot wake up', 'wake up robot'),
  (wakeWord) => {
    mockIsAwake = false;
    processCommand(wakeWord);
    return mockIsAwake === true;
  }
), { numRuns: 100 });

// Feature: voice-ai-agent, Property 2: Sleeping Agent Ignores All Non-Wake Commands
fc.assert(fc.property(
  fc.string({ minLength: 1 }).filter(s => !/روبوت استيقظ|robot wake up|wake up robot/i.test(s)),
  (cmd) => {
    mockIsAwake = false;
    processCommand(cmd);
    return mockFetchCalls.length === 0 &&
           mockScrolledIds.length === 0 &&
           mockAppliedThemes.length === 0 &&
           !document.getElementById('rh-img-modal').classList.contains('rh-open');
  }
), { numRuns: 200 });

// Feature: voice-ai-agent, Property 3: Conversation History Never Exceeds 16 Messages
fc.assert(fc.property(
  fc.integer({ min: 17, max: 100 }),
  (n) => {
    conversationHistory = [];
    for (let i = 0; i < n; i++) {
      conversationHistory.push({ role: 'user', content: 'msg' + i });
      if (conversationHistory.length > 16)
        conversationHistory = conversationHistory.slice(-16);
    }
    return conversationHistory.length <= 16;
  }
), { numRuns: 100 });

// Feature: voice-ai-agent, Property 4: Navigation Keyword Maps to Correct Section
fc.assert(fc.property(
  fc.constantFrom(...Object.keys(NAV_MAP).flatMap(k => k.split('|'))),
  (navKeyword) => {
    mockIsAwake = true;
    processCommand(navKeyword);
    const expectedId = Object.entries(NAV_MAP).find(([k]) =>
      new RegExp(k, 'i').test(navKeyword)
    )?.[1];
    return mockScrolledIds.includes(expectedId);
  }
), { numRuns: 100 });

// Feature: voice-ai-agent, Property 5: Theme Keyword Calls applyTheme with Correct Value
fc.assert(fc.property(
  fc.constantFrom(...Object.keys(THEME_MAP).flatMap(k => k.split('|'))),
  (themeKeyword) => {
    mockIsAwake = true;
    processCommand(themeKeyword);
    const expectedTheme = Object.entries(THEME_MAP).find(([k]) =>
      new RegExp(k, 'i').test(themeKeyword)
    )?.[1];
    return mockAppliedThemes.includes(expectedTheme);
  }
), { numRuns: 100 });

// Feature: voice-ai-agent, Property 6: Valid Image Number Opens Correct Image
fc.assert(fc.property(
  fc.integer({ min: 1, max: 140 }),
  (n) => {
    openImg(n);
    const img = document.getElementById('rh-modal-img');
    return img.src.endsWith(n + '.jpg') &&
           document.getElementById('rh-img-modal').classList.contains('rh-open');
  }
), { numRuns: 140 });

// Feature: voice-ai-agent, Property 7: Out-of-Range Image Number Rejected Without Modal
fc.assert(fc.property(
  fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 141 })),
  (n) => {
    const preOpen = document.getElementById('rh-img-modal').classList.contains('rh-open');
    processCommand('اعرض صورة رقم ' + n);
    return mockSpokenTexts.length > 0 &&
           !document.getElementById('rh-img-modal').classList.contains('rh-open');
  }
), { numRuns: 100 });

// Feature: voice-ai-agent, Property 8: Video Index in Range Plays Correct Video
fc.assert(fc.property(
  fc.integer({ min: 1, max: 12 }),
  (i) => {
    pendingVideoChoice = true;
    mockIsAwake = true;
    let playedUrl = null;
    mockOpenVideo = (url) => { playedUrl = url; };
    processCommand(String(i));
    return playedUrl === VIDEO_LIST[i - 1].url;
  }
), { numRuns: 100 });

// Feature: voice-ai-agent, Property 9: Unmatched Command Triggers Groq API Fetch
fc.assert(fc.property(
  fc.string({ minLength: 5, maxLength: 50 }).filter(s => !isLocalCommand(s)),
  (text) => {
    mockIsAwake = true;
    processCommand(text);
    return mockFetchCalls.length === 1 && mockFetchCalls[0].url === GROQ_URL;
  }
), { numRuns: 100 });

// Feature: voice-ai-agent, Property 10: TTS Is Always Truncated at 400 Characters
fc.assert(fc.property(
  fc.string({ minLength: 401, maxLength: 2000 }),
  (longText) => {
    let utteranceLength = null;
    const origSpeech = window.SpeechSynthesisUtterance;
    window.SpeechSynthesisUtterance = function(t) { utteranceLength = t.length; };
    speak(longText);
    window.SpeechSynthesisUtterance = origSpeech;
    return utteranceLength !== null && utteranceLength <= 400;
  }
), { numRuns: 100 });

// Feature: voice-ai-agent, Property 11: Bilingual Commands Execute Regardless of Site Language
fc.assert(fc.property(
  fc.record({
    cmd: fc.constantFrom('الرئيسية', 'home', 'المنتجات', 'products', 'ذهبي', 'gold'),
    siteLang: fc.constantFrom('ar', 'en')
  }),
  ({ cmd, siteLang }) => {
    localStorage.setItem('site-lang', siteLang);
    mockIsAwake = true;
    const actionsBefore = mockScrolledIds.length + mockAppliedThemes.length;
    processCommand(cmd);
    const actionsAfter = mockScrolledIds.length + mockAppliedThemes.length;
    return actionsAfter > actionsBefore;
  }
), { numRuns: 100 });
```

#### 3. Smoke Tests

- `voice-nav.js` يُحمَّل بلا أخطاء syntax.
- `document.getElementById('rh-mic')` موجود بعد `init()`.
- `GROQ_API_KEY` غير معدَّل.
- `GROQ_MODEL === 'llama-3.3-70b-versatile'`.
- الكود لا يحتوي على `startListening` (grep/regex check على نص الملف).
- `SYSTEM_PROMPT.includes('ROBOT HOUSE')` صحيح.
- `SYSTEM_PROMPT.includes('info@robothousefzllc.com')` صحيح.

### أداة الاختبار

- **fast-check** للاختبارات المبنية على الخصائص (npm package).
- **Jest** أو **Vitest** كـ test runner.
- كل اختبار خاصية يُشغَّل بحد أدنى **100 تكرار** (`numRuns: 100`).

