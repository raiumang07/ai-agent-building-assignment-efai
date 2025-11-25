import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, TrendingUp, Target, Users, MapPin, Lightbulb, Shield, BarChart3, Calendar, UserCheck } from 'lucide-react'
import { useState } from 'react'

export function AccountPlanDisplay({ accountPlan, companyName }) {
  const [expandedSections, setExpandedSections] = useState({})
  
  if (!accountPlan) return null

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Parse the account plan - it might be markdown, JSON, or plain text
  const parseAccountPlan = (plan) => {
    if (!plan) return null

    // Try to extract JSON if present
    const jsonMatch = plan.match(/```json\s*([\s\S]*?)\s*```/) || plan.match(/\{[\s\S]*\}/)
    let jsonData = null
    if (jsonMatch) {
      try {
        jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } catch (e) {
        // Not valid JSON, continue with markdown parsing
      }
    }

    // Parse markdown sections
    const sections = {}
    const lines = plan.split('\n')
    let currentSection = null
    let currentContent = []

    lines.forEach(line => {
      // Check for headers
      if (line.match(/^#+\s+(.+)/)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim()
        }
        currentSection = line.replace(/^#+\s+/, '').trim()
        currentContent = []
      } else if (line.match(/^##+\s+(.+)/)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim()
        }
        currentSection = line.replace(/^##+\s+/, '').trim()
        currentContent = []
      } else if (line.trim()) {
        currentContent.push(line)
      }
    })
    
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim()
    }

    // If no sections found, treat entire content as overview
    if (Object.keys(sections).length === 0) {
      sections['Overview'] = plan
    }

    return { sections, jsonData }
  }

  const parsed = parseAccountPlan(accountPlan)
  if (!parsed) return null

  const { sections, jsonData } = parsed

  const renderMarkdown = (text) => {
    if (!text) return null
    
    const lines = text.split('\n')
    const elements = []
    let inList = false
    let listItems = []
    
    lines.forEach((line, idx) => {
      // Headers
      if (line.match(/^###\s+(.+)/)) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">{listItems}</ul>)
          listItems = []
          inList = false
        }
        elements.push(<h3 key={idx} className="text-lg font-semibold mt-6 mb-3 text-foreground">{line.replace(/^###\s+/, '')}</h3>)
      } else if (line.match(/^####\s+(.+)/)) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">{listItems}</ul>)
          listItems = []
          inList = false
        }
        elements.push(<h4 key={idx} className="text-base font-semibold mt-4 mb-2 text-foreground">{line.replace(/^####\s+/, '')}</h4>)
      } 
      // Bullet points
      else if (line.match(/^[-*]\s+(.+)/)) {
        inList = true
        const content = line.replace(/^[-*]\s+/, '')
        // Handle bold text in list items
        const processedContent = content.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
        listItems.push(<li key={idx} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: processedContent }} />)
      }
      // Numbered lists
      else if (line.match(/^\d+\.\s+(.+)/)) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">{listItems}</ul>)
          listItems = []
        }
        inList = true
        const content = line.replace(/^\d+\.\s+/, '')
        const processedContent = content.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
        listItems.push(<li key={idx} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: processedContent }} />)
      }
      // Regular paragraph
      else if (line.trim()) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">{listItems}</ul>)
          listItems = []
          inList = false
        }
        // Handle bold text
        if (line.match(/\*\*(.+?)\*\*/)) {
          const processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
          elements.push(<p key={idx} className="mb-3 text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />)
        } else {
          elements.push(<p key={idx} className="mb-3 text-muted-foreground leading-relaxed">{line}</p>)
        }
      } else {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">{listItems}</ul>)
          listItems = []
          inList = false
        }
        if (line.trim() === '') {
          elements.push(<br key={idx} />)
        }
      }
    })
    
    // Handle any remaining list items
    if (inList && listItems.length > 0) {
      elements.push(<ul key="list-final" className="list-disc ml-6 mb-4 space-y-1">{listItems}</ul>)
    }
    
    return elements
  }
  
  const getSectionIcon = (title) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('executive') || lowerTitle.includes('summary') || lowerTitle.includes('overview')) {
      return Target
    }
    if (lowerTitle.includes('people') || lowerTitle.includes('influence') || lowerTitle.includes('relationship')) {
      return Users
    }
    if (lowerTitle.includes('whitespace') || lowerTitle.includes('opportunit')) {
      return Lightbulb
    }
    if (lowerTitle.includes('target') || lowerTitle.includes('sweet spot')) {
      return MapPin
    }
    if (lowerTitle.includes('trust') || lowerTitle.includes('strategy')) {
      return Shield
    }
    if (lowerTitle.includes('metric') || lowerTitle.includes('kpi') || lowerTitle.includes('success')) {
      return BarChart3
    }
    if (lowerTitle.includes('action') || lowerTitle.includes('next step') || lowerTitle.includes('timeline')) {
      return Calendar
    }
    if (lowerTitle.includes('team') || lowerTitle.includes('resource')) {
      return UserCheck
    }
    if (lowerTitle.includes('risk')) {
      return AlertTriangle
    }
    return TrendingUp
  }

  const SectionCard = ({ title, content, icon: Icon, defaultExpanded = false }) => {
    const isExpanded = expandedSections[title] !== undefined ? expandedSections[title] : defaultExpanded
    
    return (
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection(title)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5 text-primary" />}
              <CardTitle className="text-xl">{title}</CardTitle>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="prose prose-invert max-w-none">
              {renderMarkdown(content)}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Account Plan: {companyName}
          </CardTitle>
          <CardDescription>
            Strategic account planning with relationship mapping, whitespace opportunities, and actionable next steps
          </CardDescription>
        </CardHeader>
      </Card>

      {/* JSON Summary if available */}
      {jsonData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jsonData.overview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{jsonData.overview}</p>
              </CardContent>
            </Card>
          )}
          
          {jsonData.opportunities && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(jsonData.opportunities) ? (
                  <ul className="space-y-2">
                    {jsonData.opportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{opp}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{jsonData.opportunities}</p>
                )}
              </CardContent>
            </Card>
          )}

          {jsonData.risks && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(jsonData.risks) ? (
                  <ul className="space-y-2">
                    {jsonData.risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{risk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{jsonData.risks}</p>
                )}
              </CardContent>
            </Card>
          )}

          {jsonData.recommended_actions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(jsonData.recommended_actions) ? (
                  <ul className="space-y-2">
                    {jsonData.recommended_actions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{action}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{jsonData.recommended_actions}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Markdown Sections */}
      {Object.entries(sections).map(([title, content]) => {
        const Icon = getSectionIcon(title)
        const isImportant = title.toLowerCase().includes('executive') || 
                           title.toLowerCase().includes('summary') || 
                           title.toLowerCase().includes('action') ||
                           title.toLowerCase().includes('whitespace')
        return (
          <SectionCard
            key={title}
            title={title}
            content={content}
            icon={Icon}
            defaultExpanded={isImportant}
          />
        )
      })}
    </div>
  )
}


