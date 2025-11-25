import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Copy, ExternalLink, Share2, Check } from 'lucide-react'
import { useState } from 'react'
import { FinancialMetrics } from './FinancialMetrics'
import { GrowthChart } from './GrowthChart'
import { CompanyLogo } from './CompanyLogo'

export function DataDisplay({ data, shareId, companyName }) {
  const [copied, setCopied] = useState(false)

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/share/${shareId}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!data) return null

  const { raw_data, analysis } = data
  let analysisData = null
  
  try {
    if (typeof analysis === 'string') {
      // Try to parse JSON from markdown code blocks
      const cleaned = analysis.replace(/```json\n?/g, '').replace(/\n```/g, '').trim()
      analysisData = JSON.parse(cleaned)
    } else if (analysis && typeof analysis === 'object') {
      analysisData = analysis
    }
  } catch (e) {
    console.error('Error parsing analysis:', e)
    // If parsing fails, try to extract raw_text
    if (analysis?.raw_text) {
      analysisData = { raw_text: analysis.raw_text }
    }
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Company Header with Logo */}
      {raw_data?.wikipedia && !raw_data.wikipedia.error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <CompanyLogo 
                companyName={companyName}
                logoUrl={raw_data.wikipedia.logo_url}
                title={raw_data.wikipedia.title}
              />
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{raw_data.wikipedia.title}</h2>
                {raw_data.wikipedia.summary && (
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {raw_data.wikipedia.summary}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share Section */}
      {shareId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Share this research</p>
                <p className="text-xs text-muted-foreground">
                  {window.location.origin}/share/{shareId}
                </p>
              </div>
              <Button onClick={copyShareLink} variant="outline" size="sm">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive Summary */}
      {analysisData?.executive_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed text-base">
              {analysisData.executive_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Financial Metrics - Enhanced */}
      {analysisData?.numeric_table && (
        <FinancialMetrics analysisData={analysisData} rawData={raw_data} />
      )}

      {/* Growth Charts */}
      {analysisData?.numeric_table && (
        <GrowthChart analysisData={analysisData} rawData={raw_data} />
      )}

      {/* Company Info from Wikipedia - Detailed */}
      {raw_data?.wikipedia && !raw_data.wikipedia.error && (
        <Card>
          <CardHeader>
            <CardTitle>Company Overview</CardTitle>
            <CardDescription>
              Comprehensive information about {raw_data.wikipedia.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {raw_data.wikipedia.content_snippet && (
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                  {raw_data.wikipedia.content_snippet.substring(0, 3000)}
                </p>
              </div>
            )}
            {raw_data.wikipedia.infobox && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                {Object.entries(raw_data.wikipedia.infobox).map(([key, value]) => (
                  <div key={key} className="space-y-1 p-3 rounded-lg bg-muted/30">
                    <p className="text-sm font-semibold text-muted-foreground">{key}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                ))}
              </div>
            )}
            {raw_data.wikipedia.url && (
              <a
                href={raw_data.wikipedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                Read more on Wikipedia <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products & Services */}
      {analysisData?.products_services && (
        <Card>
          <CardHeader>
            <CardTitle>Products & Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                {analysisData.products_services}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      {analysisData?.financial_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                {analysisData.financial_summary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic Analysis */}
      {analysisData?.strategic_analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Strategic Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                {analysisData.strategic_analysis}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI & Cloud Strategy */}
      {analysisData?.ai_cloud_strategy && (
        <Card>
          <CardHeader>
            <CardTitle>AI & Cloud Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                {analysisData.ai_cloud_strategy}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partnerships & Ecosystem */}
      {analysisData?.partnerships_ecosystem && (
        <Card>
          <CardHeader>
            <CardTitle>Partnerships & Ecosystem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                {analysisData.partnerships_ecosystem}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subsidiaries */}
      {analysisData?.subsidiaries && analysisData.subsidiaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subsidiaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysisData.subsidiaries.map((sub, idx) => (
                <Badge key={idx} variant="secondary">
                  {sub}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Summary */}
      {analysisData?.news_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Recent News</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                {analysisData.news_summary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent News Articles */}
      {raw_data?.news && raw_data.news.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest News Articles</CardTitle>
            <CardDescription>
              {raw_data.news.length} recent articles about {companyName || 'the company'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {raw_data.news.slice(0, 10).map((article, index) => (
                <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <h4 className="font-medium group-hover:text-primary transition-colors mb-2 text-base">
                      {article.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(article.published).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

