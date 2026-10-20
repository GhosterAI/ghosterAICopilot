# Third-party notices

This file is informational. The license shipped with each component controls
its use. If a component's license file is present in `src/web-dist` or in the
installed application directory, that file prevails over this summary.

## FFmpeg

`ffmpeg/windows/x86_64/ffmpeg.exe` is FFmpeg N-124795-gc27a3b12e3-20260604,
licensed under GPLv3 (built with `--enable-gpl --enable-version3`). See
`NOTICE` and `FFMPEG_SOURCE_OFFER.md` for the source offer and build
configuration.

## Application framework

- Tauri / WRY / TAO — Apache-2.0 or MIT (depending on component).
- Microsoft Edge WebView2 Runtime — Microsoft terms; it is a system component
  and is not redistributed in this package.
- Rust crates used by the upstream executable — their respective licenses are
  included in the upstream binary's notices where applicable.

## JavaScript and UI libraries

The web bundle includes open-source libraries, including (non-exhaustive):

- React, React DOM — MIT
- Radix UI primitives — MIT
- Tailwind CSS — MIT
- Zustand — MIT
- i18next / react-i18next — MIT
- Framer Motion — MIT
- GSAP — GSAP standard license (see https://gsap.com/standard-license)
- CodeMirror / Lezer — MIT
- Shiki — MIT
- ELK layout — EPL-2.0
- Mermaid — MIT
- Lucide icons — ISC
- Sonner — MIT
- date-fns — MIT
- Zod — MIT

Other bundled libraries and their license texts can be found in the asset
headers and license files under `src/web-dist`.

## Icons

The disguise icon set includes Dashboard Icons and artwork from third-party
projects. See `src/web-dist/disguise-icons/LICENSE-dashboard-icons.txt` and
`src/web-dist/disguise-icons/official-sources.json`. Product names and logos
are trademarks of their respective owners; they are used only to identify the
corresponding applications in the disguise feature.

## Fonts

The UI uses system fonts and any font files bundled in the upstream assets,
under their respective licenses.

## No affiliation

GhosterAI is not affiliated with OpenAI, Google, Anthropic, Microsoft, FFmpeg,
or any API provider. Provider names are trademarks of their owners.
