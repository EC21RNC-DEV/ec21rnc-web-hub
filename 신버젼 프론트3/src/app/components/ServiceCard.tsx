import { useState, useRef, useEffect } from "react";
import { LucideIcon, ArrowUpRight, Star, Wifi, WifiOff, Loader2, CloudOff, Layers, X, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { HealthStatus } from "./useServerHealth";
import type { PortEntry } from "./useCustomServices";

export type ServiceStatus = "online" | "maintenance" | "inactive";

export interface Service {
  id: string;
  name: string;
  description: string;
  port: number;
  path?: string;
  ports?: PortEntry[];
  status: ServiceStatus;
  icon: LucideIcon;
}

interface ServiceCardProps {
  service: Service;
  index: number;
  compact?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  health?: HealthStatus;
  getHealth?: (port: number) => HealthStatus;
  isAdmin?: boolean;
}

const statusMeta: Record<ServiceStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  leftBar: string;
  dot: string;
  iconBg: string;
  iconColor: string;
}> = {
  online: {
    label: "운영 중",
    color: "#059669",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.18)",
    leftBar: "#10B981",
    dot: "0 0 6px rgba(16,185,129,0.6)",
    iconBg: "#EEF2FF",
    iconColor: "#4F46E5",
  },
  maintenance: {
    label: "점검중",
    color: "#B45309",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.18)",
    leftBar: "#F59E0B",
    dot: "0 0 6px rgba(245,158,11,0.5)",
    iconBg: "#FFFBEB",
    iconColor: "#D97706",
  },
  inactive: {
    label: "미사용",
    color: "#94A3B8",
    bg: "rgba(148,163,184,0.06)",
    border: "rgba(148,163,184,0.12)",
    leftBar: "#CBD5E1",
    dot: "none",
    iconBg: "#F8FAFC",
    iconColor: "#94A3B8",
  },
};

const healthMeta: Record<HealthStatus, { label: string; color: string; icon: typeof Wifi }> = {
  reachable: { label: "응답 중", color: "#10B981", icon: Wifi },
  unreachable: { label: "무응답", color: "#EF4444", icon: WifiOff },
  checking: { label: "확인 중", color: "#94A3B8", icon: Loader2 },
  "network-error": { label: "네트워크 외부", color: "#94A3B8", icon: CloudOff },
};

function buildSubdomainUrl(path: string | undefined, port: number) {
  const subdomain = path ? path.replace(/^\/|\/$/g, "").replace(/_/g, "-") : null;
  return subdomain ? `https://${subdomain}.ec21rnc-agent.com/` : `http://203.242.139.254:${port}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${hash.toString(36)}`;
}
const SITE_PW_HASH = simpleHash("movefast");

// ── 점검중 모달 ──
function MaintenanceModal({ serviceName, onClose }: { serviceName: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "#FFFBEB" }}
          >
            <AlertTriangle size={28} style={{ color: "#F59E0B" }} />
          </div>
          <h2 className="font-bold" style={{ fontSize: "17px", color: "#0F172A" }}>서비스 점검 중</h2>
          <p className="text-sm mt-2 mb-1 font-semibold" style={{ color: "#D97706" }}>{serviceName}</p>
          <p className="text-xs leading-relaxed" style={{ color: "#94A3B8" }}>
            현재 이 서비스는 점검 중입니다.<br />
            점검이 완료된 후 다시 이용해 주세요.
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "#F59E0B", color: "#FFF", boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}
          >
            확인
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── 서비스 접속 비밀번호 모달 ──
function ServiceAuthModal({ serviceName, onSuccess, onClose }: { serviceName: string; onSuccess: () => void; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (simpleHash(password) === SITE_PW_HASH) {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex flex-col items-center mb-5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "#EEF2FF" }}
            >
              <Lock size={20} style={{ color: "#4F46E5" }} />
            </div>
            <h2 className="font-bold text-sm" style={{ color: "#0F172A" }}>{serviceName}</h2>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>접속하려면 비밀번호를 입력하세요</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <motion.div
              animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="relative mb-3">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                <input
                  ref={inputRef}
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  autoComplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#F8FAFC",
                    border: error ? "2px solid #EF4444" : "2px solid rgba(0,0,0,0.06)",
                    color: "#1E293B",
                  }}
                  onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#4F46E5"; }}
                  onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#94A3B8" }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs mb-3 font-semibold"
                  style={{ color: "#EF4444" }}
                >
                  비밀번호가 일치하지 않습니다
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#F1F5F9", color: "#64748B" }}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: "#4F46E5", color: "#FFF", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}
              >
                접속
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ── Multi-port selection popup ──
function PortSelectPopup({
  ports,
  serviceName,
  onClose,
  getHealth,
}: {
  ports: PortEntry[];
  serviceName: string;
  onClose: (selectedPath?: string, selectedPort?: number) => void;
  getHealth?: (port: number) => HealthStatus;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #F1F5F9" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#EEF2FF" }}
            >
              <Layers size={16} style={{ color: "#4F46E5" }} />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>{serviceName}</h3>
              <p className="text-[11px]" style={{ color: "#94A3B8" }}>
                {ports.length}개 서버 중 선택하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: "#94A3B8" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Port list */}
        <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          {ports.map((entry, i) => {
            const h = getHealth?.(entry.port);
            const HealthIcon = h ? healthMeta[h].icon : null;
            return (
              <motion.button
                key={entry.port}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  onClose(entry.path, entry.port);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:shadow-md"
                style={{
                  background: "#F8FAFC",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}
                whileHover={{
                  background: "#EEF2FF",
                  borderColor: "rgba(99,102,241,0.2)",
                  scale: 1.01,
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
                >
                  <span className="font-mono text-xs font-bold" style={{ color: "#4F46E5" }}>
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#0F172A" }}>
                    {entry.label}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "#94A3B8" }}>
                    포트 {entry.port}{entry.path ? ` · ${entry.path.replace(/^\/|\/$/g, "")}.ec21rnc-agent.com` : ""}
                  </p>
                </div>
                {h && HealthIcon && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{
                      background: h === "reachable" ? "rgba(16,185,129,0.08)" : h === "unreachable" ? "rgba(239,68,68,0.08)" : "rgba(148,163,184,0.08)",
                    }}
                  >
                    <HealthIcon
                      size={10}
                      style={{
                        color: healthMeta[h].color,
                        animation: h === "checking" ? "spin 1s linear infinite" : "none",
                      }}
                    />
                    <span className="text-[10px] font-semibold" style={{ color: healthMeta[h].color }}>
                      {healthMeta[h].label}
                    </span>
                  </div>
                )}
                <ArrowUpRight size={14} className="flex-shrink-0" style={{ color: "#6366F1" }} />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

export function ServiceCard({ service, index, compact, isFavorite, onToggleFavorite, health, getHealth, isAdmin }: ServiceCardProps) {
  const { icon: Icon, status, name, description, port, path, ports, id } = service;
  const m = statusMeta[status];
  const isClickable = status !== "inactive";
  const isMaintenance = status === "maintenance";
  const isMultiPort = ports && ports.length > 1;
  const [showPortPopup, setShowPortPopup] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const handleClick = () => {
    if (!isClickable) return;
    // 점검중: 관리자만 접속 가능, 일반 사용자는 점검 팝업
    if (isMaintenance && !isAdmin) {
      setShowMaintenanceModal(true);
      return;
    }
    if (isMultiPort) {
      setShowPortPopup(true);
    } else {
      const url = buildSubdomainUrl(path, port);
      setPendingUrl(url);
      setShowAuthModal(true);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(id);
  };

  // Compact: full card와 동일한 형태
  if (compact) {
    const HealthIconCompact = health ? healthMeta[health].icon : null;
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.025, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={handleClick}
          className="group relative flex rounded-2xl overflow-hidden transition-all duration-200"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            cursor: isClickable ? "pointer" : "default",
            opacity: status === "inactive" ? 0.55 : 1,
          }}
          whileHover={
            isClickable
              ? {
                  y: -4,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
                  borderColor: "rgba(99,102,241,0.18)",
                  transition: { type: "spring", stiffness: 400, damping: 22 },
                }
              : {}
          }
          whileTap={isClickable ? { scale: 0.985 } : {}}
        >
          <div className="w-[4px] flex-shrink-0" style={{ background: m.leftBar }} />
          <div className="flex-1 p-4 flex flex-col min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative"
                style={{ background: m.iconBg }}
              >
                <Icon size={16} style={{ color: m.iconColor }} />
                {health && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{
                      background: healthMeta[health].color,
                      animation: health === "checking" ? "pulse 1.5s infinite" : "none",
                    }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className="font-bold truncate"
                    style={{ color: "#0F172A", fontSize: "15px", letterSpacing: "-0.01em" }}
                  >
                    {name}
                  </h3>
                  {isMultiPort ? (
                    <span
                      className="flex items-center gap-1 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                      style={{ background: "#EEF2FF", color: "#4F46E5" }}
                    >
                      <Layers size={10} />
                      {ports.length}개
                    </span>
                  ) : (
                    <span
                      className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                      style={{ background: "#F1F5F9", color: "#64748B" }}
                    >
                      :{port}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: "#94A3B8" }}>
                  {description}
                </p>
              </div>
              {onToggleFavorite && (
                <button
                  onClick={handleFavorite}
                  className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-150 hover:scale-110"
                  style={{
                    color: isFavorite ? "#F59E0B" : "#D1D5DB",
                    background: isFavorite ? "rgba(245,158,11,0.08)" : "transparent",
                  }}
                  title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                >
                  <Star size={15} fill={isFavorite ? "#F59E0B" : "none"} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-auto pt-2.5" style={{ borderTop: "1px solid #F3F4F6" }}>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ background: m.bg, border: `1px solid ${m.border}` }}
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full"
                    style={{
                      background: m.leftBar,
                      boxShadow: status === "online" ? m.dot : "none",
                      animation: status === "online" ? "pulse 2s ease-in-out infinite" : "none",
                    }}
                  />
                  <span className="text-[11px] font-semibold" style={{ color: m.color }}>
                    {m.label}
                  </span>
                </div>
                {health && HealthIconCompact && (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{
                      background: health === "reachable" ? "rgba(16,185,129,0.06)" : health === "unreachable" ? "rgba(239,68,68,0.06)" : "rgba(148,163,184,0.06)",
                    }}
                    title={`서버 상태: ${healthMeta[health].label}`}
                  >
                    <HealthIconCompact
                      size={10}
                      style={{
                        color: healthMeta[health].color,
                        animation: health === "checking" ? "spin 1s linear infinite" : "none",
                      }}
                    />
                    <span className="text-[10px] font-semibold" style={{ color: healthMeta[health].color }}>
                      {healthMeta[health].label}
                    </span>
                  </div>
                )}
              </div>
              {isClickable ? (
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#6366F1" }}>
                  <span className="hidden sm:inline">{isMultiPort ? "서버 선택" : "접속"}</span>
                  {isMultiPort ? (
                    <Layers size={14} />
                  ) : (
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  )}
                </div>
              ) : (
                <span className="text-[11px]" style={{ color: "#CBD5E1" }}>비활성</span>
              )}
            </div>
          </div>
        </motion.div>
        <AnimatePresence>
          {showPortPopup && isMultiPort && (
            <PortSelectPopup
              ports={ports}
              serviceName={name}
              onClose={(selectedPath, selectedPort) => {
                setShowPortPopup(false);
                if (selectedPath !== undefined && selectedPort !== undefined) {
                  setPendingUrl(buildSubdomainUrl(selectedPath, selectedPort));
                  setShowAuthModal(true);
                }
              }}
              getHealth={getHealth}
            />
          )}
          {showAuthModal && pendingUrl && (
            <ServiceAuthModal
              serviceName={name}
              onSuccess={() => { setShowAuthModal(false); window.open(pendingUrl!, "_blank"); setPendingUrl(null); }}
              onClose={() => { setShowAuthModal(false); setPendingUrl(null); }}
            />
          )}
          {showMaintenanceModal && (
            <MaintenanceModal serviceName={name} onClose={() => setShowMaintenanceModal(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Full service card
  const HealthIcon = health ? healthMeta[health].icon : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.025, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={handleClick}
        className="group relative flex rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          cursor: isClickable ? "pointer" : "default",
          opacity: status === "inactive" ? 0.55 : 1,
        }}
        whileHover={
          isClickable
            ? {
                y: -4,
                boxShadow: "0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
                borderColor: "rgba(99,102,241,0.18)",
                transition: { type: "spring", stiffness: 400, damping: 22 },
              }
            : {}
        }
        whileTap={isClickable ? { scale: 0.985 } : {}}
      >
        {/* Left color bar */}
        <div className="w-[4px] flex-shrink-0" style={{ background: m.leftBar }} />

        <div className="flex-1 p-4 flex flex-col min-w-0">
          {/* Row 1: Icon + Name + Port + Favorite */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative"
              style={{ background: m.iconBg }}
            >
              <Icon size={16} style={{ color: m.iconColor }} />
              {health && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{
                    background: healthMeta[health].color,
                    animation: health === "checking" ? "pulse 1.5s infinite" : "none",
                  }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className="font-bold truncate"
                  style={{ color: "#0F172A", fontSize: "15px", letterSpacing: "-0.01em" }}
                >
                  {name}
                </h3>
                {isMultiPort ? (
                  <span
                    className="flex items-center gap-1 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: "#EEF2FF", color: "#4F46E5" }}
                  >
                    <Layers size={10} />
                    {ports.length}개
                  </span>
                ) : (
                  <span
                    className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: "#F1F5F9", color: "#64748B" }}
                  >
                    :{port}
                  </span>
                )}
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: "#94A3B8" }}>
                {description}
              </p>
            </div>
            {onToggleFavorite && (
              <button
                onClick={handleFavorite}
                className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-150 hover:scale-110"
                style={{
                  color: isFavorite ? "#F59E0B" : "#D1D5DB",
                  background: isFavorite ? "rgba(245,158,11,0.08)" : "transparent",
                }}
                title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                <Star size={15} fill={isFavorite ? "#F59E0B" : "none"} />
              </button>
            )}
          </div>

          {/* Row 2: Status + Health + Action */}
          <div className="flex items-center justify-between mt-auto pt-2.5" style={{ borderTop: "1px solid #F3F4F6" }}>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: m.bg, border: `1px solid ${m.border}` }}
              >
                <span
                  className="w-[5px] h-[5px] rounded-full"
                  style={{
                    background: m.leftBar,
                    boxShadow: status === "online" ? m.dot : "none",
                    animation: status === "online" ? "pulse 2s ease-in-out infinite" : "none",
                  }}
                />
                <span className="text-[11px] font-semibold" style={{ color: m.color }}>
                  {m.label}
                </span>
              </div>

              {/* Health indicator */}
              {health && HealthIcon && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                  style={{
                    background: health === "reachable" ? "rgba(16,185,129,0.06)" : health === "unreachable" ? "rgba(239,68,68,0.06)" : "rgba(148,163,184,0.06)",
                  }}
                  title={`서버 상태: ${healthMeta[health].label}`}
                >
                  <HealthIcon
                    size={10}
                    style={{
                      color: healthMeta[health].color,
                      animation: health === "checking" ? "spin 1s linear infinite" : "none",
                    }}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: healthMeta[health].color }}>
                    {healthMeta[health].label}
                  </span>
                </div>
              )}
            </div>

            {isClickable ? (
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#6366F1" }}>
                <span className="hidden sm:inline">{isMultiPort ? "서버 선택" : "접속"}</span>
                {isMultiPort ? (
                  <Layers size={14} />
                ) : (
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                )}
              </div>
            ) : (
              <span className="text-[11px]" style={{ color: "#CBD5E1" }}>비활성</span>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPortPopup && isMultiPort && (
          <PortSelectPopup
            ports={ports}
            serviceName={name}
            onClose={(selectedPath, selectedPort) => {
              setShowPortPopup(false);
              if (selectedPath !== undefined && selectedPort !== undefined) {
                setPendingUrl(buildSubdomainUrl(selectedPath, selectedPort));
                setShowAuthModal(true);
              }
            }}
            getHealth={getHealth}
          />
        )}
        {showAuthModal && pendingUrl && (
          <ServiceAuthModal
            serviceName={name}
            onSuccess={() => { setShowAuthModal(false); window.open(pendingUrl!, "_blank"); setPendingUrl(null); }}
            onClose={() => { setShowAuthModal(false); setPendingUrl(null); }}
          />
        )}
        {showMaintenanceModal && (
          <MaintenanceModal serviceName={name} onClose={() => setShowMaintenanceModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
