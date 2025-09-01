interface NavigationProps {
  onBackToHome?: () => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onHome?: () => void;
}

export function Navigation({ onBackToHome, onSignIn, onSignUp, onHome }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              MedLink
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={onHome}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Home
            </button>
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              How It Works
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {onBackToHome ? (
              <button
                onClick={onBackToHome}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                ← Back to Home
              </button>
            ) : (
              <>
                <button 
                  onClick={onSignIn}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </button>
                <button 
                  onClick={onSignUp}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
