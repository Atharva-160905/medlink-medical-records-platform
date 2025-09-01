import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { PatientDashboard } from "./components/PatientDashboard";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { ProfileSetup } from "./components/ProfileSetup";
import { LandingPage } from "./components/LandingPage";
import { useState } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Authenticated>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      </Authenticated>
      
      <main className="flex-1">
        <Authenticated>
          <Content activeTab={activeTab} />
        </Authenticated>
        <Unauthenticated>
          <LandingPage />
        </Unauthenticated>
      </main>
      <Toaster />
    </div>
  );
}

function Header({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const patient = useQuery(api.patients.getCurrentPatient);
  const doctor = useQuery(api.doctors.getCurrentDoctor);

  const userType = patient ? "patient" : doctor ? "doctor" : null;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-blue-600">MedLink</h1>
            {userType && (
              <nav className="flex space-x-6">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "dashboard"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("records")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "records"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {userType === "patient" ? "My Records" : "Patient Records"}
                </button>
                {userType === "patient" && (
                  <button
                    onClick={() => setActiveTab("access")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "access"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Manage Access
                  </button>
                )}
                {userType === "doctor" && (
                  <button
                    onClick={() => setActiveTab("search")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "search"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Search Patients
                  </button>
                )}
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {loggedInUser?.email}
              {userType && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {userType}
                </span>
              )}
            </span>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}

function Content({ activeTab }: { activeTab: string }) {
  const patient = useQuery(api.patients.getCurrentPatient);
  const doctor = useQuery(api.doctors.getCurrentDoctor);

  if (patient === undefined || doctor === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user has no profile, show setup
  if (!patient && !doctor) {
    return <ProfileSetup />;
  }

  // Show appropriate dashboard
  if (patient) {
    return <PatientDashboard activeTab={activeTab} patient={patient} />;
  }

  if (doctor) {
    return <DoctorDashboard activeTab={activeTab} doctor={doctor} />;
  }

  return null;
}
