import { useEffect, useState } from 'react';
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
  const startNextHalf = now.month <= 6 ? 7 : 13;
  const year = startNextHalf > 12 ? now.year + 1 : now.year;
  const month = ((startNextHalf - 1) % 12) + 1;
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

function formatDuration(seconds: number): string {
  const s = Math.max(seconds, 0);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${days}日 ${hours}時間 ${minutes}分 ${secs}秒`;
}

export default function App() {
  const [now, setNow] = useState(Temporal.Now.zonedDateTimeISO(tz));

  useEffect(() => {
    const timer = setInterval(() => setNow(Temporal.Now.zonedDateTimeISO(tz)), 1000);
    return () => clearInterval(timer);
  }, []);

  const targets = [
    { label: '月末', date: endOfMonth(now) },
    { label: '四半期末', date: endOfQuarter(now) },
    { label: '半期末', date: endOfHalfYear(now) },
    { label: '年度末', date: endOfFiscalYear(now) },
  ];

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <h1>カウントダウン</h1>
      <table>
        <thead>
          <tr>
            <th>対象</th>
            <th>残り時間</th>
            <th>営業日</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => {
            const seconds = Math.floor(t.date.epochSeconds - now.epochSeconds);
            const business = businessDaysBetween(now.toPlainDate(), t.date.toPlainDate());
            return (
              <tr key={t.label}>
                <td>{t.label} ({new Date(t.date.epochMilliseconds).toLocaleDateString('ja-JP')})</td>
                <td>{formatDuration(seconds)}</td>
                <td>{business}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
