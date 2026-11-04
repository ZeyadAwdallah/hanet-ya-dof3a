import { useEffect, useMemo, useState } from "react";
import "./style.css";

type BatchMonth = 3 | 6 | 9 | 12;

const BATCHES: { month: BatchMonth; label: string }[] = [
  { month: 3, label: "مارس" },
  { month: 6, label: "يونيو" },
  { month: 9, label: "سبتمبر" },
  { month: 12, label: "ديسمبر" },
];

// Durations are selectable month counts, not official qualification mappings.
const COMMON_DURATIONS = [12, 14, 18, 19, 24, 36, 38];
const STORAGE_KEY = "military-service-profile-v2";

type Profile = {
  batchMonth: BatchMonth;
  enlistmentYear: number;
  durationMonths: number;
};

function addMonthsFromFirstDay(year: number, month: number, months: number) {
  return new Date(year, month - 1 + months, 1);
}

function formatDate(date: Date, long = true) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  }).format(date);
}

function formatDuration(months: number) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} سنة`);
  if (remainingMonths) parts.push(`${remainingMonths} شهر`);
  return parts.join(" و ") || "0 شهر";
}

function getInitialProfile(): Profile {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = {
    batchMonth: Number(params.get("batch")) as BatchMonth,
    enlistmentYear: Number(params.get("year")),
    durationMonths: Number(params.get("months")),
  };

  if (
    [3, 6, 9, 12].includes(fromUrl.batchMonth) &&
    fromUrl.enlistmentYear >= 2000 &&
    fromUrl.enlistmentYear <= 2100 &&
    fromUrl.durationMonths >= 1 &&
    fromUrl.durationMonths <= 60
  ) return fromUrl;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Profile;
      if (
        [3, 6, 9, 12].includes(parsed.batchMonth) &&
        parsed.enlistmentYear >= 2000 &&
        parsed.enlistmentYear <= 2100 &&
        parsed.durationMonths >= 1 &&
        parsed.durationMonths <= 60
      ) return parsed;
    }
  } catch {
    // Ignore malformed local storage and fall back to a sensible default.
  }

  const now = new Date();
  const nextBatch = BATCHES.find((batch) => batch.month > now.getMonth() + 1);
  return {
    batchMonth: nextBatch?.month ?? 3,
    enlistmentYear: nextBatch ? now.getFullYear() : now.getFullYear() + 1,
    durationMonths: 12,
  };
}

export default function App() {
  const [profile, setProfile] = useState<Profile>(getInitialProfile);
  const [now, setNow] = useState(() => new Date());
  const [copied, setCopied] = useState(false);
  const [posterState, setPosterState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    const url = new URL(window.location.href);
    url.searchParams.set("batch", String(profile.batchMonth));
    url.searchParams.set("year", String(profile.enlistmentYear));
    url.searchParams.set("months", String(profile.durationMonths));
    window.history.replaceState({}, "", url);
  }, [profile]);

  const enlistmentDate = useMemo(
    () => new Date(profile.enlistmentYear, profile.batchMonth - 1, 1),
    [profile],
  );
  const completionBoundary = useMemo(
    () => addMonthsFromFirstDay(profile.enlistmentYear, profile.batchMonth, profile.durationMonths),
    [profile],
  );
  const lastServiceDay = useMemo(
    () => new Date(completionBoundary.getFullYear(), completionBoundary.getMonth(), 0),
    [completionBoundary],
  );

  const totalDurationMs = completionBoundary.getTime() - enlistmentDate.getTime();
  const elapsedMs = Math.min(Math.max(now.getTime() - enlistmentDate.getTime(), 0), totalDurationMs);
  const progress = totalDurationMs > 0 ? (elapsedMs / totalDurationMs) * 100 : 0;
  const target = new Date(lastServiceDay);
  target.setHours(23, 59, 59, 999);
  const remainingMs = Math.max(target.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const started = now >= enlistmentDate;
  const completed = now > target;

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "عداد الخدمة العسكرية", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Closing the native share sheet is not an app error.
    }
  }

  

  function  reset() {
    const fresh = getInitialProfile();
    setProfile({ ...fresh, durationMonths: 12 });
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#10110f] px-3 py-5 font-[Cairo] text-[#f4f2ed] sm:px-5 sm:py-8">
      <div className="pointer-events-none absolute -right-40 top-1/4 h-80 w-80 rounded-full bg-[#d59a43]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#66734b]/10 blur-[110px]" />

      <div className="relative mx-auto w-full max-w-[650px]">
        <header className="flex items-center justify-between pb-8 text-xs text-[#c5c2b8]">
          <a href="/" aria-label="عداد الخدمة" className="flex items-center gap-2.5 text-sm font-extrabold text-[#f4f2ed] no-underline">
        <img src="src/assets/icon.png" alt="" className="w-12 l-12"/>
            <span>عداد الخدمة</span>
          </a>
          <span className="text-[#858579]">حاسبة الخدمة العسكرية</span>
        </header>

        <section className="px-2 pb-7 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d6ad70]/20 bg-[#d6ad70]/[0.07] px-3 py-1 text-[11px] font-bold text-[#d6ad70]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a8bd78] shadow-[0_0_10px_#a8bd78]" />
            العد التنازلي بدأ
          </div>
          <h1 className="my-2 text-[clamp(38px,8vw,58px)] font-black leading-tight tracking-[-1.8px] text-[#f2eee5]">هانت يا دفعة.</h1>
          <p className="m-0 text-[13px] text-[#929187]">احسب نهاية خدمتك في ثواني، وسيب الحسابات علينا بدل ورقة وقلم.</p>
        </section>

        <section aria-labelledby="setup-title" className="rounded-[20px] border border-white/[0.09] bg-[#1e1f1a]/90 p-[18px] shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-[23px]">
          <div className="mb-[22px] flex items-center justify-between">
            <div>
              <span className="mb-0.5 block text-[11px] font-bold text-[#b99560]">بيانات الخدمة</span>
              <h2 id="setup-title" className="m-0 text-xl font-extrabold">إنت دفعة إيه؟</h2>
            </div>
            <span className="rounded-lg border border-[#414137] px-2 py-1 text-xs text-[#6d6c61]">01</span>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[#c4c1b6]">دفعة التجنيد</label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-[9px]">
              {BATCHES.map((batch) => (
                <button
                  type="button"
                  key={batch.month}
                  aria-pressed={profile.batchMonth === batch.month}
                  onClick={() => update("batchMonth", batch.month)}
                  className={`min-w-0 rounded-xl border px-1 py-2.5 transition sm:px-2 ${profile.batchMonth === batch.month ? "border-[#c99a57] bg-[#c99a57]/[0.13] text-[#f0c17e] shadow-[inset_0_0_0_1px_rgba(201,154,87,0.12)]" : "border-[#3a3b32] bg-[#24251f] text-[#b9b7ac] hover:border-[#9c7848]"}`}
                >
                  <strong className="block text-xl font-black leading-tight sm:text-[22px]">{batch.month}</strong>
                  <span className="mt-1 block text-[9px] sm:text-[10px]">{batch.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label htmlFor="year" className="mb-2 block text-xs font-bold text-[#c4c1b6]">سنة الالتحاق</label>
              <select id="year" value={profile.enlistmentYear} onChange={(event) => update("enlistmentYear", Number(event.target.value))} className="h-[47px] w-full rounded-[10px] border border-[#414137] bg-[#24251f] px-3 text-sm text-[#eeeae0] outline-none focus:border-[#c99a57]">
                {Array.from({ length: 12 }, (_, index) => new Date().getFullYear() - 5 + index).map((year) => <option value={year} key={year}>{year}</option>)}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="duration" className="mb-2 block text-xs font-bold text-[#c4c1b6]">مدة الخدمة</label>
              <select id="duration" value={profile.durationMonths} onChange={(event) => update("durationMonths", Number(event.target.value))} className="h-[47px] w-full rounded-[10px] border border-[#414137] bg-[#24251f] px-3 text-sm text-[#eeeae0] outline-none focus:border-[#c99a57]">
                {COMMON_DURATIONS.map((months) => <option value={months} key={months}>{formatDuration(months)}</option>)}
              </select>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[#77786e]">اختار مدة خدمتك الفعلية حسب موقفك التجنيدي. المدد هنا بالشهور.</p>
        </section>

        <section aria-live="polite" className="mt-3 rounded-[20px] border border-[#cd9f5b]/25 bg-gradient-to-br from-[#352f23] to-[#1f201a] p-[18px] shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#c6bba8]">موعد انتهاء خدمتك المتوقع</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${completed ? "bg-white/10 text-[#b9c5bb]" : started ? "bg-[#8fab5d]/[0.13] text-[#b9cb91]" : "bg-[#dcb779]/[0.12] text-[#dcb779]"}`}>
              {completed ? "خلصت الخدمة" : started ? "في الخدمة" : "لسه ما بدأتش"}
            </span>
          </div>

          <div className="my-2 mb-5 text-[clamp(23px,5vw,32px)] font-black tracking-tight text-[#f0c17e]">{formatDate(lastServiceDay)}</div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-[9px]">
            {[
              { value: days, label: "يوم" },
              { value: hours, label: "ساعة" },
              { value: minutes, label: "دقيقة" },
              { value: seconds, label: "ثانية" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#e2b36c]/[0.18] bg-black/25 px-1 py-3 text-center">
                <strong className="block text-[clamp(23px,5vw,31px)] font-extrabold leading-tight tabular-nums text-[#f4eee2]">{String(item.value).padStart(2, "0")}</strong>
                <span className="mt-1 block text-[10px] text-[#a69b88]">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-[11px] text-[#c4bdaf]">
              <span>رحلة الخدمة</span><strong className="tabular-nums text-[#e5b875]">{progress.toFixed(1)}%</strong>
            </div>
            <div role="progressbar" aria-label="نسبة إتمام الخدمة" aria-valuenow={Number(progress.toFixed(1))} aria-valuemin={0} aria-valuemax={100} className="h-[7px] overflow-hidden rounded-full bg-[#444238]">
              <span className="block h-full rounded-full bg-gradient-to-l from-[#8c683d] to-[#e2b36c] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-[#77766c]">
              <span>البداية: {formatDate(enlistmentDate)}</span><span>النهاية</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/[0.08] pt-4">
            <div className="flex flex-col gap-1"><span className="text-[10px] text-[#858478]">مدة الخدمة</span><strong className="text-xs text-[#ded9cd]">{formatDuration(profile.durationMonths)}</strong></div>
            <div className="flex flex-col gap-1"><span className="text-[10px] text-[#858478]">تاريخ الالتحاق</span><strong className="text-xs text-[#ded9cd]">{formatDate(enlistmentDate)}</strong></div>
          </div>

          <button type="button" onClick={share} className="mt-5 w-full rounded-[11px] bg-gradient-to-l from-[#d7a45e] to-[#e8c18a] px-4 py-3 text-[13px] font-black text-[#211b12] transition hover:-translate-y-px hover:brightness-105">
            <span className="ml-2 text-lg align-[-1px]">↗</span>{copied ? "تم نسخ الرابط" : "شارك عدّادك"}
          </button>

          
          <p className="mt-3 text-center text-[9px] leading-5 text-[#77766d]">الحساب تقديري بناءً على تاريخ الدفعة والمدة المختارة. راجع تاريخ التسريح الرسمي مع وحدتك.</p>
        </section>

        <footer className="flex items-center justify-between px-1 py-4 text-[10px] text-[#77776d]">
          <span>هانت. يوم ورا يوم.</span>
          <button type="button" onClick={reset} className="text-[#a99b83] underline underline-offset-4">إعادة ضبط</button>
        </footer>
      </div>
    </main>
  );
}
