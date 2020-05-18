## Repro: crash on dynamic imports with shared dependencies

~~~bash
git clone
cd nollup-test-case-output-dir
git checkout bug-shared-dynamic-imports
yarn
~~~

## Usage

~~~bash
yarn nollup
~~~

Open http://localhost:8080/

## Problem

Expected console output:

~~~
dyn2 shared_2shared-a
~~~

Actual:

~~~
Uncaught (in promise) TypeError: modules[number] is not a function
    at create_module (main.js:55)
    at main.js:57
    at Object.2 (dyn2-[hash].js:47)
    at create_module (main.js:55)
    at main.js:57
    at Object.4 (dyn2-[hash].js:22)
    at create_module (main.js:55)
    at _require (main.js:161)
    at cb (main.js:128)
~~~

## Debugging

Commenting out the return in [this line]() fixes the problem in this example (but apparently it does end up in infinite loop in a more involved project).

~~~js
// Circular Dependency Check
if (file.checked) {
    //return;
} else {
    file.checked = true;
}
~~~
