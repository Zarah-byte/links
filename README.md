# Mix a Drink!

A card-deck website that pulls a live [Are.na](https://www.are.na/katie-lu/glassware-rxfrlfenjcu) channel about glassware and deals it out like a hand of cocktail cards. The collection brings together research and visual inspiration around glassware (its history, techniques and material presence) while keeping the interface playful and interaction-forward.

Built for the "Links" project in [Typography & Interaction](https://typography-interaction-2526.github.io/), 2025–26 MPS Communication Design, Parsons School of Design.

- **Project brief:** https://typography-interaction-2526.github.io/project/4/
- **Are.na channel:** [Glassware](https://www.are.na/katie-lu/glassware-rxfrlfenjcu)

## About the design

In terms of design, I was heavily inspired by what we do with glassware, particularly the fancy kind: we make drinks in it. That led me to cocktail cards (recipe cards for cocktails), creating a sense of celebration and joy around glassmaking and glassware, beyond just the technical craft, to the art and community it leads to.

## Features

- **A hand of five.** Every visit deals five random blocks into a fan of cards. On phones the fan becomes a deck you swipe through. **Shuffle** deals a new hand.
- **See all.** The fan straightens into a scrolling row of every block, in the order it was added (#1 → #146), with arrows and a counter. **Back to hand** returns to the same five.
- **Flip cards.** Clicking a card opens it large, with the page behind blurred. The front shows the media: the image, video, text or the first page of a PDF. **Flip** shows the back: name, number, ingredients, source and a link to Are.na.
- **Live content.** Nothing is hardcoded. Blocks load from the Are.na API, including every page of a long channel, so the site grows as the channel does.

### Tagging blocks with ingredients

Add hashtags to a block's description on Are.na, e.g. `Lovely coupe #coupe #gin`. The card shows `coupe` and `gin` as ingredients, after the media type.

## Running it locally

Plain HTML, CSS and JavaScript, with no build step. 

## Project structure

| File | What's in it |
|---|---|
| `index.html` | Header, the card hero and the About popup |
| `assets/arena.js` | Fetches the channel; builds the cards, Shuffle, See all, the phone swipe deck and the flip-card view |
| `assets/style.css` | All styles; design tokens (colours, type scale, card sizes) are at the top |
| `assets/reset.css` | The course's CSS reset |
| `assets/*-cover.*`, `assets/text.svg` | Illustrated covers for link, audio, video and text/PDF blocks |
| `assets/fonts/` | Bonbance Bold Condensed |
| `assets/favicons/` | `favicon.ico` (16, 32 and 64px) |

To show a different Are.na channel, change `channelSlug` at the top of `assets/arena.js`.

## Tech stack

- **HTML**
- **CSS** (design tokens, a consistent type scale, responsive layout)
- **Vanilla JavaScript** (View Transitions for the fan → row morph)
- **Are.na API**
- **Typography:** Bonbance (self-hosted), DM Sans and DM Mono (Google Fonts)

## Authors

- [Zarah Yaqub](https://github.com/Zarah-byte)
- [Katie Lu](https://github.com/luk862-glitch)

## Note on AI use

### Claude (redesign and implementation)

The redesign from a filterable grid into the card deck was built with Claude (Anthropic's Claude Code) as a coding assistant. I led the design with my own mockups and direction — the card fan, the flip-card view, See all, the covers, the type and icon choices — and Claude wrote and refactored the HTML, CSS and JavaScript to match, checked the layout at different screen sizes, and reformatted the code to follow the conventions from my earlier project. I reviewed each change in the browser and asked for revisions where it didn't match what I wanted.

### ChatGPT (learning and debugging support)

ChatGPT was used as a learning and troubleshooting partner throughout this project. I used it to help me diagnose bugs, trace why certain behaviours weren't working (especially in JavaScript), and translate JS concepts into beginner-friendly explanations so I could understand what each function was doing (these were particularly useful when the sorting and the intersection observer were misbehaving). Any suggestions I used were tested, edited and integrated by me. (Disclaimer: I did get project blindness in the middle, but pivoted to understanding, which is why the website ended up as it is.)

## License

The site's code is [MIT](https://choosealicense.com/licenses/mit/) licensed.

### Font and icon licenses

The fonts and icons have their own licenses:

| Asset | Designer / Publisher | License | Used for |
|---|---|---|---|
| [Bonbance Bold Condensed](https://atypeofamigo.com/fonts/bonbance/) | Louna Bourdon, published by X Cicéro | [SIL Open Font License 1.1](https://openfontlicense.org) | Titles (self-hosted in `assets/fonts/`) |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | Colophon Foundry, for Google Fonts | [SIL Open Font License 1.1](https://openfontlicense.org) | Body text (loaded from Google Fonts) |
| [DM Mono](https://fonts.google.com/specimen/DM+Mono) | Colophon Foundry, for Google Fonts | [SIL Open Font License 1.1](https://openfontlicense.org) | Buttons and labels (loaded from Google Fonts) |
| [Lucide](https://lucide.dev) icons | Lucide contributors | [ISC License](https://lucide.dev/license) | Button icons (martini, shuffle, flip, arrows, close) |
| [Material Symbols](https://fonts.google.com/icons) "info" icon | Google | [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) | The ⓘ button in the header |

Under the OFL, fonts can be used, embedded and redistributed (including commercially), but not sold on their own; the license text travels with the font files.
