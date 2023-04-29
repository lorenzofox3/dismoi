/**
 * Factory as defined in the injectable property: either a function with eventually a single named dependencies argument object or a value
 */
export type FactoryFn<FactoryLike> = FactoryLike extends (args: any) => any
  ? FactoryLike
  : () => FactoryLike;

type NamedArguments<FactoryLike> = Parameters<FactoryFn<FactoryLike>>[0];

/**
 * The dependencies map of a given factory: if there is no argument, the type is an empty map
 */

type Defined<T> = T extends undefined ? never : T;

/**
 * The dependencies map of a given factory: if there is no argument, the type is an empty map
 */
type Dependencies<FactoryLike> = Defined<NamedArguments<FactoryLike>>;

/**
 * The actual injectable: ie what a factory instantiates
 */
export type Injectable<FactoryLike> = ReturnType<FactoryFn<FactoryLike>>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

export type FlatDependencyTree<Registry> = UnionToIntersection<
  {
    [key in keyof Registry]: Dependencies<Registry[key]>;
  }[keyof Registry]
>;

export type InjectableMap<Registry> = {
  [key in keyof Registry]: Injectable<Registry[key]>;
};

declare const provideSymbol: unique symbol;

// todo not only keys should map for the omit but the type as well
type Diff<T, U> = Pick<T, Exclude<keyof T, keyof U>>;

export type ExternalDeps<Registry extends Record<string, unknown>> = Diff<
  FlatDependencyTree<Registry>,
  InjectableMap<Registry>
> &
  Partial<InjectableMap<Registry>>;

type ModuleAPI<Registry, PublicAPI extends Array<keyof Registry> = []> = {
  [injectable in PublicAPI[number]]: Injectable<Registry[injectable]>;
};

type ProviderFnArgs<Registry extends Record<string, unknown>> = {
  [key in keyof ExternalDeps<Registry>]:
    | ExternalDeps<Registry>[key]
    | ((arg?: FlatDependencyTree<Registry>) => ExternalDeps<Registry>[key]);
};

export type ProviderFn<
  Registry extends Record<string, unknown>,
  PublicAPI extends Array<keyof Registry> = []
> = Partial<InjectableMap<Registry>> extends ExternalDeps<Registry>
  ? (externalDeps?: ProviderFnArgs<Registry>) => ModuleAPI<Registry, PublicAPI>
  : (externalDeps: ProviderFnArgs<Registry>) => ModuleAPI<Registry, PublicAPI>;

declare function valueFn<T>(value: T): () => T;

// todo
// declare function fromClass = () => (x)

declare function singleton<Factory extends (...args: any[]) => any>(
  factory: Factory
): (...args: Parameters<Factory>) => ReturnType<Factory>;

declare function createProvider<
  Registry extends Record<string, unknown>,
  PublicAPI extends Array<keyof Registry> = []
>(args: {
  injectables: Registry;
  api?: PublicAPI;
}): ProviderFn<Registry, PublicAPI>;
