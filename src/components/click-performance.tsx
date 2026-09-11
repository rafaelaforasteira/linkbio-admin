import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, MousePointerClick } from "lucide-react";
import type {
  ClickMetrics,
  ClickRankingItem,
  MetricsPeriod,
} from "@/types/click-metrics";

const number = new Intl.NumberFormat("pt-BR");
const periods: MetricsPeriod[] = [7, 30, 90];

function comparison(current: number, previous: number) {
  if (!previous) return <small>Sem comparação disponível</small>;
  const change = ((current - previous) / previous) * 100;
  const up = change >= 0;
  return (
    <small className={up ? "comparison-up" : "comparison-down"}>
      {up ? <ArrowUpRight /> : <ArrowDownRight />}
      {Math.abs(change).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
      <span>vs. período anterior</span>
    </small>
  );
}

function rankingStatus(item: ClickRankingItem) {
  const now = Date.now();
  if (!item.enabled) return ["hidden", "Inativo"];
  if (item.publish_at && new Date(item.publish_at).getTime() > now)
    return ["scheduled", "Programado"];
  if (item.unpublish_at && new Date(item.unpublish_at).getTime() <= now)
    return ["ended", "Encerrado"];
  return ["published", "No ar"];
}

function dateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}${year ? "" : ""}`;
}

function ClickChart({ metrics }: { metrics: ClickMetrics }) {
  const hasClicks = metrics.series.some((point) => point.clicks > 0);
  if (!hasClicks)
    return (
      <div className="metrics-empty">Ainda não há cliques registrados.</div>
    );

  const width = Math.max(700, metrics.series.length * 23);
  const height = 220;
  const padding = 22;
  const max = Math.max(...metrics.series.map((point) => point.clicks), 1);
  const coordinates = metrics.series.map((point, index) => ({
    ...point,
    x:
      padding +
      (index * (width - padding * 2)) / Math.max(metrics.series.length - 1, 1),
    y: height - padding - (point.clicks / max) * (height - padding * 2),
  }));
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const labelStep =
    metrics.series.length <= 7 ? 1 : metrics.series.length <= 30 ? 5 : 15;

  return (
    <div className="chart-scroll">
      <svg
        className="click-chart"
        viewBox={`0 0 ${width} ${height + 34}`}
        role="img"
        aria-label="Cliques por dia no período selecionado"
      >
        {[0, 1, 2, 3, 4].map((line) => {
          const y = padding + (line * (height - padding * 2)) / 4;
          return (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              className="chart-grid"
            />
          );
        })}
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          className="chart-area"
        />
        <polyline points={points} className="chart-line" />
        {coordinates.map((point, index) => (
          <g key={point.date}>
            {metrics.series.length <= 30 && (
              <circle cx={point.x} cy={point.y} r="3.5" className="chart-dot">
                <title>
                  {dateLabel(point.date)}: {number.format(point.clicks)} cliques
                </title>
              </circle>
            )}
            {(index % labelStep === 0 || index === coordinates.length - 1) && (
              <text x={point.x} y={height + 13} textAnchor="middle">
                {dateLabel(point.date)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function ClickPerformance({
  metrics,
  period,
}: {
  metrics: ClickMetrics;
  period: MetricsPeriod;
}) {
  const cards = [
    {
      label: "Cliques hoje",
      value: metrics.today,
      comparison: comparison(metrics.today, metrics.yesterday),
    },
    {
      label: "Últimos 7 dias",
      value: metrics.last7,
      comparison: comparison(metrics.last7, metrics.previous7),
    },
    {
      label: "Últimos 30 dias",
      value: metrics.last30,
      comparison: comparison(metrics.last30, metrics.previous30),
    },
    {
      label: "Cliques totais",
      value: metrics.total,
      comparison: <small>Desde o início</small>,
    },
  ];

  return (
    <section className="performance-section">
      <div className="section-head performance-heading">
        <div>
          <span>Performance</span>
          <h2>Cliques nos banners</h2>
        </div>
        <MousePointerClick />
      </div>
      <div className="performance-cards">
        {cards.map((card) => (
          <article className="card performance-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{number.format(card.value)}</strong>
            {card.comparison}
          </article>
        ))}
      </div>
      <div className="performance-grid">
        <article className="card chart-card">
          <div className="chart-head">
            <div>
              <span>Histórico diário</span>
              <h3>Cliques nos últimos {period} dias</h3>
            </div>
            <nav aria-label="Período das métricas">
              {periods.map((value) => (
                <Link
                  key={value}
                  href={`/admin?period=${value}`}
                  className={period === value ? "active" : ""}
                >
                  {value} dias
                </Link>
              ))}
            </nav>
          </div>
          <ClickChart metrics={metrics} />
        </article>
        <article className="card ranking-card">
          <div>
            <span>Ranking</span>
            <h3>Banners mais clicados</h3>
          </div>
          {metrics.ranking.length ? (
            <ol>
              {metrics.ranking.map((item, index) => {
                const [statusClass, statusLabel] = rankingStatus(item);
                return (
                  <li key={item.id}>
                    <b>{index + 1}</b>
                    <img src={item.image_url} alt="" />
                    <span>
                      <strong>{item.internal_name}</strong>
                      <small className={`status ${statusClass}`}>
                        {statusLabel}
                      </small>
                    </span>
                    <em>{number.format(item.clicks)} cliques</em>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="ranking-empty">
              Nenhum clique registrado neste período.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
