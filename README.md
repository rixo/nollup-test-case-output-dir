# Repro: broken destructured named exports

```bash
git clone
cd nollup-test-case-output-dir
git checkout destruct-named-exports
yarn

yarn nollup

# for comparison
yarn rollup -cw
```

## Description

Named exports in the following code don't work with Nollup:

~~~js
const foobar = { foo: 1, bar: 2 }
export const { foo, bar } = foobar
~~~

### Reproduction

```bash
yarn nollup
```

Open http://localhost:8080

**Actual** console output:

~~~js
undefined undefined "Baz"
~~~

**Expected** console output (`yarn rollup -cw` to compare with Rollup):

~~~js
Foo Bar Baz
~~~
