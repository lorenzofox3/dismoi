/* eslint-disable */
import type {
  ExternalDeps,
  FlatDependencyTree,
  Injectable,
  InjectableMap,
  ProviderFn,
} from './index';
import { createProvider, FulfilledDependencies, provideSymbol } from './index';

injectables: {
  // result from a factory (the return value type)
  let injectable: Injectable<(arg: string) => number> = 42;
  // a value
  const injectableValue: Injectable<number> = 42;
  // @ts-expect-error
  // should be a number
  injectable = 'foo';

  let registry: InjectableMap<{
    foo: (arg: any) => number;
    bar: (arg: any) => (x: number) => string;
    blah: string;
  }> = {
    foo: 42,
    bar: (x) => String(x),
    blah: 'hello',
  };

  // @ts-expect-error
  // missing injectable "bar"
  registry = {
    foo: 42,
    blah: 'hello',
  };

  registry = {
    foo: 42,
    // @ts-expect-error
    // wrong injectable type inference: blah should be string
    blah: 42,
    bar: (x: number) => String(x),
  };

  let injectablesMap: InjectableMap<{
    foo: () => number;
    bar: string;
    rich: { foo: { bar: number } };
  }> = {
    foo: 42,
    bar: 'woot',
    rich: {
      foo: { bar: 34 },
    },
  };

  injectablesMap = {
    foo: 42,
    bar: 'woot',
    rich: {
      // @ts-expect-error
      // wrong nested type
      foo: {},
    },
  };

  // @ts-expect-error
  // missing dep bar
  injectablesMap = {
    foo: 42,
    rich: {
      foo: {
        bar: 42,
      },
    },
  };
}

dependenciesTree: {
  const dependenciesTree: FlatDependencyTree<{
    foo: (arg: { x: number; blah: string }) => any;
    bar: (arg: { x: number }) => any;
    bim: (arg: { y: string }) => any;
    blah: () => any;
  }> = {
    x: 42,
    blah: 'hello',
    y: 'woot',
  };

  const dependenciesTreeImpossible: FlatDependencyTree<{
    foo: (arg: { x: number; blah: string }) => any;
    bar: (arg: { x: string }) => any; // x is "never"
    bim: (arg: { y: string }) => any;
  }> = {
    // @ts-expect-error
    // x can't be in the same time number and string
    x: 42,
    blah: 'hello',
    y: 'woot',
  };
}

fulfilledDependencies: {
  let fulfilled: FulfilledDependencies<{
    foo: (arg: { x: number; blah: string; woot: { prop: number } }) => any;
    x: ({ otherThing }: { otherThing: string; y: string }) => number;
    woot: () => { prop: number };
  }> = 'x';
  fulfilled = 'woot';

  // @ts-expect-error
  // blah is not met
  fulfilled = 'blah';

  // @ts-expect-error
  // otherThing is not met
  fulfilled = 'otherThing';

  let incompatibleInterfaces: FulfilledDependencies<{
    x: (deps: { y: number; woot: { prop: { nested: number } } }) => any;
    y: () => string;
    woot: (deps: { met: string }) => { prop: { nested: string } };
    met: () => string;
  }> = 'met';

  // @ts-expect-error
  // y should return a number
  incompatibleInterfaces = 'y';

  // @ts-expect-error
  // nested type should be number
  incompatibleInterfaces = 'woot';
}

lateBoundDependencies: {
  type SampleRegistry = {
    foo: (deps: { x: number; dep: number }) => any;
    bar: (deps: { y: string; dep: number; dep2: number }) => number;
    dep2: number;
    x: () => number;
  };

  let externalDeps: ExternalDeps<SampleRegistry>;
  externalDeps = {
    y: 'hello',
    dep: 42,
  };

  // overwrite already provided deps
  externalDeps = {
    y: '2354',
    dep: 42,
    x: 42, // x is optional as provided within the registry
    dep2: 42, // dep2 is optional as provided within the registry
    bar: 42, // overwrite factory
  };

  // @ts-expect-error
  // missing a dependency "y"
  externalDeps = {
    dep: 42,
  };

  // wrong type
  externalDeps = {
    y: '2354',
    // @ts-expect-error
    dep: '42',
    // overwrite type
    // @ts-expect-error
    x: 'hello',
  };
}

publicAPI: {
  let publicAPI: ProviderFn<
    {
      foo: (x: any) => number;
      bar: (x: any) => string;
      woot: (x: any) => number;
    },
    ['foo', 'woot']
  >;

  // only foo and woot are required
  publicAPI = () => ({
    foo: 42,
    woot: 42,
  });
}

createProvider: {
  // provideSymbol is not a mandatory dep
  createProvider({
    injectables: {
      foo: ({ [provideSymbol]: provide }) => 42,
    },
  })({});

  let someProvider = createProvider({
    injectables: {
      a: ({ b }: { b: string }) => b,
      b: () => 42,
    },
    api: ['a'],
  });

  // @ts-expect-error
  // b is not a number
  someProvider();

  let f = createProvider({
    injectables: {
      a: ({ b }: { b: number }) => b,
      c: ({ b }: { b: string }) => b,
      b: 42,
    },
    api: ['a'],
  });

  // @ts-expect-error
  // b can not be fulfilled
  f();

  // when all dependencies are provide, external Deps is optional
  const provideFulfilled = createProvider({
    injectables: {
      foo: ({ val }: { val: number }) => val,
      val: 42,
    },
    api: ['foo'],
  });
  provideFulfilled();
  provideFulfilled({});
  provideFulfilled({ val: 72 });

  const provideMissing = createProvider({
    injectables: {
      foo: ({ val }: { val: number }) => val,
    },
    api: ['foo'],
  });
  provideMissing({ val: 72 });
  provideMissing({ val: () => 42 });
  // @ts-expect-error
  // missing required deps "val"
  provideMissing();
  // @ts-expect-error
  provideMissing({});
}
