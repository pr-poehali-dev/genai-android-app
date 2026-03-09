import { useState, useRef, useCallback, DragEvent } from "react";
import Icon from "@/components/ui/icon";

const DURATION_OPTIONS = [
  { value: 5, label: "5 сек", tokens: 10 },
  { value: 10, label: "10 сек", tokens: 20 },
  { value: 15, label: "15 сек", tokens: 30 },
];

const STYLE_OPTIONS = [
  { id: "cinematic", label: "Кино", icon: "Film" },
  { id: "anime", label: "Аниме", icon: "Sparkles" },
  { id: "realistic", label: "Реализм", icon: "Eye" },
  { id: "abstract", label: "Абстракт", icon: "Layers" },
];

const ASPECT_OPTIONS = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
];

interface HistoryItem {
  id: number;
  prompt: string;
  duration: number;
  style: string;
  aspect: string;
  timestamp: Date;
  tokens: number;
  photo?: string;
}

export default function Index() {
  const [tokens, setTokens] = useState(500);
  const [godMode, setGodMode] = useState(false);
  const [godTaps, setGodTaps] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [style, setStyle] = useState("cinematic");
  const [aspect, setAspect] = useState("16:9");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const godTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentOption = DURATION_OPTIONS.find((d) => d.value === duration)!;
  const tokenCost = currentOption.tokens;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleTokenTap = () => {
    if (godMode) return;
    const next = godTaps + 1;
    setGodTaps(next);
    if (godTapTimer.current) clearTimeout(godTapTimer.current);
    if (next >= 7) {
      setGodMode(true);
      setGodTaps(0);
      showToast("🔥 Режим бога активирован");
    } else {
      godTapTimer.current = setTimeout(() => setGodTaps(0), 2000);
    }
  };

  const handleGenerate = useCallback(async () => {
    setError("");
    if (!prompt.trim()) {
      setError("Введите промпт для генерации видео");
      return;
    }
    if (!godMode && tokens < tokenCost) {
      setError(`Недостаточно токенов. Нужно ${tokenCost}, доступно ${tokens}`);
      return;
    }

    setGenerating(true);
    setProgress(0);
    if (!godMode) setTokens((t) => t - tokenCost);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) { clearInterval(interval); return p; }
        return p + Math.random() * 8 + 3;
      });
    }, 80);

    await new Promise((res) => setTimeout(res, 2200));
    clearInterval(interval);
    setProgress(100);

    const newItem: HistoryItem = {
      id: Date.now(),
      prompt: prompt.trim(),
      duration,
      style,
      aspect,
      timestamp: new Date(),
      tokens: tokenCost,
      photo: photo ?? undefined,
    };

    setTimeout(() => {
      setGenerating(false);
      setProgress(0);
      setHistory((h) => [newItem, ...h]);
      showToast(`✅ Видео ${duration}с создано!`);
    }, 400);
  }, [prompt, tokens, godMode, tokenCost, duration, style, aspect]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("❌ Только изображения (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("❌ Файл слишком большой (макс. 10 МБ)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target?.result as string);
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const loadPromptFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setDuration(item.duration);
    setStyle(item.style);
    setAspect(item.aspect);
    setActiveTab("create");
    showToast("Промпт загружен");
  };

  const formatTime = (d: Date) => {
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    return `${Math.floor(diff / 3600)} ч назад`;
  };

  return (
    <div className="mesh-bg min-h-screen font-golos relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl" style={{background: 'var(--grad-start)'}} />
      <div className="pointer-events-none fixed bottom-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full opacity-15 blur-3xl" style={{background: 'var(--grad-end)'}} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="glass rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-2xl border border-white/10">
            {toast}
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pb-24 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="font-oswald text-3xl font-bold tracking-wide text-white">
              Gen<span className="gradient-text">AI</span>
            </h1>
            <p className="text-xs text-white/40 mt-0.5 font-medium tracking-widest uppercase">Video Generator</p>
          </div>

          {/* Token counter */}
          <button
            onClick={handleTokenTap}
            className="relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl gradient-border transition-all duration-200 active:scale-95"
            style={{background: 'rgba(255,255,255,0.04)'}}
          >
            {godMode && (
              <div className="absolute inset-0 rounded-2xl animate-pulse-glow" style={{background: 'linear-gradient(135deg, rgba(74,0,224,0.3), rgba(255,111,216,0.3))'}} />
            )}
            <Icon name="Coins" size={16} className="text-purple-300 mb-1" />
            <span className={`font-oswald font-bold text-xl leading-none ${godMode ? 'gradient-text' : 'text-white'}`}>
              {godMode ? '∞' : tokens}
            </span>
            <span className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">токенов</span>
            {godTaps > 0 && !godMode && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{background: 'var(--grad-mid)'}}>
                {godTaps}
              </div>
            )}
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6 animate-slide-up" style={{background: 'rgba(255,255,255,0.04)', animationDelay: '0.05s'}}>
          {[
            { id: "create", label: "Создать", icon: "Wand2" },
            { id: "history", label: `История${history.length > 0 ? ` (${history.length})` : ''}`, icon: "Clock" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "create" | "history")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "text-white shadow-lg"
                  : "text-white/40 hover:text-white/70"
              }`}
              style={activeTab === tab.id ? {background: 'linear-gradient(135deg, var(--grad-start), var(--grad-mid))'} : {}}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CREATE TAB */}
        {activeTab === "create" && (
          <div className="space-y-4 animate-fade-in">

            {/* Photo upload */}
            <div className="rounded-2xl gradient-border overflow-hidden" style={{background: 'rgba(255,255,255,0.04)'}}>
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Фото (необязательно)</label>
                {photo && (
                  <button onClick={() => { setPhoto(null); setPhotoName(""); }} className="text-xs text-white/30 hover:text-red-400 transition-colors flex items-center gap-1">
                    <Icon name="X" size={12} />
                    Удалить
                  </button>
                )}
              </div>

              {photo ? (
                <div className="relative mx-4 mb-4 rounded-xl overflow-hidden" style={{maxHeight: '180px'}}>
                  <img src={photo} alt="Загруженное фото" className="w-full h-full object-cover" style={{maxHeight: '180px'}} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                    <Icon name="ImageIcon" size={11} className="text-white/60" />
                    <span className="text-[10px] text-white/60 truncate max-w-[160px]">{photoName}</span>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-semibold text-white transition-all"
                    style={{background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)'}}
                  >
                    Заменить
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-4 mb-4 rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-6 gap-2"
                  style={{
                    border: `1.5px dashed ${dragOver ? 'rgba(142,45,226,0.8)' : 'rgba(255,255,255,0.12)'}`,
                    background: dragOver ? 'rgba(142,45,226,0.08)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{background: dragOver ? 'rgba(142,45,226,0.3)' : 'rgba(255,255,255,0.05)'}}>
                    <Icon name="ImagePlus" size={20} className={dragOver ? 'text-purple-300' : 'text-white/30'} />
                  </div>
                  <p className="text-sm text-white/40 font-medium">Загрузи своё фото</p>
                  <p className="text-xs text-white/20">Перетащи или нажми · JPG, PNG, WEBP · до 10 МБ</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>

            {/* Prompt input */}
            <div className="rounded-2xl p-4 gradient-border" style={{background: 'rgba(255,255,255,0.04)'}}>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 block">Промпт</label>
              <textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setError(""); }}
                placeholder="Опиши видео которое хочешь создать..."
                rows={4}
                className="w-full bg-transparent text-white placeholder-white/25 text-sm resize-none outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-xs text-white/25">{prompt.length} / 500</span>
                {prompt.length > 0 && (
                  <button onClick={() => setPrompt("")} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                    Очистить
                  </button>
                )}
              </div>
            </div>

            {/* Style */}
            <div className="rounded-2xl p-4 gradient-border" style={{background: 'rgba(255,255,255,0.04)'}}>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3 block">Стиль</label>
              <div className="grid grid-cols-4 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                      style === s.id
                        ? "text-white scale-105"
                        : "text-white/40 hover:text-white/70"
                    }`}
                    style={style === s.id
                      ? {background: 'linear-gradient(135deg, rgba(74,0,224,0.5), rgba(142,45,226,0.5))', border: '1px solid rgba(142,45,226,0.5)'}
                      : {background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}
                  >
                    <Icon name={s.icon} size={18} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration + Aspect */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 gradient-border" style={{background: 'rgba(255,255,255,0.04)'}}>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3 block">Длина</label>
                <div className="flex flex-col gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        duration === d.value ? "text-white" : "text-white/35 hover:text-white/60"
                      }`}
                      style={duration === d.value
                        ? {background: 'linear-gradient(135deg, rgba(74,0,224,0.6), rgba(142,45,226,0.6))'}
                        : {background: 'rgba(255,255,255,0.03)'}}
                    >
                      <span>{d.label}</span>
                      <span className={`text-[10px] ${duration === d.value ? 'text-purple-200' : 'text-white/20'}`}>{d.tokens}т</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-4 gradient-border" style={{background: 'rgba(255,255,255,0.04)'}}>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3 block">Формат</label>
                <div className="flex flex-col gap-2">
                  {ASPECT_OPTIONS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAspect(a.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        aspect === a.value ? "text-white" : "text-white/35 hover:text-white/60"
                      }`}
                      style={aspect === a.value
                        ? {background: 'linear-gradient(135deg, rgba(74,0,224,0.6), rgba(142,45,226,0.6))'}
                        : {background: 'rgba(255,255,255,0.03)'}}
                    >
                      <div className={`border rounded flex-shrink-0 ${
                        a.value === "16:9" ? "w-5 h-3" : a.value === "9:16" ? "w-3 h-5" : "w-4 h-4"
                      } ${aspect === a.value ? 'border-purple-300' : 'border-white/20'}`} />
                      {a.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-300 animate-fade-in" style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)'}}>
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            {/* Progress bar */}
            {generating && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/50 font-medium">Генерация видео...</span>
                  <span className="text-xs font-bold gradient-text">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{background: 'rgba(255,255,255,0.06)'}}>
                  <div
                    className="h-full rounded-full transition-all duration-150 shimmer"
                    style={{width: `${progress}%`, background: 'linear-gradient(90deg, var(--grad-start), var(--grad-mid), var(--grad-end))'}}
                  />
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 rounded-2xl font-oswald font-semibold text-lg tracking-wider text-white glow-btn disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              style={{background: generating ? 'rgba(142,45,226,0.4)' : 'linear-gradient(135deg, var(--grad-start), var(--grad-mid))'}}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="Loader2" size={18} className="animate-spin" />
                  Создаю...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="Zap" size={18} />
                  Создать видео
                  <span className="text-sm font-golos font-normal opacity-70">·</span>
                  <span className="text-sm font-golos font-normal opacity-70">
                    {godMode ? '∞' : tokenCost} токенов
                  </span>
                </span>
              )}
            </button>

            <p className="text-center text-xs text-white/20 font-medium">
              Powered by Hugging Face API
            </p>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="animate-fade-in">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center gradient-border" style={{background: 'rgba(255,255,255,0.03)'}}>
                  <Icon name="Film" size={28} className="text-white/20" />
                </div>
                <p className="text-white/30 text-sm font-medium">История пуста</p>
                <p className="text-white/15 text-xs text-center">Создай первое видео,<br/>оно появится здесь</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-4 gradient-border animate-slide-up"
                    style={{background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.05}s`}}
                  >
                    {/* Video placeholder */}
                    <div className="rounded-xl mb-3 flex items-center justify-center relative overflow-hidden" style={{
                      aspectRatio: item.aspect === '16:9' ? '16/9' : item.aspect === '9:16' ? '9/16' : '1/1',
                      maxHeight: item.aspect === '9:16' ? '200px' : 'auto',
                      background: 'linear-gradient(135deg, rgba(74,0,224,0.3), rgba(142,45,226,0.2), rgba(255,111,216,0.15))'
                    }}>
                      {item.photo && (
                        <img src={item.photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                      )}
                      <div className="absolute inset-0 shimmer" />
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(255,255,255,0.1)'}}>
                          <Icon name="Play" size={16} className="text-white ml-0.5" />
                        </div>
                        <span className="text-xs text-white/50">{item.duration} сек · {item.aspect}</span>
                      </div>
                      {item.photo && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)'}}>
                          <Icon name="ImageIcon" size={9} className="text-white/60" />
                          <span className="text-[9px] text-white/60">с фото</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-white/80 font-medium line-clamp-2 mb-3">{item.prompt}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-1 rounded-lg font-medium text-white/50" style={{background: 'rgba(255,255,255,0.05)'}}>
                          {STYLE_OPTIONS.find(s => s.id === item.style)?.label}
                        </span>
                        <span className="text-[10px] text-white/25">{formatTime(item.timestamp)}</span>
                      </div>
                      <button
                        onClick={() => loadPromptFromHistory(item)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{background: 'linear-gradient(135deg, rgba(74,0,224,0.4), rgba(142,45,226,0.4))', color: 'rgba(216,180,254,0.9)'}}
                      >
                        <Icon name="RotateCcw" size={11} />
                        Повторить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}