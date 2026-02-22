// ── Config ────────────────────────────────────────────────────────────────────
// The "slug" is just the end of the Are.na channel URL.
// e.g. are.na/katie-lu/glassware-rxfrlfenjcu → slug is 'glassware-rxfrlfenjcu'
let channelSlug = 'glassware-rxfrlfenjcu'

// Your Are.na username, used to fetch and display your profile in the footer.
let myUsername = 'zarah-yaqub'


// ── Modal / Dialog ────────────────────────────────────────────────────────────
// Instead of copy-pasting a <dialog> element inside every block in renderBlock()
// (which caused broken HTML and duplicate IDs), we create a single shared one
// here in JS and append it to <body> once. Every block click reuses this same dialog.

const dialog = document.createElement('dialog') // Creates the <dialog> element
dialog.id = 'dialog'                             // Gives it an ID so CSS can target it

// The inner HTML of the modal. Layers from bottom to top:
// 1. .dialog-media    → raw image fills the entire card
// 2. .dialog-blur     → frosted glass over the whole card, with a cutout revealing sharp image
// 3. .dialog-gradient → gradient sits over the cutout area, making text readable
// 4. .dialog-close    → ✕ button, top-right corner
// 5. .dialog-meta     → text panel at the bottom, above everything
dialog.innerHTML = 
`
  <div class="dialog-media"></div>
  <button class="dialog-close" aria-label="Close">✕</button>
  <div class="dialog-meta">
    <div class="dialog-card-header">
      <h3 class="dialog-title"></h3>
      <span class="dialog-type-badge"></span>
    </div>
    <div class="dialog-description"></div>
    <div class="dialog-actions">
      <a class="dialog-source" target="_blank" rel="noopener noreferrer">See original ↗</a>
      <a class="dialog-arena-link" target="_blank" rel="noopener noreferrer">See on Are.na ↗</a>
    </div>
  </div>
`

// Add the dialog into the actual page so it exists in the DOM
document.body.appendChild(dialog)

// Grab references to the parts inside the dialog we'll need to update each time it opens.
// We do this once here rather than querying them every time openModal() runs.
const dialogMedia       = dialog.querySelector('.dialog-media')       // Media preview area
const dialogClose       = dialog.querySelector('.dialog-close')       // ✕ close button
const dialogMeta        = dialog.querySelector('.dialog-meta')        // Text panel at the bottom
const dialogTitle       = dialog.querySelector('.dialog-title')       // Block title
const dialogTypeBadge   = dialog.querySelector('.dialog-type-badge')  // Block type badge (IMAGE, LINK…)
const dialogDescription = dialog.querySelector('.dialog-description') // Block description (if any)
const dialogSource      = dialog.querySelector('.dialog-source')      // "See the original" source link
const dialogArenaLink   = dialog.querySelector('.dialog-arena-link')  // "See on Are.na" button


// ── openModal(blockData) ──────────────────────────────────────────────────────
// Called whenever a block is clicked. Receives that block's data object from the
// Are.na API and uses it to populate and open the modal.
function openModal(blockData) {

  // --- Reset from any previous block ---
  dialogMedia.innerHTML        = ''
  dialogTitle.textContent      = ''
  dialogTypeBadge.textContent  = ''
  dialogDescription.innerHTML  = ''
  dialogSource.style.display   = 'none'  // hidden until we confirm a source URL exists
  dialogSource.href            = ''

  // Every Are.na block has a permanent URL using its numeric ID
  dialogArenaLink.href = `https://www.are.na/block/${blockData.id}`

  // Remove metadata rows from the previous block
  const prev = dialog.querySelector('.dialog-extra-meta')
  if (prev) prev.remove()

  // --- Title + type badge ---
  // Use the block's title if it has one, otherwise fall back to 'Untitled'.
  dialogTitle.textContent = blockData.title || 'Untitled'
  // blockData.class is Are.na's word for the block type (Image, Link, Text, Embed, Attachment)
  dialogTypeBadge.textContent = blockData.class?.toUpperCase() || ''

  // --- Description ---
  // Are.na provides descriptions as an object with an `.html` property.
  // The ?. is "optional chaining" — safely checks if `blockData.description` exists
  // before trying to access `.html`, avoiding a crash if it's undefined.
  // The ?. is "optional chaining" — it safely checks if `blockData.description` exists
  // before trying to access `.html`, avoiding a crash if it's undefined.
  if (blockData.description?.html) {
    dialogDescription.innerHTML = blockData.description.html
  }

  // --- Media preview ---
  // We check the block's type and build the appropriate HTML element.
  // For image/link blocks the image fills the card and the gradient shows.
  // For embeds/audio/pdf blocks there's no full-bleed image, so we hide the gradient.

  if (blockData.type === 'Image') {
    const img = document.createElement('img')
    img.src = blockData.image?.large?.src_2x || blockData.image?.src || ''
    img.alt = blockData.image?.alt_text || ''
    dialogMedia.appendChild(img)
   

  } else if (blockData.type === 'Link') {
    const img = document.createElement('img')
    img.src = blockData.image?.large?.src_2x || blockData.image?.medium?.src_2x || ''
    img.alt = blockData.image?.alt_text || ''
    dialogMedia.appendChild(img)


    if (blockData.source?.url) {
      dialogSource.href          = blockData.source.url
      dialogSource.style.display = 'inline-block'
    }

  } else if (blockData.type === 'Embed' && blockData.embed?.html) {
    dialogMedia.innerHTML = blockData.embed.html

  } else if (blockData.type === 'Attachment') {
    const ct = blockData.attachment?.content_type || ''
    if (ct.includes('video')) {
      dialogMedia.innerHTML = `<video controls src="${blockData.attachment.url}"></video>`
    } else if (ct.includes('audio')) {
      dialogMedia.innerHTML = `<audio controls src="${blockData.attachment.url}"></audio>`
    } else if (ct.includes('pdf')) {
      dialogMedia.innerHTML = `<iframe src="${blockData.attachment.url}" width="100%" height="360px"></iframe>`
    }

  }

  // --- Extra metadata rows ---
  // Rendered as dotted leader rows (like "LABEL ............ VALUE")
  // matching the cocktail card aesthetic. Each row only appears if the data exists.

  // Helper that builds one metadata row: LABEL ··· VALUE
  // The .dialog-meta-leader div creates the dotted line between them.
  const makeRow = (label, valueHTML) => `
    <div class="dialog-meta-row">
      <span class="dialog-section-label">${label}</span>
      <span class="dialog-meta-leader"></span>
      <span class="dialog-meta-value">${valueHTML}</span>
    </div>
  `

  const metaDiv = document.createElement('div')
  metaDiv.className = 'dialog-extra-meta'

  if (blockData.source?.url) {
    // Truncate very long URLs to keep the row readable
    const display = blockData.source.url.replace(/^https?:\/\//, '').slice(0, 40) + (blockData.source.url.length > 45 ? '…' : '')
    metaDiv.innerHTML += makeRow('SOURCE', `<a href="${blockData.source.url}" target="_blank">${display}</a>`)
  }
  if (blockData.created_at) {
    // Format the ISO date string into something human readable, e.g. "Jan 1, 2025"
    const date = new Date(blockData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    metaDiv.innerHTML += makeRow('ADDED', date)
  }
  if (blockData.class) {
    metaDiv.innerHTML += makeRow('TYPE', blockData.class.toUpperCase())
  }
  if (blockData.user?.full_name || blockData.user?.username) {
    const name = blockData.user.full_name || blockData.user.username
    const slug = blockData.user.slug || blockData.user.username
    metaDiv.innerHTML += makeRow('ADDED BY', `<a href="https://www.are.na/${slug}" target="_blank">${name}</a>`)
  }

  dialogDescription.insertAdjacentElement('afterend', metaDiv)

  // Reset scroll position before opening
  dialog.scrollTop             = 0
  dialogMeta.style.opacity     = 1

  document.body.classList.add('modal-open')
  dialog.showModal()
}


// ── Modal close handlers ──────────────────────────────────────────────────────

// Close when the ✕ button is clicked
dialogClose.addEventListener('click', () => {
  dialog.close()
  document.body.classList.remove('modal-open') // unlock page scroll
})

// Close when clicking outside the modal (on the backdrop).
// e.target is the element that was actually clicked — if it's the <dialog> itself
// (not something inside it), the user clicked the dark overlay around it.
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    dialog.close()
    document.body.classList.remove('modal-open') // unlock page scroll
  }
})

// Also catch the dialog closing any other way (e.g. Escape key),
// which the browser handles natively — this ensures the lock is always removed.
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open')
})


// ── placeChannelInfo(channelData) ────────────────────────────────────────────
// First, let's lay out some *functions*, starting with our basic metadata.
// Receives the full channel JSON from the Are.na API and fills in the page header.
let placeChannelInfo = (channelData) => {

  // Target some elements in your HTML and set their content/attributes to our data:
  document.querySelector('#channel-title').innerHTML = channelData.title   // Big heading with channel name

  // The description element is optional in our HTML, so we check it exists first
  const desc = document.querySelector('#channel-description')
  if (desc) desc.innerHTML = channelData.description?.html || ''

  // Show how many blocks are in the channel
  document.querySelector('#channel-count').innerHTML = channelData.counts.blocks

  // Update the Are.na link in the header to point to this channel
  const link = document.querySelector('#channel-link')
  if (link) link.href = `https://www.are.na/channel/${channelSlug}`
}


// ── renderBlock(blockData) ────────────────────────────────────────────────────
// Our big function for specific-block-type rendering.
// Called once per block. Receives a single block's data object and creates
// the correct HTML element for it, then appends it to the grid.


let renderBlock = (blockData) => {

  // The shared <ul> where all blocks get inserted
  const channelBlocks = document.querySelector('#channel-blocks')

  // --- makeClickable(el, data) ---
  // A small helper function we call on every block after building it.
  // It adds click and keyboard support so clicking any block opens the modal.
  const makeClickable = (el, data) => {
    el.style.cursor = 'pointer'            // Show a hand cursor on hover

    // role="button" tells screen readers this element is interactive like a button,
    // even though it's a <li>. tabindex="0" makes it focusable via the Tab key.
    el.setAttribute('role', 'button')
    el.setAttribute('tabindex', '0')

    // Open the modal when clicked with a mouse
    el.addEventListener('click', () => openModal(data))

    // Also open the modal when activated with a keyboard (Enter or Space),
    // so keyboard-only users get the same experience as mouse users
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openModal(data)
    })
  }

  // ── Link blocks ──
  // A block that links to an external website. Are.na saves a thumbnail image for it.
  if (blockData.type === 'Link') {
    const li = document.createElement('li')
    li.setAttribute('data-type', 'Image')

    // <picture> with multiple <source> elements lets the browser pick the best
    // image size for the current screen width — saves bandwidth on mobile.
    // More on template literals:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
    li.innerHTML = `
      <figure>
        <picture>
          <source media="(max-width: 500px)"  srcset="${blockData.image?.small?.src_2x || ''}">
          <source media="(max-width: 1000px)" srcset="${blockData.image?.medium?.src_2x || ''}">
          <img alt="${blockData.image?.alt_text || ''}" src="${blockData.image?.large?.src_2x || blockData.image?.medium?.src_2x || ''}">
        </picture>
        <figcaption>
          <h3>${blockData.title || 'Untitled'}</h3>
        </figcaption>
      </figure>
    `
    makeClickable(li, blockData)       // Attach click → modal
    channelBlocks.appendChild(li)      // Add to the grid

  // ── Image blocks ──
  // A directly uploaded image file.
  } else if (blockData.type === 'Image') {
    const li = document.createElement('li')
    li.className = 'img-block'
    li.setAttribute('data-type', 'Image')
    li.innerHTML = `<img src="${blockData.image?.src || ''}" alt="${blockData.image?.alt_text || ''}">`
    makeClickable(li, blockData)
    channelBlocks.appendChild(li)

  // ── Text blocks ──
  // A plain text note added directly on Are.na.
  } else if (blockData.type === 'Text') {
    const li = document.createElement('li')
    li.className = 'text-block'
    li.setAttribute('data-type', 'Text')
    // .plain gives us the text without any HTML formatting
    li.innerHTML = `<div class="text-content"><p>${blockData.content?.plain || ''}</p></div>`
    makeClickable(li, blockData)
    channelBlocks.appendChild(li)

  // ── Attachment blocks ──
  // Uploaded (not linked) media — video, audio, or PDF files.
  } else if (blockData.type === 'Attachment') {
    const ct = blockData.attachment?.content_type || '' // MIME type string, e.g. "video/mp4"
    const li = document.createElement('li')
    li.setAttribute('data-type', ct.includes('audio') ? 'audio' : 'Attachment')

    // More on `video`, like the `autoplay` attribute:
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
    if (ct.includes('video')) {
      li.innerHTML = `<video controls src="${blockData.attachment.url}"></video>`

    } else if (ct.includes('pdf')) {
      li.className = 'pdf-block'
      li.innerHTML = `<iframe src="${blockData.attachment.url}" width="100%" height="500px"></iframe>`

    // More on `audio`:
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
    } else if (ct.includes('audio')) {
      li.innerHTML = `<audio controls src="${blockData.attachment.url}"></audio>`
    }

    const attachType = ct.includes('audio') ? 'audio' : 'Attachment'
    makeClickable(li, blockData)
    channelBlocks.appendChild(li)

  // ── Embed blocks ──
  // Linked (embedded) media — YouTube videos, SoundCloud tracks, etc.
  // Are.na provides ready-made <iframe> HTML we can drop straight in.
  // More on `iframe`:
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
  } else if (blockData.type === 'Embed') {
    const li = document.createElement('li')
    li.className = 'embed-block'
    li.setAttribute('data-type', 'Attachment')
    if (blockData.embed?.html) {
      li.innerHTML = `<div class="embed-wrapper">${blockData.embed.html}</div>`
    }
    makeClickable(li, blockData)
    channelBlocks.appendChild(li)
  }
}


// ── renderUser(userData) ──────────────────────────────────────────────────────
// A function to display the owner/collaborator info in the footer.
// Called once for the channel owner and once for your own profile.
let renderUser = (userData) => {
  const channelUsers = document.querySelector('#channel-users') // The footer container

  // <address> is the semantic HTML element for contact/author info
  const address = document.createElement('address')

  // Link to their Are.na profile — falls back through full_name → username → hardcoded name
  address.innerHTML = `<p><a href="https://are.na/${userData.slug}">${userData.full_name || userData.username || 'Zarah Yaqub'}</a></p>`

  channelUsers.appendChild(address)
}


// ── fetchJson(url, callback, pageResponses) ───────────────────────────────────
// A helper function to fetch JSON from the Are.na API, then run a callback with it.
// Are.na paginates results (sends them in chunks), so this function keeps fetching
// more pages until it has everything, then combines them and calls the callback once.
// More on `fetch`:
// https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch
let fetchJson = (url, callback, pageResponses = []) => {
  fetch(url, { cache: 'no-store' }) // cache: 'no-store' means always get fresh data, never use browser cache
    .then((response) => response.json()) // Parse the raw HTTP response as JSON
    .then((json) => {

      // Add this page's results to our running list
      pageResponses.push(json)

      // Are.na response includes this "there are more!" flag (a boolean):
      if (json.meta && json.meta.has_more_pages) { // If that exists and is `true`, keep going…
        // Fetch *another* page worth, passing along our previous/accumulated responses.
        // We increment the page number by counting how many pages we've already fetched.
        fetchJson(`${url}&page=${pageResponses.length + 1}`, callback, pageResponses)

      } else { // If it is `false`, there are no more pages…
        // "Flattens" them all together as if they were one page response.
        // .flatMap() merges all the nested .data arrays into a single flat array.
        json.data = pageResponses.flatMap((page) => page.data)

        // Return the data to the callback!
        callback(json)
      }
    })
}


// ── API calls ─────────────────────────────────────────────────────────────────
// Now that we have said all the things we *can* do, go get the channel data.

// 1. Fetch the channel's info (title, description, block count, owner)
fetchJson(`https://api.are.na/v3/channels/${channelSlug}`, (json) => {
  console.log(json) // Always good to check your response!

  placeChannelInfo(json)    // Fill in the page title, count, etc.
  renderUser(json.owner)    // Add the channel owner to the footer. json.owner is a nested object inside the channel response.
})

// 2. Fetch your own profile info separately so it also shows in the footer.
// Get your info to put with the owner's:
fetchJson(`https://api.are.na/v3/users/${myUsername}/`, (json) => {
  console.log(json) // See what we get back.

  renderUser(json) // Pass this to the same function, no nesting.
})

// 3. Fetch all the blocks (content) inside the channel.
// per=100 asks for 100 results per page (the max).
// sort=position_desc returns them in the order they appear on the Are.na channel.
// And the data for the blocks:
fetchJson(`https://api.are.na/v3/channels/${channelSlug}/contents?per=100&sort=position_desc`, (json) => {
  console.log(json) // See what we get back.

  // Loop through the nested `.data` array (list).
  // .forEach() calls renderBlock once for each block in the array.
  json.data.forEach((blockData) => {
    // console.log(blockData) // The data for a single block.
    renderBlock(blockData) // Pass the single block's data to the render function.
  })
})


// ── Filtering system ──────────────────────────────────────────────────────────
// Each nav button has a data-filter attribute matching the block's data-type value.
// "all" shows everything. Other values show only blocks whose data-type matches.

var nav = document.getElementById("navigation");

// Set "All" as the default active button on load
var defaultBtn = nav.querySelector('[data-filter="all"]')
if (defaultBtn) defaultBtn.classList.add('active')

nav.addEventListener("click", function (e) {
  // Only react if a button was clicked (not the nav itself)
  if (e.target.tagName !== 'BUTTON') return;

  // Read the data-filter value from the clicked button, e.g. "all", "Image", "Text"
  var filter = e.target.getAttribute("data-filter");

  // Toggle active class so the selected button looks highlighted
  nav.querySelectorAll("button").forEach(function (btn) {
    btn.classList.remove("active");
  });
  e.target.classList.add("active");

  // Loop through every block and show/hide based on filter
  var items = document.querySelectorAll("#channel-blocks > li");
  for (var i = 0; i < items.length; i++) {
    var li = items[i];
    var type = li.getAttribute("data-type");

    if (filter === "all" || filter === type) {
      li.style.display = "";   // show
    } else {
      li.style.display = "none"; // hide
    }
  }
});