# Repro: HMR failure on renamed file

```bash
git clone
cd nollup-test-case-output-dir
git checkout bug-rename
yarn
```

## Description

HMR fails in browser when a file is renamed. Server remains OK, a browser reload fixes the situation.

In order to witness this, you've got to simultaneously rename a file, and change the content of the file that imports it. Otherwise you break on "missing module" (because the consumer still imports a file that has just been deleted -- renamed), which I think is expected, and operation resumes normally afterward :sunglasses:

The real use case is an app that watches the project's sources in parallel to Nollup, and generates a manifest files that imports those files. The bundler processes both the manifest and the imported files.

```
                        src/manifest.js
src
  pages/foo.js    ->    import('./pages/foo.js')
  pages/bar.js          import('./pages/bar.js')
```

All 3 of the projects I currently want to integrate do this (Sapper, Routify, Svench)...

## Case: static import

```bash
yarn nollup
```

Open http://localhost:8080/

Then run the `bug.js` script. It simulates renaming `foo.js` to `foot.js` back and forth. (It also changes the content of the files to better demonstrates what happens, but the content of the file is not relevant.)

```bash
node bug.js
```

### Expected

Browser console output:

```
> foot
foot
```

### Actual

#### Branch: Refactor

```
Uncaught TypeError: modules[number] is not a function
  ...
```

**NOTE** There is apparently a timing dimension to the issue. On some runs, the HMR update actually succeeds.

#### Branch: master

:ok:

## Case: dynamic import

Reload browser

```bash
DYN=1 node bug.js
```

Expected browser console output:

```
> foo
foo
```

### Actual

#### Branch: Refactor

```
Uncaught (in promise) TypeError: Failed to resolve module specifier 'undefined'
  ...
```

Not sure there's a timing dimension to this one. In my tests, I've only seen it fail.

#### Branch: master

The server crashes with:

```bash
Error: File not found: /home/eric/projects/nollup/test-case-output-dir/src/foot.js
    at .../nollup/lib/index.js:159:19
    at String.replace (<anonymous>)
    at createFileFunctionWrapper (.../nollup/lib/index.js:155:17)
    at .../nollup/lib/index.js:289:58
    at Array.map (<anonymous>)
    at generate (.../nollup/lib/index.js:288:44)
    at async bundle (.../nollup/lib/index.js:605:19)
    at async generateImpl (.../nollup/lib/index.js:744:21)
```

## Compare with rollup-plugin-hot

```bash
# ensure fixtures use rollup-plugin-hot hot API (import.meta.hot.accept())
ROLLUP=1 node bug.js

yarn rollup -cw

ROLLUP=1 node bug.js

DYN=1 ROLLUP=1 node bug.js
```

## Additional info

I had a related issue in `rollup-plugin-hot`. I don't think it's the same thing though, because in my case I was getting a complete HMR update before error on the next one.

In my case, it was because I had "left for later" handling of deleted files. And so I was getting:

1. load `foo.js` -> OK

2. delete `foo.js` -> OK

3. recreate `foo.js` (`mv foot.js foo.js`) -> (!) HMR runtime thought `foo.js` was unaccepted
