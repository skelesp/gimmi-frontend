import { ComponentHarness } from '@angular/cdk/testing';

/** Test harness for `gimmi-email-input`: interact like a user instead of through DOM queries. */
export class EmailInputHarness extends ComponentHarness {
    static hostSelector = 'gimmi-email-input';

    private readonly input = this.locatorFor('input');
    private readonly error = this.locatorForOptional('#emailError');

    async getPlaceholder(): Promise<string> {
        return (await this.input()).getProperty<string>('placeholder');
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

    /** The validation message, or an empty string when there is none. */
    async getErrorText(): Promise<string> {
        const error = await this.error();
        return error ? (await error.text()).trim() : '';
    }
}
