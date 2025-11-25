import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export function GrowthChart({ analysisData, rawData }) {
  if (!analysisData?.numeric_table) return null

  const metrics = analysisData.numeric_table

  // Extract numeric values for charts
  const extractNumber = (value) => {
    if (!value || value === 'null') return null
    const numStr = String(value).replace(/[^0-9.-]/g, '')
    const num = parseFloat(numStr)
    return isNaN(num) ? null : num
  }

  // Prepare data for revenue growth chart
  const revenueData = [
    {
      name: 'Revenue',
      value: extractNumber(metrics['Revenue (TTM)'] || metrics['Annual Revenues']),
    },
    {
      name: 'Net Income',
      value: extractNumber(metrics['Net Income']),
    },
    {
      name: 'Cloud Revenue',
      value: extractNumber(metrics['Cloud Revenue']),
    },
  ].filter(item => item.value !== null)

  // Prepare growth metrics
  const growthData = [
    {
      name: 'Revenue Growth',
      value: extractNumber(metrics['Revenue Growth %']),
    },
    {
      name: 'Cloud Growth',
      value: extractNumber(metrics['Cloud Growth Rate']),
    },
  ].filter(item => item.value !== null)

  // Market share data
  const marketShareData = [
    {
      name: 'Azure Market Share',
      value: extractNumber(metrics['Azure Market Share']),
    },
    {
      name: 'AI Revenue Share',
      value: extractNumber(metrics['AI Revenue Share']),
    },
  ].filter(item => item.value !== null)

  if (revenueData.length === 0 && growthData.length === 0 && marketShareData.length === 0) {
    return null
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  
  const formatCurrency = (value) => {
    if (!value) return 'N/A'
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  // Prepare comprehensive financial overview data
  const financialOverview = [
    { name: 'Revenue', value: extractNumber(metrics['Revenue (TTM)'] || metrics['Annual Revenues']) },
    { name: 'Net Income', value: extractNumber(metrics['Net Income']) },
    { name: 'Assets', value: extractNumber(metrics['Assets']) },
    { name: 'Equity', value: extractNumber(metrics['Equity']) },
  ].filter(item => item.value !== null && item.value > 0)

  return (
    <div className="space-y-6">
      {/* Financial Overview - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {revenueData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Key revenue streams</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {financialOverview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Core financial metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={financialOverview}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {financialOverview.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {growthData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Growth Performance</CardTitle>
              <CardDescription>Growth rate indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {marketShareData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Market Position</CardTitle>
              <CardDescription>Market share metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={marketShareData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


