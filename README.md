# Passive

> Passively track browser events

### Usage

_**NOTE**_: This is meant to be ran in the browser.
It is dependant upon `window` and you setting some
properties on that `window` object. I'm sure you
could get by without that with some haxzors but
I wouldn't.

- Add the contents of the `lib` folder into whatever
  server or Object Storage you want
- Before importing/requiring the scripting, you must
  insure that `window.__PASSIVE_CONFIG__` is set.
- Import the esm module however you please.
  - You can see demo usage at `demo.html`
