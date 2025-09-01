import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate unique Health ID
function generateHealthId(): string {
  const prefix = "MED";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Create patient profile
export const createPatient = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if patient already exists
    const existing = await ctx.db
      .query("patients")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("Patient profile already exists");
    }

    const healthId = generateHealthId();

    const patientId = await ctx.db.insert("patients", {
      userId,
      healthId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      age: args.age,
      gender: args.gender,
      bloodGroup: args.bloodGroup,
      phone: args.phone,
      address: args.address,
      allergies: [],
      chronicConditions: [],
    });

    return { patientId, healthId };
  },
});

// Get current patient profile
export const getCurrentPatient = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("patients")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
  },
});

// Update patient profile
export const updatePatient = mutation({
  args: {
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    chronicConditions: v.optional(v.array(v.string())),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const patient = await ctx.db
      .query("patients")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!patient) {
      throw new Error("Patient profile not found");
    }

    await ctx.db.patch(patient._id, {
      age: args.age,
      gender: args.gender,
      bloodGroup: args.bloodGroup,
      allergies: args.allergies,
      chronicConditions: args.chronicConditions,
      phone: args.phone,
      address: args.address,
    });

    return { success: true };
  },
});

// Search patient by Health ID (for doctors)
export const searchPatientByHealthId = query({
  args: { healthId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the user is a doctor
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!doctor) {
      throw new Error("Only doctors can search for patients");
    }

    const patient = await ctx.db
      .query("patients")
      .withIndex("by_health_id", (q) => q.eq("healthId", args.healthId))
      .first();

    if (!patient) {
      return null;
    }

    // Check if doctor has permission to view this patient
    const permission = await ctx.db
      .query("accessPermissions")
      .withIndex("by_patient_doctor", (q) => 
        q.eq("patientId", patient._id).eq("doctorId", doctor._id)
      )
      .first();

    if (!permission || !permission.granted) {
      return { 
        _id: patient._id,
        healthId: patient.healthId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        hasAccess: false 
      };
    }

    return { ...patient, hasAccess: true };
  },
});

// Grant access to doctor
export const grantDoctorAccess = mutation({
  args: {
    doctorId: v.id("doctors"),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const patient = await ctx.db
      .query("patients")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!patient) {
      throw new Error("Patient profile not found");
    }

    // Check if permission already exists
    const existing = await ctx.db
      .query("accessPermissions")
      .withIndex("by_patient_doctor", (q) => 
        q.eq("patientId", patient._id).eq("doctorId", args.doctorId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        granted: true,
        grantedAt: Date.now(),
        expiresAt: args.expiresAt,
      });
    } else {
      await ctx.db.insert("accessPermissions", {
        patientId: patient._id,
        doctorId: args.doctorId,
        granted: true,
        grantedAt: Date.now(),
        expiresAt: args.expiresAt,
      });
    }

    return { success: true };
  },
});

// Get patient by ID (for internal use)
export const getPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.patientId);
  },
});
