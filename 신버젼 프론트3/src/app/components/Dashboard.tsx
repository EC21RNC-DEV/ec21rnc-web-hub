import { useState, useMemo } from "react";
import {
  Star, Layers, Filter, Search, ArrowRight, Shield,
  RefreshCw, CloudOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { DashboardLayout } from "./DashboardLayout";
import { ServiceCard, type Service } from "./ServiceCard";
import { useFavorites } from "./useFavorites";
import { useServiceStatus } from "./useServiceStatus";
import { useServerHealth } from "./useServerHealth";
import { useCustomServices } from "./useCustomServices";
import { useAdminOnly } from "./useAdminOnly";
import { useAdminAuth } from "./useAdminAuth";
import { useHiddenServices } from "./useHiddenServices";
import { getIcon } from "./icon-map";
import { servicesData, categories, categoryMap, DOMAIN } from "./services-data";
import ec21Logo from "@/assets/5641b57d5ebb9d82fb48105ab919b7a78f36cd98.png";

export function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { getStatus } = useServiceStatus();
  const { customServices, customCategoryMap } = useCustomServices();
  const { isAdminOnly } = useAdminOnly();
  const { isAuthenticated } = useAdminAuth();
  const { isHidden } = useHiddenServices();

  // Build all services including custom ones, filtering admin-only for non-admins
  const allServices: Service[] = useMemo(() => {
    const builtIn = servicesData
      .filter((s) => !isHidden(s.id))
      .filter((s) => isAuthenticated || !isAdminOnly(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        port: s.port,
        path: s.path,
        status: getStatus(s.id, s.defaultStatus),
        icon: s.icon,
      }));
    const custom = customServices
      .filter((s) => isAuthenticated || !isAdminOnly(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        port: s.port,
        path: s.path,
        status: getStatus(s.id, s.defaultStatus),
        icon: getIcon(s.iconName),
      }));
    return [...builtIn, ...custom];
  }, [getStatus, customServices, isAdminOnly, isAuthenticated]);

  // Merged category map
  const mergedCategoryMap = useMemo(() => {
    const merged: Record<string, string[]> = {};
    for (const key of Object.keys(categoryMap)) {
      merged[key] = [...categoryMap[key]];
    }
    for (const [key, ids] of Object.entries(customCategoryMap)) {
      if (!merged[key]) merged[key] = [];
      merged[key].push(...ids);
    }
    return merged;
  }, [customCategoryMap]);

  // All port infos for health check (includes path for domain-based check)
  const allPortInfos = useMemo(() => allServices.map((s) => ({ port: s.port, path: s.path })), [allServices]);
  const { getHealth, checkAll, lastChecked, isChecking, networkAvailable } = useServerHealth(allPortInfos);

  const onlineCount = allServices.filter((s) => s.status === "online").length;
  const maintenanceCount = allServices.filter((s) => s.status === "maintenance").length;
  const inactiveCount = allServices.filter((s) => s.status === "inactive").length;
  const totalCount = allServices.length;

  const getFilteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (ids: string[]) => {
      let filtered = allServices.filter((s) => ids.includes(s.id));
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
  }, [searchQuery, allServices]);

  const visibleCategories = categories.filter((cat) => {
    if (activeFilter && activeFilter !== cat.id) return false;
    const ids = mergedCategoryMap[cat.id] ?? [];
    return getFilteredServices(ids).length > 0;
  });

  const favoriteServices = allServices.filter((s) => favorites.includes(s.id));

  return (
    <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* HERO */}
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
                <div className="flex items-center gap-2">
                  <p className="text-xs" style={{ color: "#94A3B8" }}>
                    사내 AI 서비스 바로가기
                  </p>
                  {lastChecked && (
                    <button
                      onClick={checkAll}
                      disabled={isChecking}
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-all hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8" }}
                    >
                      <RefreshCw
                        size={9}
                        style={{ animation: isChecking ? "spin 1s linear infinite" : "none" }}
                      />
                      {isChecking ? "확인 중..." : `마지막 체크: ${lastChecked.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status summary */}
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

        {/* Network notice banner */}
        {/* REMOVED: network external banner */}

        {/* QUICK ACCESS - Favorites */}
        {!searchQuery && !activeFilter && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} style={{ color: "#F59E0B" }} />
              <h2 className="font-bold text-sm" style={{ color: "#0F172A" }}>즐겨찾기</h2>
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
                    isFavorite onToggleFavorite={toggleFavorite}
                    health={getHealth(svc.port)} />
                ))}
              </div>
            ) : (
              <div
                className="flex items-center gap-3 px-5 py-4 rounded-xl"
                style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
              >
                <Star size={16} style={{ color: "#F59E0B" }} />
                <p className="text-xs" style={{ color: "#92400E" }}>
                  아래 서비스 카드의 <strong>별 아이콘</strong>을 클릭하면 즐겨찾기에 추가됩니다.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* FILTER TABS */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Layers size={15} style={{ color: "#6366F1" }} />
              <h2 className="font-bold text-sm" style={{ color: "#0F172A" }}>전체 서비스</h2>
              {searchQuery && (
                <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  "{searchQuery}" 검색 중
                </span>
              )}
            </div>

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
                const ids = mergedCategoryMap[cat.id] ?? [];
                const count = allServices.filter((s) => ids.includes(s.id)).length;
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

          {/* CATEGORY SECTIONS */}
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {visibleCategories.map((cat, catIndex) => {
                const ids = mergedCategoryMap[cat.id] ?? [];
                const catServices = getFilteredServices(ids);
                return (
                  <motion.section
                    key={cat.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: catIndex * 0.04 }}
                    layout
                  >
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
                          <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>{cat.label}</h3>
                          <span className="text-xs" style={{ color: "#94A3B8" }}>{cat.sublabel}</span>
                        </div>
                      </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {catServices.map((service, idx) => (
                        <ServiceCard key={service.id} service={service} index={idx}
                          isFavorite={isFavorite(service.id)} onToggleFavorite={toggleFavorite}
                          health={getHealth(service.port)} />
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </AnimatePresence>

            {visibleCategories.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF2FF" }}>
                  <Search size={28} style={{ color: "#A5B4FC" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: "#374151" }}>검색 결과가 없습니다</p>
                <p className="text-xs mt-1 mb-4" style={{ color: "#94A3B8" }}>다른 키워드로 검색해 보세요</p>
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

        {/* FOOTER */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-5 pb-3"
          style={{ borderTop: "1px solid #E2E8F0" }}
        >
          <div className="flex items-center gap-2">
            <img src={ec21Logo} alt="EC21 R&C" className="h-5 object-contain" />
            <span className="text-xs" style={{ color: "#94A3B8" }}>Agent Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: "#94A3B8", background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.color = "#4F46E5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
            >
              <Shield size={12} />
              관리자
            </Link>
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