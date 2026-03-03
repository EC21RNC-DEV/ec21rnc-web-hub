import { useState } from "react";
import { RouterProvider } from "react-router";
import { Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { router } from "./routes";
import { useSiteAuth } from "./components/useSiteAuth";
import ec21Logo from "@/assets/5641b57d5ebb9d82fb48105ab919b7a78f36cd98.png";

function SiteLoginScreen({ onLogin }: { onLogin: (pw: string) => boolean }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
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
            <h1 className="font-bold" style={{ fontSize: "18px", color: "#0F172A" }}>사이트 접속</h1>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>비밀번호를 입력하여 사이트에 접속하세요</p>
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
              접속하기
            </button>
          </form>

          <p className="text-center text-[11px] mt-4" style={{ color: "#CBD5E1" }}>
            접속 인증이 필요합니다
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, login } = useSiteAuth();

  if (!isAuthenticated) {
    return <SiteLoginScreen onLogin={login} />;
  }

  return <RouterProvider router={router} />;
}
