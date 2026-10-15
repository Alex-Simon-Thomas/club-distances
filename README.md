# Club Distances

A quick reference card on your phone for choosing a club on the course. Enter the distance to the pin, and it shows which club and swing (full, ¾ or ½) gets you closest, using your own carry distances, for example from launch-monitor range sessions.

**Open it:** https://alex-simon-thomas.github.io/club-distances/

> This is an early build. The full card is on its way.

## Install it on your phone

It's a web app: no app store, and it works with no signal once installed.

- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap the ⋮ menu, then **Install app** (or **Add to Home screen**).

## Your data

Your bag is saved only in your phone's browser. Nothing is sent anywhere, there are no accounts, and there's no tracking. To move your bag to another phone or keep a backup, use Export bag and Import bag in Settings.

## Development

Plain HTML, CSS and JavaScript, with no build step and no dependencies. Serve the folder with any static server, for example:

```sh
python -m http.server 8000
```

Run the tests with Node 22 or later:

```sh
node --test "tests/*.test.js"
```

Enable the pre-commit hook, which runs the tests, once per clone:

```sh
git config core.hooksPath .githooks
```

When you add a file the app needs, add it to `files.js` so it works offline. A test checks this.

## Licence

MIT, see [LICENSE](LICENSE).
