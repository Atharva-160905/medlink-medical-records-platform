import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Generate upload URL for medical documents
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Upload medical record
export const uploadMedicalRecord = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    recordType: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    patientId: v.optional(v.id("patients")), // For doctors uploading on behalf of patients
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let targetPatientId = args.patientId;
    let uploadedBy = "patient";
    let uploaderName = "Patient";

    // If patientId is provided, verify doctor has access
    if (args.patientId) {
      const doctor = await ctx.db
        .query("doctors")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();

      if (!doctor) {
        throw new Error("Only doctors can upload records for other patients");
      }

      const permission = await ctx.db
        .query("accessPermissions")
        .withIndex("by_patient_doctor", (q) => 
          q.eq("patientId", args.patientId!).eq("doctorId", doctor._id)
        )
        .first();

      if (!permission || !permission.granted) {
        throw new Error("No access permission for this patient");
      }

      uploadedBy = `Dr. ${doctor.firstName} ${doctor.lastName}`;
      uploaderName = uploadedBy;
    } else {
      // User is uploading for themselves
      const patient = await ctx.db
        .query("patients")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();

      if (!patient) {
        throw new Error("Patient profile not found");
      }

      targetPatientId = patient._id;
      uploaderName = `${patient.firstName} ${patient.lastName}`;
    }

    const recordId = await ctx.db.insert("medicalRecords", {
      patientId: targetPatientId!,
      title: args.title,
      description: args.description,
      recordType: args.recordType,
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploadedBy: uploaderName,
      uploadedById: userId,
      tags: args.tags || [],
      date: Date.now(),
    });

    return { recordId };
  },
});

// Get medical records for a patient
export const getPatientRecords = query({
  args: { patientId: v.optional(v.id("patients")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let targetPatientId = args.patientId;

    // If no patientId provided, get current user's records
    if (!targetPatientId) {
      const patient = await ctx.db
        .query("patients")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();

      if (!patient) {
        throw new Error("Patient profile not found");
      }

      targetPatientId = patient._id;
    } else {
      // Verify access if viewing another patient's records
      const patient = await ctx.db.get(targetPatientId);
      if (!patient) {
        throw new Error("Patient not found");
      }

      const isOwnRecords = patient.userId === userId;

      if (!isOwnRecords) {
        const doctor = await ctx.db
          .query("doctors")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .first();

        if (!doctor) {
          throw new Error("Access denied");
        }

        const permission = await ctx.db
          .query("accessPermissions")
          .withIndex("by_patient_doctor", (q) => 
            q.eq("patientId", targetPatientId!).eq("doctorId", doctor._id)
          )
          .first();

        if (!permission || !permission.granted) {
          throw new Error("No access permission");
        }
      }
    }

    const records = await ctx.db
      .query("medicalRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", targetPatientId!))
      .order("desc")
      .collect();

    // Get file URLs for records with files
    const recordsWithUrls = await Promise.all(
      records.map(async (record) => {
        if (record.fileId) {
          const url = await ctx.storage.getUrl(record.fileId);
          return { ...record, fileUrl: url };
        }
        return record;
      })
    );

    return recordsWithUrls;
  },
});

// Delete medical record
export const deleteMedicalRecord = mutation({
  args: { recordId: v.id("medicalRecords") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("Record not found");
    }

    // Only the uploader or patient can delete the record
    const patient = await ctx.db.get(record.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const canDelete = record.uploadedById === userId || patient.userId === userId;

    if (!canDelete) {
      throw new Error("Permission denied");
    }

    await ctx.db.delete(args.recordId);

    // Delete associated file if exists
    if (record.fileId) {
      await ctx.storage.delete(record.fileId);
    }

    return { success: true };
  },
});

// Save OCR text to a medical record
export const saveOcrText = mutation({
  args: {
    recordId: v.id("medicalRecords"),
    ocrText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("Record not found");
    }

    // Check permissions
    const patient = await ctx.db.get(record.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const canAccess = record.uploadedById === userId || patient.userId === userId;
    
    if (!canAccess) {
      // Check if user is a doctor with access
      const doctor = await ctx.db
        .query("doctors")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();

      if (doctor) {
        const permission = await ctx.db
          .query("accessPermissions")
          .withIndex("by_patient_doctor", (q) => 
            q.eq("patientId", record.patientId).eq("doctorId", doctor._id)
          )
          .first();

        if (!permission || !permission.granted) {
          throw new Error("No access permission");
        }
      } else {
        throw new Error("Permission denied");
      }
    }

    await ctx.db.patch(args.recordId, {
      ocrText: args.ocrText,
    });

    return { success: true };
  },
});

// Analyze medical record with AI
export const analyzeReport = action({
  args: {
    recordId: v.id("medicalRecords"),
    ocrText: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    summary: v.object({
      patientSummary: v.string(),
      doctorSummary: v.string(),
      flags: v.optional(v.array(v.object({
        name: v.string(),
        value: v.string(),
        range: v.string(),
        note: v.string(),
      }))),
      model: v.string(),
      generatedAt: v.number(),
      generatedBy: v.id("users"),
    }),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get record and verify permissions
    const record: any = await ctx.runQuery(api.medicalRecords.getRecord, { recordId: args.recordId });
    if (!record) {
      throw new Error("Record not found");
    }

    // Check permissions
    const patient = await ctx.runQuery(api.patients.getPatient, { patientId: record.patientId });
    if (!patient) {
      throw new Error("Patient not found");
    }

    const canAccess = record.uploadedById === userId || patient.userId === userId;
    
    if (!canAccess) {
      // Check if user is a doctor with access
      const doctor = await ctx.runQuery(api.doctors.getDoctor, { userId });
      if (doctor) {
        const permission = await ctx.runQuery(api.access.getPermission, {
          patientId: record.patientId,
          doctorId: doctor._id,
        });
        if (!permission || !permission.granted) {
          throw new Error("No access permission");
        }
      } else {
        throw new Error("Permission denied");
      }
    }

    // Get text to analyze
    let textToAnalyze = args.ocrText;
    if (!textToAnalyze && record.ocrText) {
      textToAnalyze = record.ocrText;
    }
    if (!textToAnalyze || textToAnalyze.trim().length < 10) {
      throw new Error("No sufficient text available for analysis. Please upload a document with readable text or provide OCR text.");
    }

    // Normalize OCR text to fix common errors
    const normalizedResult = await ctx.runAction(api.ai.normalizeLabResults, {
      ocrText: textToAnalyze,
    });
    const normalizedText = normalizedResult.normalizedText;

    // Get user info for logging
    const user = await ctx.runQuery(api.auth.loggedInUser);
    const userName = user?.email || "Unknown User";

    try {
      // Call AI analysis with normalized text
      const summary: any = await ctx.runAction(api.ai.analyzeWithCohere, {
        text: normalizedText,
        recordType: record.recordType,
      });

      // Save summary to record
      await ctx.runMutation(api.medicalRecords.saveSummary, {
        recordId: args.recordId,
        summary: {
          ...summary,
          generatedAt: Date.now(),
          generatedBy: userId,
        },
      });

      // Log the analysis
      await ctx.runMutation(api.medicalRecords.logAnalysis, {
        recordId: args.recordId,
        triggeredBy: userId,
        triggeredByName: userName,
        model: summary.model,
        action: "generate",
      });

      return { ok: true, summary };
    } catch (error) {
      console.error("AI analysis failed:", error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Save AI summary to record
export const saveSummary = mutation({
  args: {
    recordId: v.id("medicalRecords"),
    summary: v.object({
      patientSummary: v.string(),
      doctorSummary: v.string(),
      flags: v.optional(v.array(v.object({
        name: v.string(),
        value: v.string(),
        range: v.string(),
        note: v.string(),
      }))),
      model: v.string(),
      generatedAt: v.number(),
      generatedBy: v.id("users"),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      summary: args.summary,
    });
    return { success: true };
  },
});

// Log analysis activity
export const logAnalysis = mutation({
  args: {
    recordId: v.id("medicalRecords"),
    triggeredBy: v.id("users"),
    triggeredByName: v.string(),
    model: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analysisLogs", {
      recordId: args.recordId,
      triggeredBy: args.triggeredBy,
      triggeredByName: args.triggeredByName,
      model: args.model,
      timestamp: Date.now(),
      action: args.action,
    });
    return { success: true };
  },
});

// Get a single record
export const getRecord = query({
  args: { recordId: v.id("medicalRecords") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const record = await ctx.db.get(args.recordId);
    if (!record) {
      return null;
    }

    // Check permissions
    const patient = await ctx.db.get(record.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const canAccess = record.uploadedById === userId || patient.userId === userId;
    
    if (!canAccess) {
      // Check if user is a doctor with access
      const doctor = await ctx.db
        .query("doctors")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();

      if (doctor) {
        const permission = await ctx.db
          .query("accessPermissions")
          .withIndex("by_patient_doctor", (q) => 
            q.eq("patientId", record.patientId).eq("doctorId", doctor._id)
          )
          .first();

        if (!permission || !permission.granted) {
          throw new Error("No access permission");
        }
      } else {
        throw new Error("Permission denied");
      }
    }

    // Get file URL if exists
    let fileUrl = null;
    if (record.fileId) {
      fileUrl = await ctx.storage.getUrl(record.fileId);
    }

    return { ...record, fileUrl };
  },
});
