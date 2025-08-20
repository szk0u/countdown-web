/* eslint-env browser */
'use client';
import React, { useEffect, useState } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import Holidays from 'date-holidays';

const tz = 'Asia/Tokyo';
const hd = new Holidays('JP');

function endOfMonth(now: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  return now
    .with({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 })
    .add({ months: 1 })
    .subtract({ nanoseconds: 1 });
}

function endOfQuarter(now: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  const q = Math.floor((now.month - 1) / 3);
  const startNextQuarterMonth = q * 3 + 4;
  const year = startNextQuarterMonth > 12 ? now.year + 1 : now.year;
  const month = ((startNextQuarterMonth - 1) % 12) + 1;
  return now
    .with({ year, month, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 })
    .subtract({ nanoseconds: 1 });
}

function endOfHalfYear(now: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  const startNextHalf = now.month <= 9 ? 10 : 4;
  const year = startNextHalf === 4 ? now.year + 1 : now.year;
  const month = startNextHalf;
  return now
    .with({ year, month, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 })
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
  const [now, setNow] = useState(Temporal.Now.zonedDateTimeISO(tz));
  const [dark, setDark] = useState(() =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [simple, setSimple] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Temporal.Now.zonedDateTimeISO(tz)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const targets = [
    { 
      label: '月末', 
      date: endOfMonth(now),
      icon: '📅',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      label: '四半期末', 
      date: endOfQuarter(now),
      icon: '📊',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      label: '半期末', 
      date: endOfHalfYear(now),
      icon: '📈',
      color: 'from-green-500 to-teal-500'
    },
    { 
      label: '年度末', 
      date: endOfFiscalYear(now),
      icon: '🎯',
      color: 'from-orange-500 to-red-500'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-12">
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
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="group relative px-6 py-3 bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-2xl hover:bg-white/30 dark:hover:bg-slate-800/70 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
                <span className="font-medium">{dark ? 'ライト' : 'ダーク'}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSimple((s) => !s)}
              className="group relative px-6 py-3 bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-2xl hover:bg-white/30 dark:hover:bg-slate-800/70 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-lg">{simple ? '🔢' : '📅'}</span>
                <span className="font-medium">{simple ? '詳細' : 'シンプル'}</span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {targets.map((target, index) => {
            const seconds = Math.floor(target.date.epochSeconds - now.epochSeconds);
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
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${target.color} opacity-5 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${target.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <span className="text-2xl">{target.icon}</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                          {target.label}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(target.date.epochMilliseconds).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {simple ? (
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{days}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">日</div>
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
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                          {business}日
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-full border border-white/50 dark:border-slate-700/50">
            <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">リアルタイム更新中</span>
          </div>
        </div>
      </div>
    </div>
  );
}
