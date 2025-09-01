import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create doctor profile
export const createDoctor = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    licenseNumber: v.string(),
    specialization: v.string(),
    hospital: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if doctor already exists
    const existing = await ctx.db
      .query("doctors")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("Doctor profile already exists");
    }

    const doctorId = await ctx.db.insert("doctors", {
      userId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      licenseNumber: args.licenseNumber,
      specialization: args.specialization,
      hospital: args.hospital,
      phone: args.phone,
      verified: true, // Auto-verify for demo purposes
    });

    return { doctorId };
  },
});

// Get current doctor profile
export const getCurrentDoctor = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("doctors")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get doctor's patients (with access permissions)
export const getDoctorPatients = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!doctor) {
      throw new Error("Doctor profile not found");
    }

    const permissions = await ctx.db
      .query("accessPermissions")
      .withIndex("by_doctor", (q) => q.eq("doctorId", doctor._id))
      .filter((q) => q.eq(q.field("granted"), true))
      .collect();

    const patients = await Promise.all(
      permissions.map(async (permission) => {
        const patient = await ctx.db.get(permission.patientId);
        return patient ? { ...patient, accessGrantedAt: permission.grantedAt } : null;
      })
    );

    return patients.filter(Boolean);
  },
});

// Add consultation notes
export const addConsultation = mutation({
  args: {
    patientId: v.id("patients"),
    notes: v.string(),
    diagnosis: v.optional(v.string()),
    prescription: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!doctor) {
      throw new Error("Doctor profile not found");
    }

    // Verify access permission
    const permission = await ctx.db
      .query("accessPermissions")
      .withIndex("by_patient_doctor", (q) => 
        q.eq("patientId", args.patientId).eq("doctorId", doctor._id)
      )
      .first();

    if (!permission || !permission.granted) {
      throw new Error("No access permission for this patient");
    }

    const consultationId = await ctx.db.insert("consultations", {
      patientId: args.patientId,
      doctorId: doctor._id,
      notes: args.notes,
      diagnosis: args.diagnosis,
      prescription: args.prescription,
      followUpDate: args.followUpDate,
      consultationDate: Date.now(),
    });

    return { consultationId };
  },
});

// Get consultations for a patient
export const getPatientConsultations = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is the patient or a doctor with access
    const patient = await ctx.db.get(args.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const isPatient = patient.userId === userId;
    let hasAccess = isPatient;

    if (!isPatient) {
      const doctor = await ctx.db
        .query("doctors")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();

      if (doctor) {
        const permission = await ctx.db
          .query("accessPermissions")
          .withIndex("by_patient_doctor", (q) => 
            q.eq("patientId", args.patientId).eq("doctorId", doctor._id)
          )
          .first();

        hasAccess = permission?.granted || false;
      }
    }

    if (!hasAccess) {
      throw new Error("No access permission");
    }

    const consultations = await ctx.db
      .query("consultations")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    // Get doctor details for each consultation
    const consultationsWithDoctors = await Promise.all(
      consultations.map(async (consultation) => {
        const doctor = await ctx.db.get(consultation.doctorId);
        return {
          ...consultation,
          doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unknown Doctor",
          doctorSpecialization: doctor?.specialization,
        };
      })
    );

    return consultationsWithDoctors;
  },
});

// Update doctor verification status (for fixing existing doctors)
export const updateDoctorVerification = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doctor = await ctx.db.query("doctors").withIndex("by_user_id", (q) => q.eq("userId", userId)).first();
    if (!doctor) throw new Error("Doctor profile not found");

    await ctx.db.patch(doctor._id, { verified: true });
    return { success: true };
  },
});

// Get doctor by user ID (for internal use)
export const getDoctor = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("doctors")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});
