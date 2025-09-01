/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as access from "../access.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as doctors from "../doctors.js";
import type * as http from "../http.js";
import type * as medicalRecords from "../medicalRecords.js";
import type * as patients from "../patients.js";
import type * as router from "../router.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  access: typeof access;
  ai: typeof ai;
  auth: typeof auth;
  doctors: typeof doctors;
  http: typeof http;
  medicalRecords: typeof medicalRecords;
  patients: typeof patients;
  router: typeof router;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
