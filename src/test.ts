import type {
  FactoryFn,
  Dependencies,
  Injectable,
  InjectableMap,
  FlatDependencyTree,
  ExternalDeps,
  ProviderFn,
} from './index';

import { singleton, createProvider, provideSymbol } from './index';

let factoryFn: FactoryFn<(arg: any) => number>;

factoryFn = () => 42;
// @ts-expect-error
factoryFn = () => 'hello';

// no deps -> empty map
let deps1: Dependencies<() => number> = {};
let deps2: Dependencies<(deps: { foo: { bar: number }; blah: string }) => any> =
  {
    foo: { bar: 42 },
    blah: 'hello',
  };

// mismatch in dependency types
deps2 = {
  // @ts-expect-error
  foo: { bar: 'foo' },
  // @ts-expect-error
  blah: 42,
};

// missing dependency
// @ts-expect-error
deps2 = {
  foo: { bar: 42 },
};

// result from a factory
let injectable: Injectable<(arg: string) => number> = 42;
// a value
let injectableValue: Injectable<number> = 42;
// @ts-expect-error
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

// missing injectable
// @ts-expect-error
registry = {
  foo: 42,
  blah: 'hello',
};

let dependenciesTree: FlatDependencyTree<{
  foo: (arg: { x: number; blah: string }) => any;
  bar: (arg: { x: number }) => any;
  bim: (arg: { y: string }) => any;
}> = {
  x: 42,
  blah: 'hello',
  y: 'woot',
};

let dependenciesTreeImpossible: FlatDependencyTree<{
  foo: (arg: { x: number; blah: string }) => any;
  bar: (arg: { x: string }) => any; // x must is "never"
  bim: (arg: { y: string }) => any;
}> = {
  // @ts-expect-error
  x: 42,
  blah: 'hello',
  y: 'woot',
};

let externalDeps: ExternalDeps<{
  foo: (deps: { x: number; dep: number }) => any;
  bar: (deps: { y: string; dep: number; dep2: number }) => number;
  dep2: number;
  x: () => number;
}>;

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

// missing a dep
// @ts-expect-error
externalDeps = {
  dep: 42,
  // y: 'sff'
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

const singletonFactory = singleton(({ x }: { x: number }) => ({
  foo: 42 + x,
}));

const returnValue: { foo: number } = singletonFactory({ x: 32 });

// missing dep
// @ts-expect-error
singletonFactory();

const singletonFactoryBis = singleton(() => ({ x: 42 }));
const returnValueBis: { x: number } = singletonFactoryBis();

// provideSymbol is not a mandatory dep
createProvider({
  injectables: {
    foo: ({ [provideSymbol]: provide }) => 42,
  },
})({});

// when all dependencies are provide, external Deps is optional
let provideFulfilled = createProvider({
  injectables: {
    foo: ({ val }: { val: number }) => val,
    val: 42,
  },
  api: ['foo'],
});
provideFulfilled();
provideFulfilled({});
provideFulfilled({ val: 72 });

let provideMissing = createProvider({
  injectables: {
    foo: ({ val }: { val: number }) => val,
  },
  api: ['foo'],
});
provideMissing({ val: 72 });
// @ts-expect-error
provideMissing();
// @ts-expect-error
provideMissing({});
