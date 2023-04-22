type EmptyMap = {};

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
export type Dependencies<FactoryLike> =
  NamedArguments<FactoryLike> extends undefined
    ? EmptyMap
    : NamedArguments<FactoryLike>;

/**
 * The actual injectable: ie what a factory instantiates
 */
export type Injectable<FactoryLike> = ReturnType<FactoryFn<FactoryLike>>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

export type FlatDependencyTree<Registry extends Object> = UnionToIntersection<
  {
    [key in keyof Registry]: Dependencies<Registry[key]>;
  }[keyof Registry]
>;

export type InjectableMap<Registry extends Object> = {
  [key in keyof Registry]: Injectable<Registry[key]>;
};

declare const provideSymbol: unique symbol;

// todo not only keys should map for the omit but the type as well
export type ExternalDeps<Registry extends Object> = Omit<
  FlatDependencyTree<Registry>,
  keyof InjectableMap<Registry> | typeof provideSymbol // provideSymbol is never required
> &
  Partial<InjectableMap<Registry>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type ModuleAPI<
  Registry extends Object,
  PublicAPI extends Array<keyof Registry> = []
> = {
  [injectable in PublicAPI[number]]: Injectable<Registry[injectable]>;
};

export type ProviderFn<
  Registry extends Object,
  PublicAPI extends Array<keyof Registry> = []
> = RequiredKeys<ExternalDeps<Registry>> extends never
  ? (externalDeps?: ExternalDeps<Registry>) => ModuleAPI<Registry, PublicAPI>
  : (externalDeps: ExternalDeps<Registry>) => ModuleAPI<Registry, PublicAPI>;

declare function valueFn<T>(value: T): () => T;

// todo
// declare function fromClass = () => (x)

declare function singleton<Factory extends (...args: any[]) => any>(
  factory: Factory
): (...args: Parameters<Factory>) => ReturnType<Factory>;

declare function createProvider<
  Registry extends Object,
  PublicAPI extends Array<keyof Registry> = []
>(args: {
  injectables: Registry;
  api?: PublicAPI;
}): ProviderFn<Registry, PublicAPI>;
