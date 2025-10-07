/* eslint-env browser */
'use client';
/* global Notification, navigator */
import React, { useEffect, useState, useRef } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import Holidays from 'date-holidays';

const tz = 'Asia/Tokyo';
const hd = new Holidays('JP');

function endOfMonth(now: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  return now
    .with({
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0,
    })
    .add({ months: 1 })
    .subtract({ nanoseconds: 1 });
}

function endOfQuarter(now: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  const q = Math.floor((now.month - 1) / 3);
  const startNextQuarterMonth = q * 3 + 4;
  const year = startNextQuarterMonth > 12 ? now.year + 1 : now.year;
  const month = ((startNextQuarterMonth - 1) % 12) + 1;
  return now
    .with({
      year,
      month,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0,
    })
    .subtract({ nanoseconds: 1 });
}

function endOfHalfYear(now: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  const startNextHalf = now.month <= 9 ? 10 : 4;
  const year = startNextHalf === 4 ? now.year + 1 : now.year;
  const month = startNextHalf;
  return now
    .with({
      year,
      month,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0,
    })
    .subtract({ nanoseconds: 1 });
}

function endOfFiscalYear(now: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  const year = now.month <= 3 ? now.year : now.year + 1;
  return Temporal.ZonedDateTime.from({
    timeZone: tz,
    year,
    month: 4,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }).subtract({ nanoseconds: 1 });
}

function businessDaysBetween(start: Temporal.PlainDate, end: Temporal.PlainDate): number {
  let current = start.add({ days: 1 });
  let count = 0;
  while (Temporal.PlainDate.compare(current, end) <= 0) {
    const day = current.dayOfWeek; // 1=Mon .. 7=Sun
    const isWeekend = day === 6 || day === 7;
    const jsDate = new Date(Date.UTC(current.year, current.month - 1, current.day));
    const isHoliday = hd.isHoliday(jsDate) !== false;
    if (!isWeekend && !isHoliday) {
      count += 1;
    }
    current = current.add({ days: 1 });
  }
  return count;
}

export default function App() {
  const customTargetSectionRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Temporal.Now.zonedDateTimeISO(tz));
  const [dark, setDark] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('dark');
    if (param === 'true') return true;
    if (param === 'false') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [simple, setSimple] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('simple') === 'true';
  });
  const [targetFromUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const date = params.get('date');
    if (name && date) {
      return { label: name, date };
    }
    return null;
  });
  const [customTargets, setCustomTargets] = useState<
    {
      id: string;
      label: string;
      date: string;
      notifyAt?: string;
    }[]
  >([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [inputLabel, setInputLabel] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [inputNotifyAt, setInputNotifyAt] = useState('');
  const scheduledIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('customTargets');
    if (saved) {
      setCustomTargets(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('customTargets', JSON.stringify(customTargets));
  }, [customTargets]);

  useEffect(() => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        customTargets.forEach((t) => {
          if (t.notifyAt && !scheduledIds.current.has(t.id)) {
            scheduledIds.current.add(t.id);
            const notificationTime = new Date(t.notifyAt).getTime();
            const targetTime = Temporal.PlainDate.from(t.date)
              .add({ days: 1 })
              .toZonedDateTime({ timeZone: tz, plainTime: '00:00:00' })
              .subtract({ nanoseconds: 1 }).epochMilliseconds;
            const diff = targetTime - notificationTime;
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            registration.active?.postMessage({
              type: 'schedule',
              title: `${t.label}までのカウントダウン`,
              body: `${t.label}まであと${days}日${hours}時間${minutes}分`,
              timestamp: notificationTime,
            });
          }
        });
      });
    }
  }, [customTargets]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Temporal.Now.zonedDateTimeISO(tz)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    const url = new URL(window.location.href);
    url.searchParams.set('dark', dark ? 'true' : 'false');
    window.history.replaceState({}, '', url.toString());
  }, [dark]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (simple) {
      url.searchParams.set('simple', 'true');
    } else {
      url.searchParams.delete('simple');
    }
    window.history.replaceState({}, '', url.toString());
  }, [simple]);

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputLabel && inputDate) {
      const newTarget = {
        id: Date.now().toString(),
        label: inputLabel,
        date: inputDate,
        notifyAt: inputNotifyAt || undefined,
      };
      setCustomTargets((prevTargets) => [...prevTargets, newTarget]);
      setInputLabel('');
      setInputDate('');
      setInputNotifyAt('');
      setIsFormVisible(false);
    }
  };

  const handleDeleteTarget = (idToDelete: string) => {
    setCustomTargets((prevTargets) => prevTargets.filter((target) => target.id !== idToDelete));
  };

  const allTargets = [
    {
      label: '月末',
      date: endOfMonth(now),
      icon: '📅',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: '四半期末',
      date: endOfQuarter(now),
      icon: '📊',
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: '半期末',
      date: endOfHalfYear(now),
      icon: '📈',
      color: 'from-green-500 to-teal-500',
    },
    {
      label: '年度末',
      date: endOfFiscalYear(now),
      icon: '🎯',
      color: 'from-orange-500 to-red-500',
    },
  ];

  customTargets.forEach((target) => {
    const customDate = Temporal.PlainDate.from(target.date)
      .add({ days: 1 })
      .toZonedDateTime({ timeZone: tz, plainTime: '00:00:00' })
      .subtract({ nanoseconds: 1 });

    if (Temporal.ZonedDateTime.compare(customDate, now) > 0) {
      allTargets.unshift({
        label: target.label,
        date: customDate,
        icon: '📌',
        color: 'from-yellow-500 to-amber-500',
      });
    }
  });

  if (targetFromUrl) {
    const urlDate = Temporal.PlainDate.from(targetFromUrl.date)
      .add({ days: 1 })
      .toZonedDateTime({ timeZone: tz, plainTime: '00:00:00' })
      .subtract({ nanoseconds: 1 });

    if (Temporal.ZonedDateTime.compare(urlDate, now) > 0) {
      allTargets.unshift({
        label: targetFromUrl.label,
        date: urlDate,
        icon: '🔗',
        color: 'from-pink-500 to-rose-500',
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                カウントダウン
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {now.toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-col w-full gap-4 sm:w-auto sm:flex-row sm:items-center">
            {!isFormVisible && (
              <button
                type="button"
                onClick={() => {
                  setIsFormVisible(true);
                  setTimeout(() => {
                    customTargetSectionRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                  }, 100);
                }}
                className="group relative w-full px-6 py-3 bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-2xl hover:bg-white/30 dark:hover:bg-slate-800/70 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer active:scale-95 sm:w-auto"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-lg">➕</span>
                  <span className="font-medium">新規追加</span>
                </div>
              </button>
            )}
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="group relative w-full px-6 py-3 bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-2xl hover:bg-white/30 dark:hover:bg-slate-800/70 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer active:scale-95 sm:w-auto"
            >
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
                <span className="font-medium">{dark ? 'ライト' : 'ダーク'}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSimple((s) => !s)}
              className="group relative w-full px-6 py-3 bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-2xl hover:bg-white/30 dark:hover:bg-slate-800/70 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer active:scale-95 sm:w-auto"
            >
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-lg">{simple ? '🔢' : '📅'}</span>
                <span className="font-medium">{simple ? '詳細' : 'シンプル'}</span>
              </div>
            </button>
          </div>
        </div>

        {isFormVisible && (
          <div
            ref={customTargetSectionRef}
            className="mb-8 p-6 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 dark:border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">カスタムターゲット</h2>
            </div>

            <div className="space-y-3 mb-4">
              {customTargets.map((target) => (
                <div
                  key={target.id}
                  className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{target.label}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(target.date + 'T00:00:00').toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTarget(target.id)}
                    className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 rounded-md hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTarget} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={inputLabel}
                  onChange={(e) => setInputLabel(e.target.value)}
                  placeholder="イベント名"
                  className="flex-grow px-4 py-2 rounded-lg bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 backdrop-blur-sm"
                  required
                />
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 backdrop-blur-sm"
                  required
                />
              </div>
              <input
                type="datetime-local"
                value={inputNotifyAt}
                onChange={(e) => setInputNotifyAt(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 backdrop-blur-sm"
                placeholder="通知日時"
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="group relative px-6 py-2 bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-xl hover:bg-white/30 dark:hover:bg-slate-800/70 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer active:scale-95"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">キャンセル</span>
                </button>
                <button
                  type="submit"
                  className="group relative px-6 py-2 bg-blue-500/20 dark:bg-blue-500/50 backdrop-blur-sm border border-blue-500/30 dark:border-blue-500/50 rounded-xl hover:bg-blue-500/30 dark:hover:bg-blue-500/70 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer active:scale-95"
                >
                  <span className="font-medium text-blue-700 dark:text-blue-300">保存</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allTargets.map((target, index) => {
            const seconds = Math.floor((target.date.epochMilliseconds - now.epochMilliseconds) / 1000);
            const business = businessDaysBetween(now.toPlainDate(), target.date.toPlainDate());
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            return (
              <div
                key={target.label}
                className="group relative bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 dark:border-slate-700/50"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards',
                }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${target.color} opacity-5 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}
                ></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${target.color} rounded-2xl flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-2xl">{target.icon}</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{target.label}</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(target.date.epochMilliseconds).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {simple ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{days}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">日</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{business}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">営業日</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{days}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">日</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{hours}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">時間</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{minutes}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">分</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{secs}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">秒</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/30 dark:to-slate-600/30 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">💼</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">営業日</span>
                        </div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{business}日</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
