import { useState, useEffect } from "react";
import { Search, ChevronRight, BookOpen, AlertCircle, Clock, Filter } from "lucide-react";
import Card from "../ui/Card";
import {
  getMedicalAdvice,
  getMedicalCategoriesWithLabels,
  searchMedicalArticles,
  getEmergencyArticles,
  getRiskRecommendedArticles,
  getArticleTypeLabel,
} from "../../api/medical";
import { txt } from "../../utils/txt";

export default function KnowledgeLibrary({ lang, style, pregnancyWeek, riskLevel }) {
  const [activeCategory, setActiveCategory] = useState("first");
  const [articles, setArticles] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all"); // all, medical, psychology, practice, faq

  // Load categories
  useEffect(() => {
    getMedicalCategoriesWithLabels(lang).then(setCategories);
  }, [lang]);

  // Load articles when category or type filter changes
  useEffect(() => {
    if (isSearching) return;

    let loadPromise;

    if (showEmergency) {
      loadPromise = getEmergencyArticles(lang);
    } else if (typeFilter === "all" || typeFilter === "medical") {
      loadPromise = getMedicalAdvice(activeCategory, lang);
    } else {
      // Type filter applies to all categories
      loadPromise = getMedicalAdvice(activeCategory, lang).then(articles =>
        articles.filter(article => article.articleType === typeFilter)
      );
    }

    if (loadPromise) {
      loadPromise.then(setArticles);
    }
  }, [activeCategory, lang, isSearching, showEmergency, typeFilter]);

  // Search articles
  useEffect(() => {
    if (!isSearching) return;
    const timer = setTimeout(() => {
      if (searchKeyword.trim()) {
        searchMedicalArticles(searchKeyword, lang).then(setArticles);
      } else {
        setIsSearching(false);
        setShowEmergency(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword, lang, isSearching]);

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
    if (keyword.trim()) {
      setIsSearching(true);
      setShowEmergency(false);
    }
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setIsSearching(false);
    setSearchKeyword("");
    setShowEmergency(false);
  };

  const handleEmergencyClick = () => {
    setShowEmergency(true);
    setIsSearching(false);
    setSearchKeyword("");
  };

  const activeCategoryLabel = categories.find(c => c.key === activeCategory)?.label || "";

  return (
    <div className="space-y-4">
      {/* Mobile View */}
      <Card style={style} className="overflow-hidden p-0 lg:hidden">
        <div className="px-4 pb-3 pt-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay/60">
            {txt(lang, "Medical Knowledge", "医疗知识库")}
          </p>
          <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
            {txt(lang, "Professional Guidance for Your Journey", "专业陪伴您的孕产之旅")}
          </h3>
          <p className="mt-1 text-sm text-clay/78">
            {txt(lang, "Evidence-based medical advice to support your emotional health.", "基于循证医学的建议，支持您的心理健康。")}
          </p>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clay/60" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={txt(lang, "Search articles...", "搜索文章...")}
              className="w-full rounded-full border-0 bg-cream/50 py-2.5 pl-10 pr-4 text-sm placeholder:text-clay/50 focus:outline-none focus:ring-2 focus:ring-sage/30"
              style={{ background: `${style.card}40` }}
            />
          </div>

          {/* Content Type Filter */}
          {!isSearching && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "all"
                    ? "bg-sage-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "All", "全部")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("medical")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "medical"
                    ? "bg-blue-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "Medical", "医疗")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("psychology")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "psychology"
                    ? "bg-purple-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "Psychology", "心理")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("practice")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "practice"
                    ? "bg-green-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "Practice", "练习")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("faq")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "faq"
                    ? "bg-orange-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "FAQ", "问题")}
              </button>
            </div>
          )}

          {!isSearching && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={handleEmergencyClick}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  showEmergency
                    ? "bg-red-500 text-white"
                    : "bg-[#fff5f5] text-red-600"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {txt(lang, "Emergency", "紧急情况")}
                </span>
              </button>
              {categories.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleCategoryClick(item.key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeCategory === item.key && !showEmergency
                      ? style.tabBg
                        ? `text-white`
                        : "bg-sage-600 text-white"
                      : "bg-[#fffaf2] text-clay/70"
                  }`}
                  style={
                    activeCategory === item.key && !showEmergency && style.tabBg
                      ? { backgroundColor: style.tabBg, color: style.tabText }
                      : undefined
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Articles List */}
        <div className="border-t px-4 pb-2 pt-3 sm:px-5" style={{ borderColor: style.line }}>
          {isSearching && (
            <p className="mb-3 text-xs font-semibold text-clay/60">
              {txt(lang, `Search results for "${searchKeyword}"`, `"${searchKeyword}" 的搜索结果`)}
            </p>
          )}
          {showEmergency && (
            <p className="mb-3 text-xs font-semibold text-red-500">
              {txt(lang, "Emergency Information", "紧急信息")}
            </p>
          )}
          {!isSearching && !showEmergency && (
            <p className="mb-3 text-xs font-semibold text-clay/60">
              {activeCategoryLabel}
            </p>
          )}

          <div className="divide-y" style={{ borderColor: style.line }}>
            {articles.length === 0 ? (
              <div className="py-8 text-center text-clay/60">
                {txt(lang, "No articles found", "未找到相关文章")}
              </div>
            ) : (
              articles.map((article) => (
                <article
                  key={article.id}
                  className={`group flex w-full flex-col gap-2 py-4 ${
                    article.isEmergency ? "border-l-4 border-red-500 bg-red-50/30 px-3" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                        article.isEmergency
                          ? "bg-red-500 text-white"
                          : ""
                      }`}
                      style={!article.isEmergency ? { backgroundColor: style.pillBg, color: style.pillText } : undefined}
                    >
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading text-base font-semibold text-clay group-hover:text-sage-600 transition-colors">
                        {article.title}
                      </h4>
                      <p className="mt-1 text-sm text-clay/75 line-clamp-2">
                        {article.summary}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {article.articleType && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex items-center gap-1"
                            style={{
                              backgroundColor:
                                article.articleType === "medical" ? "#dbeafe" :
                                article.articleType === "psychology" ? "#e9d5ff" :
                                article.articleType === "practice" ? "#d1fae5" :
                                "#fed7aa",
                              color:
                                article.articleType === "medical" ? "#1e40af" :
                                article.articleType === "psychology" ? "#7c3aed" :
                                article.articleType === "practice" ? "#059669" :
                                "#ea580c"
                            }}
                          >
                            {getArticleTypeLabel(article.articleType, lang)}
                          </span>
                        )}
                        {article.readingTime && (
                          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 bg-clay/10 text-clay/70">
                            <Clock className="h-3 w-3" />
                            {article.readingTime}
                          </span>
                        )}
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ backgroundColor: style.pillBg, color: style.pillText }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="mt-4 h-4 w-4 shrink-0 text-clay/40 group-hover:text-sage-500 transition-colors" />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Desktop View */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[280px,1fr]">
        {/* Sidebar */}
        <Card style={style} className="h-fit lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay/60">
            {txt(lang, "Medical Knowledge", "医疗知识库")}
          </p>
          <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
            {txt(lang, "Professional Guidance", "专业陪伴")}
          </h3>
          <p className="mt-1 text-sm text-clay/78">
            {txt(lang, "Evidence-based advice for your journey.", "基于循证医学的建议。")}
          </p>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clay/60" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={txt(lang, "Search articles...", "搜索文章...")}
              className="w-full rounded-full border-0 bg-cream/50 py-2.5 pl-10 pr-4 text-sm placeholder:text-clay/50 focus:outline-none focus:ring-2 focus:ring-sage/30"
              style={{ background: `${style.card}40` }}
            />
          </div>

          {/* Content Type Filter */}
          {!isSearching && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "all"
                    ? "bg-sage-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "All", "全部")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("medical")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "medical"
                    ? "bg-blue-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "Medical", "医疗")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("psychology")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "psychology"
                    ? "bg-purple-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "Psychology", "心理")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("practice")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "practice"
                    ? "bg-green-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "Practice", "练习")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("faq")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  typeFilter === "faq"
                    ? "bg-orange-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {txt(lang, "FAQ", "问题")}
              </button>
            </div>
          )}

          {!isSearching && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handleEmergencyClick}
                className={`w-full flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  showEmergency
                    ? "bg-red-500 text-white"
                    : "bg-[#fff5f5] text-red-600"
                }`}
              >
                <AlertCircle className="h-4 w-4" />
                {txt(lang, "Emergency Information", "紧急情况")}
              </button>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-clay/60">
                {txt(lang, "Categories", "分类")}
              </p>
              {categories.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleCategoryClick(item.key)}
                  className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    activeCategory === item.key && !showEmergency
                      ? style.tabBg
                        ? `text-white`
                        : "bg-sage-600 text-white"
                      : "bg-[#fffaf2] text-clay/70"
                  }`}
                  style={
                    activeCategory === item.key && !showEmergency && style.tabBg
                      ? { backgroundColor: style.tabBg, color: style.tabText }
                      : undefined
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Main Content */}
        <div className="space-y-4">
          <Card style={style}>
            {isSearching && (
              <p className="text-xs font-semibold text-clay/60">
                {txt(lang, `Search results for "${searchKeyword}"`, `"${searchKeyword}" 的搜索结果`)}
              </p>
            )}
            {showEmergency && (
              <p className="text-xs font-semibold text-red-500">
                {txt(lang, "Emergency Information", "紧急信息")}
              </p>
            )}
            {!isSearching && !showEmergency && (
              <p className="text-xs font-semibold text-clay/60">
                {activeCategoryLabel}
              </p>
            )}

            <div className="mt-3 divide-y" style={{ borderColor: style.line }}>
              {articles.length === 0 ? (
                <div className="py-12 text-center text-clay/60">
                  {txt(lang, "No articles found", "未找到相关文章")}
                </div>
              ) : (
                articles.map((article) => (
                  <article
                    key={article.id}
                    className={`group flex w-full flex-col gap-2 py-4 ${
                      article.isEmergency ? "border-l-4 border-red-500 bg-red-50/30 px-3" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                          article.isEmergency
                            ? "bg-red-500 text-white"
                            : ""
                        }`}
                        style={!article.isEmergency ? { backgroundColor: style.pillBg, color: style.pillText } : undefined}
                      >
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-heading text-lg font-semibold text-clay group-hover:text-sage-600 transition-colors">
                          {article.title}
                        </h4>
                        <p className="mt-1 text-sm text-clay/75">
                          {article.summary}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {article.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{ backgroundColor: style.pillBg, color: style.pillText }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="mt-4 h-5 w-5 shrink-0 text-clay/40 group-hover:text-sage-500 transition-colors" />
                    </div>
                  </article>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
