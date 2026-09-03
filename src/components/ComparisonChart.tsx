/**
 * Comparison chart (spec §16).
 * One switchable metric at a time, plotted as a plain bar chart. Deliberately
 * undecorated: the winning bar is marked in CRT green, everything else in
 * neutral ink, so the reading is instant and not merely pretty.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ComparisonRow, MetricSpec } from '../engine/comparison';
import { METRIC_SPECS, isBest } from '../engine/comparison';
import { fmt } from '../engine/metrics';

interface ComparisonChartProps {
  rows: ComparisonRow[];
  metric: MetricSpec;
  onMetric: (key: MetricSpec) => void;
}

export function ComparisonChart({ rows, metric, onMetric }: ComparisonChartProps) {
  const data = rows.map((row) => ({
    name: row.label,
    value: row.result[metric.key],
    best: isBest(rows, metric, row),
  }));

  return (
    <div className="space-y-3">
      {/* Metric switcher */}
      <div className="thin-scroll flex overflow-x-auto border border-rule" role="tablist">
        {METRIC_SPECS.map((spec) => (
          <button
            key={spec.key}
            type="button"
            role="tab"
            aria-selected={spec.key === metric.key}
            onClick={() => onMetric(spec)}
            className={[
              'shrink-0 border-r border-rule px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors last:border-r-0',
              spec.key === metric.key
                ? 'bg-ink text-bone'
                : 'bg-bone-2 text-text/70 hover:bg-bone-3',
            ].join(' ')}
          >
            {spec.short}
          </button>
        ))}
      </div>

      <div>
        <p className="label mb-2 text-muted-2">
          {metric.label} — {metric.goal === 'min' ? 'lower is better' : 'higher is better'}
        </p>
        <div style={{ height: Math.max(200, rows.length * 42 + 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 46, bottom: 4, left: 4 }}
            >
              <CartesianGrid stroke="#c8c4b4" strokeDasharray="2 3" horizontal={false} />
              <XAxis
                type="number"
                stroke="#8c8a82"
                tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={104}
                stroke="#8c8a82"
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(23,23,23,0.06)' }}
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #58C472',
                  borderRadius: 0,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                }}
                itemStyle={{ color: '#F3F0E7' }}
                labelStyle={{ color: '#58C472', fontWeight: 700 }}
                formatter={(value: unknown) => [
                  `${fmt(Number(value))}${metric.unit ?? ''}`,
                  metric.label,
                ]}
              />
              <Bar dataKey="value" barSize={20} isAnimationActive={false}>
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.best ? '#58C472' : '#A7A49B'}
                    stroke="#171717"
                    strokeWidth={1}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(value: unknown) => `${fmt(Number(value))}${metric.unit ?? ''}`}
                  style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#1A1A1A' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="tabular mt-1 text-[10px] text-muted-2">
          Green marks the best result for this metric.
        </p>
      </div>
    </div>
  );
}
