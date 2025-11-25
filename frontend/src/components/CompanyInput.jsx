import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Search, Loader2 } from 'lucide-react'

export function CompanyInput({ onSearch, loading }) {
  const [companyName, setCompanyName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (companyName.trim()) {
      onSearch(companyName.trim())
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto glass glow">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Search Company</CardTitle>
        <CardDescription className="text-base">
          Enter a company name to get comprehensive research and analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter company name (e.g., Microsoft, Apple, Google)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !companyName.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

