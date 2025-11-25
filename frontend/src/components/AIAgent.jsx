import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Send, Bot, User, Loader2, FileText } from 'lucide-react'
import { pythonApi, api } from '../services/api'
import { Badge } from './ui/badge'
import { AccountPlanDisplay } from './AccountPlanDisplay'

export function AIAgent({ companyName, researchData }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [accountPlan, setAccountPlan] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (companyName && researchData) {
      // Initialize with welcome message
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I'm your AI research assistant. I've gathered comprehensive information about ${companyName}. How can I help you today? You can ask me about:
          
• Financial metrics and performance
• Strategic analysis and opportunities
• Products and services
• Market position and competition
• Recent news and developments
• Generate an account plan

What would you like to know?`,
        },
      ])
    }
  }, [companyName, researchData])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Check if user wants to generate account plan
      if (input.toLowerCase().includes('account plan') || input.toLowerCase().includes('generate plan')) {
        setGeneratingPlan(true)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Generating account plan... This may take a moment.',
          },
        ])
        
        try {
          const response = await api.post('/api/generate-plan', {
            company: companyName,
            research: researchData,
          })
          
          if (response.data && response.data.account_plan) {
            setAccountPlan(response.data.account_plan)
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: 'I\'ve generated an account plan for you! Check the Account Plan section below.',
              },
            ])
          } else {
            throw new Error('Invalid response format')
          }
        } catch (error) {
          console.error('Account plan generation error:', error)
          // Try direct Python API call as fallback
          try {
            const pythonResponse = await pythonApi.post('/plan/generate', {
              company: companyName,
              research: researchData,
            })
            if (pythonResponse.data && pythonResponse.data.account_plan) {
              setAccountPlan(pythonResponse.data.account_plan)
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: 'I\'ve generated an account plan for you! Check the Account Plan section below.',
                },
              ])
            } else {
              throw new Error('Failed to generate plan')
            }
          } catch (fallbackError) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: 'I apologize, but I encountered an error generating the account plan. Please try again or check that the backend services are running.',
              },
            ])
          }
        } finally {
          setGeneratingPlan(false)
        }
      } else {
        // Regular conversation - use LLM to answer questions
        try {
          const response = await pythonApi.post('/api/chat', {
            company: companyName,
            research: researchData,
            question: input,
          })

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: response.data.response || 'I apologize, but I couldn\'t process that request.',
            },
          ])
        } catch (error) {
          // Fallback to local response generation
          const fallbackResponse = generateFallbackResponse(input, researchData)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: fallbackResponse,
            },
          ])
        }
      }
    } catch (error) {
      console.error('Error in AI agent:', error)
      // Fallback: provide intelligent responses based on research data
      const fallbackResponse = generateFallbackResponse(input, researchData)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackResponse,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const generateFallbackResponse = (question, data) => {
    const q = question.toLowerCase()
    const { analysis, raw_data } = data

    if (q.includes('revenue') || q.includes('financial')) {
      const metrics = analysis?.numeric_table || {}
      return `Based on the research data, here are key financial metrics:
• Revenue: ${metrics['Revenue (TTM)'] || metrics['Annual Revenues'] || 'Not available'}
• Net Income: ${metrics['Net Income'] || 'Not available'}
• Market Cap: ${metrics['Market Cap'] || 'Not available'}
${metrics['Revenue Growth %'] ? `• Revenue Growth: ${metrics['Revenue Growth %']}` : ''}
${metrics['Profit Margin'] ? `• Profit Margin: ${metrics['Profit Margin']}` : ''}

Would you like more details on any specific metric?`
    }

    if (q.includes('product') || q.includes('service')) {
      return analysis?.products_services || 'Product and service information is being analyzed. Please check the Products & Services section for details.'
    }

    if (q.includes('strategy') || q.includes('strategic')) {
      return analysis?.strategic_analysis || 'Strategic analysis is available in the Strategic Analysis section. Would you like me to highlight specific points?'
    }

    if (q.includes('news') || q.includes('recent')) {
      const news = raw_data?.news || []
      if (news.length > 0) {
        return `Here are the latest news headlines:\n${news.slice(0, 3).map((n, i) => `${i + 1}. ${n.title}`).join('\n')}\n\nCheck the Recent News section for full details.`
      }
      return 'Recent news information is available in the News section.'
    }

    if (q.includes('cloud') || q.includes('azure') || q.includes('ai')) {
      return analysis?.ai_cloud_strategy || 'AI and cloud strategy details are available in the AI & Cloud Strategy section.'
    }

    return `I'm analyzing the research data about ${companyName}. Could you be more specific about what you'd like to know? I can help with financial metrics, strategic analysis, products, news, or generate an account plan.`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Research Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about {companyName} or request an account plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Messages */}
            <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card border rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask a question or request an account plan..."
                disabled={loading || generatingPlan}
              />
              <Button onClick={handleSend} disabled={loading || generatingPlan || !input.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('What are the key financial metrics?')}
                disabled={loading}
              >
                Financial Metrics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Tell me about their products and services')}
                disabled={loading}
              >
                Products & Services
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Generate an account plan')}
                disabled={loading || generatingPlan}
              >
                {generatingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Account Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Plan Display */}
      {accountPlan && (
        <AccountPlanDisplay accountPlan={accountPlan} companyName={companyName} />
      )}
    </div>
  )
}

