# Vendor files

`app.js` first tries to import `../../vendor/mp4-muxer.mjs` from `assets/js/app.js`.

To remove the CDN dependency completely, download the exact `mp4-muxer` browser module used by the project and place it here as:

```text
vendor/mp4-muxer.mjs
```

If the local file is missing, the app falls back to jsDelivr.

I'm too bored to actually import it since its deprecated
