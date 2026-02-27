import {
  type LucideIcon,
  BrainCircuit, Briefcase, Settings, Archive,
  Rss, Users, BookOpen, TrendingUp, Send, ListChecks, Globe,
  Activity, Building2, Landmark, FolderOpen, Leaf,
  Network, Sparkles, LayoutGrid, Languages, ShieldCheck, FileSearch,
  Terminal, ArrowRightLeft, BarChart3, PieChart, Heart, Award,
  Scale, Monitor, MapPin, Megaphone,
} from "lucide-react";
import type { ServiceStatus } from "./ServiceCard";

export interface ServiceData {
  id: string;
  name: string;
  description: string;
  port: number;
  path: string;
  defaultStatus: ServiceStatus;
  icon: LucideIcon;
}

export interface CategoryData {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

export const categories: CategoryData[] = [
  { id: "agent", label: "AI 에이전트", sublabel: "대화형 AI 인터페이스", icon: BrainCircuit, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  { id: "main", label: "주요 사업", sublabel: "EMERiCs, AIF, GIP, CIFC 등", icon: Briefcase, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  { id: "tools", label: "공통 기능", sublabel: "AI 도구 및 데이터 처리", icon: Settings, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  { id: "inactive", label: "미사용 서비스", sublabel: "현재 비활성화", icon: Archive, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
];

export const servicesData: ServiceData[] = [
  { id: "s1", name: "OpenWeb UI", description: "AI 에이전트 및 대화형 인터페이스", port: 8598, path: "/openwebui", defaultStatus: "online", icon: BrainCircuit },
  { id: "s2", name: "EMERiCs 뉴스브리핑", description: "신흥국 뉴스 브리핑 자동화", port: 8501, path: "/emerics-news", defaultStatus: "online", icon: Rss },
  { id: "s3", name: "EMERiCs 전문가오피니언", description: "전문가 의견 분석 및 정리", port: 8519, path: "/emerics-opinion", defaultStatus: "online", icon: Users },
  { id: "s4", name: "EMERiCs 월간특집", description: "월간 특집 리포트 생성", port: 8533, path: "/emerics-monthly", defaultStatus: "online", icon: BookOpen },
  { id: "s5", name: "EMERiCs 이슈트렌드", description: "신흥국 이슈 트렌드 분석", port: 8555, path: "/emerics-trend", defaultStatus: "online", icon: TrendingUp },
  { id: "s6", name: "AIF 뉴스레터 자동화", description: "아세안·인도남아시아 뉴스레터", port: 8503, path: "/aif-newsletter", defaultStatus: "online", icon: Send },
  { id: "s7", name: "보고서 내용 검수", description: "보고서 품질 검수 시스템", port: 8542, path: "/emerics-inspection", defaultStatus: "maintenance", icon: ListChecks },
  { id: "s8", name: "GIP 일일동향", description: "국내외 일일 동향 정리", port: 8525, path: "/gip-daily", defaultStatus: "maintenance", icon: Globe },
  { id: "s9", name: "원전 입찰정보", description: "원자력 발전 입찰 정보 웹앱", port: 8513, path: "/nuclear-bid", defaultStatus: "online", icon: Activity },
  { id: "s10", name: "글코포 자동화", description: "글로벌 코스매틱 포커스 자동화 웹앱", port: 8509, path: "/globecorpo-auto", defaultStatus: "online", icon: Building2 },
  { id: "s11", name: "CIFC 해금협 이슈정보", description: "해외건설금융협회 이슈 정보", port: 8540, path: "/cifc-issues", defaultStatus: "maintenance", icon: Landmark },
  { id: "s12", name: "CIFC 입찰정보 분류", description: "해금협 입찰 정보 자동 분류", port: 8541, path: "/cifc-bidding", defaultStatus: "maintenance", icon: FolderOpen },
  { id: "s13", name: "농산업 수출전략 조사", description: "농산업 수출 전략 자동화", port: 8518, path: "/agri-export", defaultStatus: "online", icon: Leaf },
  { id: "s14", name: "이슈 클러스터링", description: "이슈 클러스터링 및 요약", port: 8591, path: "/issue-clustering", defaultStatus: "online", icon: Network },
  { id: "s15", name: "CSF AI 툴 모음", description: "CSF 전용 AI 도구 모음", port: 8508, path: "/csf-tools", defaultStatus: "online", icon: Sparkles },
  { id: "s16", name: "AI 툴 모음", description: "범용 AI 도구 모음", port: 8515, path: "/ai-tools", defaultStatus: "online", icon: LayoutGrid },
  { id: "s17", name: "인터뷰 번역봇", description: "인터뷰 내용 자동 번역", port: 8504, path: "/interview-translator", defaultStatus: "online", icon: Languages },
  { id: "s18", name: "보고서 출처 검증", description: "보고서 출처 자동 검증", port: 8590, path: "/report-verification", defaultStatus: "online", icon: ShieldCheck },
  { id: "s19", name: "기사내용 추출기", description: "웹 기사 내용 자동 추출", port: 8592, path: "/article-extractor", defaultStatus: "online", icon: FileSearch },
  { id: "s20", name: "프롬프트 허브", description: "AI 프롬프트 관리 허브", port: 8599, path: "/prompt-hub", defaultStatus: "maintenance", icon: Terminal },
  { id: "s21", name: "PDF to HTML 변환기", description: "PDF 문서를 HTML로 변환", port: 8593, path: "/pdf-converter", defaultStatus: "online", icon: ArrowRightLeft },
  { id: "s22", name: "농수맞춤 자동화(시장분석)", description: "농업/수산업 맞춤형 시장분석", port: 8511, path: "/agri-market-analysis", defaultStatus: "inactive", icon: BarChart3 },
  { id: "s23", name: "농수맞춤 자동화(경쟁력분석)", description: "농업/수산업 맞춤형 경쟁력분석", port: 8514, path: "/agri-competitiveness", defaultStatus: "inactive", icon: PieChart },
  { id: "s24", name: "aT 반려동물(시장분석)", description: "반려동물 연관 산업 시장분석", port: 8522, path: "/at-pet-market", defaultStatus: "inactive", icon: Heart },
  { id: "s25", name: "aT 반려동물(경쟁력분석)", description: "반려동물 연관 산업 경쟁력분석", port: 8524, path: "/at-pet-competitive", defaultStatus: "inactive", icon: Award },
  { id: "s26", name: "KOCCA 법령정보", description: "기업맞춤형 법령정보", port: 8516, path: "/kocca-legal", defaultStatus: "inactive", icon: Scale },
  { id: "s27", name: "KOCCA 콘텐츠 이용행태", description: "기업맞춤형 콘텐츠 이용행태", port: 8517, path: "/kocca-behavior", defaultStatus: "inactive", icon: Monitor },
  { id: "s28", name: "KOCCA 해외 심층정보", description: "기업맞춤형 해외 심층정보", port: 8520, path: "/kocca-overseas", defaultStatus: "inactive", icon: MapPin },
  { id: "s29", name: "KOCCA 국내동향 해외제공", description: "기업맞춤형 국내 동향 해외제공", port: 8521, path: "/kocca-domestic", defaultStatus: "inactive", icon: Megaphone },
];

export const categoryMap: Record<string, string[]> = {
  agent: ["s1"],
  main: ["s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13"],
  tools: ["s14","s15","s16","s17","s18","s19","s20","s21"],
  inactive: ["s22","s23","s24","s25","s26","s27","s28","s29"],
};
