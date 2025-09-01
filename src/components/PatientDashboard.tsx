import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Doc } from "../../convex/_generated/dataModel";
import { ManageAccess } from "./ManageAccess";
import { SummaryModal } from "./SummaryModal";

interface PatientDashboardProps {
  activeTab: string;
  patient: Doc<"patients">;
}

export function PatientDashboard({ activeTab, patient }: PatientDashboardProps) {
  if (activeTab === "records") {
    return <PatientRecords patient={patient} />;
  }

  if (activeTab === "access") {
    return <ManageAccess patient={patient} />;
  }

  return <PatientOverview patient={patient} />;
}

function PatientOverview({ patient }: { patient: Doc<"patients"> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    age: patient.age || "",
    gender: patient.gender || "",
    bloodGroup: patient.bloodGroup || "",
    phone: patient.phone || "",
    address: patient.address || "",
    allergies: patient.allergies?.join(", ") || "",
    chronicConditions: patient.chronicConditions?.join(", ") || "",
  });

  const updatePatient = useMutation(api.patients.updatePatient);
  const records = useQuery(api.medicalRecords.getPatientRecords, {});

  const handleSave = async () => {
    try {
      await updatePatient({
        age: formData.age ? parseInt(formData.age.toString()) : undefined,
        gender: formData.gender || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        allergies: formData.allergies ? formData.allergies.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patient Dashboard</h2>
            <p className="text-gray-600">Welcome back, {patient.firstName}!</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Your Health ID</div>
            <div className="text-xl font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
              {patient.healthId}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{records?.length || 0}</div>
            <div className="text-sm text-gray-600">Medical Records</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {patient.allergies?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Known Allergies</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {patient.chronicConditions?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Chronic Conditions</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <div className="px-3 py-2 bg-gray-50 rounded-md">
              {patient.firstName} {patient.lastName}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="px-3 py-2 bg-gray-50 rounded-md">{patient.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            {isEditing ? (
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md">{patient.age || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            {isEditing ? (
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md">{patient.gender || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            {isEditing ? (
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md">{patient.bloodGroup || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md">{patient.phone || "Not specified"}</div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          {isEditing ? (
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md">{patient.address || "Not specified"}</div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            {isEditing ? (
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                placeholder="Separate multiple allergies with commas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md min-h-[80px]">
                {patient.allergies?.length ? patient.allergies.join(", ") : "None specified"}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Conditions</label>
            {isEditing ? (
              <textarea
                name="chronicConditions"
                value={formData.chronicConditions}
                onChange={handleInputChange}
                placeholder="Separate multiple conditions with commas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md min-h-[80px]">
                {patient.chronicConditions?.length ? patient.chronicConditions.join(", ") : "None specified"}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientRecords({ patient }: { patient: Doc<"patients"> }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const records = useQuery(api.medicalRecords.getPatientRecords, {});
  const consultations = useQuery(api.doctors.getPatientConsultations, { patientId: patient._id });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
        <button
          onClick={() => setShowUploadForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Upload Record
        </button>
      </div>

      {showUploadForm && (
        <UploadRecordForm onClose={() => setShowUploadForm(false)} />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Medical Documents</h3>
          {records === undefined ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : records?.length === 0 ? (
            <p className="text-gray-500">No medical records uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {records?.map((record) => (
                <RecordItem key={record._id} record={record} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Consultation History</h3>
          {consultations === undefined ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : consultations?.length === 0 ? (
            <p className="text-gray-500">No consultations recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {consultations?.map((consultation) => (
                <div key={consultation._id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{consultation.doctorName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(consultation.consultationDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{consultation.doctorSpecialization}</div>
                  <div className="text-sm">{consultation.notes}</div>
                  {consultation.diagnosis && (
                    <div className="text-sm mt-1">
                      <span className="font-medium">Diagnosis:</span> {consultation.diagnosis}
                    </div>
                  )}
                  {consultation.prescription && (
                    <div className="text-sm mt-1">
                      <span className="font-medium">Prescription:</span> {consultation.prescription}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadRecordForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    recordType: "document",
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
              placeholder="e.g., Blood Test Results"
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

function RecordItem({ record }: { record: any }) {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const deleteRecord = useMutation(api.medicalRecords.deleteMedicalRecord);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteRecord({ recordId: record._id });
        toast.success("Record deleted successfully");
      } catch (error) {
        toast.error("Failed to delete record");
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
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
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
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
