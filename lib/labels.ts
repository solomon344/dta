// Badge tones for status enums, shared by dashboard pages.
export const cohortTone = { UPCOMING: "blue", ACTIVE: "green", COMPLETED: "gray" } as const;
export const studentTone = { ENROLLED: "blue", GRADUATED: "green", WITHDRAWN: "gray" } as const;
export const testimonialTone = { PENDING: "amber", APPROVED: "green", REJECTED: "gray" } as const;
export const certificateTone = { ISSUED: "green", REVOKED: "red", VOIDED: "gray" } as const;
export const certificateLabel = { ISSUED: "issued", REVOKED: "revoked", VOIDED: "un-issued" } as const;
