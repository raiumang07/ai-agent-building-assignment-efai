import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom'
import { CompanyInput } from './components/CompanyInput'
import { DataDisplay } from './components/DataDisplay'
import { AIAgent } from './components/AIAgent'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { searchCompany, getResearchById } from './services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { AlertCircle } from 'lucide-react'

function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shareId, setShareId] = useState(null)
  const [companyName, setCompanyName] = useState(null)

  const handleSearch = async (companyName) => {
    setLoading(true)
    setError(null)
    setData(null)
    setShareId(null)

    try {
      const result = await searchCompany(companyName)
      setData(result.data)
      setShareId(result.id)
      setCompanyName(companyName)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch company data')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 md:p-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 pt-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-pulse">
              Company Research & Analysis
            </h1>
            <p className="text-lg text-muted-foreground font-medium">Enterprise-grade Account Planning Platform</p>
          </div>

          <CompanyInput onSearch={handleSearch} loading={loading} />
          
          {error && (
            <Card className="mt-6 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {data && companyName && (
            <>
              <AIAgent companyName={companyName} researchData={data} />
              <DataDisplay data={data} shareId={shareId} companyName={companyName} />
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

function ShareView() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getResearchById(id)
        setData(result.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load shared research')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 md:p-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Shared Company Research</CardTitle>
              <CardDescription>
                This is a shared view of company research data
              </CardDescription>
            </CardHeader>
          </Card>
          {data && <DataDisplay data={data} />}
        </div>
      </div>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/share/:id" element={<ShareView />} />
      </Routes>
    </Router>
  )
}

export default App
