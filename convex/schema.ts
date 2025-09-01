import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  patients: defineTable({
    userId: v.id("users"),
    healthId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    chronicConditions: v.optional(v.array(v.string())),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_health_id", ["healthId"])
    .index("by_email", ["email"]),

  doctors: defineTable({
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    licenseNumber: v.string(),
    specialization: v.string(),
    hospital: v.optional(v.string()),
    phone: v.optional(v.string()),
    verified: v.boolean(),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_license", ["licenseNumber"]),

  medicalRecords: defineTable({
    patientId: v.id("patients"),
    title: v.string(),
    description: v.optional(v.string()),
    recordType: v.string(), // "document", "prescription", "consultation", "lab_result"
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    uploadedBy: v.string(), // "patient" or doctor's name
    uploadedById: v.id("users"),
    tags: v.optional(v.array(v.string())),
    date: v.number(),
    ocrText: v.optional(v.string()),
    summary: v.optional(v.object({
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
    })),
  })
    .index("by_patient", ["patientId"])
    .index("by_date", ["date"]),

  consultations: defineTable({
    patientId: v.id("patients"),
    doctorId: v.id("doctors"),
    notes: v.string(),
    diagnosis: v.optional(v.string()),
    prescription: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
    consultationDate: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_doctor", ["doctorId"])
    .index("by_date", ["consultationDate"]),

  accessPermissions: defineTable({
    patientId: v.id("patients"),
    doctorId: v.id("doctors"),
    granted: v.boolean(),
    grantedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_patient", ["patientId"])
    .index("by_doctor", ["doctorId"])
    .index("by_patient_doctor", ["patientId", "doctorId"]),

  analysisLogs: defineTable({
    recordId: v.id("medicalRecords"),
    triggeredBy: v.id("users"),
    triggeredByName: v.string(),
    model: v.string(),
    timestamp: v.number(),
    action: v.string(), // "generate", "regenerate"
  })
    .index("by_record", ["recordId"])
    .index("by_user", ["triggeredBy"])
    .index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
