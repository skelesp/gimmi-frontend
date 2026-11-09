import { ComponentHarness } from '@angular/cdk/testing';

/** Test harness for `gimmi-password-input`: interact like a user instead of through DOM queries. */
export class PasswordInputHarness extends ComponentHarness {
    static hostSelector = 'gimmi-password-input';

    private readonly input = this.locatorFor('input');
    private readonly toggleButton = this.locatorFor('button');
    private readonly label = this.locatorFor('label');
    private readonly error = this.locatorForOptional('#passwordErrors');

    async getPlaceholder(): Promise<string> {
        return (await this.input()).getProperty<string>('placeholder');
    }

    async getLabel(): Promise<string> {
        return (await this.label()).text();
    }

    /** Replaces the value by typing it, key by key. */
    async setValue(value: string): Promise<void> {
        const input = await this.input();
        await input.clear();
        if (value) await input.sendKeys(value);
    }

    async blur(): Promise<void> {
        await (await this.input()).blur();
    }

    /** `true` while the password is readable (input type `text`). */
    async isPasswordVisible(): Promise<boolean> {
        return (await (await this.input()).getProperty<string>('type')) === 'text';
    }

    /** Clicks the eye button. */
    async toggleVisibility(): Promise<void> {
        await (await this.toggleButton()).click();
    }

    /** The validation message, or an empty string when there is none. */
    async getErrorText(): Promise<string> {
        const error = await this.error();
        return error ? (await error.text()).trim() : '';
    }
}
