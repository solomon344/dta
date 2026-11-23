// Badge tones for status enums, shared by dashboard pages.
export const cohortTone = { UPCOMING: "blue", ACTIVE: "green", COMPLETED: "gray" } as const;
export const studentTone = { ENROLLED: "blue", GRADUATED: "green", WITHDRAWN: "gray" } as const;
export const waitlistTone = { NEW: "blue", CONTACTED: "amber", ENROLLED: "green", ARCHIVED: "gray" } as const;
export const projectTone = { PENDING: "amber", APPROVED: "green", REJECTED: "gray" } as const;
/** Project statuses as students see them. */
export const projectStudentLabel = { PENDING: "in review", APPROVED: "published", REJECTED: "not approved" } as const;
export const testimonialTone = { PENDING: "amber", APPROVED: "green", REJECTED: "gray" } as const;
export const certificateTone = { ISSUED: "green", REVOKED: "red", VOIDED: "gray" } as const;
export const certificateLabel = { ISSUED: "issued", REVOKED: "revoked", VOIDED: "un-issued" } as const;
