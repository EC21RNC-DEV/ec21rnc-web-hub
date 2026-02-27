import { useState, useMemo } from "react";
import {
  ArrowLeft, Search, X, RotateCcw, CheckCircle2, AlertTriangle,
  XCircle, Server, Shield, ChevronDown, Plus, Trash2, Lock,
  Eye, EyeOff, LogOut, Key, RefreshCw, Wifi, WifiOff, Loader2, CloudOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { useServiceStatus } from "./useServiceStatus";
import { useAdminAuth } from "./useAdminAuth";
import { useCustomServices, type CustomServiceData } from "./useCustomServices";
import { useServerHealth } from "./useServerHealth";
import { useAdminOnly } from "./useAdminOnly";
import { useHiddenServices } from "./useHiddenServices";
import { getIcon, iconNames } from "./icon-map";
import { servicesData, categories, categoryMap, type ServiceData } from "./services-data";
import type { ServiceStatus } from "./ServiceCard";
import ec21Logo from "@/assets/5641b57d5ebb9d82fb48105ab919b7a78f36cd98.png";

const statusOptions: { value: ServiceStatus; label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }[] = [
  { value: "online", label: "운영 중", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: CheckCircle2 },
  { value: "maintenance", label: "점검중", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: AlertTriangle },
  { value: "inactive", label: "미사용", color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", icon: XCircle },
];

// ── Login Screen ──
function LoginScreen({ onLogin }: { onLogin: (pw: string) => Promise<boolean> }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onLogin(password);
    if (!success) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4F6FA" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm mx-4"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex flex-col items-center mb-6">
            <img src={ec21Logo} alt="EC21 R&C" className="h-10 object-contain mb-4" />
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "#EEF2FF" }}
            >
              <Lock size={24} style={{ color: "#4F46E5" }} />
            </div>
            <h1 className="font-bold" style={{ fontSize: "18px", color: "#0F172A" }}>관리자 인증</h1>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>비밀번호를 입력하여 관리자 페이지에 접속하세요</p>
          </div>

          <form onSubmit={handleSubmit}>
            <motion.div
              animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="relative mb-3">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#F8FAFC",
                    border: error ? "2px solid #EF4444" : "2px solid rgba(0,0,0,0.06)",
                    color: "#1E293B",
                  }}
                  onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#4F46E5"; }}
                  onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)"; }}
                  autoFocus
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

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{
                background: "#4F46E5",
                color: "#FFF",
                boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
              }}
            >
              로그인
            </button>
          </form>

          <p className="text-center text-[11px] mt-4" style={{ color: "#CBD5E1" }}>
            관리자 인증이 필요합니다
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 mt-4 text-xs font-semibold py-2 rounded-xl transition-colors"
          style={{ color: "#94A3B8" }}
        >
          <ArrowLeft size={12} />
          대시보드로 돌아가기
        </Link>
      </motion.div>
    </div>
  );
}

// ── Add Service Modal ──
function AddServiceModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: Omit<CustomServiceData, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [port, setPort] = useState("");
  const [servicePath, setServicePath] = useState("");
  const [category, setCategory] = useState("tools");
  const [iconName, setIconName] = useState("Server");
  const [status, setStatus] = useState<ServiceStatus>("online");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const isValid = name.trim() && description.trim() && port.trim() && !isNaN(Number(port));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const pathVal = servicePath.trim();
    onAdd({
      name: name.trim(),
      description: description.trim(),
      port: Number(port),
      ...(pathVal ? { path: pathVal.startsWith("/") ? pathVal : `/${pathVal}` } : {}),
      category,
      iconName,
      defaultStatus: status,
    });
    onClose();
  };

  const SelectedIcon = getIcon(iconName);

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
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div className="flex items-center gap-2">
            <Plus size={16} style={{ color: "#4F46E5" }} />
            <h2 className="font-bold text-sm" style={{ color: "#0F172A" }}>새 서비스 추가</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: "#94A3B8" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>서비스명 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 새로운 AI 서비스"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#F8FAFC", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1E293B" }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>설명 *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: AI 기반 문서 분석 서비스"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#F8FAFC", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1E293B" }}
            />
          </div>

          {/* Port + Path + Category */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>포트 번호 *</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="예: 8600"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1E293B" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>도메인 경로</label>
              <input
                type="text"
                value={servicePath}
                onChange={(e) => setServicePath(e.target.value)}
                placeholder="예: /my-service/"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1E293B" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                style={{ background: "#F8FAFC", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1E293B" }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>초기 상태</label>
            <div className="flex gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-1 justify-center transition-all"
                  style={
                    status === opt.value
                      ? { background: opt.color, color: "#FFF", boxShadow: `0 2px 6px ${opt.color}40` }
                      : { background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }
                  }
                >
                  <opt.icon size={12} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#374151" }}>아이콘</label>
            <button
              type="button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: "#F8FAFC", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1E293B" }}
            >
              <SelectedIcon size={16} style={{ color: "#4F46E5" }} />
              <span>{iconName}</span>
              <ChevronDown size={12} style={{ color: "#94A3B8", marginLeft: "auto" }} />
            </button>
            <AnimatePresence>
              {showIconPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="grid grid-cols-8 gap-1.5 mt-2 p-3 rounded-xl max-h-[180px] overflow-y-auto"
                    style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", scrollbarWidth: "thin" }}
                  >
                    {iconNames.map((name) => {
                      const Ic = getIcon(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => { setIconName(name); setShowIconPicker(false); }}
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            background: iconName === name ? "#4F46E5" : "transparent",
                            color: iconName === name ? "#FFF" : "#64748B",
                          }}
                          title={name}
                        >
                          <Ic size={14} />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
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
              disabled={!isValid}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: isValid ? "#4F46E5" : "#E2E8F0",
                color: isValid ? "#FFF" : "#94A3B8",
                boxShadow: isValid ? "0 2px 8px rgba(79,70,229,0.3)" : "none",
                cursor: isValid ? "pointer" : "not-allowed",
              }}
            >
              추가
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Admin Page ──
export function AdminPage() {
  const { isAuthenticated, login, logout } = useAdminAuth();
  const { overrides, setStatus, resetStatus, resetAll, getStatus } = useServiceStatus();
  const { customServices, addService, removeService } = useCustomServices();
  const { adminOnlyIds, toggleAdminOnly, isAdminOnly } = useAdminOnly();
  const { isHidden, toggleHidden } = useHiddenServices();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<ServiceStatus | "all">("all");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // All services (built-in + custom)
  const allServicesData = useMemo(() => {
    const custom = customServices.map((s) => ({
      ...s,
      icon: getIcon(s.iconName),
      isCustom: true,
    }));
    return [
      ...servicesData.map((s) => ({ ...s, isCustom: false, category: "", iconName: "" })),
      ...custom,
    ];
  }, [customServices]);

  // All port infos for health check (API server checks directly + nginx fallback)
  const allPortInfos = useMemo(() => allServicesData.map((s: any) => ({ port: s.port, path: s.path })), [allServicesData]);
  const { getHealth, checkAll, lastChecked, isChecking } = useServerHealth(allPortInfos);

  // Merged category map
  const mergedCategoryMap = useMemo(() => {
    const merged: Record<string, string[]> = {};
    for (const key of Object.keys(categoryMap)) {
      merged[key] = [...categoryMap[key]];
    }
    customServices.forEach((s) => {
      if (!merged[s.category]) merged[s.category] = [];
      merged[s.category].push(s.id);
    });
    return merged;
  }, [customServices]);

  const filteredBuiltIn = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return servicesData.filter((s) => {
      const currentStatus = getStatus(s.id, s.defaultStatus);
      if (filterStatus !== "all" && currentStatus !== filterStatus) return false;
      if (query) {
        return (
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.port.toString().includes(query)
        );
      }
      return true;
    });
  }, [searchQuery, filterStatus, getStatus]);

  const filteredCustom = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return customServices.filter((s) => {
      const currentStatus = getStatus(s.id, s.defaultStatus);
      if (filterStatus !== "all" && currentStatus !== filterStatus) return false;
      if (query) {
        return (
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.port.toString().includes(query)
        );
      }
      return true;
    });
  }, [searchQuery, filterStatus, getStatus, customServices]);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleStatusChange = (id: string, status: ServiceStatus) => {
    const svc = allServicesData.find((s) => s.id === id);
    const defaultSt = svc ? ("defaultStatus" in svc ? svc.defaultStatus : "online") : "online";
    if (defaultSt === status) {
      resetStatus(id);
    } else {
      setStatus(id, status);
    }
    const label = statusOptions.find((o) => o.value === status)?.label ?? status;
    showToast(`${svc?.name} → ${label}`);
  };

  const handleResetAll = () => {
    resetAll();
    showToast("모든 상태가 초기화되었습니다", "info");
  };

  const handleBulkStatus = (catId: string, status: ServiceStatus) => {
    const ids = mergedCategoryMap[catId] ?? [];
    ids.forEach((id) => {
      const svc = allServicesData.find((s) => s.id === id);
      const defaultSt = svc ? ("defaultStatus" in svc ? svc.defaultStatus : "online") : "online";
      if (defaultSt === status) {
        resetStatus(id);
      } else {
        setStatus(id, status);
      }
    });
    const cat = categories.find((c) => c.id === catId);
    const label = statusOptions.find((o) => o.value === status)?.label ?? status;
    showToast(`${cat?.label} 전체 → ${label}`);
  };

  const handleAddService = (data: Omit<CustomServiceData, "id" | "createdAt">) => {
    addService(data);
    showToast(`"${data.name}" 서비스가 추가되었습니다`);
  };

  const handleDeleteService = (id: string) => {
    const svc = customServices.find((s) => s.id === id);
    removeService(id);
    resetStatus(id);
    showToast(`"${svc?.name}" 삭제됨`, "error");
    setDeleteConfirm(null);
  };

  const overrideCount = Object.keys(overrides).length;
  const onlineCount = allServicesData.filter((s) => getStatus(s.id, s.defaultStatus) === "online").length;
  const maintCount = allServicesData.filter((s) => getStatus(s.id, s.defaultStatus) === "maintenance").length;
  const inactiveCount = allServicesData.filter((s) => getStatus(s.id, s.defaultStatus) === "inactive").length;

  const HealthDot = ({ port }: { port: number }) => {
    const h = getHealth(port);
    const color = h === "reachable" ? "#10B981" : h === "unreachable" ? "#EF4444" : "#94A3B8";
    const Icon = h === "reachable" ? Wifi : h === "unreachable" ? WifiOff : h === "network-error" ? CloudOff : Loader2;
    const label = h === "reachable" ? "응답 중" : h === "unreachable" ? "무응답" : h === "network-error" ? "네트워크 외부" : "확인 중";
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: `${color}10` }}>
        <Icon size={10} style={{ color, animation: h === "checking" ? "spin 1s linear infinite" : "none" }} />
        <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
      </div>
    );
  };

  const renderServiceRow = (svc: ServiceData | (CustomServiceData & { icon?: never }), idx: number, total: number, isCustom: boolean) => {
    const currentStatus = getStatus(svc.id, svc.defaultStatus);
    const isOverridden = overrides[svc.id] !== undefined;
    const Icon = isCustom ? getIcon((svc as CustomServiceData).iconName) : (svc as ServiceData).icon;
    const statusMeta = statusOptions.find((o) => o.value === currentStatus)!;

    return (
      <div
        key={svc.id}
        className="flex items-center gap-3 px-5 py-3 transition-colors"
        style={{
          borderBottom: idx < total - 1 ? "1px solid #F8FAFC" : "none",
          background: isOverridden ? "rgba(99,102,241,0.02)" : "transparent",
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: statusMeta.bg }}
        >
          <Icon size={16} style={{ color: statusMeta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate" style={{ color: "#0F172A" }}>{svc.name}</p>
            <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ background: "#F1F5F9", color: "#64748B" }}>:{svc.port}</span>
            <HealthDot port={svc.port} />
            {isOverridden && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ background: "#EEF2FF", color: "#4F46E5" }}>변경됨</span>
            )}
            {isCustom && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ background: "#F0FDF4", color: "#16A34A" }}>커스텀</span>
            )}
            {isHidden(svc.id) && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ background: "#FEF2F2", color: "#DC2626" }}>숨김</span>
            )}
            {isAdminOnly(svc.id) && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ background: "#FFF7ED", color: "#EA580C" }}>관리자 전용</span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: "#94A3B8" }}>{svc.description}</p>
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {statusOptions.map((opt) => {
            const isActive = currentStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(svc.id, opt.value)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  isActive
                    ? { background: opt.color, color: "#FFF", boxShadow: `0 2px 6px ${opt.color}40` }
                    : { background: "#F8FAFC", color: "#94A3B8", border: "1px solid #E2E8F0" }
                }
              >
                <opt.icon size={12} />
                <span className="hidden md:inline">{opt.label}</span>
              </button>
            );
          })}

          {isOverridden && (
            <button
              onClick={() => { resetStatus(svc.id); showToast(`${svc.name} → 초기값 복원`, "info"); }}
              className="p-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "#FEF2F2", color: "#DC2626" }}
              title="초기값 복원"
            >
              <RotateCcw size={12} />
            </button>
          )}

          {/* 관리자 전용 토글 */}
          <button
            onClick={() => {
              toggleAdminOnly(svc.id);
              showToast(
                isAdminOnly(svc.id)
                  ? `${svc.name} → 전체 공개`
                  : `${svc.name} → 관리자 전용`,
                "info"
              );
            }}
            className="p-1.5 rounded-lg transition-all hover:opacity-80"
            style={
              isAdminOnly(svc.id)
                ? { background: "#FFF7ED", color: "#EA580C" }
                : { background: "#F8FAFC", color: "#CBD5E1" }
            }
            title={isAdminOnly(svc.id) ? "관리자 전용 해제" : "관리자 전용으로 설정"}
          >
            {isAdminOnly(svc.id) ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>

          {deleteConfirm === svc.id ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (isCustom) {
                    handleDeleteService(svc.id);
                  } else {
                    toggleHidden(svc.id);
                    showToast(`"${svc.name}" 숨김 처리됨`, "error");
                    setDeleteConfirm(null);
                  }
                }}
                className="px-2 py-1.5 rounded-lg text-[10px] font-bold"
                style={{ background: "#DC2626", color: "#FFF" }}
              >
                확인
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-2 py-1.5 rounded-lg text-[10px] font-bold"
                style={{ background: "#F1F5F9", color: "#64748B" }}
              >
                취소
              </button>
            </div>
          ) : isHidden(svc.id) ? (
            <button
              onClick={() => { toggleHidden(svc.id); showToast(`"${svc.name}" 복원됨`, "info"); }}
              className="p-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "#ECFDF5", color: "#059669" }}
              title="복원"
            >
              <RotateCcw size={12} />
            </button>
          ) : (
            <button
              onClick={() => setDeleteConfirm(svc.id)}
              className="p-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "#FEF2F2", color: "#DC2626" }}
              title={isCustom ? "삭제" : "숨기기"}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#F4F6FA" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="max-w-[1400px] mx-auto w-full h-[60px] flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: "#F1F5F9", color: "#64748B" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.color = "#4F46E5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#64748B"; }}
            >
              <ArrowLeft size={16} />
            </Link>
            <img src={ec21Logo} alt="EC21 R&C" className="h-7 object-contain" />
            <div className="flex items-center gap-1.5">
              <Shield size={14} style={{ color: "#4F46E5" }} />
              <p className="font-bold" style={{ color: "#0F172A", fontSize: "15px" }}>서비스 관리</p>
              <span className="px-1.5 py-0.5 rounded-md font-bold"
                style={{ background: "#FEF2F2", color: "#DC2626", fontSize: "9px", letterSpacing: "0.05em" }}>
                ADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkAll}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE" }}
            >
              <RefreshCw size={12} style={{ animation: isChecking ? "spin 1s linear infinite" : "none" }} />
              {isChecking ? "확인 중..." : "서버 체크"}
            </button>
            {overrideCount > 0 && (
              <button
                onClick={handleResetAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
              >
                <RotateCcw size={12} />
                초기화 ({overrideCount})
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "#F8FAFC", color: "#94A3B8", border: "1px solid #E2E8F0" }}
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "전체", count: allServicesData.length, color: "#4F46E5", bg: "#EEF2FF", icon: Server },
            { label: "운영 중", count: onlineCount, color: "#059669", bg: "#ECFDF5", icon: CheckCircle2 },
            { label: "점검중", count: maintCount, color: "#D97706", bg: "#FFFBEB", icon: AlertTriangle },
            { label: "미사용", count: inactiveCount, color: "#64748B", bg: "#F8FAFC", icon: XCircle },
            { label: "커스텀", count: customServices.length, color: "#16A34A", bg: "#F0FDF4", icon: Plus },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.bg }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="font-bold" style={{ fontSize: "20px", color: "#0F172A" }}>{stat.count}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Health check status bar */}
        {lastChecked && (
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <Wifi size={13} style={{ color: "#10B981" }} />
              <span className="text-xs font-semibold" style={{ color: "#374151" }}>서버 헬스체크</span>
              <span className="text-[11px]" style={{ color: "#94A3B8" }}>
                마지막 확인: {lastChecked.toLocaleTimeString("ko-KR")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const reachable = allPortInfos.filter((p) => getHealth(p.port) === "reachable").length;
                const unreachable = allPortInfos.filter((p) => getHealth(p.port) === "unreachable").length;
                const checking = allPortInfos.filter((p) => getHealth(p.port) === "checking").length;
                return (
                  <>
                    <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#059669" }}>
                      <Wifi size={10} /> {reachable} 응답
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#EF4444" }}>
                      <WifiOff size={10} /> {unreachable} 무응답
                    </span>
                    {checking > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#94A3B8" }}>
                        <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> {checking} 확인 중
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Search & Filter + Add button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="서비스명, 포트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#FFFFFF", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1E293B" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "#E2E8F0", color: "#64748B" }}>
                <X size={10} />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
            <button onClick={() => setFilterStatus("all")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filterStatus === "all" ? { background: "#4F46E5", color: "#FFF" } : { color: "#64748B" }}>
              전체
            </button>
            {statusOptions.map((opt) => (
              <button key={opt.value}
                onClick={() => setFilterStatus(filterStatus === opt.value ? "all" : opt.value)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={filterStatus === opt.value ? { background: opt.color, color: "#FFF" } : { color: "#64748B" }}>
                <opt.icon size={11} />{opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#4F46E5", color: "#FFF", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}
          >
            <Plus size={14} />
            서비스 추가
          </button>
        </div>

        {/* Category sections */}
        {categories.map((cat) => {
          const catIds = mergedCategoryMap[cat.id] ?? [];
          const builtInCat = filteredBuiltIn.filter((s) => catIds.includes(s.id));
          const customCat = filteredCustom.filter((s) => catIds.includes(s.id));
          const allCat = [...builtInCat, ...customCat];
          if (allCat.length === 0) return null;

          const isExpanded = expandedCategory === null || expandedCategory === cat.id;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none"
                style={{ borderBottom: isExpanded ? "1px solid #F1F5F9" : "none" }}
                onClick={() => setExpandedCategory(isExpanded && expandedCategory !== null ? null : cat.id === expandedCategory ? null : cat.id)}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.bg }}>
                  <cat.icon size={14} style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>{cat.label}</h3>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold"
                      style={{ background: cat.bg, color: cat.color }}>{allCat.length}</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 mr-2" onClick={(e) => e.stopPropagation()}>
                  {statusOptions.map((opt) => (
                    <button key={opt.value}
                      onClick={() => handleBulkStatus(cat.id, opt.value)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-80"
                      style={{ background: opt.bg, color: opt.color, border: `1px solid ${opt.border}` }}>
                      <opt.icon size={10} />일괄 {opt.label}
                    </button>
                  ))}
                </div>
                <ChevronDown size={16} style={{ color: "#94A3B8", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {builtInCat.map((svc, idx) => renderServiceRow(svc, idx, allCat.length, false))}
                    {customCat.map((svc, idx) => renderServiceRow(svc as any, builtInCat.length + idx, allCat.length, true))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Empty state */}
        {filteredBuiltIn.length === 0 && filteredCustom.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF2FF" }}>
              <Search size={28} style={{ color: "#A5B4FC" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: "#374151" }}>검색 결과가 없습니다</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 pb-2" style={{ borderTop: "1px solid #E2E8F0" }}>
          <div className="flex items-center gap-2">
            <img src={ec21Logo} alt="EC21 R&C" className="h-4 object-contain" />
            <span className="text-[11px]" style={{ color: "#CBD5E1" }}>Admin Panel</span>
          </div>
          <span className="text-[11px]" style={{ color: "#CBD5E1" }}>
            상태 변경 및 서비스 추가는 서버에 저장되어 모든 사용자에게 공유됩니다
          </span>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddServiceModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddService}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: toast.type === "success" ? "#059669" : toast.type === "error" ? "#DC2626" : "#4F46E5",
              color: "#FFF",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            {toast.type === "success" ? <CheckCircle2 size={14} /> : toast.type === "error" ? <Trash2 size={14} /> : <RotateCcw size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}