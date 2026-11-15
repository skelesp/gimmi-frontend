import { Pipe, PipeTransform } from '@angular/core';
import type { Schema } from 'src/app/core/api/api-types';

/** Cents of the API as euros, for the `currency` pipe; `null` when there is no price. */
@Pipe({ name: 'euros' })
export class EurosPipe implements PipeTransform {
  transform(price: Schema<'Money'> | null | undefined): number | null {
    return price ? price.amount / 100 : null;
  }
}
