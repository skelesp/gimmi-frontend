import { Person } from 'src/app/features/people/models/person.model';
import { validateUrl } from 'src/app/core/url-utility';
import type { Schema } from 'src/app/core/api/api-types';

export type wishStatus = 'Open' | 'Reserved' | 'Received' | 'Fulfilled';

/** Afbeelding van een wens in R2 (sc-3052, sc-2911). Cloudinary is weg sinds sc-3070. */
export interface IWishImage {
    key?: string,
    url?: string
}

export interface IReservation {
    reservedBy: Person;
    amount: number;
    reservationDate: Date;
    reason: string;
    handoverDate?: Date;
}

export interface IGiftFeedback {
    satisfaction: string;
    receivedOn: Date;
    message: string;
    putBackOnList: boolean;
    /** The wish the server put back on the receiver's list, if asked. */
    relistedWishId?: string;
}

export interface IClosure {
    closedBy: Person;
    closedOn: Date;
    reason: string;
}
export class Wish {
    private _status: wishStatus;
    public image: IWishImage;
    public reservation: IReservation;
    public giftFeedback: IGiftFeedback;
    public closure: IClosure;
    public copyOf: string;
    /** All links of the wish; the form shows the first (`url`) only. */
    public links: string[] = [];
    public createdAt: Date;
    /** What the viewer is to this wish and may do with it, as the server says (`viewer.can`, `viewer.ownCopyId`). */
    public viewer?: Schema<'WishViewer'>;

    constructor(
        public id: string,
        public title: string,
        public price: number,
        public url: string,
        public receiver: Person,
        public createdBy: Person,
        public color: string,
        public size: string,
        public description: string,
        public amountWanted: number
    ) {
        if (url) this.url = validateUrl(url);
    }
    
    public set status (v : wishStatus) {
        this._status = v;
    }    
    public get status(): wishStatus{
        return this._status;
    }
    /** Whether the viewer may do this to the wish: the server says so (`viewer.can`). */
    public can(action: 'update' | 'delete' | 'copy'): boolean {
        return !!this.viewer?.can[action];
    }

    /** What the viewer is to this wish, as the server says (`viewer.roles`). */
    public hasRole(role: Schema<'WishViewer'>['roles'][number]): boolean {
        return !!this.viewer?.roles.includes(role);
    }
}
