import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-900 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Nexus
            </h1>
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

