import {
  AlertCircle,
  Archive,
  Bot,
  CheckCircle2,
  Clock3,
  MessageCircle,
  MessagesSquare,
  PenLine,
  Plus,
  Send,
  Sparkles,
  Theater,
  WandSparkles,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "../../../components/shadcn/ui/alert";
import { Badge } from "../../../components/shadcn/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/shadcn/ui/breadcrumb";
import { Button } from "../../../components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/shadcn/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/shadcn/ui/dialog";
import { Skeleton } from "../../../components/shadcn/ui/skeleton";
import { Field } from "../../../components/ui/Field";
import { Textarea } from "../../../components/ui/Textarea";
import {
  archiveAiConversation,
  createAiConversation,
  getAiConversation,
  listAiConversations,
  sendAiTutorMessage,
} from "../../../lib/api/aiTutorApi";
import { getApiErrorMessage } from "../../../lib/api/client";
import type {
  AiConversationDetail,
  AiConversationSummary,
  AiTutorFeedbackType,
  AiTutorMessage,
  AiTutorPracticeType,
} from "../../../lib/api/types";
import { formatStudentLearningDate } from "./studentLearningUtils";

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 2000;

const practiceTypeOptions: Array<{
  type: AiTutorPracticeType;
  label: string;
  description: string;
  className: string;
}> = [
  {
    type: "FREE_CHAT",
    label: "Trò chuyện tự do",
    description:
      "Hỏi đáp linh hoạt về tiếng Anh, cách diễn đạt và luyện phản xạ.",
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    type: "ROLEPLAY",
    label: "Đóng vai tình huống",
    description:
      "Luyện hội thoại theo bối cảnh đời thực như nhà hàng, lớp học, du lịch.",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    type: "WRITING_PRACTICE",
    label: "Luyện viết",
    description: "Viết câu, đoạn văn và nhận góp ý sửa lỗi trực tiếp.",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
];

const feedbackLabels: Record<AiTutorFeedbackType, string> = {
  GRAMMAR: "Ngữ pháp",
  VOCABULARY: "Từ vựng",
  WORD_CHOICE: "Dùng từ",
  STYLE: "Văn phong",
  OTHER: "Khác",
};

function getPracticeLabel(type: AiTutorPracticeType) {
  return (
    practiceTypeOptions.find((option) => option.type === type)?.label ?? type
  );
}

function getPracticeClassName(type: AiTutorPracticeType) {
  return (
    practiceTypeOptions.find((option) => option.type === type)?.className ??
    "border-slate-200 bg-slate-50 text-slate-700"
  );
}

function PracticeIcon({
  type,
  className = "size-4",
}: {
  type: AiTutorPracticeType;
  className?: string;
}) {
  switch (type) {
    case "ROLEPLAY":
      return <Theater className={className} />;
    case "WRITING_PRACTICE":
      return <PenLine className={className} />;
    case "FREE_CHAT":
    default:
      return <MessageCircle className={className} />;
  }
}

function PracticeBadge({ type }: { type: AiTutorPracticeType }) {
  return (
    <Badge variant="outline" className={getPracticeClassName(type)}>
      <PracticeIcon type={type} />
      {getPracticeLabel(type)}
    </Badge>
  );
}

function buildEmptyDetail(
  summary: AiConversationSummary,
): AiConversationDetail {
  return {
    id: summary.id,
    title: summary.title,
    practiceType: summary.practiceType,
    status: summary.status,
    startedAt: summary.lastMessageAt,
    lastMessageAt: summary.lastMessageAt,
    cleanupWarnAt: summary.cleanupWarnAt,
    archiveAfter: summary.archiveAfter,
    deleteAfter: null,
    cleanupWarning: summary.cleanupWarning,
    messages: [],
  };
}

function sortMessages(messages: AiTutorMessage[]) {
  return [...messages].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.id - right.id;
  });
}

export function StudentAiTutorPage() {
  const mountedRef = useRef(false);
  const chatRegionRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const sendRequestIdRef = useRef(0);
  const archiveRequestIdRef = useRef(0);
  const createRequestIdRef = useRef(0);

  const [conversations, setConversations] = useState<AiConversationSummary[]>(
    [],
  );
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<AiConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationTitleError, setConversationTitleError] = useState<
    string | undefined
  >();
  const [practiceType, setPracticeType] =
    useState<AiTutorPracticeType>("FREE_CHAT");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  function focusChatComposer() {
    chatRegionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    composerRef.current?.focus();
  }

  async function loadConversations() {
    const requestId = listRequestIdRef.current + 1;
    listRequestIdRef.current = requestId;

    setListLoading(true);
    setListError(null);

    try {
      const response = await listAiConversations({ page: 0, size: 3 });
      if (!mountedRef.current || listRequestIdRef.current !== requestId)
        return [];
      const recentConversations = response.data.content.slice(0, 3);
      setConversations(recentConversations);
      return recentConversations;
    } catch (error) {
      if (mountedRef.current && listRequestIdRef.current === requestId)
        setListError(
          getApiErrorMessage(
            error,
            "Không thể tải danh sách hội thoại gần đây.",
          ),
        );
      return [];
    } finally {
      if (mountedRef.current && listRequestIdRef.current === requestId)
        setListLoading(false);
    }
  }

  async function loadConversationDetail(conversationId: number) {
    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;

    setDetailLoading(true);
    setDetailError(null);
    setMessageError(null);
    setArchiveError(null);

    try {
      const response = await getAiConversation(conversationId);
      if (!mountedRef.current || detailRequestIdRef.current !== requestId)
        return;
      setSelectedConversation(response.data);
      focusChatComposer();
    } catch (error) {
      if (mountedRef.current && detailRequestIdRef.current === requestId)
        setDetailError(
          getApiErrorMessage(error, "Không thể tải nội dung hội thoại."),
        );
    } finally {
      if (mountedRef.current && detailRequestIdRef.current === requestId)
        setDetailLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    const listTimer = window.setTimeout(() => void loadConversations(), 0);

    return () => {
      window.clearTimeout(listTimer);
      mountedRef.current = false;
    };
  }, []);

  function resetCreateForm() {
    setConversationTitle("");
    setConversationTitleError(undefined);
    setPracticeType("FREE_CHAT");
    setCreateError(null);
  }

  function openCreateDialog() {
    resetCreateForm();
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    if (creating) return;
    setCreateOpen(false);
    resetCreateForm();
  }

  async function handleCreateConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = conversationTitle.trim();

    if (!trimmedTitle) {
      setConversationTitleError("Vui lòng nhập tiêu đề hội thoại.");
      return;
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setConversationTitleError("Tiêu đề không được vượt quá 120 ký tự.");
      return;
    }

    const requestId = createRequestIdRef.current + 1;
    createRequestIdRef.current = requestId;

    setCreating(true);
    setCreateError(null);
    setConversationTitleError(undefined);

    try {
      const response = await createAiConversation({
        title: trimmedTitle,
        practiceType,
      });
      if (!mountedRef.current || createRequestIdRef.current !== requestId)
        return;
      detailRequestIdRef.current += 1;
      setCreateOpen(false);
      setSelectedConversation(buildEmptyDetail(response.data));
      setDetailError(null);
      setDetailLoading(false);
      setMessageText("");
      setMessageError(null);
      setArchiveError(null);
      resetCreateForm();
      await loadConversations();
      focusChatComposer();
    } catch (error) {
      if (mountedRef.current && createRequestIdRef.current === requestId)
        setCreateError(
          getApiErrorMessage(error, "Không thể tạo hội thoại mới."),
        );
    } finally {
      if (mountedRef.current && createRequestIdRef.current === requestId)
        setCreating(false);
    }
  }

  function handleSelectConversation(summary: AiConversationSummary) {
    if (sending || archiving) return;
    setSelectedConversation(buildEmptyDetail(summary));
    void loadConversationDetail(summary.id);
  }

  async function handleSendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!selectedConversation) return;

    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) {
      setMessageError("Vui lòng nhập tin nhắn trước khi gửi.");
      return;
    }
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setMessageError("Tin nhắn không được vượt quá 2000 ký tự.");
      return;
    }

    const requestId = sendRequestIdRef.current + 1;
    sendRequestIdRef.current = requestId;
    const conversationId = selectedConversation.id;

    setSending(true);
    setMessageError(null);
    setArchiveError(null);

    try {
      const response = await sendAiTutorMessage(conversationId, {
        message: trimmedMessage,
      });
      if (!mountedRef.current || sendRequestIdRef.current !== requestId) return;
      detailRequestIdRef.current += 1;
      setSelectedConversation((current) => {
        if (!current || current.id !== conversationId) return current;
        return {
          ...current,
          title: response.data.conversation.title,
          practiceType: response.data.conversation.practiceType,
          status: response.data.conversation.status,
          lastMessageAt: response.data.conversation.lastMessageAt,
          cleanupWarnAt: response.data.conversation.cleanupWarnAt,
          archiveAfter: response.data.conversation.archiveAfter,
          cleanupWarning: response.data.conversation.cleanupWarning,
          messages: [
            ...current.messages,
            response.data.userMessage,
            response.data.aiMessage,
          ],
        };
      });
      setMessageText("");
      await loadConversations();
    } catch (error) {
      if (mountedRef.current && sendRequestIdRef.current === requestId)
        setMessageError(
          getApiErrorMessage(
            error,
            "Không thể gửi tin nhắn. Nội dung của bạn vẫn được giữ lại.",
          ),
        );
    } finally {
      if (mountedRef.current && sendRequestIdRef.current === requestId)
        setSending(false);
    }
  }

  async function handleArchiveConversation() {
    if (!selectedConversation) return;

    const requestId = archiveRequestIdRef.current + 1;
    archiveRequestIdRef.current = requestId;
    const conversationId = selectedConversation.id;

    setArchiving(true);
    setArchiveError(null);
    setMessageError(null);

    try {
      await archiveAiConversation(conversationId);
      if (!mountedRef.current || archiveRequestIdRef.current !== requestId)
        return;
      detailRequestIdRef.current += 1;
      setSelectedConversation(null);
      const remainingConversations = await loadConversations();
      if (!mountedRef.current || archiveRequestIdRef.current !== requestId)
        return;
      const firstRemaining =
        remainingConversations.find(
          (conversation) => conversation.id !== conversationId,
        ) ?? remainingConversations[0];
      if (firstRemaining && archiveRequestIdRef.current === requestId) {
        setSelectedConversation(buildEmptyDetail(firstRemaining));
        await loadConversationDetail(firstRemaining.id);
      }
    } catch (error) {
      if (mountedRef.current && archiveRequestIdRef.current === requestId)
        setArchiveError(
          getApiErrorMessage(error, "Không thể lưu trữ hội thoại."),
        );
    } finally {
      if (mountedRef.current && archiveRequestIdRef.current === requestId)
        setArchiving(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (!sending && !archiving) void handleSendMessage();
  }

  const selectedMessages = selectedConversation
    ? sortMessages(selectedConversation.messages)
    : [];
  const messageLength = messageText.length;
  const composerDisabled = sending || archiving || !selectedConversation;
  const sendDisabled =
    composerDisabled ||
    messageText.trim().length === 0 ||
    messageText.trim().length > MAX_MESSAGE_LENGTH;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/student">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>AI Tutor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="relative overflow-hidden border-indigo-100 py-0 shadow-sm">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative bg-gradient-to-br from-amber-50 via-white to-indigo-50 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-amber-700"
                >
                  <Bot className="size-3" />
                  Chat luyện tập cá nhân
                </Badge>
              </div>
              <div className="space-y-2">
                <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                    <MessagesSquare className="size-6" />
                  </span>
                  AI Chatbot Tutor
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Tạo hội thoại luyện tiếng Anh với trợ giảng AI, nhận phản hồi
                  tức thì và tiếp tục ba cuộc trò chuyện gần nhất.
                </p>
              </div>
            </div>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={openCreateDialog}
            >
              <Plus className="size-4" />
              Tạo hội thoại mới
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-slate-200 py-0 shadow-sm">
          <CardHeader className="border-b bg-white/80 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <Clock3 className="size-4 text-indigo-600" />3 cuộc hội thoại gần
              nhất
            </CardTitle>
            <CardDescription>
              Chỉ hiển thị tối đa 3 hội thoại đang hoạt động.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <div className="max-h-[520px] overflow-y-auto p-3">
              {listLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              ) : null}
              {!listLoading && listError ? (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertCircle className="size-4" />
                  <AlertDescription>{listError}</AlertDescription>
                </Alert>
              ) : null}
              {!listLoading && !listError && conversations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-5 text-sm text-slate-600">
                  <Bot className="mb-3 size-8 text-indigo-500" />
                  <p className="font-medium text-slate-900">
                    Chưa có hội thoại nào.
                  </p>
                  <p className="mt-1">
                    Tạo hội thoại đầu tiên để bắt đầu luyện tập cùng AI Tutor.
                  </p>
                </div>
              ) : null}
              {!listLoading && !listError && conversations.length > 0 ? (
                <div className="space-y-3">
                  {conversations.slice(0, 3).map((conversation) => {
                    const selected =
                      selectedConversation?.id === conversation.id;
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={sending || archiving}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          selected
                            ? "border-indigo-200 bg-indigo-50 shadow-sm shadow-indigo-100"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-2">
                            <p className="truncate font-medium text-slate-950">
                              {conversation.title}
                            </p>
                            <PracticeBadge type={conversation.practiceType} />
                          </div>
                          <span className="rounded-full bg-white p-2 text-indigo-600 ring-1 ring-indigo-100">
                            <PracticeIcon type={conversation.practiceType} />
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
                          {conversation.messagePreview ??
                            "Chưa có tin nhắn trong hội thoại này."}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>
                            Hoạt động:{" "}
                            {formatStudentLearningDate(
                              conversation.lastMessageAt,
                            )}
                          </span>
                          {conversation.cleanupWarning ? (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-amber-700"
                            >
                              <AlertCircle className="size-3" />
                              Sắp lưu trữ
                            </Badge>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card
          ref={chatRegionRef}
          className="flex max-h-[980px] min-h-[640px] h-[calc(100vh-10rem)] flex-col overflow-hidden border-indigo-100 py-0 shadow-sm"
        >
          {!selectedConversation ? (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-gradient-to-br from-white via-indigo-50/40 to-amber-50/50 p-6">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
                  <WandSparkles className="size-8" />
                </div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Chọn hoặc tạo một hội thoại
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  AI Tutor sẵn sàng luyện phản xạ, đóng vai tình huống hoặc sửa
                  bài viết khi bạn bắt đầu.
                </p>
                <Button
                  className="mt-5 bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={openCreateDialog}
                >
                  <Plus className="size-4" />
                  Tạo hội thoại mới
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col bg-slate-50/80">
              <div className="border-b bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <PracticeBadge type={selectedConversation.practiceType} />
                      {selectedConversation.cleanupWarning ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700"
                        >
                          <AlertCircle className="size-3" />
                          Sắp đến hạn lưu trữ
                        </Badge>
                      ) : null}
                    </div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {selectedConversation.title}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Hoạt động gần nhất:{" "}
                      {formatStudentLearningDate(
                        selectedConversation.lastMessageAt,
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={sending || archiving}
                    loading={archiving}
                    onClick={handleArchiveConversation}
                  >
                    <Archive className="size-4" />
                    Lưu trữ hội thoại
                  </Button>
                </div>
                {archiveError ? (
                  <Alert
                    variant="destructive"
                    className="mt-4 border-red-200 bg-red-50"
                  >
                    <AlertCircle className="size-4" />
                    <AlertDescription>{archiveError}</AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <div
                data-testid="ai-tutor-message-scroller"
                className="max-h-full min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
              >
                {detailLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-3/4" />
                    <Skeleton className="ml-auto h-20 w-2/3" />
                    <Skeleton className="h-24 w-4/5" />
                  </div>
                ) : null}
                {!detailLoading && detailError ? (
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50"
                  >
                    <AlertCircle className="size-4" />
                    <AlertDescription>{detailError}</AlertDescription>
                  </Alert>
                ) : null}
                {!detailLoading &&
                !detailError &&
                selectedMessages.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-indigo-200 bg-white p-6 text-center shadow-sm">
                    <Bot className="mx-auto mb-3 size-10 text-indigo-500" />
                    <p className="font-medium text-slate-950">
                      Hội thoại đã sẵn sàng.
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Gửi câu đầu tiên, ví dụ: “I want order pizza.”
                    </p>
                  </div>
                ) : null}
                {!detailLoading &&
                !detailError &&
                selectedMessages.length > 0 ? (
                  <div className="space-y-5">
                    {selectedMessages.map((message) => {
                      const isUser = message.senderType === "USER";
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser ? (
                            <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 ring-1 ring-indigo-100">
                              <Bot className="size-5" />
                            </span>
                          ) : null}
                          <div
                            className={`max-w-[min(760px,85%)] space-y-2 ${isUser ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm whitespace-pre-wrap ${
                                isUser
                                  ? "rounded-br-md bg-indigo-600 text-white shadow-indigo-100"
                                  : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                              }`}
                            >
                              {message.message}
                            </div>
                            <p
                              className={`text-xs text-slate-500 ${isUser ? "text-right" : "text-left"}`}
                            >
                              {formatStudentLearningDate(message.createdAt)}
                            </p>
                            {isUser && message.feedback ? (
                              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-slate-700 shadow-sm">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="border-amber-300 bg-white text-amber-700"
                                  >
                                    <AlertCircle className="size-3" />
                                    {feedbackLabels[message.feedback.errorType]}
                                  </Badge>
                                  <span className="text-xs text-amber-700">
                                    Phản hồi dưới tin nhắn của bạn
                                  </span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-xl bg-white p-3 ring-1 ring-amber-100">
                                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                                      <AlertCircle className="size-3" />
                                      Câu gốc
                                    </p>
                                    <p className="whitespace-pre-wrap text-slate-800">
                                      {message.feedback.originalText}
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-white p-3 ring-1 ring-emerald-100">
                                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                                      <CheckCircle2 className="size-3" />
                                      Gợi ý sửa
                                    </p>
                                    <p className="whitespace-pre-wrap text-slate-800">
                                      {message.feedback.correctedText}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-amber-100">
                                  <p className="mb-1 flex items-center gap-1 text-xs font-medium text-indigo-600">
                                    <Sparkles className="size-3" />
                                    Giải thích
                                  </p>
                                  <p className="whitespace-pre-wrap">
                                    {message.feedback.explanation}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="border-t bg-white p-4"
              >
                {messageError ? (
                  <Alert
                    variant="destructive"
                    className="mb-3 border-red-200 bg-red-50"
                  >
                    <AlertCircle className="size-4" />
                    <AlertDescription>{messageError}</AlertDescription>
                  </Alert>
                ) : null}
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Tin nhắn gửi AI Tutor
                  </span>
                  <Textarea
                    ref={composerRef}
                    value={messageText}
                    maxLength={MAX_MESSAGE_LENGTH}
                    disabled={composerDisabled}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Ví dụ: I want order pizza."
                    className="min-h-24 resize-none border-indigo-100 bg-indigo-50/30 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    className={`text-xs ${messageLength > MAX_MESSAGE_LENGTH ? "text-red-600" : "text-slate-500"}`}
                  >
                    {messageLength}/{MAX_MESSAGE_LENGTH} ký tự. Nhấn Enter để
                    gửi, Shift+Enter để xuống dòng.
                  </p>
                  <Button
                    type="submit"
                    disabled={sendDisabled}
                    loading={sending}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Send className="size-4" />
                    Gửi tin nhắn
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) =>
          open ? openCreateDialog() : closeCreateDialog()
        }
      >
        <DialogContent
          className="max-h-[90vh] max-w-2xl overflow-y-auto border-indigo-100 p-0 shadow-2xl"
          showCloseButton={!creating}
        >
          <DialogHeader className="border-b bg-gradient-to-br from-indigo-50 to-amber-50 px-5 py-5">
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-950">
              <Plus className="size-5 text-indigo-600" />
              Tạo hội thoại mới
            </DialogTitle>
            <DialogDescription>
              Chọn mục tiêu luyện tập để AI Tutor phản hồi đúng ngữ cảnh.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 py-5">
            <form onSubmit={handleCreateConversation} className="space-y-5">
              {createError ? (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertCircle className="size-4" />
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              ) : null}
              <Field label="Tiêu đề hội thoại" error={conversationTitleError}>
                <input
                  value={conversationTitle}
                  maxLength={MAX_TITLE_LENGTH}
                  disabled={creating}
                  onChange={(event) => setConversationTitle(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Ví dụ: Luyện gọi món ở nhà hàng"
                />
              </Field>
              <p className="text-xs text-slate-500">
                {conversationTitle.length}/{MAX_TITLE_LENGTH} ký tự
              </p>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-slate-700">
                  Chế độ luyện tập
                </legend>
                <div className="grid gap-3 md:grid-cols-3">
                  {practiceTypeOptions.map((option) => {
                    const selected = practiceType === option.type;
                    return (
                      <label
                        key={option.type}
                        className={`cursor-pointer rounded-2xl border p-4 transition ${
                          selected
                            ? "border-indigo-200 bg-indigo-50 shadow-sm shadow-indigo-100"
                            : "border-slate-200 bg-white hover:border-indigo-200"
                        } ${creating ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <input
                          type="radio"
                          name="practiceType"
                          value={option.type}
                          checked={selected}
                          disabled={creating}
                          onChange={() => setPracticeType(option.type)}
                          className="sr-only"
                        />
                        <span className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-white text-indigo-600 ring-1 ring-indigo-100">
                          <PracticeIcon type={option.type} className="size-5" />
                        </span>
                        <span className="block font-medium text-slate-950">
                          {option.label}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-slate-600">
                          {option.description}
                        </span>
                        {selected ? (
                          <span className="mt-3 inline-flex text-xs font-medium text-indigo-700">
                            Đang chọn
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={creating}
                  onClick={closeCreateDialog}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  loading={creating}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Plus className="size-4" />
                  Tạo hội thoại mới
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
