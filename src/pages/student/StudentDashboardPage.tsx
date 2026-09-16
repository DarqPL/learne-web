import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Loader2,
  Map as MapIcon,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "../../components/shadcn/ui/alert";
import { Badge } from "../../components/shadcn/ui/badge";
import { Button } from "../../components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/shadcn/ui/card";
import { getApiErrorMessage } from "../../lib/api/client";
import {
  getStudentDashboard,
  getCurrentCourseRecommendations,
  getPlacementStatus,
  skipPlacement,
} from "../../lib/api/studentLearningApi";
import type {
  CourseRecommendationPath,
  PlacementStatus,
  StudentDashboard,
} from "../../lib/api/types";
import { useAuth } from "../../lib/auth/auth-context";

const quickActions = [
  {
    title: "Khám phá khóa học",
    description:
      "Tìm khóa học đã duyệt theo trình độ và kỹ năng cần cải thiện.",
    to: "/student/courses",
    phase: "Phase 6",
    icon: BookOpen,
    className: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    title: "Khóa đã đăng ký",
    description: "Tiếp tục bài học, theo dõi lesson và tiến độ hoàn thành.",
    to: "/student/enrollments",
    phase: "Phase 6-7",
    icon: GraduationCap,
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  {
    title: "Lộ trình học",
    description: "Xem hành trình học cá nhân và các bước nên ưu tiên.",
    to: "/student/learning-path",
    phase: "Phase 7",
    icon: MapIcon,
    className: "border-violet-100 bg-violet-50 text-violet-700",
  },
  {
    title: "AI đề xuất khóa học",
    description: "Dùng kết quả đầu vào để đề xuất khóa học phù hợp.",
    to: "/student/course-recommendations",
    phase: "Phase 8",
    icon: Sparkles,
    className: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
  {
    title: "Kiểm tra ngữ pháp AI",
    description: "Dán đoạn văn tiếng Anh để AI highlight lỗi và gợi ý sửa.",
    to: "/student/grammar-check",
    phase: "Phase 9",
    icon: FileCheck2,
    className: "border-amber-100 bg-amber-50 text-amber-700",
  },
  {
    title: "AI Tutor",
    description: "Luyện hội thoại, roleplay và writing cùng gia sư AI.",
    to: "/student/ai-tutor",
    phase: "Phase 9",
    icon: Bot,
    className: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700",
  },
];

const learningFlow = [
  { label: "Chọn khóa học", description: "Tìm khóa phù hợp", icon: BookOpen },
  {
    label: "Làm bài học / quiz",
    description: "Tích lũy tiến độ",
    icon: ClipboardCheck,
  },
  {
    label: "Nhận đề xuất AI",
    description: "Cá nhân hóa hướng học",
    icon: Sparkles,
  },
  { label: "Luyện với AI Tutor", description: "Thực hành mỗi ngày", icon: Bot },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const mountedRef = useRef(false);
  const [placementStatus, setPlacementStatus] =
    useState<PlacementStatus | null>(null);
  const [recommendations, setRecommendations] =
    useState<CourseRecommendationPath | null>(null);
  const [loadingAiCard, setLoadingAiCard] = useState(true);
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    void getStudentDashboard()
      .then((response) => {
        if (!mountedRef.current) return;
        setDashboard(response.data);
        setDashboardError(null);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setDashboardError(
          getApiErrorMessage(err, "Không thể tải dashboard học viên."),
        );
      })
      .finally(() => {
        if (mountedRef.current) setLoadingDashboard(false);
      });

    void Promise.allSettled([
      getPlacementStatus(),
      getCurrentCourseRecommendations(),
    ])
      .then(([statusResult, recommendationsResult]) => {
        if (!mountedRef.current) return;

        if (statusResult.status === "fulfilled") {
          setPlacementStatus(statusResult.value.data);
        } else {
          setPlacementStatus(null);
        }

        setRecommendations(
          recommendationsResult.status === "fulfilled"
            ? recommendationsResult.value.data
            : null,
        );
      })
      .finally(() => {
        if (mountedRef.current) setLoadingAiCard(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleSkipPlacement() {
    if (skipping) return;

    setSkipping(true);
    setCardError(null);
    try {
      const response = await skipPlacement();
      if (!mountedRef.current) return;
      setPlacementStatus(response.data);
    } catch (err) {
      if (!mountedRef.current) return;
      setCardError(
        getApiErrorMessage(
          err,
          "Không thể bỏ qua bài kiểm tra đầu vào. Vui lòng thử lại sau.",
        ),
      );
    } finally {
      if (mountedRef.current) setSkipping(false);
    }
  }

  const recommendationCount = recommendations?.items.length ?? 0;
  const shouldTakePlacement =
    placementStatus === null ||
    (!placementStatus.placementCompleted && !placementStatus.skipped);
  const stats = dashboard?.stats;
  const enrollmentSummary = dashboard?.enrollmentSummary;
  const studentStats = [
    {
      label: "Tổng XP",
      value: stats ? formatNumber(stats.totalXp) : "--",
      description: "Điểm kinh nghiệm đã tích lũy",
      icon: Zap,
      className: "border-amber-100 bg-amber-50 text-amber-700",
    },
    {
      label: "Streak hiện tại",
      value: stats ? `${formatNumber(stats.currentStreakDays)} ngày` : "--",
      description: "Số ngày học liên tiếp",
      icon: Sparkles,
      className: "border-orange-100 bg-orange-50 text-orange-700",
    },
    {
      label: "Streak dài nhất",
      value: stats ? `${formatNumber(stats.longestStreakDays)} ngày` : "--",
      description: "Kỷ lục duy trì thói quen",
      icon: Trophy,
      className: "border-violet-100 bg-violet-50 text-violet-700",
    },
    {
      label: "Bài học hoàn thành",
      value: enrollmentSummary
        ? formatNumber(enrollmentSummary.completedLessons)
        : "--",
      description: enrollmentSummary
        ? `${formatNumber(enrollmentSummary.activeEnrollments)} khóa đang học / ${formatNumber(enrollmentSummary.totalEnrollments)} khóa đã đăng ký`
        : "Theo dõi tiến độ học tập",
      icon: CheckCircle2,
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-6 overflow-hidden">
      <section className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-xl shadow-indigo-200">
        <div className="relative p-6 sm:p-8">
          <div className="relative max-w-3xl space-y-5">
            <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
              <GraduationCap className="size-3.5" aria-hidden="true" /> AI
              Learning Hub
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Chào mừng trở lại, {user?.fullName ?? "học viên"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-50 sm:text-base">
                Trung tâm học tập cá nhân giúp bạn khám phá khóa học, theo dõi
                tiến độ và luyện tiếng Anh cùng các công cụ AI của LearnE.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="bg-white text-indigo-700 hover:bg-indigo-50"
              >
                <Link to="/student/enrollments">
                  <PlayCircle className="size-4" aria-hidden="true" /> Tiếp tục
                  học
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/student/ai-tutor">
                  <Bot className="size-4" aria-hidden="true" /> Mở AI Tutor
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-label="Tổng quan học tập">
        {dashboardError ? (
          <Alert variant="destructive">
            <AlertDescription>{dashboardError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {studentStats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="border-slate-200 bg-white">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                  <div>
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="mt-2 text-2xl text-slate-950">
                      {loadingDashboard ? "..." : item.value}
                    </CardTitle>
                  </div>
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${item.className}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">
                Tiến độ đăng ký
              </CardTitle>
              <CardDescription>
                Ngữ cảnh học tập từ các khóa đã tham gia.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Tổng đăng ký</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {enrollmentSummary
                    ? formatNumber(enrollmentSummary.totalEnrollments)
                    : "--"}
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-4">
                <p className="text-xs font-medium text-indigo-600">Đang học</p>
                <p className="mt-2 text-2xl font-bold text-indigo-800">
                  {enrollmentSummary
                    ? formatNumber(enrollmentSummary.activeEnrollments)
                    : "--"}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-600">Đã hoàn thành</p>
                <p className="mt-2 text-2xl font-bold text-emerald-800">
                  {enrollmentSummary
                    ? formatNumber(enrollmentSummary.completedLessons)
                    : "--"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Trophy className="size-5 text-amber-500" aria-hidden="true" />
                Bảng xếp hạng học viên
              </CardTitle>
              <CardDescription>Top học viên theo XP và streak.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDashboard ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Đang tải bảng xếp hạng...
                </div>
              ) : dashboard?.leaderboard.length ? (
                <div className="space-y-3">
                  {dashboard.leaderboard.map((student, index) => (
                    <div
                      key={student.userId}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-indigo-700 shadow-sm">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Streak {formatNumber(student.currentStreakDays)} ngày
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-amber-600">
                          {formatNumber(student.totalXp)} XP
                        </p>
                        <p className="text-xs text-slate-500">
                          Kỷ lục {formatNumber(student.longestStreakDays)} ngày
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Chưa có dữ liệu xếp hạng
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Lối tắt học tập"
      >
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.to}
              to={action.to}
              className="group rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Card className="h-full border-slate-200 bg-white transition-all group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-100">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border ${action.className}`}
                    >
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <Badge
                      variant="outline"
                      className="border-slate-200 text-slate-500"
                    >
                      {action.phase}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="flex items-center justify-between gap-3 text-lg leading-6 text-slate-950">
                      <span>{action.title}</span>
                      <ArrowRight
                        className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600"
                        aria-hidden="true"
                      />
                    </CardTitle>
                    <CardDescription className="mt-2 leading-6">
                      {action.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </section>

      <section
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        aria-label="Luồng học tập"
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Hành trình học trên LearnE
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Các phase chính được gom thành một luồng học rõ ràng cho học viên.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-indigo-200 bg-indigo-50 text-indigo-700"
          >
            Phase 6-9
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {learningFlow.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.label}
                className="relative rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-950">{step.label}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
        <div className="border-b border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge className="border-indigo-100 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                <Sparkles className="size-3.5" aria-hidden="true" /> AI đề xuất
              </Badge>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">
                Khóa học phù hợp với bạn
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Bài kiểm tra đầu vào và lịch sử học giúp AI xác định điểm cần
                cải thiện, sau đó đề xuất khóa học nên bắt đầu trước.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Link to="/student/course-recommendations">
                Xem AI đề xuất{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="p-6">
          {cardError ? (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{cardError}</AlertDescription>
            </Alert>
          ) : null}

          {loadingAiCard ? (
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm text-indigo-700">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />{" "}
              Đang kiểm tra dữ liệu cá nhân hóa...
            </div>
          ) : shouldTakePlacement ? (
            <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                    <Target className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    Bắt đầu bằng bài kiểm tra đầu vào
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Hoàn thành 20 câu hỏi để AI hiểu trình độ hiện tại, điểm
                    mạnh và điểm cần cải thiện trước khi đề xuất khóa học.
                  </p>
                  {placementStatus?.reason ? (
                    <p className="mt-3 text-xs font-medium text-indigo-700">
                      {placementStatus.reason}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button
                    asChild
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Link to="/student/placement-test">
                      Làm bài kiểm tra đầu vào
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    loading={skipping}
                    disabled={skipping}
                    onClick={() => void handleSkipPlacement()}
                  >
                    Bỏ qua
                  </Button>
                </div>
              </div>
            </div>
          ) : recommendationCount > 0 ? (
            <div className="rounded-3xl border border-violet-100 bg-violet-50/60 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <Badge
                    variant="outline"
                    className="border-violet-200 bg-white text-violet-700"
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden="true" /> AI
                    match sẵn sàng
                  </Badge>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">
                    Khóa học AI đề xuất đã sẵn sàng
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {recommendations?.weaknesses.length
                      ? `AI phát hiện bạn nên tập trung: ${recommendations.weaknesses.join(", ")}.`
                      : "AI đã phân tích dữ liệu hiện có để đề xuất khóa học phù hợp."}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                  <p className="text-xs font-medium text-violet-600">Đề xuất</p>
                  <p className="text-3xl font-bold text-violet-800">
                    {recommendationCount}
                  </p>
                  <p className="text-xs text-slate-500">khóa học</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Link to="/student/course-recommendations">
                    Xem khóa học AI đề xuất
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/student/courses">Khám phá khóa học</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-indigo-200 bg-slate-50 p-6">
              <Sparkles
                className="mb-3 size-8 text-indigo-500"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold text-slate-950">
                Chưa có khóa học AI đề xuất
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Bạn có thể mở trang đề xuất để tạo danh sách khóa học cá nhân
                hóa, hoặc khám phá toàn bộ khóa học đã duyệt.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Link to="/student/course-recommendations">
                    Xem AI đề xuất
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/student/courses">Khám phá khóa học</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </section>
    </div>
  );
}
