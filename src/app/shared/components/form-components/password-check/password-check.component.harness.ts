import { ComponentHarness } from '@angular/cdk/testing';
import { PasswordInputHarness } from '../password-input/password-input.component.harness';

/** Test harness for `gimmi-password-check`: the password field plus its confirmation field. */
export class PasswordCheckHarness extends ComponentHarness {
    static hostSelector = 'gimmi-password-check';

    private readonly fields = this.locatorForAll(PasswordInputHarness);
    private readonly mismatchError = this.locatorForOptional('#passwordErrors');

    /** Types the password and its confirmation, then leaves the confirmation field. */
    async fill(password: string, confirmation: string): Promise<void> {
        const [passwordField, confirmationField] = await this.fields();
        await passwordField.setValue(password);
        await confirmationField.setValue(confirmation);
        await confirmationField.blur();
    }

    /** The mismatch message of the group, or an empty string when there is none. */
    async getMismatchText(): Promise<string> {
        const error = await this.mismatchError();
        return error ? (await error.text()).trim() : '';
    }
}
