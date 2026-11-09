import type { components, operations, paths } from './schema';

/** A schema of the contract by name: `Schema<'Wish'>`. */
export type Schema<Name extends keyof components['schemas']> = components['schemas'][Name];

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** The paths that have the method: `ApiPath<'get'>` is `'/me' | '/people' | ...`. */
export type ApiPath<M extends HttpMethod> = {
  [P in keyof paths]: paths[P] extends Record<M, unknown> ? P : never;
}[keyof paths];

type Operation<P extends keyof paths, M extends HttpMethod> = paths[P] extends Record<M, infer Op> ? Op : never;

type SuccessStatus = 200 | 201 | 202;

/** The JSON body of the success response (`void` for 204). */
type SuccessBody<Op> = Op extends { responses: infer R }
  ? [Extract<keyof R, SuccessStatus>] extends [never]
    ? void
    : {
        [S in Extract<keyof R, SuccessStatus>]: R[S] extends { content: infer C }
          ? C[keyof C]
          : void;
      }[Extract<keyof R, SuccessStatus>]
  : void;

type Parameters<Op> = Op extends { parameters: infer P } ? P : never;
type PathParams<Op> = Parameters<Op> extends { path: infer P } ? P : never;
type QueryParams<Op> = Parameters<Op> extends { query?: infer Q } ? Q : never;
type Body<Op> = Op extends { requestBody?: infer RB } ? (RB extends { content: infer C } ? C[keyof C] : never) : never;

/** What a call needs to pass: the path parameters, the query and the body of the operation. */
export type RequestOptions<Op> =
  ([PathParams<Op>] extends [never] ? { path?: never } : { path: PathParams<Op> }) &
  ([QueryParams<Op>] extends [never] ? { query?: never } : { query?: QueryParams<Op> }) &
  ([Body<Op>] extends [never] ? { body?: never } : { body: Body<Op> });

// Options are optional only when nothing in them is required.
type NeedsOptions<Op> = [PathParams<Op>] extends [never] ? ([Body<Op>] extends [never] ? false : true) : true;
export type OptionsArgs<Op> = NeedsOptions<Op> extends true ? [options: RequestOptions<Op>] : [options?: RequestOptions<Op>];

export type ResponseOf<P extends keyof paths, M extends HttpMethod> = SuccessBody<Operation<P, M>>;
export type ArgsOf<P extends keyof paths, M extends HttpMethod> = OptionsArgs<Operation<P, M>>;

/** Request and response types by `operationId`: `OperationResponse<'getMe'>`. */
export type OperationId = keyof operations;
export type OperationResponse<Id extends OperationId> = SuccessBody<operations[Id]>;
export type OperationRequest<Id extends OperationId> = RequestOptions<operations[Id]>;
