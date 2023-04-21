import { test } from 'zora';
import { createProvider, provideSymbol, singleton } from './provider.js';

test('instantiates an injectable, calling the factory', ({ eq }) => {
  const provide = createProvider({
    injectables: {
      a: () => 'a',
    },
  });

  const services = provide();

  eq(services.a, 'a');
});

test('instantiates an injectable, when it is a value', ({ eq }) => {
  const provide = createProvider({
    injectables: {
      a: 'a',
    },
  });

  const services = provide();

  eq(services.a, 'a');
});

test('everytime the getter is called a new instance is created', ({
  eq,
  isNot,
}) => {
  const provide = createProvider({
    injectables: {
      a: () => ({ prop: 'a' }),
    },
  });

  const services = provide();

  const instance1 = services.a;
  const { a: instance2 } = services;
  eq(instance1, { prop: 'a' });
  eq(instance2, { prop: 'a' });
  isNot(instance2, instance1);
});

test('singleton decorator makes sure an injectable is only instantiated once', ({
  eq,
  is,
}) => {
  const provider = createProvider({
    injectables: {
      a: ({ b }) => b,
      b: singleton(({ c }) => ({ c })),
      c: 'c',
    },
  });

  const services = provider();
  const instance1 = services.a;
  const instance2 = services.a;
  eq(instance1, { c: 'c' });
  eq(instance2, { c: 'c' });
  is(instance1, instance2);
});

test('resolves dependency graph, instantiating the transitive dependencies ', ({
  eq,
}) => {
  const provide = createProvider({
    injectables: {
      a: ({ b, c }) => b + '+' + c,
      b: () => 'b',
      c: ({ d }) => d,
      d: 'd',
    },
  });

  const services = provide();
  eq(services.a, 'b+d');
});

test(`only instantiates a service when required`, ({ eq, notOk, ok }) => {
  let aInstantiated = false;
  let bInstantiated = false;
  let cInstantiated = false;

  const provide = createProvider({
    injectables: {
      a: ({ b }) => {
        aInstantiated = true;
        return b;
      },
      b: () => {
        bInstantiated = true;
        return 'b';
      },
      c: () => {
        cInstantiated = true;
        return 'c';
      },
    },
  });

  const services = provide();
  const { a } = services;

  eq(a, 'b');
  ok(aInstantiated);
  ok(bInstantiated);
  notOk(cInstantiated);

  const { c } = services;
  eq(c, 'c');
  ok(cInstantiated);
});

test('provide function allows late binding', ({ eq }) => {
  const provide = createProvider({
    injectables: {
      a: ({ b }) => b,
    },
  });

  const { a } = provide({ b: () => 'b' });

  eq(a, 'b');
});

test('provide function allows to overwrite defined injectable', ({ eq }) => {
  const provide = createProvider({
    injectables: {
      a: ({ b }) => b,
      b: 'b',
    },
  });

  const { a } = provide({ b: `b'` });

  eq(a, `b'`);
});

test('gives a friendly message when it can not resolve a dependency', ({
  eq,
  fail,
}) => {
  const provide = createProvider({
    injectables: {
      a: ({ b }) => b,
      b: ({ c }) => c,
    },
  });

  try {
    const { a } = provide();
    fail('should not reach that statement');
  } catch (err) {
    eq(err.message, 'could not resolve injectable with injection token "c"');
  }
});

test('injectable is explicitly "undefined" then it is an actual injectable value', ({
  eq,
}) => {
  const provide = createProvider({
    injectables: {
      a: ({ b }) => b,
      b: ({ c }) => c,
      c: undefined,
    },
  });

  const { a } = provide();
  eq(a, undefined);
  const { a: aBis } = provide({
    c: ({ d }) => d,
    d: undefined,
  });
  eq(aBis, undefined);
});

test('provide is itself injected', ({ eq }) => {
  const withSession = (factory) => {
    return ({ [provideSymbol]: provide }) => {
      return factory(
        provide({
          session: true,
        })
      );
    };
  };

  const provide = createProvider({
    injectables: {
      usecaseA: withSession(
        ({ repository, service }) => repository + '&' + service
      ),
      usecaseB: ({ repository, service }) => repository + '&' + service,
      repository: ({ session }) =>
        session ? 'repositoryWithSession' : 'repository',
      service: 'some_service',
      session: undefined,
    },
  });

  const { usecaseA, usecaseB } = provide();

  eq(usecaseA, 'repositoryWithSession&some_service');
  eq(usecaseB, 'repository&some_service');
});

test(`"api" defines the public API`, ({ eq }) => {
  const provide = createProvider({
    injectables: {
      a: ({ b }) => b,
      b: 'b',
      c: ({ b, d }) => `${b}+${d}`,
      d: 'd',
    },
    api: ['a', 'c'],
  });

  const moduleAPI = {
    ...provide(),
  };

  eq(Object.keys(moduleAPI), ['a', 'c']);
});
