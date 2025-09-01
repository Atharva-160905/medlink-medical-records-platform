import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Search doctor by license number (for patients)
export const searchDoctorByLicense = query({
  args: { licenseNumber: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const patient = await ctx.db.query("patients").withIndex("by_user_id", (q) => q.eq("userId", userId)).first();
    if (!patient) throw new Error("Only patients can search for doctors");

    const doctor = await ctx.db.query("doctors").withIndex("by_license", (q) => q.eq("licenseNumber", args.licenseNumber)).first();
    if (!doctor) return null;

    const permission = await ctx.db.query("accessPermissions").withIndex("by_patient_doctor", (q) => q.eq("patientId", patient._id).eq("doctorId", doctor._id)).first();

    return {
      _id: doctor._id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      licenseNumber: doctor.licenseNumber,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      verified: doctor.verified,
      hasAccess: permission?.granted || false,
    };
  },
});

// Grant access to doctor (for patients)
export const grantDoctorAccess = mutation({
  args: {
    doctorId: v.id("doctors"),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const patient = await ctx.db.query("patients").withIndex("by_user_id", (q) => q.eq("userId", userId)).first();
    if (!patient) throw new Error("Patient profile not found");

    const existing = await ctx.db.query("accessPermissions").withIndex("by_patient_doctor", (q) => q.eq("patientId", patient._id).eq("doctorId", args.doctorId)).first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        granted: true,
        grantedAt: Date.now(),
        expiresAt: args.expiresAt,
      });
      console.log("Updated existing permission for patient:", patient._id, "doctor:", args.doctorId);
    } else {
      const permissionId = await ctx.db.insert("accessPermissions", {
        patientId: patient._id,
        doctorId: args.doctorId,
        granted: true,
        grantedAt: Date.now(),
        expiresAt: args.expiresAt,
      });
      console.log("Created new permission:", permissionId, "for patient:", patient._id, "doctor:", args.doctorId);
    }

    return { success: true };
  },
});

// Revoke access from doctor (for patients)
export const revokeDoctorAccess = mutation({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const patient = await ctx.db.query("patients").withIndex("by_user_id", (q) => q.eq("userId", userId)).first();
    if (!patient) throw new Error("Patient profile not found");

    const permission = await ctx.db.query("accessPermissions").withIndex("by_patient_doctor", (q) => q.eq("patientId", patient._id).eq("doctorId", args.doctorId)).first();

    if (permission) {
      await ctx.db.patch(permission._id, { granted: false });
    }

    return { success: true };
  },
});

// Get patient's granted access list
export const getGrantedAccess = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const patient = await ctx.db.query("patients").withIndex("by_user_id", (q) => q.eq("userId", userId)).first();
    if (!patient) throw new Error("Patient profile not found");

    const permissions = await ctx.db.query("accessPermissions").withIndex("by_patient", (q) => q.eq("patientId", patient._id)).filter((q) => q.eq(q.field("granted"), true)).collect();

    const accessList = await Promise.all(
      permissions.map(async (permission) => {
        const doctor = await ctx.db.get(permission.doctorId);
        return doctor ? {
          _id: permission._id,
          doctor: {
            _id: doctor._id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            licenseNumber: doctor.licenseNumber,
            specialization: doctor.specialization,
            hospital: doctor.hospital,
          },
          grantedAt: permission.grantedAt,
          expiresAt: permission.expiresAt,
        } : null;
      })
    );

    return accessList.filter(Boolean);
  },
});

// Debug function to check all permissions
export const debugPermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allPermissions = await ctx.db.query("accessPermissions").collect();
    const patient = await ctx.db.query("patients").withIndex("by_user_id", (q) => q.eq("userId", userId)).first();
    const doctor = await ctx.db.query("doctors").withIndex("by_user_id", (q) => q.eq("userId", userId)).first();

    return {
      allPermissions,
      currentPatient: patient,
      currentDoctor: doctor,
      userType: patient ? "patient" : doctor ? "doctor" : "unknown"
    };
  },
});

// Get permission between patient and doctor (for internal use)
export const getPermission = query({
  args: {
    patientId: v.id("patients"),
    doctorId: v.id("doctors"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accessPermissions")
      .withIndex("by_patient_doctor", (q) => 
        q.eq("patientId", args.patientId).eq("doctorId", args.doctorId)
      )
      .first();
  },
});
