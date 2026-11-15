import { WritableSignal, signal } from '@angular/core';

/** A stand-in for the resource of `ApiClient.resource` in specs: set `value`, `loading` or `error` to play a state. */
export function fakeResource<T>(initial?: T) {
  const value: WritableSignal<T | undefined> = signal(initial);
  const loading = signal(false);
  const error = signal<unknown>(undefined);
  return {
    value,
    loading,
    error,
    ref: { value, isLoading: loading.asReadonly(), error: error.asReadonly(), hasValue: () => value() !== undefined }
  };
}
