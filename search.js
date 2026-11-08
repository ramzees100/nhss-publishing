(function () {
  const papers = [
    {
      id: "open-journal",
      en: {
        title: "Light and matter: a demonstration research article",
        terms: "light optics physics natural sciences",
        info: "Sample journal article · Open access"
      },
      ar: {
        title: "الضوء والمادة: مقالة بحثية تجريبية",
        terms: "الضوء البصريات الفيزياء العلوم الطبيعية",
        info: "مقالة مجلة تجريبية · وصول مفتوح"
      }
    },
    {
      id: "paid-journal",
      en: {
        title: "Environmental measurement: a paid-access article demonstration",
        terms: "environment environmental measurement natural sciences",
        info: "Sample journal article · Paid-access demonstration"
      },
      ar: {
        title: "القياس البيئي: مثال لمقالة ذات وصول مدفوع",
        terms: "البيئة البيئي القياس العلوم الطبيعية",
        info: "مقالة مجلة تجريبية · مثال وصول مدفوع"
      }
    },
    {
      id: "conference",
      en: {
        title: "Connecting scientific ideas: a demonstration conference paper",
        terms: "conference science natural sciences ideas",
        info: "Sample conference paper · Open access"
      },
      ar: {
        title: "ربط الأفكار العلمية: ورقة مؤتمر تجريبية",
        terms: "مؤتمر علوم العلوم الطبيعية أفكار",
        info: "ورقة مؤتمر تجريبية · وصول مفتوح"
      }
    }
  ];

  const text = {
    en: {
      label: "Search research papers",
      placeholder: "Search by title, keyword, or subject",
      button: "Search",
      hint: "Search the demonstration papers. Try “light” or “environment”.",
      heading: "Search results",
      found: "matching sample papers",
      empty: "No matching sample papers. Try another keyword."
    },
    ar: {
      label: "ابحث في الأوراق البحثية",
      placeholder: "ابحث بالعنوان أو الكلمة المفتاحية أو المجال",
      button: "بحث",
      hint: "ابحث في الأوراق التجريبية. جرّب «الضوء» أو «البيئة».",
      heading: "نتائج البحث",
      found: "أوراق تجريبية مطابقة",
      empty: "لا توجد أوراق تجريبية مطابقة. جرّب كلمة أخرى."
    }
  };

  const form = document.getElementById("paper-search");
  const input = document.getElementById("paper-query");
  const results = document.getElementById("paper-search-results");
  const list = document.getElementById("paper-results-list");
  const status = document.getElementById("paper-results-status");

  if (!form || !input || !results || !list || !status) {
    return;
  }

  let hasSearched = false;

  function normalize(value) {
    return value.toLowerCase()
      .normalize("NFKC")
      .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .trim();
  }

  function currentLanguage() {
    return document.documentElement.lang === "ar" ? "ar" : "en";
  }

  function renderResults() {
    const lang = currentLanguage();
    const t = text[lang];
    const query = normalize(input.value);

    list.replaceChildren();

    if (!query) {
      results.hidden = true;
      return;
    }

    const words = query.split(/\s+/);

    const matching = papers.filter(function (paper) {
      const searchable = normalize(
        paper.en.title + " " + paper.en.terms + " " +
        paper.ar.title + " " + paper.ar.terms
      );

      return words.every(function (word) {
        return searchable.includes(word);
      });
    });

    results.hidden = false;

    status.textContent = matching.length
      ? matching.length + " " + t.found
      : t.empty;

    matching.forEach(function (paper) {
      const link = document.createElement("a");
      link.className = "paper-result";
      link.href = "article.html?id=" + encodeURIComponent(paper.id);

      const title = document.createElement("strong");
      title.textContent = paper[lang].title;

      const information = document.createElement("small");
      information.textContent = paper[lang].info;

      link.append(title, information);
      list.append(link);
    });
  }

  function updateSearchLanguage() {
    const t = text[currentLanguage()];

    document.getElementById("paper-search-label").textContent = t.label;
    document.getElementById("paper-search-button").textContent = t.button;
    document.getElementById("paper-search-hint").textContent = t.hint;
    document.getElementById("paper-results-heading").textContent = t.heading;

    input.placeholder = t.placeholder;

    if (hasSearched) {
      renderResults();
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hasSearched = true;
    renderResults();
  });

  input.addEventListener("input", function () {
    if (!input.value.trim()) {
      results.hidden = true;
      hasSearched = false;
    }
  });

  const languageObserver = new MutationObserver(updateSearchLanguage);

  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  updateSearchLanguage();
})();
