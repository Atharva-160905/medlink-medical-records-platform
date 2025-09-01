import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { SummaryModal } from "./SummaryModal";

interface DoctorDashboardProps {
  activeTab: string;
  doctor: Doc<"doctors">;
}

export function DoctorDashboard({ activeTab, doctor }: DoctorDashboardProps) {
  if (activeTab === "search") {
    return <PatientSearch doctor={doctor} />;
  }

  if (activeTab === "records") {
    return <DoctorPatients doctor={doctor} />;
  }

  return <DoctorOverview doctor={doctor} />;
}

function DoctorOverview({ doctor }: { doctor: Doc<"doctors"> }) {
  const patients = useQuery(api.doctors.getDoctorPatients);
  const updateVerification = useMutation(api.doctors.updateDoctorVerification);

  const handleVerifyDoctor = async () => {
    try {
      await updateVerification({});
      toast.success("Doctor profile verified!");
    } catch (error) {
      toast.error("Failed to verify profile");
    }
  };

  if (!doctor.verified) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Account Under Review</h2>
          <p className="text-yellow-700">
            Your doctor profile is currently being verified. You'll be able to access patient records once verification is complete.
          </p>
          <div className="mt-4 text-sm text-yellow-600">
            License Number: {doctor.licenseNumber}
          </div>
          <button
            onClick={handleVerifyDoctor}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Verify Profile (Demo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h2>
            <p className="text-gray-600">Welcome back, Dr. {doctor.firstName}!</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">License Number</div>
            <div className="font-mono font-bold text-green-600">{doctor.licenseNumber}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{patients?.length || 0}</div>
            <div className="text-sm text-gray-600">Active Patients</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {doctor.verified ? "Verified" : "Pending"}
            </div>
            <div className="text-sm text-gray-600">Account Status</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{doctor.specialization}</div>
            <div className="text-sm text-gray-600">Specialization</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{doctor.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Specialization</div>
                <div className="font-medium">{doctor.specialization}</div>
              </div>
              {doctor.hospital && (
                <div>
                  <div className="text-sm text-gray-500">Hospital/Clinic</div>
                  <div className="font-medium">{doctor.hospital}</div>
                </div>
              )}
              {doctor.phone && (
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium">{doctor.phone}</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Patients</h3>
            {patients?.length === 0 ? (
              <p className="text-gray-500">No patients yet. Use the search function to find patients by their Health ID.</p>
            ) : (
              <div className="space-y-3">
                {patients?.slice(0, 5).map((patient) => patient && (
                  <div key={patient._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-gray-600">{patient.healthId}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Access granted {new Date(patient.accessGrantedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientSearch({ doctor }: { doctor: Doc<"doctors"> }) {
  const [searchId, setSearchId] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const searchResult = useQuery(
    api.patients.searchPatientByHealthId,
    searchTriggered && searchId.trim() ? { healthId: searchId.trim() } : "skip"
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setSearchTriggered(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Patients</h2>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Health ID
              </label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Health ID (e.g., MED123456ABC)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!searchId.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {searchResult === null && searchTriggered && searchId && (
          <div className="text-center py-8 text-gray-500">
            No patient found with Health ID: {searchId}
          </div>
        )}

        {searchResult && (
          <PatientSearchResult patient={searchResult} doctor={doctor} />
        )}
      </div>
    </div>
  );
}

function PatientSearchResult({ patient, doctor }: { patient: any; doctor: Doc<"doctors"> }) {
  if (!patient.hasAccess) {
    return (
      <div className="border rounded-lg p-6 bg-yellow-50 border-yellow-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Patient Found</h3>
            <p className="text-gray-600">
              {patient.firstName} {patient.lastName} ({patient.healthId})
            </p>
          </div>
          <div className="text-yellow-600 text-2xl">🔒</div>
        </div>
        <p className="text-yellow-700 mb-4">
          You don't have access to this patient's records. The patient needs to grant you access first.
        </p>
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium mb-2">To request access:</h4>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Contact the patient directly</li>
            <li>Ask them to log into MedLink</li>
            <li>They can grant you access from their dashboard</li>
            <li>Provide them with your license number: <span className="font-mono">{doctor.licenseNumber}</span></li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6">
      <PatientDetails patient={patient} doctor={doctor} />
    </div>
  );
}

function PatientDetails({ patient, doctor }: { patient: any; doctor: Doc<"doctors"> }) {
  const [activeSection, setActiveSection] = useState("overview");
  const records = useQuery(api.medicalRecords.getPatientRecords, { patientId: patient._id });
  const consultations = useQuery(api.doctors.getPatientConsultations, { patientId: patient._id });

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold">{patient.firstName} {patient.lastName}</h3>
          <p className="text-gray-600">Health ID: {patient.healthId}</p>
        </div>
        <div className="text-green-600 text-2xl">✅</div>
      </div>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveSection("overview")}
          className={`pb-2 px-1 ${
            activeSection === "overview"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSection("records")}
          className={`pb-2 px-1 ${
            activeSection === "records"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Records
        </button>
        <button
          onClick={() => setActiveSection("consultations")}
          className={`pb-2 px-1 ${
            activeSection === "consultations"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Consultations
        </button>
        <button
          onClick={() => setActiveSection("add-consultation")}
          className={`pb-2 px-1 ${
            activeSection === "add-consultation"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Add Consultation
        </button>
      </div>

      {activeSection === "overview" && (
        <PatientOverviewSection patient={patient} />
      )}

      {activeSection === "records" && (
        <PatientRecordsSection records={records} patientId={patient._id} />
      )}

      {activeSection === "consultations" && (
        <ConsultationsSection consultations={consultations} />
      )}

      {activeSection === "add-consultation" && (
        <AddConsultationSection patient={patient} doctor={doctor} />
      )}
    </div>
  );
}

function PatientOverviewSection({ patient }: { patient: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold mb-3">Basic Information</h4>
        <div className="space-y-2 text-sm">
          <div><span className="text-gray-500">Age:</span> {patient.age || "Not specified"}</div>
          <div><span className="text-gray-500">Gender:</span> {patient.gender || "Not specified"}</div>
          <div><span className="text-gray-500">Blood Group:</span> {patient.bloodGroup || "Not specified"}</div>
          <div><span className="text-gray-500">Phone:</span> {patient.phone || "Not specified"}</div>
          <div><span className="text-gray-500">Email:</span> {patient.email}</div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-3">Medical Information</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Allergies:</span>
            <div className="mt-1">
              {patient.allergies?.length ? (
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((allergy: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                "None specified"
              )}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Chronic Conditions:</span>
            <div className="mt-1">
              {patient.chronicConditions?.length ? (
                <div className="flex flex-wrap gap-1">
                  {patient.chronicConditions.map((condition: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                      {condition}
                    </span>
                  ))}
                </div>
              ) : (
                "None specified"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientRecordsSection({ records, patientId }: { records: any[] | undefined; patientId: Id<"patients"> }) {
  const [showUploadForm, setShowUploadForm] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Medical Records</h4>
        <button
          onClick={() => setShowUploadForm(true)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          + Add Record
        </button>
      </div>

      {showUploadForm && (
        <DoctorUploadForm patientId={patientId} onClose={() => setShowUploadForm(false)} />
      )}

      {records === undefined ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : records.length === 0 ? (
        <p className="text-gray-500">No medical records found.</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <DoctorRecordItem key={record._id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConsultationsSection({ consultations }: { consultations: any[] | undefined }) {
  return (
    <div>
      <h4 className="font-semibold mb-4">Consultation History</h4>
      {consultations === undefined ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : consultations.length === 0 ? (
        <p className="text-gray-500">No consultations recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <div key={consultation._id} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{consultation.doctorName}</div>
                <div className="text-sm text-gray-500">
                  {new Date(consultation.consultationDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">{consultation.doctorSpecialization}</div>
              <div className="text-sm mb-2">
                <span className="font-medium">Notes:</span> {consultation.notes}
              </div>
              {consultation.diagnosis && (
                <div className="text-sm mb-2">
                  <span className="font-medium">Diagnosis:</span> {consultation.diagnosis}
                </div>
              )}
              {consultation.prescription && (
                <div className="text-sm mb-2">
                  <span className="font-medium">Prescription:</span> {consultation.prescription}
                </div>
              )}
              {consultation.followUpDate && (
                <div className="text-sm text-blue-600">
                  <span className="font-medium">Follow-up:</span> {new Date(consultation.followUpDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddConsultationSection({ patient, doctor }: { patient: any; doctor: Doc<"doctors"> }) {
  const [formData, setFormData] = useState({
    notes: "",
    diagnosis: "",
    prescription: "",
    followUpDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const addConsultation = useMutation(api.doctors.addConsultation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addConsultation({
        patientId: patient._id,
        notes: formData.notes,
        diagnosis: formData.diagnosis || undefined,
        prescription: formData.prescription || undefined,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).getTime() : undefined,
      });

      toast.success("Consultation added successfully!");
      setFormData({ notes: "", diagnosis: "", prescription: "", followUpDate: "" });
    } catch (error) {
      toast.error("Failed to add consultation: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h4 className="font-semibold mb-4">Add New Consultation</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Consultation Notes *
          </label>
          <textarea
            required
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter consultation notes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis
          </label>
          <input
            type="text"
            value={formData.diagnosis}
            onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter diagnosis..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prescription
          </label>
          <textarea
            value={formData.prescription}
            onChange={(e) => setFormData(prev => ({ ...prev, prescription: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter prescription details..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Date
          </label>
          <input
            type="date"
            value={formData.followUpDate}
            onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Consultation"}
        </button>
      </form>
    </div>
  );
}

function DoctorPatients({ doctor }: { doctor: Doc<"doctors"> }) {
  const patients = useQuery(api.doctors.getDoctorPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<Id<"patients"> | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Patients</h2>

      {patients === undefined ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">👥</div>
          <p className="text-gray-500">No patients have granted you access yet.</p>
          <p className="text-gray-400 text-sm mt-2">Use the search function to find patients by their Health ID.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient) => patient && (
            <div key={patient._id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{patient.firstName} {patient.lastName}</h3>
                  <p className="text-gray-600">Health ID: {patient.healthId}</p>
                  <p className="text-sm text-gray-500">
                    Access granted: {new Date(patient.accessGrantedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {patient.age && <div>Age: {patient.age}</div>}
                  {patient.bloodGroup && <div>Blood: {patient.bloodGroup}</div>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Contact</div>
                  <div>{patient.email}</div>
                  {patient.phone && <div>{patient.phone}</div>}
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Medical Info</div>
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="mb-1">
                      <span className="text-red-600">Allergies:</span> {patient.allergies.join(", ")}
                    </div>
                  )}
                  {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                    <div>
                      <span className="text-orange-600">Conditions:</span> {patient.chronicConditions.join(", ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => { setSelectedPatientId(patient._id); setSelectedPatientName(`${patient.firstName} ${patient.lastName}`); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Records
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPatientId && (
        <RecordsModal
          patientId={selectedPatientId}
          patientName={selectedPatientName}
          onClose={() => { setSelectedPatientId(null); setSelectedPatientName(""); }}
        />
      )}
    </div>
  );
}

function RecordsModal({ patientId, patientName, onClose }: { patientId: Id<"patients">; patientName: string; onClose: () => void }) {
  const records = useQuery(api.medicalRecords.getPatientRecords, { patientId });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Records for {patientName}</h3>
            <div className="text-sm text-gray-500">Total: {records?.length ?? 0}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {records === undefined ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : records.length === 0 ? (
          <p className="text-gray-500">No medical records found for this patient.</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {records.map((record: any) => (
              <DoctorRecordItem key={record._id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorUploadForm({ patientId, onClose }: { patientId: Id<"patients">; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    recordType: "consultation",
    tags: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const generateUploadUrl = useMutation(api.medicalRecords.generateUploadUrl);
  const uploadRecord = useMutation(api.medicalRecords.uploadMedicalRecord);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let fileId = undefined;
      let fileName = undefined;
      let fileType = undefined;

      if (file) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error("Failed to upload file");
        }

        const { storageId } = await result.json();
        fileId = storageId;
        fileName = file.name;
        fileType = file.type;
      }

      await uploadRecord({
        title: formData.title,
        description: formData.description || undefined,
        recordType: formData.recordType,
        fileId,
        fileName,
        fileType,
        tags: formData.tags ? formData.tags.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        patientId,
      });

      toast.success("Medical record uploaded successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to upload record: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload Medical Record</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Consultation Notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.recordType}
              onChange={(e) => setFormData(prev => ({ ...prev, recordType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="document">Document</option>
              <option value="lab_result">Lab Result</option>
              <option value="prescription">Prescription</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., cardiology, routine checkup"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DoctorRecordItem({ record }: { record: any }) {
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex-1">
          <div className="font-medium">{record.title}</div>
          <div className="text-sm text-gray-600">
            {record.recordType} • {new Date(record.date).toLocaleDateString()}
          </div>
          {record.description && (
            <div className="text-sm text-gray-500 mt-1">{record.description}</div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            Uploaded by {record.uploadedBy}
          </div>
          {record.summary && (
            <div className="text-xs text-green-600 mt-1 flex items-center">
              <span className="mr-1">🤖</span>
              AI Summary Available
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSummaryModal(true)}
            className={`text-sm px-3 py-1 rounded ${
              record.summary
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            {record.summary ? "View Summary" : "Generate Summary"}
          </button>
          {record.fileUrl && (
            <a
              href={record.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View File
            </a>
          )}
        </div>
      </div>

      {showSummaryModal && (
        <SummaryModal
          record={record}
          onClose={() => setShowSummaryModal(false)}
        />
      )}
    </>
  );
}
