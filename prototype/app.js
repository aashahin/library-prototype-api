(() => {
  'use strict';

  const paths = {
    brand: '<path d="M12 20V5C8 2.8 4.8 3.1 2 4v14c3.5-.8 6.5-.1 10 2Zm0 0V5c4-2.2 7.2-1.9 10-1v14c-3.5-.8-6.5-.1-10 2Z"/><path d="M5.5 7.5c1.2 0 2.2.3 3.2.8m6.6 0c1-.5 2-.8 3.2-.8M5.5 11c1.2 0 2.2.3 3.2.8m6.6 0c1-.5 2-.8 3.2-.8"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
    library: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="m16 5 3-1 4 15-3 1ZM3 8h4m2 0h4M3 16h4m2 0h4"/>',
    bookmark: '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    'arrow-left': '<path d="M20 12H4m6-6-6 6 6 6"/>',
    'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',
    sparkles: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4ZM20 2v4m-2-2h4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    moon: '<path d="M20.8 13a9 9 0 0 1-9.8-9.8A9 9 0 1 0 20.8 13Z"/>',
    sprout: '<path d="M12 21v-9m0 4C4 17 3 12 3 8c5 0 9 2 9 8Zm0-4c0-7 3-10 9-10 0 6-3 10-9 10Z"/>',
    book: '<path d="M4 3h15v18H5a3 3 0 0 1 0-6h14M4 3v12m3 3h12M8 7h7m-7 3h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    feather: '<path d="M20 4C12-1 5 8 8 15c7 3 16-4 12-11ZM3 22 16 9M8 15h7"/>',
    history: '<path d="M4 8h16M6 8v10m6-10v10m6-10v10M3 21h18M4 18h16M3 6l9-4 9 4Z"/>',
    science: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)"/>',
    heart: '<path d="M20.7 5.3a5.5 5.5 0 0 0-7.8 0L12 6.4l-1-1.1a5.5 5.5 0 0 0-7.7 7.8L12 22l8.7-8.9a5.5 5.5 0 0 0 0-7.8Z"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
  const hydrateIcons = (root = document) => root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const ar = value => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 }).format(value);

  let catalog = [];
  // Original artwork source for api/scripts/generate-covers.mjs; online screens use the API catalog.
  const books = [
    { id: 'light', title: 'أثر الضوء', lines: ['أثر', 'الضوء'], author: 'ليلى مراد', category: 'أدب وروايات', rating: 4.8, pages: 216, color: '#e5e4cf', ink: '#3b5242', art: 'botanical', accent: '#7b927a', edition: 'حكايات تُزهر في الذاكرة', description: 'في بيت قديم تحيط به الأشجار، تعثر سلمى على دفتر لا يحمل اسمًا. وبين صفحاته، تكتشف حكايات صغيرة عن الضوء الذي نتركه في حياة الآخرين، وعن الأشياء التي تنمو في صمت.', intro: 'حين فتحت سلمى النافذة، لم يكن في الحديقة شيء جديد. شجرة الليمون في مكانها، والمقعد الخشبي ينتظر كعادته. لكن خيط الضوء الذي عبر الزجاج هذه المرة بدا لها كأنه رسالة وصلت متأخرة، ووجدت أخيرًا من يقرؤها.' },
    { id: 'sea', title: 'رسائل إلى البحر', lines: ['رسائل', 'إلى البحر'], author: 'يوسف عادل', category: 'أدب وروايات', rating: 4.7, pages: 184, color: '#254b53', ink: '#f4ecd6', art: 'waves', accent: '#86a7a3', edition: 'للحكايات مرافئ أخرى', description: 'رسائل لم تُرسل، ومدينة تتكئ على البحر. رحلة أدبية دافئة عن المسافات التي تقرّبنا، والأماكن التي تحتفظ بأصواتنا حتى بعد أن نغادرها.', intro: 'كتبت الرسالة الأولى على طاولة مقهى يطل على الميناء. لم أكن أعرف لمن أكتب، لكن البحر الذي أمامي بدا مستعدًا لأن يسمع. وضعت التاريخ في أعلى الورقة، ثم تركت للنسيم أن يختار الجملة الأولى.' },
    { id: 'memory', title: 'خرائط الذاكرة', lines: ['خرائط', 'الذاكرة'], author: 'عمر السيوفي', category: 'تاريخ وحضارة', rating: 4.9, pages: 280, color: '#b4775c', ink: '#fff1d7', art: 'arch', accent: '#ecd7b3', edition: 'مدن تسكننا ولا نغادرها', description: 'قراءة تخيلية في ذاكرة المدن العربية، من أبواب البيوت إلى الأسواق القديمة. حكايات عن المكان بوصفه سجلًا للناس، وعن التفاصيل اليومية التي تصنع حضارة.', intro: 'لم يكن باب المدينة كبيرًا كما وصفته الحكايات، لكنه كان يتسع لكل ما حمله العابرون من أمل. وقفت عند عتبته، أتأمل الحجارة التي صقلتها الأيدي، وأفكر في الخرائط التي لا ترسمها الأقلام بل ترسمها الخطوات.' },
    { id: 'slow', title: 'على مهل', lines: ['على', 'مَهل'], author: 'نور إبراهيم', category: 'تطوير الذات', rating: 4.6, pages: 160, color: '#e7dcc7', ink: '#485946', art: 'vase', accent: '#80927b', edition: 'مساحة أوسع للحياة', description: 'تأملات بسيطة في استعادة الانتباه لما حولنا. كتاب يدعوك إلى بداية أقل استعجالًا، وإلى بناء عادات صغيرة تمنح يومك مساحة للتنفس.', intro: 'في ذلك الصباح قررت ألا أبدأ يومي بقائمة طويلة. صنعت كوب الشاي، وجلست قرب النافذة، ومنحت نفسي الوقت لألاحظ كيف يتغير لون السماء. لم يتوقف العالم، لكن شيئًا في داخلي صار أكثر هدوءًا.' },
    { id: 'cosmos', title: 'مجرّة الأسئلة', lines: ['مجرّة', 'الأسئلة'], author: 'آدم منصور', category: 'علوم ومعرفة', rating: 4.8, pages: 248, color: '#27364f', ink: '#f2e7cf', art: 'cosmos', accent: '#c3ae79', edition: 'كل اكتشاف يبدأ بدهشة', description: 'رحلة تخيلية تبدأ بسؤال صغير وتنفتح على اتساع الكون. نصوص مبسطة تحتفي بالفضول، وتبحث في علاقتنا بالنجوم والزمن والأشياء التي لم نفهمها بعد.', intro: 'رفعت مريم رأسها إلى السماء وسألت عن الضوء الذي يصلنا من بعيد. لم يكن السؤال جديدًا، لكن الدهشة كانت جديدة تمامًا. وفي تلك اللحظة، بدا لها أن كل نجمة تفتح بابًا صغيرًا على حكاية أكبر.' },
    { id: 'beginnings', title: 'فن البدايات', lines: ['فنّ', 'البدايات'], author: 'سارة ياسين', category: 'تطوير الذات', rating: 4.9, pages: 192, color: '#344c60', ink: '#ece3c6', art: 'sunrise', accent: '#bdad85', edition: 'خطوات صغيرة، آفاق جديدة', description: 'ليس للبداية شكل واحد. عبر حكايات وتأملات قصيرة، يرافقك هذا الكتاب في اكتشاف قيمة الخطوة الأولى، وفي بناء علاقة ألطف مع الوقت والمحاولة.', intro: 'على طرف المكتب، بقي الدفتر مفتوحًا على صفحة بيضاء لأسابيع. كنت أمر به كل صباح وأؤجل الكلمة الأولى. وفي يوم عادي، لا يشبه البدايات الكبيرة في شيء، جلست وكتبت سطرًا واحدًا. لم يتغير العالم، لكن الصفحة لم تعد بيضاء.' },
    { id: 'windows', title: 'نوافذ بعيدة', lines: ['نوافذ', 'بعيدة'], author: 'هالة ناصر', category: 'أدب وروايات', rating: 4.5, pages: 224, color: '#64808b', ink: '#f4ebd8', art: 'arch', accent: '#bbc9bd', edition: 'خلف كل نافذة حكاية', description: 'تتقاطع حيوات ثلاثة جيران حول نافذة تطل على شجرة وحيدة. رواية تخيلية عن الإصغاء، وعن الصداقة التي تبدأ أحيانًا بتحية عابرة.', intro: 'كانت النافذة المقابلة تُفتح في السابعة كل صباح. لا أحد يعرف من يسكن هناك، لكن أصيص الريحان على حافتها كان يكبر يومًا بعد يوم. اعتدت أن أراه قبل أن أغادر، كأنه تحية صغيرة لا تحتاج إلى كلمات.' },
    { id: 'andalus', title: 'ظلال الأندلس', lines: ['ظلال', 'الأندلس'], author: 'رامي الخطيب', category: 'تاريخ وحضارة', rating: 4.7, pages: 320, color: '#768879', ink: '#f5ead3', art: 'arch', accent: '#d7c9a6', edition: 'رحلة في ذاكرة المكان', description: 'جولة أدبية متخيلة بين الحدائق والأفنية والمكتبات، تستلهم أثر الأندلس في الفن والعمارة، وتمنح المكان صوتًا يروي تفاصيله.', intro: 'في الفناء الهادئ، كانت النافورة تقول ما لا تقوله الجدران. جلست في ظل الرواق، وأصغيت إلى الماء وهو يعبر المسافة القصيرة بين الحجر والحوض. بدا المكان كأنه يتنفس ببطء، محتفظًا بشيء من أصوات الذين مروا هنا.' },
    { id: 'nature', title: 'لغة الأشجار', lines: ['لغة', 'الأشجار'], author: 'مريم سالم', category: 'علوم ومعرفة', rating: 4.6, pages: 208, color: '#d9dec9', ink: '#3d5849', art: 'botanical', accent: '#6a8a68', edition: 'حياة خضراء تستحق التأمل', description: 'دعوة إلى النظر للطبيعة بعين فضولية. مشاهد أدبية مستوحاة من الأشجار والمواسم، تفتح بابًا للتساؤل عن الحياة التي تحيط بنا.', intro: 'في الطريق إلى المدرسة، كانت هناك شجرة أقدم من كل البيوت المجاورة. لم أكن أعرف اسمها، لكنني كنت أعرف موعد أوراقها الجديدة. كل ربيع كانت تعلمني أن الأشياء تستطيع أن تبدأ من جديد، من دون أن تنسى جذورها.' },
    { id: 'habits', title: 'خطوة كل يوم', lines: ['خطوة', 'كل يوم'], author: 'زياد أمين', category: 'تطوير الذات', rating: 4.4, pages: 176, color: '#cea777', ink: '#3e4e4b', art: 'sunrise', accent: '#f0dbb1', edition: 'للتغيير إيقاعك الخاص', description: 'حكايات قصيرة عن الاستمرار، وعن أثر القرارات الصغيرة حين تتراكم. رحلة هادئة تمنح المحاولة قيمة وتترك لكل قارئ إيقاعه الخاص.', intro: 'لم أقرر أن أمشي مسافة طويلة. اخترت فقط أن أصل إلى الشجرة عند نهاية الشارع. وفي اليوم التالي، صرت أعرف الطريق إليها، وأعرف بائع الخبز الذي يحييني في منتصفه. كانت الخطوة صغيرة، لكن العالم حولها بدأ يتسع.' },
    { id: 'time', title: 'حكاية الزمن', lines: ['حكاية', 'الزمن'], author: 'دينا فؤاد', category: 'علوم ومعرفة', rating: 4.8, pages: 264, color: '#6c677b', ink: '#f4e8d0', art: 'cosmos', accent: '#cfc2ae', edition: 'أسئلة على حافة اللحظة', description: 'تأمل أدبي في الوقت كما نعيشه ونقيسه ونتذكره. أسئلة يومية تفتح نوافذ على فكرة الزمن، وتمنح القارئ متعة التأمل والدهشة.', intro: 'توقفت ساعة جدي عند الثالثة، لكن البيت لم يتوقف معها. مضى الضوء على الأرض، وبرد الشاي، وعادت العصافير إلى الشرفة. تأملت العقربين الساكنين وتساءلت: هل تحفظ الساعة الوقت، أم تحفظ الطريقة التي نحب أن نفهمه بها؟' },
    { id: 'caravan', title: 'دروب القوافل', lines: ['دروب', 'القوافل'], author: 'مازن فريد', category: 'تاريخ وحضارة', rating: 4.5, pages: 296, color: '#a98c6c', ink: '#fcf1db', art: 'dunes', accent: '#ddc29a', edition: 'حين كانت الطرق تصنع الحكايات', description: 'حكاية تخيلية عن رحلة عبر الصحراء، تلتقي فيها الأسواق والوجوه واللغات. كتاب عن الطرق بوصفها جسورًا بين البشر، وعن فضول السفر.', intro: 'انطلقت القافلة قبل أن يستيقظ النهار. كانت الرمال باردة، وكانت النجوم قريبة بما يكفي لنظن أنها تعرف الطريق. حمل كل مسافر شيئًا يبيعه وشيئًا يتذكره، أما أنا فحملت دفترًا أردت أن أملأه بأسماء الأماكن.' },
  ];
  const byId = id => catalog.find(book => book.id === id);
  let categories = [{ id: 'all', name: 'الكل', icon: 'grid' }];
  let homeData = null;
  let bootstrapStatus = 'loading';
  let searchStatus = 'idle';
  let searchResults = [];
  let searchError = '';
  const storageKey = 'maktabah.prototype.v1';
  const clamp = (number, min, max, fallback = min) => Number.isFinite(Number(number)) ? Math.min(max, Math.max(min, Number(number))) : fallback;
  const chapterLists = new Map();
  const chapterCache = new Map();
  let storageAvailable = true;
  let storageNoticeShown = false;
  let needsDemoState = false;
  let bootstrapController;
  let searchController;
  let readerController;
  let chapterController;
  let bootstrapToken = 0;
  let searchToken = 0;
  let readerOpenToken = 0;
  let chapterToken = 0;
  let searchTimer;
  let readerScrollTimer;
  let toastTimer;
  let route = 'home';
  let selectedCategory = 'all';
  let libraryTab = 'all';
  let searchQuery = '';
  let currentBook = null;
  let currentChapter = 0;
  let pendingChapter = 0;
  let readerContentLoaded = false;
  let restoringPosition = false;
  let readerStartPosition = { chapter: 0, scroll: 0 };
  const main = document.getElementById('main');
  const detail = document.getElementById('book-dialog');
  const reader = document.getElementById('reader-dialog');
  const searchInput = document.getElementById('global-search');

  function emptyLocalState() {
    return { saved: [], progress: {}, bookmarks: [], preferences: { fontSize: 21, theme: 'light' }, lastRead: null };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) { needsDemoState = true; return emptyLocalState(); }
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new SyntaxError('Invalid state');
      return sanitizeState(data, false);
    } catch (error) {
      if (!(error instanceof SyntaxError)) storageAvailable = false;
      needsDemoState = true;
      return emptyLocalState();
    }
  }

  function sanitizeState(data, withCatalog = true) {
    const known = id => typeof id === 'string' && (!withCatalog || Boolean(byId(id)));
    const progress = {};
    for (const [id, item] of Object.entries(data.progress && typeof data.progress === 'object' ? data.progress : {})) {
      if (!known(id) || !item || typeof item !== 'object') continue;
      const max = withCatalog ? byId(id).chapterCount - 1 : Number.MAX_SAFE_INTEGER;
      progress[id] = { chapter: Math.floor(clamp(item.chapter, 0, max)), scroll: clamp(item.scroll, 0, 1), updatedAt: clamp(item.updatedAt, 0, Number.MAX_SAFE_INTEGER) };
    }
    const saved = Array.isArray(data.saved) ? [...new Set(data.saved.filter(known))] : [];
    const marks = Array.isArray(data.bookmarks) ? data.bookmarks.filter(mark => mark && known(mark.bookId) && Number.isSafeInteger(mark.chapter) && mark.chapter >= 0 && (!withCatalog || mark.chapter < byId(mark.bookId).chapterCount)) : [];
    return {
      saved,
      progress,
      bookmarks: marks.filter((mark, index, all) => all.findIndex(other => other.bookId === mark.bookId && other.chapter === mark.chapter) === index).map(mark => ({ bookId: mark.bookId, chapter: mark.chapter, scroll: clamp(mark.scroll, 0, 1) })),
      preferences: { fontSize: clamp(data.preferences?.fontSize, 17, 29, 21), theme: data.preferences?.theme === 'dark' ? 'dark' : 'light' },
      lastRead: known(data.lastRead) ? data.lastRead : Object.keys(progress)[0] || null,
    };
  }

  let state = loadState();

  function apiBase() {
    const base = new URL(String(window.MAKTABAH_API_BASE || ''));
    if (!['https:', 'http:'].includes(base.protocol)) throw new Error('API address is missing');
    return base.href.replace(/\/$/, '');
  }

  async function apiRequest(path, signal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 15000);
    try {
      const response = await fetch(`${apiBase()}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'تعذّر تحميل البيانات.');
      if (!payload || !Object.hasOwn(payload, 'data')) throw new Error('بيانات غير صالحة.');
      return payload;
    } catch (error) {
      if (controller.signal.aborted && !signal?.aborted) throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }

  function mapBook(book) {
    if (!book || typeof book.id !== 'string' || !['title', 'author', 'categoryId', 'categoryName', 'description', 'coverUrl'].every(key => typeof book[key] === 'string') || !Number.isSafeInteger(book.chapterCount) || book.chapterCount < 1 || !Number.isFinite(book.rating) || !Number.isSafeInteger(book.pageCount) || !Number.isSafeInteger(book.coverWidth) || book.coverWidth < 1 || !Number.isSafeInteger(book.coverHeight) || book.coverHeight < 1) throw new Error('بيانات كتاب غير صالحة.');
    const coverUrl = new URL(book.coverUrl);
    if (!['http:', 'https:'].includes(coverUrl.protocol)) throw new Error('عنوان غلاف غير صالح.');
    return { ...book, coverUrl: coverUrl.href, category: book.categoryName, pages: book.pageCount };
  }

  async function fetchBooks(filters = {}, signal) {
    const result = [];
    const seen = new Set();
    let page = 1;
    while (true) {
      const params = new URLSearchParams({ ...filters, page: String(page), limit: '50' });
      const payload = await apiRequest(`/books?${params}`, signal);
      const pagination = payload.meta?.pagination;
      if (!Array.isArray(payload.data) || !pagination || pagination.page !== page || typeof pagination.hasNextPage !== 'boolean' || !Number.isSafeInteger(pagination.totalPages)) throw new Error('بيانات قائمة الكتب غير صالحة.');
      for (const record of payload.data) {
        const book = mapBook(record);
        if (seen.has(book.id)) throw new Error('تكرار في قائمة الكتب.');
        seen.add(book.id);
        result.push(book);
      }
      if (!pagination.hasNextPage) return result;
      if (!payload.data.length || page >= pagination.totalPages) throw new Error('تعذّر تحميل بقية الكتب.');
      page++;
    }
  }

  async function getChapterList(book, signal) {
    if (chapterLists.has(book.id)) return chapterLists.get(book.id);
    const { data } = await apiRequest(`/books/${encodeURIComponent(book.id)}/chapters`, signal);
    if (!Array.isArray(data) || data.length !== book.chapterCount || data.some((chapter, index) => chapter.index !== index || typeof chapter.title !== 'string')) throw new Error('بيانات الفصول غير صالحة.');
    chapterLists.set(book.id, data);
    return data;
  }

  async function bootstrap() {
    bootstrapController?.abort();
    bootstrapController = new AbortController();
    const controller = bootstrapController;
    const token = ++bootstrapToken;
    bootstrapStatus = 'loading';
    render();
    try {
      const [allBooks, categoryResponse, homeResponse, demoResponse] = await Promise.all([
        fetchBooks({}, controller.signal),
        apiRequest('/categories', controller.signal),
        apiRequest('/home', controller.signal),
        needsDemoState ? apiRequest('/demo-state', controller.signal) : Promise.resolve(null),
      ]);
      if (token !== bootstrapToken) return;
      if (!Array.isArray(categoryResponse.data) || categoryResponse.data.some(category => !category || !['id', 'name', 'icon'].every(key => typeof category[key] === 'string'))) throw new Error('بيانات التصنيفات غير صالحة.');
      const home = homeResponse.data;
      if (!home || !['welcomeTitle', 'welcomeSubtitle'].every(key => typeof home[key] === 'string') || !home.hero || !['eyebrow', 'title', 'actionLabel'].every(key => typeof home.hero[key] === 'string') || !Array.isArray(home.hero.books) || !Array.isArray(home.featuredBooks) || !home.quote || !['text', 'attribution'].every(key => typeof home.quote[key] === 'string')) throw new Error('بيانات الرئيسية غير صالحة.');
      catalog = allBooks;
      categories = [{ id: 'all', name: 'الكل', icon: 'grid' }, ...categoryResponse.data];
      homeData = { ...home, hero: { ...home.hero, books: home.hero.books.map(mapBook) }, featuredBooks: home.featuredBooks.map(mapBook) };
      state = sanitizeState(demoResponse ? demoResponse.data : state);
      // Seeding happens only for a new storage record; an intentionally empty library stays empty.
      needsDemoState = false;
      persist();
      await Promise.all([...new Set(state.bookmarks.map(mark => mark.bookId))].map(id => getChapterList(byId(id), controller.signal)));
      if (token !== bootstrapToken) return;
      bootstrapStatus = 'ready';
      render();
      if (route === 'discover') loadSearch();
    } catch (error) {
      if (token !== bootstrapToken || controller.signal.aborted) return;
      bootstrapStatus = 'error';
      render();
    }
  }

  // Native dialogs stay anchored inside the phone canvas.
  function syncScreenBounds() {
    const shell = document.querySelector('.app-shell');
    const frame = shell.getBoundingClientRect();
    const top = document.querySelector('.status-bar').getBoundingClientRect().bottom;
    const bottom = document.querySelector('.home-indicator').getBoundingClientRect().top;
    const dimensions = { left: frame.left + shell.clientLeft, top, bottom, width: shell.clientWidth, height: bottom - top };
    Object.entries(dimensions).forEach(([key, value]) => document.body.style.setProperty(`--screen-${key}`, `${value}px`));
  }

  function persist() {
    if (storageAvailable) {
      try { localStorage.setItem(storageKey, JSON.stringify(state)); }
      catch { storageAvailable = false; }
    }
    if (!storageAvailable && !storageNoticeShown) {
      storageNoticeShown = true;
      toast('التخزين غير متاح؛ ستبقى تغييراتك خلال هذه الجلسة فقط.');
    }
  }

  function toast(message) {
    const el = document.getElementById('toast');
    el.innerHTML = `${icon('check')}<span>${escape(message)}</span>`;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3200);
  }

  function coverArt(book) {
    const a = book.accent;
    const shapes = {
      botanical: `<circle cx="142" cy="130" r="32" fill="${a}" opacity=".13"/><g fill="none" stroke="${a}" stroke-width="1.4"><path d="M98 258C55 215 127 193 108 139M99 254C131 224 148 209 154 165M100 253C59 235 29 208 21 161"/></g><g fill="${a}"><path d="M105 208c-38-10-32-27-18-31 13 5 20 17 18 31M106 186c26-17 34-9 28 5-7 8-18 5-28-5M108 169c-20-9-18-27-8-34 9 8 11 19 8 34M136 204c-5-32 12-41 19-28 0 13-10 22-19 28M126 223c30-6 39 8 22 14-11 0-17-6-22-14M66 229c5-29-11-39-20-28 0 13 11 23 20 28M45 209c-25 1-38-16-25-25 13 1 20 12 25 25M30 181c10-23 0-39-11-31-4 11 3 22 11 31"/></g><path d="M96 254c8 3 13 2 19-1" stroke="${a}" fill="none"/>`,
      waves: `<circle cx="93" cy="153" r="26" fill="${a}" opacity=".4"/><g fill="none" stroke="${a}" stroke-width="1" opacity=".8">${Array.from({length:14}, (_, i) => `<path d="M-10 ${177+i*6}Q30 ${162+i*6} 69 ${177+i*6}T146 ${177+i*6}T219 ${177+i*6}"/>`).join('')}</g><path d="m80 156 21-11-7 25-5-10Z" fill="#f4ecd6" opacity=".95"/>`,
      arch: `<path d="M32 280V173a68 68 0 0 1 136 0v107" fill="none" stroke="${a}" stroke-width="2"/><path d="M42 280V175a58 58 0 0 1 116 0v105" fill="none" stroke="${a}" stroke-width=".7"/><path d="M59 280v-99a41 41 0 0 1 82 0v99" fill="${a}" opacity=".65"/><path d="M76 280v-84a24 24 0 0 1 48 0v84" fill="${book.color}"/><circle cx="101" cy="174" r="9" fill="${book.ink}" opacity=".75"/><path d="M60 251h80m-80 8h80m-80 8h80" stroke="${book.color}" stroke-width="2"/><path d="M22 120v135m156-135v135M16 132h12m144 0h12" stroke="${a}" stroke-width=".5"/>`,
      vase: `<circle cx="104" cy="178" r="52" fill="${a}" opacity=".11"/><path d="M78 193h43l-5 16c28 32 13 52-15 52s-42-20-15-52Z" fill="${a}" opacity=".8"/><path d="M83 193h33" stroke="${book.ink}" stroke-width="2"/><g fill="none" stroke="${book.ink}" stroke-width="1.4"><path d="M100 195c-3-33-24-41-19-74M101 195c18-18 18-41 34-53"/></g><g fill="${a}"><path d="M86 150c-22-2-29-17-17-23 12 3 15 12 17 23M94 171c11-22 4-34-6-26-7 11-2 17 6 26M119 164c24-3 25-17 14-19-11 2-14 10-14 19M126 153c-13-19-11-34-1-27 6 9 4 18 1 27"/></g><path d="M65 263h75" stroke="${a}" stroke-width="1"/>`,
      cosmos: `<g fill="${a}">${[[25,116],[162,107],[51,149],[167,216],[35,233],[120,130],[145,252],[60,204],[145,147],[32,180]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3===0?1.5:.8}"/>`).join('')}</g><circle cx="104" cy="188" r="37" fill="none" stroke="${a}" stroke-width=".8"/><circle cx="104" cy="188" r="28" fill="${a}" opacity=".15"/><ellipse cx="104" cy="188" rx="73" ry="17" transform="rotate(-32 104 188)" fill="none" stroke="${a}" stroke-width="1"/><circle cx="47" cy="217" r="4" fill="${a}"/><path d="M154 128v10m-5-5h10M39 151v6m-3-3h6" stroke="${a}" stroke-width=".8"/>`,
      sunrise: `<g stroke="${a}" fill="none"><circle cx="100" cy="177" r="29" stroke-width="1.5"/><circle cx="100" cy="177" r="34" stroke-width=".4"/>${Array.from({length:13},(_,i)=>`<path d="M100 132v-8" transform="rotate(${i*15-90} 100 177)" stroke-width=".8"/>`).join('')}</g><path d="m0 226 64-60 54 49 34-39 48 43v61H0Z" fill="${a}" opacity=".9"/><path d="m0 243 62-32 51 29 42-28 45 23v45H0Z" fill="${book.color}" opacity=".7"/><path d="m0 262 68-25 57 18 75-12v37H0Z" fill="${book.color}"/>`,
      dunes: `<circle cx="137" cy="150" r="27" fill="${a}"/><path d="M0 217q63-94 122-31t78 7v87H0Z" fill="${a}" opacity=".6"/><path d="M0 229q64 7 104-23t96-5v79H0Z" fill="${book.ink}" opacity=".4"/><path d="M0 248q56-25 114-4t86-8v44H0Z" fill="${book.color}"/><path d="m92 196 14 15-16 16 11 15" stroke="${book.ink}" stroke-width=".8" fill="none" opacity=".8"/>`,
    };
    return `<svg class="cover-art" viewBox="0 0 200 285" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${shapes[book.art]}</svg>`;
  }

  function cover(book) {
    if (book.coverUrl) {
      const color = /^#[0-9a-f]{6}$/i.test(book.coverBackgroundColor) ? book.coverBackgroundColor : '#e7e2d5';
      return `<div class="book-cover remote-cover" style="--cover-bg:${color}" aria-hidden="true"><span class="cover-placeholder">${icon('book')}<span>جارٍ تحميل الغلاف</span></span><img class="cover-image" src="${escape(book.coverUrl)}" alt="" width="${book.coverWidth}" height="${book.coverHeight}" decoding="async" loading="lazy"></div>`;
    }
    return `<div class="book-cover" style="--cover-bg:${book.color};--cover-ink:${book.ink}" aria-hidden="true">${coverArt(book)}<span class="cover-edition">${book.edition}</span><strong class="cover-title">${book.lines.map(line=>`<span>${line}</span>`).join('')}</strong><span class="cover-author">${book.author}</span></div>`;
  }

  function percent(id) {
    const position = state.progress[id];
    const count = byId(id)?.chapterCount;
    return position && count ? Math.round((position.chapter + position.scroll) / count * 100) : 0;
  }

  function bookCard(book, showProgress = false) {
    const id = escape(book.id);
    const title = escape(book.title);
    return `<article class="book-card" data-book-id="${id}">
      <button class="cover-button" data-action="details" data-id="${id}" aria-label="عرض تفاصيل ${title}">${cover(book)}</button>
      <div class="book-card-info"><button class="book-title-button" data-action="details" data-id="${id}">${title}</button>
      <button class="save-button" data-action="save" data-save-id="${id}" aria-label="${state.saved.includes(book.id) ? 'إزالة من' : 'إضافة إلى'} مكتبتي: ${title}" aria-pressed="${state.saved.includes(book.id)}">${icon('bookmark')}</button>
      <p class="book-author">${escape(book.author)}</p><div class="book-meta"><span class="rating">${icon('star')} ${ar(book.rating)}</span><span class="meta-divider"></span><span>${escape(book.category)}</span></div>
      ${showProgress && state.progress[book.id] ? `<div class="progress-track" role="progressbar" aria-label="تقدم قراءة المقتطف" aria-valuenow="${percent(book.id)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent(book.id)}%"></span></div><div class="progress-caption"><span>تقدم القراءة</span><span>${ar(percent(book.id))}٪</span></div>` : ''}</div></article>`;
  }

  function categoryBar() {
    return `<div class="category-bar" aria-label="تصنيفات الكتب">${categories.map(category => `<button class="category-chip ${selectedCategory === category.id ? 'active' : ''}" data-action="category" data-category="${escape(category.id)}" aria-pressed="${selectedCategory === category.id}">${icon(category.icon)}${escape(category.name)}</button>`).join('')}</div>`;
  }

  function emptyState(glyph, title, message, action = 'discover', label = 'اكتشف الكتب') {
    return `<div class="empty-state">${icon(glyph)}<h2>${escape(title)}</h2><p>${escape(message)}</p><button class="primary-button" data-action="${escape(action)}">${escape(label)}${icon('arrow-left')}</button></div>`;
  }

  function loadingState(message = 'جارٍ تحميل الكتب…') {
    return `<div class="empty-state loading-state" role="status"><span class="loading-spinner" aria-hidden="true"></span><p>${escape(message)}</p></div>`;
  }

  function continueCard() {
    const book = byId(state.lastRead);
    if (!book || !state.progress[book.id]) return emptyState('book', 'رحلتك تبدأ بصفحة', 'افتح كتابًا لتبدأ القراءة، وسنحفظ مكانك هنا.');
    const value = percent(book.id);
    return `<div class="continue-card">${cover(book)}<div class="continue-info"><div class="continue-label">${icon('book')} أكمل رحلتك</div><h3>${escape(book.title)}</h3><p class="continue-author">${escape(book.author)}</p><div class="progress-track" role="progressbar" aria-label="تقدم قراءة ${escape(book.title)}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><span style="width:${value}%"></span></div><div class="progress-caption"><span>مقتطف القراءة</span><span>${ar(value)}٪ مكتمل</span></div></div><button class="continue-button" data-action="read" data-id="${escape(book.id)}" aria-label="متابعة قراءة ${escape(book.title)}">${icon('arrow-left')}</button></div>`;
  }

  function homePage() {
    const featured = homeData.featuredBooks.filter(book => selectedCategory === 'all' || book.categoryId === selectedCategory);
    return `<section class="welcome"><div><h1>${escape(homeData.welcomeTitle)}</h1><p>${escape(homeData.welcomeSubtitle)}</p></div><span class="welcome-sun">${icon('sun')}</span></section>
      <section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><div class="hero-eyebrow">${icon('sparkles')} ${escape(homeData.hero.eyebrow)}</div><h2 id="hero-title">${escape(homeData.hero.title).replace(/\n/g, '<br>')}</h2><button class="primary-button" data-action="discover">${escape(homeData.hero.actionLabel)} ${icon('arrow-left')}</button></div><div class="hero-art" aria-hidden="true">${homeData.hero.books.map(cover).join('')}<span class="art-spark">✦</span><span class="art-spark small">✧</span></div></section>
      <section class="reading-section" aria-labelledby="continue-title"><div class="section-heading"><h2 id="continue-title">متابعة القراءة</h2><a class="text-button" href="#library">مكتبتي ${icon('arrow-left')}</a></div>${continueCard()}</section>
      <section class="recommendations" aria-labelledby="recommendations-title"><div class="section-heading"><h2 id="recommendations-title">اخترنا لك</h2><button class="text-button" data-action="discover">عرض الكل ${icon('arrow-left')}</button></div>${categoryBar()}<div class="book-grid home-book-grid">${featured.length ? featured.map(book => bookCard(book)).join('') : emptyState('book', 'لا توجد توصيات في هذا التصنيف', 'استكشف قائمة الكتب كاملة للعثور على كتابك القادم.')}</div></section>
      <aside class="quote-card"><div class="quote-label">${icon('sparkles')} بين السطور</div><blockquote>${escape(homeData.quote.text).replace(/\n/g, '<br>')}</blockquote><small>${escape(homeData.quote.attribution)}</small></aside>`;
  }

  function discoverPage() {
    const content = searchStatus === 'error' ? emptyState('compass', 'تعذّر تحميل نتائج البحث', searchError, 'retry-search', 'حاول مرة أخرى') : searchStatus !== 'ready' ? loadingState('جارٍ البحث في الكتب…') : searchResults.length ? searchResults.map(book => bookCard(book)).join('') : emptyState('search', 'لم نجد كتابًا بهذه الكلمات', 'جرّب اسمًا آخر أو أزل التصنيف للبحث بين جميع الكتب.', 'reset-filters', 'عرض جميع الكتب');
    return `<section class="page-heading"><div><h1>لكل فضول، كتاب</h1><p>تجوّل بين الرفوف، واعثر على حكايتك القادمة.</p></div><span class="heading-icon">${icon('compass')}</span></section>
      ${searchQuery ? `<div class="search-summary">نتائج البحث عن «${escape(searchQuery)}» <button class="clear-search" data-action="clear-search">مسح البحث</button></div>` : ''}
      <div class="catalog-toolbar">${categoryBar()}<span class="result-count" role="status">${searchStatus === 'ready' ? `${ar(searchResults.length)} كتابًا للاكتشاف` : searchStatus === 'error' ? 'تعذّر الاتصال' : 'جارٍ التحميل…'}</span></div><div class="book-grid catalog-grid" aria-busy="${searchStatus === 'loading'}">${content}</div>`;
  }

  async function loadSearch() {
    if (bootstrapStatus !== 'ready') return;
    searchController?.abort();
    searchController = new AbortController();
    const controller = searchController;
    const token = ++searchToken;
    searchStatus = 'loading';
    searchError = '';
    render();
    try {
      const results = await fetchBooks({ q: searchQuery, category: selectedCategory }, controller.signal);
      if (token !== searchToken || controller.signal.aborted) return;
      searchResults = results;
      searchStatus = 'ready';
      if (route === 'discover') render();
    } catch (error) {
      if (token !== searchToken || controller.signal.aborted) return;
      searchStatus = 'error';
      searchError = error.message || 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
      if (route === 'discover') render();
    }
  }

  function libraryPage() {
    const collection = catalog.filter(book => state.saved.includes(book.id) || state.progress[book.id]);
    const reading = catalog.filter(book => state.progress[book.id]);
    const matching = libraryTab === 'saved' ? catalog.filter(book => state.saved.includes(book.id)) : libraryTab === 'reading' ? reading : collection;
    return `<section class="page-heading"><div><h1>مكتبتي، على ذوقي</h1><p>حكايات اخترتها، وصفحات تنتظر عودتك.</p></div><span class="heading-icon">${icon('library')}</span></section>
      <div class="library-tabs" role="group" aria-label="عرض المكتبة">${[['all', 'جميع الكتب', collection.length], ['reading', 'أقرأ الآن', reading.length], ['saved', 'المحفوظة', state.saved.length]].map(([id, label, count]) => `<button class="library-tab ${libraryTab === id ? 'active' : ''}" data-action="library-tab" data-tab="${id}" aria-pressed="${libraryTab === id}">${label}<span>${ar(count)}</span></button>`).join('')}</div>
      <div class="book-grid catalog-grid">${matching.length ? matching.map(book => bookCard(book, true)).join('') : emptyState('library', libraryTab === 'reading' ? 'رحلتك تبدأ بصفحة' : 'رفّك ينتظر حكايتك', libraryTab === 'reading' ? 'افتح كتابًا وابدأ القراءة. ستجد تقدمك محفوظًا هنا.' : 'اضغط علامة الحفظ على أي كتاب ليصبح جزءًا من مكتبتك.')}</div>`;
  }

  function bookmarksPage() {
    return `<section class="page-heading"><div><h1>هنا توقّفت، وهنا تعود</h1><p>علامات تحتفظ لك بالصفحات التي تستحق العودة.</p></div><span class="heading-icon">${icon('bookmark')}</span></section>
      ${state.bookmarks.length ? `<div class="bookmark-list">${state.bookmarks.map(mark => {
        const book = byId(mark.bookId);
        const title = chapterLists.get(book.id)?.[mark.chapter]?.title;
        return `<article class="bookmark-card">${cover(book)}<div class="bookmark-card-info"><h2>${escape(book.title)}</h2><p>الفصل ${ar(mark.chapter + 1)}${title ? `: ${escape(title)}` : ''}</p><button class="text-button" data-action="open-bookmark" data-id="${escape(book.id)}" data-chapter="${mark.chapter}">العودة إلى العلامة ${icon('arrow-left')}</button></div><button class="icon-button" data-action="remove-bookmark" data-id="${escape(book.id)}" data-chapter="${mark.chapter}" aria-label="حذف علامة ${escape(book.title)}، الفصل ${ar(mark.chapter + 1)}">${icon('trash')}</button></article>`;
      }).join('')}</div>` : emptyState('bookmark', 'احتفظ بمكان يستحق العودة', 'أثناء القراءة، اضغط علامة الحفظ أعلى الصفحة. ستجد علاماتك هنا في أي وقت.')}`;
  }

  function render() {
    const focused = document.activeElement;
    const focusAction = main.contains(focused) ? focused?.dataset?.action : null;
    const focusCategory = focused?.dataset?.category;
    const focusTab = focused?.dataset?.tab;
    const pageNames = { home: 'الرئيسية', discover: 'استكشف', library: 'مكتبتي', bookmarks: 'علامات القراءة' };
    main.innerHTML = bootstrapStatus === 'loading' ? loadingState() : bootstrapStatus === 'error' ? emptyState('compass', 'تعذّر الاتصال بالمكتبة', 'تحقق من اتصالك بالإنترنت ثم حاول تحميل الكتب مرة أخرى.', 'retry-bootstrap', 'حاول مرة أخرى') : ({ home: homePage, discover: discoverPage, library: libraryPage, bookmarks: bookmarksPage })[route]();
    main.setAttribute('aria-busy', String(bootstrapStatus === 'loading'));
    document.querySelectorAll('[data-route]').forEach(link => {
      const active = link.dataset.route === route;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    document.body.dataset.route = route;
    document.title = `${pageNames[route]} — مكتبة`;
    updateLibraryCount();
    if (focusAction === 'category') [...main.querySelectorAll('[data-category]')].find(button => button.dataset.category === focusCategory)?.focus({ preventScroll: true });
    else if (focusAction === 'library-tab') main.querySelector(`[data-tab="${focusTab}"]`)?.focus({ preventScroll: true });
    hydrateCovers(main);
  }

  function hydrateCovers(root) {
    root.querySelectorAll('.cover-image').forEach(image => {
      const update = () => {
        const failed = image.naturalWidth === 0;
        image.parentElement.classList.toggle('cover-failed', failed);
        image.parentElement.classList.toggle('cover-loaded', !failed);
        image.parentElement.querySelector('.cover-placeholder span').textContent = failed ? 'الغلاف غير متاح' : '';
      };
      image.addEventListener('load', update, { once: true });
      image.addEventListener('error', update, { once: true });
      if (image.complete) update();
    });
  }

  function updateLibraryCount() {
    document.getElementById('library-count').textContent = ar(catalog.filter(book => state.saved.includes(book.id) || state.progress[book.id]).length);
  }

  function navigate(next) {
    if (location.hash === `#${next}`) { route = next; render(); main.scrollTop = 0; if (next === 'discover') loadSearch(); }
    else location.hash = next;
  }

  function onRouteChange() {
    const target = location.hash.slice(1);
    route = ['home', 'discover', 'library', 'bookmarks'].includes(target) ? target : 'home';
    clearTimeout(searchTimer);
    searchController?.abort();
    ++searchToken;
    if (route !== 'discover') { searchQuery = ''; searchInput.value = ''; }
    selectedCategory = 'all';
    render();
    if (route === 'discover') loadSearch();
    main.scrollTop = 0;
    if (document.activeElement !== searchInput) main.focus({ preventScroll: true });
  }

  function saveBook(id) {
    const book = byId(id);
    if (!book) return;
    const wasSaved = state.saved.includes(id);
    state.saved = wasSaved ? state.saved.filter(value => value !== id) : [...state.saved, id];
    if (route === 'library') {
      render();
      if (!detail.open) (main.querySelector(`[data-save-id="${CSS.escape(id)}"]`) || main).focus({ preventScroll: true });
    }
    document.querySelectorAll(`[data-save-id="${CSS.escape(id)}"]`).forEach(button => {
      button.setAttribute('aria-pressed', String(!wasSaved));
      button.setAttribute('aria-label', `${wasSaved ? 'إضافة إلى' : 'إزالة من'} مكتبتي: ${book.title}`);
      if (button.classList.contains('detail-save')) button.innerHTML = `${icon(wasSaved ? 'bookmark' : 'check')} ${wasSaved ? 'أضف إلى مكتبتي' : 'في مكتبتي'}`;
    });
    updateLibraryCount();
    toast(wasSaved ? 'أُزيل الكتاب من المحفوظة' : 'أُضيف الكتاب إلى مكتبتك');
    persist();
  }

  function showDetails(id) {
    const book = byId(id);
    if (!book) return;
    const saved = state.saved.includes(id);
    detail.innerHTML = `<button class="icon-button dialog-close" data-action="close-details" aria-label="إغلاق تفاصيل الكتاب">${icon('close')}</button><div class="detail-top">${cover(book)}<div class="detail-info"><span class="detail-category">${escape(book.category)}</span><h2 id="detail-title">${escape(book.title)}</h2><p>${escape(book.author)}</p><div class="detail-rating">${icon('star')}${ar(book.rating)}<span>تقييم توضيحي</span></div></div></div>
      <div class="detail-body"><h3>بين دفّتي هذا الكتاب</h3><p class="detail-description">${escape(book.description)}</p><div class="detail-facts"><div>${ar(book.pages)} صفحة<span>حجم الكتاب التوضيحي</span></div><div>${book.language === 'ar' ? 'العربية' : escape(book.language)}<span>لغة الكتاب</span></div><div>${ar(book.chapterCount)} فصول<span>مقتطف متاح للقراءة</span></div></div><div class="detail-actions"><button class="primary-button" data-action="read" data-id="${escape(id)}">${icon('book')} ${state.progress[id] ? 'متابعة القراءة' : 'اقرأ المقتطف'}</button><button class="secondary-button detail-save" data-action="save" data-save-id="${escape(id)}" aria-pressed="${saved}" aria-label="${saved ? 'إزالة من' : 'إضافة إلى'} مكتبتي: ${escape(book.title)}">${icon(saved ? 'check' : 'bookmark')} ${saved ? 'في مكتبتي' : 'أضف إلى مكتبتي'}</button></div><p class="detail-note">كتاب ومؤلف تخيليان؛ النصوص أصلية ومخصصة لتجربة القراءة.</p></div>`;
    syncScreenBounds();
    if (!detail.open) detail.showModal();
    hydrateCovers(detail);
  }

  async function openReader(id, bookmark = null) {
    const book = byId(id);
    if (!book) return;
    if (reader.open) saveReaderPosition();
    readerController?.abort();
    chapterController?.abort();
    readerController = new AbortController();
    const controller = readerController;
    const token = ++readerOpenToken;
    ++chapterToken;
    clearTimeout(readerScrollTimer);
    currentBook = book;
    readerContentLoaded = false;
    restoringPosition = true;
    readerStartPosition = bookmark || state.progress[id] || { chapter: 0, scroll: 0 };
    currentChapter = Math.floor(clamp(readerStartPosition.chapter, 0, book.chapterCount - 1));
    pendingChapter = currentChapter;
    reader.innerHTML = `<header class="reader-topbar"><button class="icon-button" data-action="close-reader" aria-label="العودة من القارئ">${icon('arrow-right')}</button><div class="reader-book-name" id="reader-title">${escape(book.title)}<small>${escape(book.author)} · مقتطف توضيحي</small></div><div class="reader-actions"><button class="icon-button" id="reader-bookmark" data-action="bookmark" aria-label="حفظ علامة لهذا الفصل" disabled>${icon('bookmark')}</button><button class="icon-button" id="reader-theme" data-action="theme" aria-label="تبديل مظهر القراءة"></button></div></header>
      <div class="reader-settings"><label for="chapter-select">الفصل <select id="chapter-select" disabled><option>جارٍ تحميل الفصول…</option></select></label><div class="font-controls"><span>حجم الخط</span><button data-action="font-smaller" aria-label="تصغير الخط">−</button><output id="font-size"></output><button data-action="font-larger" aria-label="تكبير الخط">+</button></div></div>
      <div class="reader-body" id="reader-body" tabindex="0" aria-label="نص القراءة"><article class="reader-article" id="reader-article">${loadingState('جارٍ تحميل الفصول…')}</article></div>
      <footer class="reader-footer"><button id="previous-chapter" data-action="previous-chapter" disabled>${icon('arrow-right')} الفصل السابق</button><div class="reader-progress"><span id="reader-progress-label" role="status">جارٍ التحميل…</span><div class="progress-track"><span id="reader-progress-bar"></span></div></div><button id="next-chapter" data-action="next-chapter" disabled>الفصل التالي ${icon('arrow-left')}</button></footer>`;
    syncScreenBounds();
    if (!reader.open) reader.showModal();
    applyReaderPreferences();
    document.getElementById('reader-body').addEventListener('scroll', () => {
      if (restoringPosition || !readerContentLoaded) return;
      clearTimeout(readerScrollTimer);
      readerScrollTimer = setTimeout(saveReaderPosition, 120);
    });
    document.getElementById('chapter-select').addEventListener('change', event => changeChapter(Number(event.target.value)));
    try {
      const chapters = await getChapterList(book, controller.signal);
      if (token !== readerOpenToken || !reader.open || controller.signal.aborted) return;
      document.getElementById('chapter-select').innerHTML = chapters.map(chapter => `<option value="${chapter.index}">${ar(chapter.index + 1)}. ${escape(chapter.title)}</option>`).join('');
      await renderChapter(currentChapter, readerStartPosition.scroll);
    } catch (error) {
      if (token !== readerOpenToken || !reader.open || controller.signal.aborted) return;
      document.getElementById('reader-article').innerHTML = emptyState('book', 'تعذّر تحميل الفصول', error.message, 'retry-reader', 'حاول مرة أخرى');
      document.getElementById('reader-progress-label').textContent = 'تعذّر الاتصال';
    }
  }

  async function renderChapter(chapter = currentChapter, scroll = 0) {
    if (!currentBook || !reader.open || !chapterLists.has(currentBook.id)) return;
    chapterController?.abort();
    chapterController = new AbortController();
    const controller = chapterController;
    const token = ++chapterToken;
    const openToken = readerOpenToken;
    const book = currentBook;
    pendingChapter = chapter;
    readerContentLoaded = false;
    restoringPosition = true;
    clearTimeout(readerScrollTimer);
    document.getElementById('reader-article').innerHTML = loadingState('جارٍ تحميل نص الفصل…');
    document.getElementById('reader-body').setAttribute('aria-busy', 'true');
    document.getElementById('chapter-select').disabled = true;
    document.getElementById('previous-chapter').disabled = true;
    document.getElementById('next-chapter').disabled = true;
    document.getElementById('reader-bookmark').disabled = true;
    document.getElementById('reader-progress-label').textContent = 'جارٍ تحميل الفصل…';
    applyReaderPreferences();
    try {
      const key = `${book.id}:${chapter}`;
      let data = chapterCache.get(key);
      if (!data) {
        ({ data } = await apiRequest(`/books/${encodeURIComponent(book.id)}/chapters/${chapter}`, controller.signal));
        if (!data || data.bookId !== book.id || data.index !== chapter || data.chapterCount !== book.chapterCount || typeof data.title !== 'string' || !Array.isArray(data.paragraphs) || !data.paragraphs.length || data.paragraphs.some(paragraph => typeof paragraph !== 'string')) throw new Error('نص الفصل غير صالح.');
        chapterCache.set(key, data);
      }
      if (token !== chapterToken || openToken !== readerOpenToken || !reader.open || controller.signal.aborted) return;
      currentChapter = chapter;
      state.lastRead = book.id;
      state.progress[book.id] = { chapter, scroll: clamp(scroll, 0, 1), updatedAt: Date.now() };
      document.getElementById('reader-article').innerHTML = `<div class="chapter-eyebrow">الفصل ${ar(chapter + 1)}</div><h1>${escape(data.title)}</h1>${data.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}<div class="chapter-decoration">✦</div><div class="reader-sample-note">نص أصلي مخصص للنموذج التوضيحي لمكتبة</div>`;
      document.getElementById('reader-body').setAttribute('aria-busy', 'false');
      document.getElementById('chapter-select').value = String(chapter);
      document.getElementById('chapter-select').disabled = false;
      document.getElementById('previous-chapter').disabled = chapter === 0;
      document.getElementById('next-chapter').disabled = chapter === book.chapterCount - 1;
      document.getElementById('reader-bookmark').disabled = false;
      readerContentLoaded = true;
      updateBookmarkControl();
      updateReaderProgress();
      applyReaderPreferences();
      persist();
      await document.fonts.ready;
      requestAnimationFrame(() => {
        if (token !== chapterToken || openToken !== readerOpenToken || !reader.open) return;
        const body = document.getElementById('reader-body');
        body.scrollTop = Math.max(0, body.scrollHeight - body.clientHeight) * clamp(scroll, 0, 1);
        requestAnimationFrame(() => {
          if (token !== chapterToken || openToken !== readerOpenToken || !reader.open) return;
          restoringPosition = false;
          // A short chapter is fully visible and therefore fully read.
          saveReaderPosition();
        });
      });
    } catch (error) {
      if (token !== chapterToken || openToken !== readerOpenToken || !reader.open || controller.signal.aborted) return;
      document.getElementById('reader-body').setAttribute('aria-busy', 'false');
      document.getElementById('reader-article').innerHTML = emptyState('book', 'تعذّر تحميل نص الفصل', error.message, 'retry-chapter', 'حاول مرة أخرى');
      document.getElementById('reader-progress-label').textContent = 'تعذّر الاتصال';
      document.getElementById('chapter-select').value = String(chapter);
      document.getElementById('chapter-select').disabled = false;
    }
  }

  function saveReaderPosition() {
    if (!currentBook || restoringPosition || !readerContentLoaded) return;
    const body = document.getElementById('reader-body');
    if (!body) return;
    const range = body.scrollHeight - body.clientHeight;
    const scroll = range > 0 ? clamp(body.scrollTop / range, 0, 1) : 1;
    state.progress[currentBook.id] = { chapter: currentChapter, scroll, updatedAt: Date.now() };
    updateReaderProgress();
    persist();
  }

  function updateReaderProgress() {
    if (!currentBook) return;
    const value = percent(currentBook.id);
    document.getElementById('reader-progress-label').textContent = `الفصل ${ar(currentChapter + 1)} من ${ar(currentBook.chapterCount)} · ${ar(value)}٪`;
    document.getElementById('reader-progress-bar').style.width = `${value}%`;
  }

  function changeChapter(chapter) {
    if (!currentBook || !Number.isInteger(chapter) || chapter < 0 || chapter >= currentBook.chapterCount) return;
    saveReaderPosition();
    renderChapter(chapter);
    document.getElementById('reader-body').focus({ preventScroll: true });
  }

  function applyReaderPreferences() {
    reader.dataset.theme = state.preferences.theme;
    document.body.dataset.readerTheme = state.preferences.theme;
    reader.style.setProperty('--reading-size', `${state.preferences.fontSize}px`);
    document.getElementById('font-size').textContent = ar(state.preferences.fontSize);
    reader.querySelector('[data-action="font-smaller"]').disabled = !readerContentLoaded || state.preferences.fontSize <= 17;
    reader.querySelector('[data-action="font-larger"]').disabled = !readerContentLoaded || state.preferences.fontSize >= 29;
    const theme = document.getElementById('reader-theme');
    theme.innerHTML = icon(state.preferences.theme === 'light' ? 'moon' : 'sun');
    theme.setAttribute('aria-label', state.preferences.theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري');
    theme.setAttribute('aria-pressed', String(state.preferences.theme === 'dark'));
  }

  function updateBookmarkControl() {
    if (!currentBook) return;
    const marked = state.bookmarks.some(mark => mark.bookId === currentBook.id && mark.chapter === currentChapter);
    const button = document.getElementById('reader-bookmark');
    button.classList.toggle('active', marked);
    button.setAttribute('aria-pressed', String(marked));
    button.setAttribute('aria-label', marked ? 'إزالة علامة هذا الفصل' : 'حفظ علامة لهذا الفصل');
  }

  function toggleBookmark() {
    if (!readerContentLoaded) return;
    saveReaderPosition();
    const index = state.bookmarks.findIndex(mark => mark.bookId === currentBook.id && mark.chapter === currentChapter);
    if (index >= 0) state.bookmarks.splice(index, 1);
    else state.bookmarks.push({ bookId: currentBook.id, chapter: currentChapter, scroll: state.progress[currentBook.id]?.scroll || 0 });
    updateBookmarkControl();
    const label = document.getElementById('reader-progress-label');
    label.textContent = index >= 0 ? 'أُزيلت علامة القراءة' : 'حُفظت علامة القراءة';
    persist();
  }

  function resetFilters() {
    clearTimeout(searchTimer);
    selectedCategory = 'all';
    searchQuery = '';
    searchInput.value = '';
    loadSearch();
    searchInput.focus();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const { action, id } = button.dataset;
    switch (action) {
      case 'retry-bootstrap': bootstrap(); break;
      case 'retry-search': loadSearch(); break;
      case 'retry-reader': openReader(currentBook.id, readerStartPosition); break;
      case 'retry-chapter': renderChapter(pendingChapter, pendingChapter === readerStartPosition.chapter ? readerStartPosition.scroll : 0); break;
      case 'discover': searchQuery = ''; searchInput.value = ''; selectedCategory = 'all'; navigate('discover'); break;
      case 'details': showDetails(id); break;
      case 'save': saveBook(button.dataset.saveId); break;
      case 'category':
        clearTimeout(searchTimer);
        searchQuery = searchInput.value.trim();
        selectedCategory = button.dataset.category;
        if (route === 'discover') loadSearch(); else render();
        break;
      case 'library-tab': libraryTab = button.dataset.tab; render(); break;
      case 'close-details': detail.close(); break;
      case 'read': openReader(id); break;
      case 'close-reader': saveReaderPosition(); reader.close(); break;
      case 'clear-search': clearTimeout(searchTimer); searchQuery = ''; searchInput.value = ''; loadSearch(); searchInput.focus(); break;
      case 'reset-filters': resetFilters(); break;
      case 'next-chapter': changeChapter(currentChapter + 1); break;
      case 'previous-chapter': changeChapter(currentChapter - 1); break;
      case 'theme': state.preferences.theme = state.preferences.theme === 'light' ? 'dark' : 'light'; applyReaderPreferences(); persist(); break;
      case 'font-smaller':
      case 'font-larger': {
        saveReaderPosition();
        const position = state.progress[currentBook.id]?.scroll || 0;
        state.preferences.fontSize = clamp(state.preferences.fontSize + (action === 'font-larger' ? 2 : -2), 17, 29);
        applyReaderPreferences(); renderChapter(currentChapter, position); persist(); break;
      }
      case 'bookmark': toggleBookmark(); break;
      case 'open-bookmark': {
        const mark = state.bookmarks.find(item => item.bookId === id && item.chapter === Number(button.dataset.chapter));
        if (mark) openReader(id, mark);
        break;
      }
      case 'remove-bookmark': state.bookmarks = state.bookmarks.filter(mark => !(mark.bookId === id && mark.chapter === Number(button.dataset.chapter))); render(); persist(); toast('أُزيلت علامة القراءة'); main.focus({ preventScroll: true }); break;
    }
  });

  reader.addEventListener('cancel', saveReaderPosition);
  reader.addEventListener('close', () => {
    clearTimeout(readerScrollTimer);
    readerController?.abort();
    chapterController?.abort();
    readerOpenToken++;
    chapterToken++;
    readerContentLoaded = false;
    currentBook = null;
    render();
    if (detail.open) {
      const button = detail.querySelector('[data-action="read"]');
      const read = state.progress[button.dataset.id];
      button.innerHTML = `${icon('book')} ${read ? 'متابعة القراءة' : 'اقرأ المقتطف'}`;
      button.focus({ preventScroll: true });
    } else main.focus({ preventScroll: true });
  });
  for (const dialog of [detail, reader]) {
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled),a[href],input,select:not(:disabled),textarea,[tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog || dialog === reader) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  }

  function performSearch() {
    searchQuery = searchInput.value.trim();
    if (route !== 'discover') navigate('discover'); else loadSearch();
  }
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    // Invalidate an in-flight result immediately, even during the debounce delay.
    searchController?.abort();
    ++searchToken;
    if (route === 'discover') { searchStatus = 'loading'; render(); }
    searchTimer = setTimeout(performSearch, 180);
  });
  document.getElementById('search-form').addEventListener('submit', event => { event.preventDefault(); clearTimeout(searchTimer); performSearch(); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !reader.open && !detail.open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      if (route === 'library' || route === 'bookmarks') navigate('discover');
      setTimeout(() => searchInput.focus(), 0);
    }
  });
  window.addEventListener('hashchange', onRouteChange);
  window.addEventListener('pagehide', () => { if (reader.open) saveReaderPosition(); });
  const screenObserver = new ResizeObserver(syncScreenBounds);
  for (const element of document.querySelectorAll('.app-shell,.status-bar,.home-indicator')) screenObserver.observe(element);
  window.addEventListener('resize', syncScreenBounds);
  hydrateIcons();
  onRouteChange();
  syncScreenBounds();
  bootstrap();
})();
