import { LucideIcon, ArrowUpRight, Star } from "lucide-react";
import { motion } from "motion/react";

export type ServiceStatus = "online" | "maintenance" | "inactive";

export interface Service {
  id: string;
  name: string;
  description: string;
  port: number;
  path: string;
  status: ServiceStatus;
  icon: LucideIcon;
}

interface ServiceCardProps {
  service: Service;
  index: number;
  compact?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
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

export function ServiceCard({ service, index, compact, isFavorite, onToggleFavorite }: ServiceCardProps) {
  const { icon: Icon, status, name, description, port, id } = service;
  const m = statusMeta[status];
  const isClickable = status !== "inactive";

  const handleClick = () => {
    if (isClickable) {
      const isProduction = window.location.hostname === "ec21rnc-agent.com";
      const url = isProduction
        ? `${window.location.origin}${service.path}`
        : `http://203.242.139.254:${port}`;
      window.open(url, "_blank");
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(id);
  };

  // ── Compact quick-access card ──
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        onClick={handleClick}
        className="group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
        whileHover={{
          y: -2,
          boxShadow: "0 8px 24px rgba(99,102,241,0.1), 0 2px 6px rgba(0,0,0,0.04)",
          borderColor: "rgba(99,102,241,0.2)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: m.iconBg }}
        >
          <Icon size={16} style={{ color: m.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "#0F172A" }}>{name}</p>
          <p className="text-xs truncate" style={{ color: "#94A3B8" }}>:{port}</p>
        </div>
        {onToggleFavorite && (
          <button
            onClick={handleFavorite}
            className="flex-shrink-0 p-1 rounded-lg transition-all duration-150 hover:scale-110"
            style={{ color: "#F59E0B" }}
            title="즐겨찾기 해제"
          >
            <Star size={14} fill="#F59E0B" />
          </button>
        )}
        <ArrowUpRight
          size={14}
          className="flex-shrink-0 opacity-30 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: "#6366F1" }}
        />
      </motion.div>
    );
  }

  // ── Full service card ──
  return (
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
      <div
        className="w-[4px] flex-shrink-0"
        style={{ background: m.leftBar }}
      />

      <div className="flex-1 p-4 flex flex-col min-w-0">
        {/* Row 1: Icon + Name + Port + Favorite */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: m.iconBg }}
          >
            <Icon size={16} style={{ color: m.iconColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="font-bold truncate"
                style={{ color: "#0F172A", fontSize: "15px", letterSpacing: "-0.01em" }}
              >
                {name}
              </h3>
              <span
                className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ background: "#F1F5F9", color: "#64748B" }}
              >
                :{port}
              </span>
            </div>
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: "#94A3B8" }}
            >
              {description}
            </p>
          </div>
          {/* Favorite star button */}
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

        {/* Row 2: Status + Action */}
        <div className="flex items-center justify-between mt-auto pt-2.5" style={{ borderTop: "1px solid #F3F4F6" }}>
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

          {isClickable ? (
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#6366F1" }}>
              <span className="hidden sm:inline">접속</span>
              <ArrowUpRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          ) : (
            <span className="text-[11px]" style={{ color: "#CBD5E1" }}>비활성</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
