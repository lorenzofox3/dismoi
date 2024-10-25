/**
 * Factory as defined in the injectable property: either a function with eventually a single named dependencies argument object or a value
 */
export type FactoryFn<FactoryLike> = FactoryLike extends (args: any) => any
  ? FactoryLike
  : () => FactoryLike;

type NamedArguments<FactoryLike> = Parameters<FactoryFn<FactoryLike>>[0];

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

type ObjectLike = Record<string, unknown>;

/**
 * All the dependencies of the declared injectables on a registry
 */
export type FlatDependencyTree<Registry extends ObjectLike> =
  UnionToIntersection<Dependencies<Registry[keyof Registry]>>;

/**
 * All the Injectables defined by a registry
 */
export type InjectableMap<Registry extends ObjectLike> = {
  [key in keyof Registry]: Injectable<Registry[key]>;
};

type MaybeMet<Registry extends ObjectLike> =
  keyof FlatDependencyTree<Registry> & keyof InjectableMap<Registry>;

/**
 * Dependencies already met by the injectables themselves (union of keys)
 */
export type FulfilledDependencies<Registry extends ObjectLike> = {
  [Dep in MaybeMet<Registry>]: InjectableMap<Registry>[Dep] extends FlatDependencyTree<Registry>[Dep]
    ? Dep
    : never;
}[MaybeMet<Registry>];

export type ExternalDeps<Registry extends ObjectLike> = Omit<
  FlatDependencyTree<Registry>,
  FulfilledDependencies<Registry>
> &
  Partial<InjectableMap<Registry>>;

type ModuleAPI<Registry, PublicAPI extends Array<keyof Registry> = []> = {
  [injectable in PublicAPI[number]]: Injectable<Registry[injectable]>;
};

type ProviderFnArgs<Registry extends ObjectLike> = {
  [key in keyof ExternalDeps<Registry>]:
    | ExternalDeps<Registry>[key]
    | ((arg: InjectableMap<Registry>) => ExternalDeps<Registry>[key]); // technically there is no constraint on arg, it is quite the opposite: it may bring new constraints but this gets contrived.
};

export type ProviderFn<
  Registry extends ObjectLike,
  PublicAPI extends Array<keyof Registry> = []
> = Partial<InjectableMap<Registry>> extends ExternalDeps<Registry>
  ? (externalDeps?: ProviderFnArgs<Registry>) => ModuleAPI<Registry, PublicAPI>
  : (externalDeps: ProviderFnArgs<Registry>) => ModuleAPI<Registry, PublicAPI>;

/**
 * If the injectable is a function, we have to wrap it in a function to avoid treating it as a factory
 */
type WrapFunctionInjectable<T> = [T] extends [(...args: any[]) => any]
  ? (deps?: any) => T 
  : ((deps?: any) => T) | T;
  
/**
 * Checks if each injectable match the required dependencies of the entire registry
 */
type ValidateRegistry<Registry extends ObjectLike, Deps = FlatDependencyTree<Registry>> = {
  [key in keyof Registry]: key extends keyof Deps ? WrapFunctionInjectable<Deps[key]> : Registry[key];
};

declare function valueFn<T>(value: T): () => T;

declare const provideSymbol: unique symbol;

declare function singleton<Factory extends (...args: any[]) => any>(
  factory: Factory
): (...args: Parameters<Factory>) => ReturnType<Factory>;

declare function createProvider<
  Registry extends ObjectLike,
  PublicAPI extends Array<keyof Registry> = []
>(args: {
  injectables: ValidateRegistry<Registry>;
  api?: PublicAPI;
}): ProviderFn<Registry, PublicAPI>;

declare function fromClass<T extends abstract new (deps: any) => any>(
  Klass: T
): (deps: Defined<ConstructorParameters<T>[0]>) => InstanceType<T>;
