const mapValues = (mapFn) => (source) =>
  Object.fromEntries(
    [
      ...Object.getOwnPropertyNames(source),
      ...Object.getOwnPropertySymbols(source),
    ].map((key) => [key, mapFn(source[key], key)])
  );

export const valueFn = (val) => () => val;

export const fromClass = (Klass) => (deps) => new Klass(deps);

export const provideSymbol = Symbol('provide');

export const singleton = (factory) => {
  let instance;
  return (...args) => {
    if (instance) {
      return instance;
    }
    return (instance = factory(...args));
  };
};

export const createProvider = ({ injectables, api = [] }) => {
  return function provide(externalDeps = {}) {
    const _injectables = new Proxy(
      {
        ...injectables,
        [provideSymbol]: valueFn((subArgs = {}) => provide(subArgs)),
        ...externalDeps,
      },
      {
        get(target, prop, receiver) {
          if (!(prop in target)) {
            throw new Error(
              `could not resolve injectable with injection token "${String(
                prop
              )}"`
            );
          }
          return Reflect.get(target, prop, receiver);
        },
      }
    );

    const mapWithPropertyDescriptor = mapValues((factory, key) => {
      const _factory =
        typeof factory === 'function' ? factory : valueFn(factory);
      return {
        get() {
          return _factory(_injectables);
        },
        enumerable: api.includes(key),
      };
    });

    const properties = mapWithPropertyDescriptor(_injectables);
    return Object.defineProperties(_injectables, properties);
  };
};
