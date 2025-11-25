import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'

export function CompanyLogo({ companyName, logoUrl, title }) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [logoUrl])

  if (!logoUrl || imgError) {
    return (
      <div className="flex items-center justify-center w-24 h-24 rounded-lg bg-muted border-2 border-border">
        <Building2 className="h-12 w-12 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-24 h-24 rounded-lg bg-white p-2 border-2 border-border overflow-hidden">
      <img
        src={logoUrl}
        alt={`${title || companyName} logo`}
        className="max-w-full max-h-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  )
}


