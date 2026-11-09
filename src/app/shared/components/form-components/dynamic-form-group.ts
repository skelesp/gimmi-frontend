import { AbstractControl, FormGroup } from '@angular/forms';

/**
 * Formulier waarvan de controls pas in `ngOnInit` van de kindcomponenten
 * (email-input, password-input, password-check) worden toegevoegd.
 */
export type DynamicFormGroup = FormGroup<Record<string, AbstractControl>>;
