import { useRouteError, Link } from "react-router";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export function ErrorFallback() {
  const error = useRouteError();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F4F6FA" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "#FEF2F2" }}
        >
          <AlertTriangle size={28} style={{ color: "#DC2626" }} />
        </div>
        <h1
          className="font-bold mb-2"
          style={{ fontSize: "18px", color: "#0F172A" }}
        >
          페이지 오류
        </h1>
        <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>
          {error instanceof Error
            ? error.message
            : "페이지를 불러오는 중 오류가 발생했습니다."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "#F1F5F9",
              color: "#64748B",
            }}
          >
            <ArrowLeft size={14} />
            대시보드
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "#4F46E5",
              color: "#FFF",
              boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
            }}
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
