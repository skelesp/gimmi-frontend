export class User {
    constructor(
        public id: string,
        public lastName: string,
        public firstName: string,
        public email: string,
        public loginStrategy: string,
        public token: string,
        public accounts: unknown[]
    ) { };

    get fullName(): string { // TODO: User should extend Person so this duplication isn't needed anymore (name should come from Person class, not User Class)
        return `${this.firstName} ${this.lastName}`;
    }
}

export interface ILocalLoginInfo {
    email: string,
    password: string
}

export interface IDecodedUserToken {
    _id: string;
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    birthday: string;
    exp: number;
    iat: number;
    loginStrategy: string;
    accounts: unknown[];
}