import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function FinancialMetrics({ analysisData, rawData }) {
  if (!analysisData?.numeric_table) return null

  const metrics = analysisData.numeric_table
  const formatValue = (value) => {
    if (!value || value === 'null' || value === null) return 'N/A'
    return value
  }

  const getTrendIcon = (key) => {
    if (key.toLowerCase().includes('growth') || key.toLowerCase().includes('revenue')) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    }
    return null
  }

  // Group metrics by category
  const coreMetrics = [
    { key: 'Market Cap', label: 'Market Cap' },
    { key: 'Revenue (TTM)', label: 'Revenue (TTM)' },
    { key: 'Revenue Growth %', label: 'Revenue Growth %' },
    { key: 'Net Income', label: 'Net Income' },
    { key: 'Profit Margin', label: 'Profit Margin' },
    { key: 'EPS', label: 'Earnings Per Share (EPS)' },
    { key: 'PE Ratio', label: 'P/E Ratio' },
  ]

  const financialMetrics = [
    { key: 'Annual Revenues', label: 'Annual Revenues' },
    { key: 'Operating Income', label: 'Operating Income' },
    { key: 'Assets', label: 'Total Assets' },
    { key: 'Equity', label: 'Total Equity' },
    { key: 'Cash on hand', label: 'Cash on Hand' },
    { key: 'Debt', label: 'Total Debt' },
  ]

  const growthMetrics = [
    { key: 'Cloud Revenue', label: 'Cloud Revenue' },
    { key: 'Cloud Growth Rate', label: 'Cloud Growth Rate' },
    { key: 'Azure Market Share', label: 'Azure Market Share' },
    { key: 'AI Revenue Share', label: 'AI Revenue Share' },
  ]

  const operationalMetrics = [
    { key: 'R&D Spend', label: 'R&D Spend' },
    { key: 'Employees', label: 'Number of Employees' },
  ]

  const MetricCard = ({ items, title }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ key, label }) => {
          const value = metrics[key] || metrics[key.replace(' ', '')] || metrics[key.toLowerCase()]
          if (!value || value === 'null' || value === null) return null
          return (
            <div key={key} className="space-y-1 p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                {getTrendIcon(key)}
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className="text-lg font-semibold">{formatValue(value)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Metrics</CardTitle>
        <CardDescription>Comprehensive financial and operational metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MetricCard items={coreMetrics} title="Core Financial Metrics" />
        <MetricCard items={financialMetrics} title="Financial Position" />
        <MetricCard items={growthMetrics} title="Growth & Market Share" />
        <MetricCard items={operationalMetrics} title="Operational Metrics" />
        
        {/* Show all other metrics that might be in the data */}
        {Object.entries(metrics).map(([key, value]) => {
          const allKeys = [
            ...coreMetrics.map(m => m.key),
            ...financialMetrics.map(m => m.key),
            ...growthMetrics.map(m => m.key),
            ...operationalMetrics.map(m => m.key),
          ]
          if (allKeys.includes(key) || !value || value === 'null') return null
          return (
            <div key={key} className="flex justify-between items-center p-2 border-b">
              <span className="text-sm text-muted-foreground">{key}</span>
              <span className="text-sm font-medium">{formatValue(value)}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}


