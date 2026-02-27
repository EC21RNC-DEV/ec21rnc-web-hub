import { useState, useRef, useEffect } from "react";
import { Search, Zap, X, ExternalLink, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ec21Logo from "@/assets/5641b57d5ebb9d82fb48105ab919b7a78f36cd98.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DashboardLayout({ children, searchQuery, onSearchChange }: DashboardLayoutProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#F4F6FA" }}>
      {/* Header */}
      <header
        className="relative z-30 flex-shrink-0 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.72)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.04)" : "none",
        }}
      >
        <div className="max-w-[1680px] mx-auto w-full h-[60px] flex items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={ec21Logo}
              alt="EC21 R&C"
              className="h-8 flex-shrink-0 object-contain"
            />
            <span
              className="px-1.5 py-0.5 rounded-md font-bold"
              style={{
                background: "#EEF2FF",
                color: "#4F46E5",
                fontSize: "9px",
                letterSpacing: "0.05em",
              }}
            >
              PORTAL
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: searchFocused ? "#6366F1" : "#94A3B8" }}
              />
              <input
                type="text"
                placeholder="서비스명, 포트 검색..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-48 sm:w-60 pl-9 pr-8 py-2 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: searchFocused ? "#FFFFFF" : "#F1F5F9",
                  border: searchFocused ? "1.5px solid #6366F1" : "1.5px solid transparent",
                  color: "#1E293B",
                  boxShadow: searchFocused ? "0 0 0 3px rgba(99,102,241,0.08)" : "none",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#E2E8F0", color: "#64748B" }}
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Quick access */}
            <a
              href="http://203.242.139.254:8598"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4F46E5, #6366F1)",
                color: "#FFF",
                boxShadow: "0 2px 6px rgba(99,102,241,0.25)",
              }}
            >
              <Sparkles size={12} />
              OpenWeb UI
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main
        ref={mainRef}
        className="relative flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}