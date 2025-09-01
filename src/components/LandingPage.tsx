import { useState } from "react";
import { SignInForm } from "../SignInForm";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

export function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn");

  const handleSignInClick = () => {
    setAuthMode("signIn");
    setShowAuth(true);
  };

  const handleSignUpClick = () => {
    setAuthMode("signUp");
    setShowAuth(true);
  };

  const handleBackToHome = () => {
    setShowAuth(false);
  };

  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showAuth) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation onBackToHome={handleBackToHome} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-4">MedLink</h1>
              <p className="text-xl text-gray-600">
                {authMode === "signIn" ? "Welcome back" : "Join MedLink today"}
              </p>
              <p className="text-gray-500 mt-2">
                {authMode === "signIn" 
                  ? "Sign in to access your medical records" 
                  : "Create your account to get started"}
              </p>
            </div>
            <SignInForm initialFlow={authMode} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation onSignIn={handleSignInClick} onSignUp={handleSignUpClick} onHome={handleHomeClick} />
      
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Secure Digital
            <span className="text-blue-600 block">Health Records</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect patients and doctors through secure, encrypted medical record sharing. 
            Take control of your health data with MedLink.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSignUpClick}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl text-lg"
            >
              Get Started
            </button>
            <button
              onClick={handleSignInClick}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose MedLink?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Empowering healthcare through secure, accessible, and user-friendly medical record management.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Encrypted</h3>
              <p className="text-gray-600">
                Your medical records are protected with enterprise-grade encryption and secure access controls.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant Access</h3>
              <p className="text-gray-600">
                Access your medical records anytime, anywhere. Share them securely with healthcare providers.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Patient Control</h3>
              <p className="text-gray-600">
                You control who can access your records. Grant and revoke access permissions as needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How MedLink Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to secure your health information
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Account</h3>
              <p className="text-gray-600">
                Sign up as a patient or healthcare provider to get started with MedLink.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Records</h3>
              <p className="text-gray-600">
                Securely upload and organize your medical records, test results, and documents.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Share Securely</h3>
              <p className="text-gray-600">
                Grant access to healthcare providers and manage permissions with full control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Secure Your Health Records?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of patients and healthcare providers who trust MedLink with their medical data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSignUpClick}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl text-lg"
            >
              Start Free Trial
            </button>
            <button
              onClick={handleSignInClick}
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-blue-600 transition-colors text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
