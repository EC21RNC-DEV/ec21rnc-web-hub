import { useState, useMemo } from "react";
import {
  type LucideIcon,
  BrainCircuit, Briefcase, Settings, Archive,
  Rss, Users, BookOpen, TrendingUp, Send, ListChecks, Globe,
  Activity, Building2, Landmark, FolderOpen, Leaf,
  Network, Sparkles, LayoutGrid, Languages, ShieldCheck, FileSearch,
  Terminal, ArrowRightLeft, BarChart3, PieChart, Heart, Award,
  Scale, Monitor, MapPin, Megaphone,
  Star, Layers, Filter, Search, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardLayout } from "./DashboardLayout";
import { ServiceCard, type Service } from "./ServiceCard";
import { useFavorites } from "./useFavorites";
import ec21Logo from "@/assets/5641b57d5ebb9d82fb48105ab919b7a78f36cd98.png";

interface Category {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

const categories: Category[] = [
  { id: "agent", label: "AI 에이전트", sublabel: "대화형 AI 인터페이스", icon: BrainCircuit, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  { id: "main", label: "주요 사업", sublabel: "EMERiCs, AIF, GIP, CIFC 등", icon: Briefcase, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  { id: "tools", label: "공통 기능", sublabel: "AI 도구 및 데이터 처리", icon: Settings, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  { id: "inactive", label: "미사용 서비스", sublabel: "현재 비활성화", icon: Archive, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
];

const services: Service[] = [
  { id: "s1", name: "OpenWeb UI", description: "AI 에이전트 및 대화형 인터페이스", port: 8598, path: "/openwebui", status: "online", icon: BrainCircuit },
  { id: "s2", name: "EMERiCs 뉴스브리핑", description: "신흥국 뉴스 브리핑 자동화", port: 8501, path: "/emerics-news", status: "online", icon: Rss },
  { id: "s3", name: "EMERiCs 전문가오피니언", description: "전문가 의견 분석 및 정리", port: 8519, path: "/emerics-opinion", status: "online", icon: Users },
  { id: "s4", name: "EMERiCs 월간특집", description: "월간 특집 리포트 생성", port: 8533, path: "/emerics-monthly", status: "online", icon: BookOpen },
  { id: "s5", name: "EMERiCs 이슈트렌드", description: "신흥국 이슈 트렌드 분석", port: 8555, path: "/emerics-trend", status: "online", icon: TrendingUp },
  { id: "s6", name: "AIF 뉴스레터 자동화", description: "아세안·인도남아시아 뉴스레터", port: 8543, path: "/aif-newsletter", status: "online", icon: Send },
  { id: "s7", name: "보고서 내용 검수", description: "보고서 품질 검수 시스템", port: 8542, path: "/emerics-inspection", status: "maintenance", icon: ListChecks },
  { id: "s8", name: "GIP 일일동향", description: "국내외 일일 동향 정리", port: 8525, path: "/gip-daily", status: "maintenance", icon: Globe },
  { id: "s9", name: "원전 입찰정보", description: "원자력 발전 입찰 정보 웹앱", port: 8513, path: "/nuclear-bid", status: "online", icon: Activity },
  { id: "s10", name: "글코포 자동화", description: "글로벌 코스매틱 포커스 자동화 웹앱", port: 8509, path: "/globecorpo-auto", status: "online", icon: Building2 },
  { id: "s11", name: "CIFC 해금협 이슈정보", description: "해외건설금융협회 이슈 정보", port: 8540, path: "/cifc-issues", status: "maintenance", icon: Landmark },
  { id: "s12", name: "CIFC 입찰정보 분류", description: "해금협 입찰 정보 자동 분류", port: 8541, path: "/cifc-bidding", status: "maintenance", icon: FolderOpen },
  { id: "s13", name: "농산업 수출전략 조사", description: "농산업 수출 전략 자동화", port: 8518, path: "/agri-export", status: "online", icon: Leaf },
  { id: "s14", name: "이슈 클러스터링", description: "이슈 클러스터링 및 요약", port: 8591, path: "/issue-clustering", status: "online", icon: Network },
  { id: "s15", name: "CSF AI 툴 모음", description: "CSF 전용 AI 도구 모음", port: 8508, path: "/csf-tools", status: "online", icon: Sparkles },
  { id: "s16", name: "AI 툴 모음", description: "범용 AI 도구 모음", port: 8515, path: "/ai-tools", status: "online", icon: LayoutGrid },
  { id: "s17", name: "인터뷰 번역봇", description: "인터뷰 내용 자동 번역", port: 8504, path: "/interview-translator", status: "online", icon: Languages },
  { id: "s18", name: "보고서 출처 검증", description: "보고서 출처 자동 검증", port: 8590, path: "/report-verification", status: "online", icon: ShieldCheck },
  { id: "s19", name: "기사내용 추출기", description: "웹 기사 내용 자동 추출", port: 8592, path: "/article-extractor", status: "online", icon: FileSearch },
  { id: "s20", name: "프롬프트 허브", description: "AI 프롬프트 관리 허브", port: 8599, path: "/prompt-hub", status: "maintenance", icon: Terminal },
  { id: "s21", name: "PDF to HTML 변환기", description: "PDF 문서를 HTML로 변환", port: 8593, path: "/pdf-converter", status: "online", icon: ArrowRightLeft },
  { id: "s22", name: "농수맞춤 자동화(시장분석)", description: "농업/수산업 맞춤형 시장분석", port: 8511, path: "/agri-market-analysis", status: "inactive", icon: BarChart3 },
  { id: "s23", name: "농수맞춤 자동화(경쟁력분석)", description: "농업/수산업 맞춤형 경쟁력분석", port: 8514, path: "/agri-competitiveness", status: "inactive", icon: PieChart },
  { id: "s24", name: "aT 반려동물(시장분석)", description: "반려동물 연관 산업 시장분석", port: 8522, path: "/at-pet-market", status: "inactive", icon: Heart },
  { id: "s25", name: "aT 반려동물(경쟁력분석)", description: "반려동물 연관 산업 경쟁력분석", port: 8524, path: "/at-pet-competitive", status: "inactive", icon: Award },
  { id: "s26", name: "KOCCA 법령정보", description: "기업맞춤형 법령정보", port: 8516, path: "/kocca-legal", status: "inactive", icon: Scale },
  { id: "s27", name: "KOCCA 콘텐츠 이용행태", description: "기업맞춤형 콘텐츠 이용행태", port: 8517, path: "/kocca-behavior", status: "inactive", icon: Monitor },
  { id: "s28", name: "KOCCA 해외 심층정보", description: "기업맞춤형 해외 심층정보", port: 8520, path: "/kocca-overseas", status: "inactive", icon: MapPin },
  { id: "s29", name: "KOCCA 국내동향 해외제공", description: "기업맞춤형 국내 동향 해외제공", port: 8521, path: "/kocca-domestic", status: "inactive", icon: Megaphone },
];

const categoryMap: Record<string, string[]> = {
  agent: ["s1"],
  main: ["s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13"],
  tools: ["s14","s15","s16","s17","s18","s19","s20","s21"],
  inactive: ["s22","s23","s24","s25","s26","s27","s28","s29"],
};

export function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const onlineCount = services.filter((s) => s.status === "online").length;
  const maintenanceCount = services.filter((s) => s.status === "maintenance").length;
  const inactiveCount = services.filter((s) => s.status === "inactive").length;
  const totalCount = services.length;

  const getFilteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (ids: string[]) => {
      let filtered = services.filter((s) => ids.includes(s.id));
      if (query) {
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query) ||
            s.port.toString().includes(query)
        );
      }
      return filtered;
    };
  }, [searchQuery]);

  const visibleCategories = categories.filter((cat) => {
    if (activeFilter && activeFilter !== cat.id) return false;
    return getFilteredServices(categoryMap[cat.id]).length > 0;
  });

  const favoriteServices = services.filter((s) => favorites.includes(s.id));

  return (
    <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ═══════ HERO — Compact, informative ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl px-6 py-5 md:px-8 md:py-6"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #172554 100%)",
            boxShadow: "0 4px 20px rgba(15,23,42,0.12)",
          }}
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)" }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={ec21Logo}
                alt="EC21 R&C"
                className="h-10 object-contain rounded-lg"
                style={{ background: "rgba(255,255,255,0.95)", padding: "4px 10px" }}
              />
              <div>
                <h1 className="font-bold text-white mb-1" style={{ fontSize: "20px", letterSpacing: "-0.02em" }}>
                  Agent 서비스 포탈
                </h1>
                <p className="text-xs" style={{ color: "#94A3B8" }}>
                  사내 AI 서비스 바로가기 · 카드를 클릭하면 해당 서비스로 이동합니다
                </p>
              </div>
            </div>

            {/* Status summary — clear counts */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: "운영", count: onlineCount, color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
                { label: "점검", count: maintenanceCount, color: "#FBBF24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.25)" },
                { label: "미사용", count: inactiveCount, color: "#64748B", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.25)" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  <span className="font-bold text-white" style={{ fontSize: "15px" }}>{s.count}</span>
                  <span className="text-[11px]" style={{ color: s.color }}>{s.label}</span>
                </div>
              ))}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="font-bold text-white" style={{ fontSize: "15px" }}>{totalCount}</span>
                <span className="text-[11px]" style={{ color: "#64748B" }}>전체</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════ QUICK ACCESS — 즐겨찾기 ═══════ */}
        {!searchQuery && !activeFilter && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} style={{ color: "#F59E0B" }} />
              <h2 className="font-bold text-sm" style={{ color: "#0F172A" }}>
                즐겨찾기
              </h2>
              {favoriteServices.length > 0 && (
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: "#FEF3C7", color: "#B45309" }}>
                  {favoriteServices.length}
                </span>
              )}
            </div>
            {favoriteServices.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {favoriteServices.map((svc, i) => (
                  <ServiceCard key={svc.id} service={svc} index={i} compact
                    isFavorite onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            ) : (
              <div
                className="flex items-center gap-3 px-5 py-4 rounded-xl"
                style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
              >
                <Star size={16} style={{ color: "#F59E0B" }} />
                <p className="text-xs" style={{ color: "#92400E" }}>
                  아래 서비스 카드의 <strong>별 아이콘</strong>을 클릭하면 즐겨찾기에 추가됩니다. 즐겨찾기는 이 브라우저에 저장됩니다.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ FILTER TABS ═══════ */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Layers size={15} style={{ color: "#6366F1" }} />
              <h2 className="font-bold text-sm" style={{ color: "#0F172A" }}>
                전체 서비스
              </h2>
              {searchQuery && (
                <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  "{searchQuery}" 검색 중
                </span>
              )}
            </div>

            {/* Tab bar */}
            <div
              className="flex items-center p-1 rounded-xl overflow-x-auto gap-0.5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                scrollbarWidth: "none",
              }}
            >
              <button
                onClick={() => setActiveFilter(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={
                  activeFilter === null
                    ? { background: "#4F46E5", color: "#FFF", boxShadow: "0 1px 4px rgba(79,70,229,0.3)" }
                    : { color: "#64748B" }
                }
              >
                <Filter size={11} />
                전체 {totalCount}
              </button>
              {categories.map((cat) => {
                const isActive = activeFilter === cat.id;
                const count = services.filter((s) => categoryMap[cat.id].includes(s.id)).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(isActive ? null : cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                    style={
                      isActive
                        ? { background: cat.color, color: "#FFF", boxShadow: `0 1px 4px ${cat.color}50` }
                        : { color: "#64748B" }
                    }
                  >
                    <cat.icon size={11} />
                    {cat.label}
                    <span
                      className="text-[10px] font-bold px-1 rounded"
                      style={{
                        background: isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.04)",
                        color: isActive ? "#FFF" : "#94A3B8",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══════ CATEGORY SECTIONS ═══════ */}
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {visibleCategories.map((cat, catIndex) => {
                const catServices = getFilteredServices(categoryMap[cat.id]);
                return (
                  <motion.section
                    key={cat.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: catIndex * 0.04 }}
                    layout
                  >
                    {/* Category Header — color-coded left border */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
                      style={{
                        background: cat.bg,
                        borderLeft: `4px solid ${cat.color}`,
                        borderTop: `1px solid ${cat.border}`,
                        borderRight: `1px solid ${cat.border}`,
                        borderBottom: `1px solid ${cat.border}`,
                      }}
                    >
                      <cat.icon size={16} style={{ color: cat.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>
                            {cat.label}
                          </h3>
                          <span className="text-xs" style={{ color: "#94A3B8" }}>
                            {cat.sublabel}
                          </span>
                        </div>
                      </div>

                      {/* Status counts */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(() => {
                          const online = catServices.filter((s) => s.status === "online").length;
                          const maint = catServices.filter((s) => s.status === "maintenance").length;
                          return (
                            <div className="hidden sm:flex items-center gap-1.5">
                              {online > 0 && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                                  style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10B981" }} />
                                  {online}
                                </span>
                              )}
                              {maint > 0 && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                                  style={{ background: "rgba(245,158,11,0.08)", color: "#B45309" }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#F59E0B" }} />
                                  {maint}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        <span
                          className="text-xs font-mono font-bold px-2 py-1 rounded-lg"
                          style={{ background: "#FFF", color: "#374151", border: `1px solid ${cat.border}` }}
                        >
                          {catServices.length}개
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {catServices.map((service, idx) => (
                        <ServiceCard key={service.id} service={service} index={idx}
                          isFavorite={isFavorite(service.id)} onToggleFavorite={toggleFavorite} />
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </AnimatePresence>

            {/* Empty state */}
            {visibleCategories.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "#EEF2FF" }}
                >
                  <Search size={28} style={{ color: "#A5B4FC" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: "#374151" }}>
                  검색 결과가 없습니다
                </p>
                <p className="text-xs mt-1 mb-4" style={{ color: "#94A3B8" }}>
                  다른 키워드로 검색해 보세요
                </p>
                <button
                  onClick={() => { setSearchQuery(""); setActiveFilter(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "#4F46E5", color: "#FFF", boxShadow: "0 2px 6px rgba(79,70,229,0.3)" }}
                >
                  필터 초기화
                  <ArrowRight size={12} />
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-5 pb-3"
          style={{ borderTop: "1px solid #E2E8F0" }}
        >
          <div className="flex items-center gap-2">
            <img src={ec21Logo} alt="EC21 R&C" className="h-5 object-contain" />
            <span className="text-xs" style={{ color: "#94A3B8" }}>Agent Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: "#CBD5E1" }}>203.242.139.254</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10B981", animation: "pulse 2s infinite" }} />
              <span className="text-xs" style={{ color: "#94A3B8" }}>정상 운영</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}