# Raise Your Glass! 🍸  
**An Are.na-powered collection site exploring glassware through images, videos, text, links, and audio.**

This project was developed as part of the **2025–26 MPS Communication Design** program at **Parsons School of Design**.

---

## Live Links

- **Project (course page):** https://typography-interaction-2526.github.io/project/4/
- **Are.na channel:** https://www.are.na/katie-lu/glassware-rxfrlfenjcu

---

## About the Project

**Raise Your Glass!** is a front-end site that pulls content from an Are.na channel and displays it as a bold, responsive grid. The collection brings together research and visual inspiration around glassware—its history, techniques, and material presence—while keeping the interface playful and interaction-forward.

Instead of hardcoding content, the site fetches blocks live from Are.na, so the collection can evolve continuously as the channel updates.

---

## Key Features

### Note on ChatGPT Use (Learning + Debugging Support)
ChatGPT was used as a learning and troubleshooting partner throughout this project. I used it to help me **diagnose bugs**, **trace why certain behaviors weren’t working (especially in JavaScript)**, and to **translate JS concepts into beginner-friendly explanations** so I could understand what each function was doing. Any suggestions I used were **tested, edited, and integrated by me**, and the goal was always to strengthen my understanding of vanilla JavaScript—not to copy/paste without comprehension. (disclaimer i did get project blindness in the middle but pivitoed to understading which is why the website ended up as it is)

### 1) Are.na API → Live, data-driven content
- Pulls channel details + block content directly from Are.na.
- Handles pagination so the full channel loads (not just the first page).

### 2) Category filtering (with a default state)
Filters are mapped to the content types the site renders:

| UI Label | Filter value | What shows |
|---|---|---|
| **LOOK** | `image` | Image blocks |
| **WATCH** | `attachment` | Video attachments + embed blocks |
| **READ** | `text` | Text blocks + PDF attachments (shown as previews in the grid) |
| **EXPLORE** | `links` | Link blocks |
| **LISTEN** | `audio` | Audio attachments |

✅ The site defaults to **LOOK (images)** on load, so the first view is immediate and visually strong.

### 3) Responsive navigation: desktop buttons + mobile custom dropdown
- Desktop: button row
- Mobile: custom dropdown UI (only one system visible at a time)

### 4) Reusable modal built with native `<dialog>`
- Clicking a card opens a modal with:
  - Title + description
  - “See original” (source link when available)
  - “See on Are.na”
  - Media preview (supported types listed below)

### 5) Media handling (grid + modal)
**Grid supports:**
- Images (cropped to fill)
- Link blocks (image previews)
- Text blocks (clean typographic tile)
- Video attachments + Embeds (thumbnail preview or fallback tile)
- PDF attachments (thumbnail preview or fallback tile)
- Audio attachments (stylized tile)

**Modal currently previews:**
- Images + Link preview images
- Embeds (iframe)
- Video attachments (native `<video controls>`)

Other attachments may show a “No preview available” placeholder in the modal (depending on file type).

### 6) Mobile-only “hover” highlight
Mobile doesn’t have real hover states, so the project uses an **IntersectionObserver** to add/remove a `.highlight` class as cards enter an “active zone” while scrolling. Desktop keeps true `:hover`. using intersection observer (Thanks Riya!) 

---

## Tech Stack

- **HTML5**
- **CSS3** (design tokens + responsive layout)
- **Vanilla JavaScript**
- **Are.na API**
- **Typography:** Google Fonts (**Syne** + **Bokor**)

---

## Typographic Licences
# Syne
Designed by Bonjour Monde, Lucas Descroix, George Triantafyllakos

License
Copyright 2017 The Syne Project Authors (https://gitlab.com/bonjour-monde/fonderie/syne-typeface)
This Font Software is licensed under the SIL Open Font License, Version 1.1 . This license is copied below, and is also available with a FAQ at: https://openfontlicense.org

SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007

# Bokor
Designed by Danh Hong

License
Copyright 2020 The Bokor Project Authors (https://github.com/danhhong/Bokor)
This Font Software is licensed under the SIL Open Font License, Version 1.1 . This license is copied below, and is also available with a FAQ at: https://openfontlicense.org

SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007

---

## Project Structure

```txt
.
├── index.html
├── reset.css
└── assets/
    ├── style.css
    └── arena.js
