import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { EnrollmentTrendPoint } from '../../services/adminDashboardApi'
import type { MonthlyRevenuePoint } from '../../services/adminRevenueApi'

interface DashboardChartsProps {
  enrollmentTrend: EnrollmentTrendPoint[]
  revenueMonthly: MonthlyRevenuePoint[]
  loadingOverview: boolean
  loadingRevenueMonthly: boolean
  revenueError: string | null
  selectedRangeLabel: string
  rangeIsApprox: boolean
  growthRate: number | null
  revenueGrowthRate: number | null
}

function formatNaira(amount: number) {
  return `\u20A6${amount.toLocaleString('en-NG')}`
}

export default function DashboardCharts({
  enrollmentTrend,
  revenueMonthly,
  loadingOverview,
  loadingRevenueMonthly,
  revenueError,
  selectedRangeLabel,
  rangeIsApprox,
  growthRate,
  revenueGrowthRate,
}: DashboardChartsProps) {
  const enrollmentChartData = enrollmentTrend.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: point.new_enrollments,
  }))

  return (
    <>
      <div className="ad-panel">
        <div className="ad-panel-head">
          <div>
            <h3 className="ad-panel-title">Enrollments Over Time</h3>
            <p className="ad-panel-sub">
              New enrollments · {selectedRangeLabel}
              {rangeIsApprox && ' (approx.)'}
            </p>
          </div>
          {growthRate != null && (
            <span className={`ad-panel-badge${growthRate < 0 ? ' negative' : ''}`}>
              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
              <span className="ad-panel-badge-sub">vs prior period</span>
            </span>
          )}
        </div>
        {loadingOverview ? (
          <p className="ad-panel-empty">Loading…</p>
        ) : enrollmentChartData.length === 0 ? (
          <p className="ad-panel-empty">No enrollment data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={enrollmentChartData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2492EB" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="ad-panel">
        <div className="ad-panel-head">
          <div>
            <h3 className="ad-panel-title">Revenue Over Time</h3>
            <p className="ad-panel-sub">Monthly (\u20A6) · succeeded payments</p>
          </div>
          {revenueGrowthRate != null && (
            <span className={`ad-panel-badge${revenueGrowthRate < 0 ? ' negative' : ''}`}>
              {revenueGrowthRate >= 0 ? '+' : ''}{revenueGrowthRate.toFixed(0)}%
            </span>
          )}
        </div>
        {loadingRevenueMonthly ? (
          <p className="ad-panel-empty">Loading…</p>
        ) : revenueMonthly.length === 0 ? (
          <p className="ad-panel-empty">{revenueError || 'No revenue data available.'}</p>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={revenueMonthly} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `\u20A6${(value / 100_000_000).toFixed(0)}M`}
              />
              <Tooltip formatter={(value) => [formatNaira(Number(value) / 100), 'Revenue']} />
              <Bar dataKey="revenue_kobo" radius={[6, 6, 0, 0]}>
                {revenueMonthly.map((entry) => (
                  <Cell key={entry.month} fill={entry.isCurrentMonth ? '#F97316' : '#FDBA74'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  )
}
