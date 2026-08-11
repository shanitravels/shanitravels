/** Shared shape for public form action state (booking / enquiry / contact). */
export interface PublicFormState {
  error: string | null;
  fieldErrors: Record<string, string[]>;
}

export const EMPTY_FORM_STATE: PublicFormState = { error: null, fieldErrors: {} };
