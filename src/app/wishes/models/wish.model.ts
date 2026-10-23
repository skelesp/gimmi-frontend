import { Person } from 'src/app/people/models/person.model';
import { User } from 'src/app/users/models/user.model';
import { validateUrl } from 'src/app/_utility/url_utility';
import { environment } from 'src/environments/environment';

export type wishStatus = 'Open' | 'Reserved' | 'Received' | 'Fulfilled';
export type WishScenario = 'OPEN_WISH' | 'OPEN_WISH_CREATED_BY_USER_FOR_ANOTHER' | 'RESERVED' | 'RESERVED_BY_USER' | 'RESERVED_INCOGNITO_FOR_USER' | 'RECEIVED' | 'RECEIVED_RECEIVER' | 'RECEIVED_GIVEN_BY_USER' | 'FULFILLED' | 'FULFILLED_BY_USER';

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
    public createdAt: Date;
    private _userIs : {[key: string]:boolean} = {
        receiver: null,
        creator: null,
        reservator: null
    };

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
    public get userIsReceiver(): boolean {
        return this._userIs.receiver;
    }
    public get userIsCreator(): boolean {
        return this._userIs.creator;
    } 
    public get userIsReservator(): boolean {
        return this._userIs.reservator;
    }

    public setUserIsFlags(user: User) {
        this._userIs = {
            receiver: user.id === this.receiver.id,
            creator: user.id === this.createdBy.id,
            reservator: user.id === this.reservation?.reservedBy.id
        }
    }

    public get scenario() : WishScenario {
        switch (this._status) {
            case 'Open':
                if (!this._userIs.receiver && this._userIs.creator) return 'OPEN_WISH_CREATED_BY_USER_FOR_ANOTHER'
                else return 'OPEN_WISH';
            case 'Reserved':
                if (this._userIs.reservator) return 'RESERVED_BY_USER'
                else if (!this._userIs.receiver) return 'RESERVED'
                else return 'RESERVED_INCOGNITO_FOR_USER'  // user is the receiver and should not know that something is reserved on his list
            case 'Received':
                if (this._userIs.reservator) return 'RECEIVED_GIVEN_BY_USER'
                else if (this._userIs.receiver) return 'RECEIVED_RECEIVER'
                else return 'RECEIVED'
            case 'Fulfilled':
                if (this._userIs.reservator) return 'FULFILLED_BY_USER'
                else return 'FULFILLED'
            default:
                console.warn(`No scenario set for wish with status ${this._status} and flags (receiver|creator|reservator): ${this._userIs.receiver}|${this._userIs.creator}|${this._userIs.reservator} `)
                break;
        }
    }
    
}
