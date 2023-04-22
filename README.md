# dismoi

Dependency Injection for Javascript on any platform. 

[Less than 1kb of code](https://bundlephobia.com/package/dismoi@0.0.2)

## Installation 

Nodejs: 

``npm install --save dismoi``

Browser (CDN)

```HTML
<script type="module">
    import {createProvider} from 'https://unpkg.com/dismoi@0.0.1/src/index.js'
</script>
```

(replace 0.0.1 by the appropriate version)

## Usage

### Define your module

You define a registry of *injectable* items within a flat object whose keys (strings or Symbols) are the lookup tokens and values are *factories* to instantiate those items.

A factory must have the following signature 

``<T extends Object>(deps?: T) => any // returns an injectable``

``deps`` is an object providing the named dependency map of the injectable.

Alternatively it can be any value which gets automatically wrapped into a factory function.

```Javascript
const token = Symbol('something'); 
const injectables = {
    [token]: ({foo}) => { return 'whathever'},
    foo: ({externalThing, someValue}) => externalThing,
    someValue: 'something' // a value
}
```
the dependency graph of your module is the following: 

1. The injectable designed by the symbol token depends on ``foo``
2. ``foo`` depends on ``externalThing`` (not provided by the module) and ``someValue``
3. ``someValue`` always returns the string ``something``

Factories can be decorated to adapt to any instantiation pattern:

```Javascript
import {fromClass, singleton} from 'dismoi';

const injectables = {
    foo: fromClass(class blah {
        constructor({depA}){};
    }),
    depA: singleton(someFactory) // make sure someFactory only instantiate once and then returns the same instance
}
```

How factories get registered in the module is left out: simple imports, to sophisticated class annotation system.

### Create a provider

You pass the injectable registry to the ``createProvider`` function alongside with the injectable list you want to expose.
It gives you a function to instantiate the module:

Example using the injectables aforementioned
```Javascript
import {createProvider} from 'dismoi';

const provide = createProvider({
    injectables,
    api:['foo']
});
```

You call the ``provide`` function to instantiate the module passing the missing dependencies in the graph, eventually overwriting some you have defined in the registry.

```javascript
const moduleA = provide({
    someValue: 'otherValue', // overwrite
    externalThing: 42 // required
}) 
```

Then injectables get instantiated lazily when required through their getter. 

A different instance is created each time, unless you have a "singleton" factory

```Javascript
const { foo } = services;
const otherFoo = services.foo;
```

An exception is thrown if some dependencies are not met.

See the [extensive test suite](src/provider.test.js) for advanced usages. 

## Typescript support. 

Typescript is well-supported and the compiler will throw if there are incompatible dependencies or if some are missing.








