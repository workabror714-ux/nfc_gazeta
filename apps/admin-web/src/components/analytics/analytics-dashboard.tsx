"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

import { getApiErrorMessage } from "@/lib/auth";
import type {
  AnalyticsDailyPoint,
  AnalyticsOverview,
} from "@/lib/analytics";

import styles from "./analytics-dashboard.module.css";

const ranges = [7, 30, 90, 365] as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;

  return (
    <span
      className={`${styles.change} ${
        positive
          ? styles.changePositive
          : styles.changeNegative
      }`}
    >
      {positive ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

function AnalyticsChart({
  points,
}: {
  points: AnalyticsDailyPoint[];
}) {
  const width = 760;
  const height = 250;
  const paddingX = 35;
  const paddingY = 24;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const maximum = Math.max(
    1,
    ...points.map((point) => point.issue_opens),
  );

  const coordinates = points.map(
    (point, index) => {
      const x =
        paddingX +
        (points.length <= 1
          ? chartWidth / 2
          : (index / (points.length - 1)) *
            chartWidth);
      const y =
        paddingY +
        chartHeight -
        (point.issue_opens / maximum) *
          chartHeight;

      return {
        x,
        y,
        point,
      };
    },
  );

  const linePoints = coordinates
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");

  const areaPoints = [
    `${paddingX},${paddingY + chartHeight}`,
    linePoints,
    `${paddingX + chartWidth},${
      paddingY + chartHeight
    }`,
  ].join(" ");

  const labelStep = Math.max(
    1,
    Math.ceil(points.length / 7),
  );

  return (
    <svg
      aria-label="Kunlik gazeta ochilishlari grafigi"
      className={styles.chart}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map(
        (ratio) => {
          const y =
            paddingY + chartHeight * ratio;
          const label = Math.round(
            maximum * (1 - ratio),
          );

          return (
            <g key={ratio}>
              <line
                className={styles.chartGrid}
                x1={paddingX}
                x2={paddingX + chartWidth}
                y1={y}
                y2={y}
              />
              <text
                className={styles.chartLabel}
                textAnchor="end"
                x={paddingX - 8}
                y={y + 4}
              >
                {label}
              </text>
            </g>
          );
        },
      )}

      <polygon
        className={styles.chartArea}
        points={areaPoints}
      />
      <polyline
        className={styles.chartLine}
        points={linePoints}
      />

      {coordinates.map(
        ({ x, y, point }, index) => (
          <g key={point.date}>
            <circle
              className={styles.chartPoint}
              cx={x}
              cy={y}
              r={3.5}
            >
              <title>
                {formatDate(point.date)}: {point.issue_opens} ta ochilish
              </title>
            </circle>
            {index % labelStep === 0 ||
            index === coordinates.length - 1 ? (
              <text
                className={styles.chartLabel}
                textAnchor="middle"
                x={x}
                y={height - 4}
              >
                {formatDate(point.date)}
              </text>
            ) : null}
          </g>
        ),
      )}
    </svg>
  );
}

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] =
    useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] =
    useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadAnalytics() {
      // Effect ichida sinxron setState ishlamasligi uchun
      // avval asinxron chegaradan o‘tamiz.
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/analytics/overview?days=${days}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              payload,
              "Analitikani olib bo‘lmadi.",
            ),
          );
        }

        if (!cancelled) {
          setData(
            payload as AnalyticsOverview,
          );
        }
      } catch (loadError: unknown) {
        if (
          cancelled ||
          (loadError instanceof DOMException &&
            loadError.name === "AbortError")
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Kutilmagan xatolik.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [days, refreshKey]);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Gazeta ochilishlari",
        value: data.summary.issue_opens,
        change: data.changes.issue_opens,
      },
      {
        label: "NFC ochilishlari",
        value: data.summary.nfc_opens,
        change: data.changes.nfc_opens,
      },
      {
        label: "Saytdan ochilishlar",
        value: data.summary.web_opens,
        change: data.changes.web_opens,
      },
      {
        label: "Unikal tashrifchilar",
        value: data.summary.unique_visitors,
        change: data.changes.unique_visitors,
      },
      {
        label: "Maqola ko‘rishlari",
        value: data.summary.article_views,
        change: data.changes.article_views,
      },
      {
        label: "Gazeta betlari",
        value: data.summary.page_views,
        change: data.changes.page_views,
      },
    ];
  }, [data]);

  if (isLoading && !data) {
    return (
      <section className="content-panel">
        <div className="form-loading-state">
          <div className="loading-spinner" />
          <p>Analitika yuklanmoqda...</p>
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="content-panel">
        <div className="loading-error issue-load-error">
          <h2>Analitikani ochib bo‘lmadi</h2>
          <p>{error}</p>
          <button
            className="primary-button"
            onClick={() =>
              setRefreshKey((value) => value + 1)
            }
            type="button"
          >
            Qayta urinish
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const hasEvents =
    data.summary.total_events > 0;

  return (
    <div className={styles.dashboard}>
      <div className={styles.toolbar}>
        <div className={styles.rangeButtons}>
          {ranges.map((range) => (
            <button
              className={`${styles.rangeButton} ${
                days === range
                  ? styles.rangeButtonActive
                  : ""
              }`}
              disabled={isLoading}
              key={range}
              onClick={() => setDays(range)}
              type="button"
            >
              {range === 365
                ? "1 yil"
                : `${range} kun`}
            </button>
          ))}
        </div>

        <button
          className={styles.refreshButton}
          disabled={isLoading}
          onClick={() =>
            setRefreshKey((value) => value + 1)
          }
          type="button"
        >
          {isLoading
            ? "Yangilanmoqda..."
            : "Ma’lumotni yangilash"}
        </button>
      </div>

      {error ? (
        <div className="error-message">{error}</div>
      ) : null}

      <section className={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <article
            className={styles.summaryCard}
            key={card.label}
          >
            <span>{card.label}</span>
            <strong className={styles.summaryValue}>
              {formatNumber(card.value)}
            </strong>
            <ChangeBadge value={card.change} />
          </article>
        ))}
      </section>

      {!hasEvents ? (
        <section className="content-panel">
          <div className="empty-state large-empty-state">
            <div className="empty-state-icon">↗</div>
            <h2>Statistika hali yig‘ilmagan</h2>
            <p>
              Public saytda gazeta yoki maqola ochilgach ma’lumotlar shu yerda ko‘rinadi.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.contentGrid}>
            <article className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Kunlik gazeta ochilishlari</h2>
                  <p>
                    {data.range.start_date} — {data.range.end_date}
                  </p>
                </div>
              </header>
              <div className={styles.chartWrap}>
                <AnalyticsChart points={data.daily} />
              </div>
              <div className={styles.legend}>
                <span>
                  Jami hodisalar: <strong>{formatNumber(data.summary.total_events)}</strong>
                </span>
                <span>
                  O‘rtacha bet: <strong>{data.average_pages_per_visitor}</strong>
                </span>
              </div>
            </article>

            <article className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Qurilmalar</h2>
                  <p>Tashriflar qurilma turi bo‘yicha</p>
                </div>
              </header>
              <div className={styles.distributionList}>
                {data.devices.map((item) => (
                  <div
                    className={styles.distributionRow}
                    key={item.label}
                  >
                    <div className={styles.distributionMeta}>
                      <strong>{item.label}</strong>
                      <span>
                        {formatNumber(item.count)} · {item.percentage}%
                      </span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className={styles.tablesGrid}>
            <article className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Eng ko‘p ochilgan nashrlar</h2>
                  <p>Gazeta sonlari reytingi</p>
                </div>
              </header>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nashr</th>
                      <th>Jami</th>
                      <th>NFC</th>
                      <th>Unikal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_issues.map((issue) => (
                      <tr key={issue.issue_id}>
                        <td>
                          <Link href={`/nashrlar/${issue.issue_id}`}>
                            {issue.year}-yil, {issue.issue_number}-son
                          </Link>
                        </td>
                        <td>{formatNumber(issue.opens)}</td>
                        <td>{formatNumber(issue.nfc_opens)}</td>
                        <td>{formatNumber(issue.unique_visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Eng ko‘p o‘qilgan maqolalar</h2>
                  <p>Maqolalar reytingi</p>
                </div>
              </header>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Maqola</th>
                      <th>Ko‘rish</th>
                      <th>Unikal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_articles.map((article) => (
                      <tr key={article.article_id}>
                        <td>
                          <Link href={`/maqolalar/${article.article_id}`}>
                            {article.title}
                          </Link>
                        </td>
                        <td>{formatNumber(article.views)}</td>
                        <td>{formatNumber(article.unique_visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className={styles.contentGrid}>
            <article className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Tashrif manbalari</h2>
                  <p>NFC, sayt va tashqi havolalar</p>
                </div>
              </header>
              <div className={styles.distributionList}>
                {data.sources.map((item) => (
                  <div
                    className={styles.distributionRow}
                    key={item.key ?? item.label}
                  >
                    <div className={styles.distributionMeta}>
                      <strong>{item.label}</strong>
                      <span>
                        {formatNumber(item.count)} · {item.percentage}%
                      </span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Brauzerlar</h2>
                  <p>Foydalanuvchilar brauzeri</p>
                </div>
              </header>
              <div className={styles.distributionList}>
                {data.browsers.map((item) => (
                  <div
                    className={styles.distributionRow}
                    key={item.label}
                  >
                    <div className={styles.distributionMeta}>
                      <strong>{item.label}</strong>
                      <span>{formatNumber(item.count)}</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2>So‘nggi tashriflar</h2>
                <p>Eng yangi 20 ta analitika hodisasi</p>
              </div>
            </header>
            <div className={styles.recentList}>
              {data.recent_events.map((event) => (
                <article
                  className={styles.recentItem}
                  key={event.id}
                >
                  <div>
                    <strong>
                      {event.article_title || event.issue_label}
                    </strong>
                    <span>
                      {event.event_label}
                      {event.page_number
                        ? ` · ${event.page_number}-bet`
                        : ""}
                    </span>
                    <small>
                      {event.device_type} · {event.browser} · {formatDateTime(event.opened_at)}
                    </small>
                  </div>
                  <span className={styles.badge}>
                    {event.source_label}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}