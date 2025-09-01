import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Doc } from "../../convex/_generated/dataModel";

export function ManageAccess({ patient }: { patient: Doc<"patients"> }) {
  const [searchLicense, setSearchLicense] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const searchResult = useQuery(
    api.access.searchDoctorByLicense,
    searchTriggered && searchLicense.trim() ? { licenseNumber: searchLicense.trim() } : "skip"
  );

  const grantedAccess = useQuery(api.access.getGrantedAccess);
  const grantAccess = useMutation(api.access.grantDoctorAccess);
  const revokeAccess = useMutation(api.access.revokeDoctorAccess);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLicense.trim()) return;
    setSearchTriggered(true);
  };

  const handleGrantAccess = async (doctorId: string) => {
    try {
      await grantAccess({ doctorId: doctorId as any });
      toast.success("Access granted successfully!");
      setSearchTriggered(false);
      setSearchLicense("");
    } catch (error) {
      toast.error("Failed to grant access: " + (error as Error).message);
    }
  };

  const handleRevokeAccess = async (doctorId: string) => {
    try {
      await revokeAccess({ doctorId: doctorId as any });
      toast.success("Access revoked successfully!");
    } catch (error) {
      toast.error("Failed to revoke access: " + (error as Error).message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Doctor Access</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Grant Access to Doctor</h3>
          
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor's License Number
                </label>
                <input
                  type="text"
                  value={searchLicense}
                  onChange={(e) => setSearchLicense(e.target.value)}
                  placeholder="Enter doctor's license number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!searchLicense.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {searchResult === null && searchTriggered && searchLicense && (
            <div className="text-center py-4 text-gray-500">
              No doctor found with license number: {searchLicense}
            </div>
          )}

          {searchResult && (
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold">Dr. {searchResult.firstName} {searchResult.lastName}</h4>
                  <p className="text-gray-600">{searchResult.specialization}</p>
                  {searchResult.hospital && <p className="text-sm text-gray-500">{searchResult.hospital}</p>}
                  <p className="text-xs text-gray-400">License: {searchResult.licenseNumber}</p>
                </div>
                <div className="text-right">
                  {searchResult.verified ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Verified</span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Pending</span>
                  )}
                </div>
              </div>
              
              {searchResult.hasAccess ? (
                <div className="text-green-600 text-sm">✅ Access already granted</div>
              ) : (
                <button
                  onClick={() => handleGrantAccess(searchResult._id)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Grant Access
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Current Access Permissions</h3>
          
          {grantedAccess === undefined ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : grantedAccess?.length === 0 ? (
            <p className="text-gray-500">No doctors have access to your records yet.</p>
          ) : (
            <div className="space-y-3">
              {grantedAccess?.map((access) => access && (
                <div key={access._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Dr. {access.doctor.firstName} {access.doctor.lastName}</h4>
                      <p className="text-sm text-gray-600">{access.doctor.specialization}</p>
                      {access.doctor.hospital && <p className="text-xs text-gray-500">{access.doctor.hospital}</p>}
                    </div>
                    <button
                      onClick={() => handleRevokeAccess(access.doctor._id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                  <div className="text-xs text-gray-400">
                    Access granted: {new Date(access.grantedAt).toLocaleDateString()}
                    {access.expiresAt && ` • Expires: ${new Date(access.expiresAt).toLocaleDateString()}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
