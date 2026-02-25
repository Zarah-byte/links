// ALl LLM Attibutions to Chat-GPT

// STEP 1 — CONFIG
// Here I’m setting the key “settings” for the project in one place.
// `channelSlug` is the exact Are.na channel I want the site to pull content from (my Glassware channel).
// `myUsername` is my Are.na username, which I use for attribution / links back to my profile.
// I’m using `const` because these values should stay fixed and not change while the site runs.
const channelSlug = 'glassware-rxfrlfenjcu'
const myUsername = 'zarah-yaqub'

// FILTERING STATE
// This section is basically the “brain” of my filter system.
// I’m setting a default view (images) so the page loads with the image content showing first,
// and then I track whatever filter the user clicks after that.

// Default filter = images (so “Look” / images is the starting state on load)
const DEFAULT_FILTER = 'image'

// This is the filter that’s currently active.
// I’m using `let` because this value needs to update every time the user switches categories.
let currentFilter = DEFAULT_FILTER


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOBILE-ONLY "HOVER" HIGHLIGHT (IntersectionObserver) this was suggest and explained to be by Riya, i go more into detail below
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Desktop already has real :hover styles.
// On mobile there is no hover, so we add/remove a `.highlight` class as cards
// scroll into the “active zone” in the viewport.
//
// We ONLY enable this behavior on mobile.

let cardObserver = null
const mqMobileHighlight = window.matchMedia('(max-width: 768px)')

// Decide if we should run the observer (mobile screens / touch devices)
function isMobileHighlightMode() {
	return (
		mqMobileHighlight.matches ||
		window.matchMedia('(hover: none) and (pointer: coarse)').matches
	)
}

// Build ONE observer that can watch all cards (more reliable + faster than 1 observer per card)
function buildCardObserver() {
	return new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				entry.target.classList.toggle('highlight', entry.isIntersecting)
			})
		},
		{
			root: null,                    // viewport
			rootMargin: '-35% 0px -35% 0px', // center “active zone” (mobile-friendly)
			threshold: 0
		}
	)
}

// Re-connect observer to only the cards that are currently visible (not display:none)
function refreshObserverTargets() {
	if (!cardObserver) return

	cardObserver.disconnect()

	document.querySelectorAll('#channel-blocks > li').forEach((li) => {
		if (li.style.display !== 'none') cardObserver.observe(li)
	})
}

// Turn ON highlight behavior (mobile only)
function enableMobileHighlights() {
	if (cardObserver) return
	cardObserver = buildCardObserver()
	refreshObserverTargets()
}

// Turn OFF highlight behavior (desktop + cleanup)
function disableMobileHighlights() {
	if (!cardObserver) return
	cardObserver.disconnect()
	cardObserver = null

	// Remove leftover highlights so desktop never looks “stuck”
	document.querySelectorAll('#channel-blocks > li.highlight').forEach((li) => {
		li.classList.remove('highlight')
	})
}

// Keep highlight mode correct when the user resizes or rotates the device
function syncHighlightMode() {
	if (isMobileHighlightMode()) enableMobileHighlights()
	else disableMobileHighlights()
}

// Update highlight mode on resize/orientation changes
mqMobileHighlight.addEventListener?.('change', syncHighlightMode)
window.addEventListener('resize', syncHighlightMode)
window.addEventListener('orientationchange', syncHighlightMode)


// This function applies the filter by showing/hiding cards in the grid.
// If no filter is passed in, it just uses whatever the current filter already is.
function applyFilter(filter = currentFilter) {

	// Update the global filter state.
	// If something weird/empty gets passed in, I fall back to "all".
	// I also force lowercase so the comparison is consistent.
	currentFilter = (filter || 'all').toLowerCase()

	// Grab every card (<li>) inside #channel-blocks and loop through them one by one.
	document.querySelectorAll('#channel-blocks > li').forEach((li) => {

		// Each card has a `data-type` attribute (like image / video / text).
		// I read that value so I know what category the card belongs to.
		const type = (li.dataset.type || '').toLowerCase()

		// Decide if this card should be visible:
		// - show everything if the filter is "all"
		// - otherwise only show cards whose type matches the selected filter
		const show = currentFilter === 'all' || currentFilter === type

		// Actually show/hide the card by toggling its display style.
		// '' means “use the default CSS” (visible), and 'none' means hidden.
		li.style.display = show ? '' : 'none'

		// If a card gets hidden, remove highlight so it doesn't “stick” when you switch filters
		if (!show) li.classList.remove('highlight')
	})

	// If mobile highlights are enabled, re-sync the observer to the visible cards
	refreshObserverTargets()
}
// STEP 2 — BUILD THE MODAL <dialog>
// This is where I build the modal once, up front, using the native HTML <dialog> element.
// Instead of having a bunch of modal HTML sitting in my index.html, I generate it in JavaScript,
// so it’s always consistent and easy to update in one place.

// Create a brand new <dialog> element (this is the actual modal container)
const dialog = document.createElement('dialog')

// Give it an ID so I can target it in CSS (for styling + layout)
dialog.id = 'dialog'

// Inject the entire modal structure as HTML using a template string.
// This layout includes:
// - a close button (with an X icon)
// - a meta panel (title + description)
// - action links (source link + Are.na link)
// - an empty media container where I’ll dynamically insert the image/video/etc. later
dialog.innerHTML = `
	<button class="dialog-close">
		<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
			<path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
		</svg>
	</button>
	<div class="dialog-meta">
		<div class="dialog-card-header">
			<h3 class="dialog-title"></h3>
		</div>
		<p class="dialog-description"></p>
		<section class="dialog-actions">
			<a class="dialog-source" target="_blank" rel="noopener noreferrer">See original ↗&#xFE0E;</a>
			<a class="dialog-arena-link" target="_blank" rel="noopener noreferrer">See on Are.na ↗&#xFE0E;</a>
		</section>
	</div>
	<div class="dialog-media"></div>
`

// Finally, I attach the dialog to the <body> so it actually exists on the page
// and can be opened/closed later when a user clicks a card.
document.body.appendChild(dialog)

// STEP 3 — CACHED REFERENCES TO DIALOG PARTS
// After building the modal, I “cache” (save) the important elements inside it.
// This means I don’t have to keep re-running `querySelector` every time the modal opens,
// and I can update the title / description / links / media quickly and cleanly.

// Where the main media (image / video / etc.) gets injected
const dialogMedia = dialog.querySelector('.dialog-media')

// The close button (X) so I can attach click + keyboard behavior
const dialogClose = dialog.querySelector('.dialog-close')

// The text/info panel in the modal (title, description, links)
const dialogMeta = dialog.querySelector('.dialog-meta')

// The title element that I fill in dynamically per block
const dialogTitle = dialog.querySelector('.dialog-title')

// The description text that I fill in dynamically per block
const dialogDescription = dialog.querySelector('.dialog-description')

// Link to the original source (if the Are.na block has a source URL)
const dialogSource = dialog.querySelector('.dialog-source')

// Link back to the block on Are.na (so users can view it in context)
const dialogArenaLink = dialog.querySelector('.dialog-arena-link')
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 4 — HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// This whole section is my “toolkit” for the project.
// Everything here is used later by the grid + modal logic so I don’t repeat myself.

//escapeHtml(s)
// I use this when I’m about to inject text into HTML (ex: inside `innerHTML`).
// It replaces risky characters so the browser treats them as text, not as real HTML.
function escapeHtml(s) {
	// `String(s)` makes sure whatever comes in (null/number/etc.) becomes a string safely
	return String(s)
		// Replace & first (because if you replace < first, you could create new & sequences)
		.replace(/&/g, '&amp;')   // turns "&" into "&amp;"
		.replace(/</g, '&lt;')    // turns "<" into "&lt;"
		.replace(/"/g, '&quot;')  // turns `"` into "&quot;"
}

// getBestSourceUrl(blockData)
// Are.na blocks can store the “original URL” in different places depending on block type.
// This helper checks the likely spots in priority order and returns the first real URL it finds.
function getBestSourceUrl(blockData) {
	return (
		// For Link blocks, Are.na often stores the original link here:
		blockData?.source?.url ||

		// For file uploads (Attachments), the direct file URL lives here:
		blockData?.attachment?.url ||

		// For Image blocks, the highest-quality original can be here:
		blockData?.image?.original?.url ||

		// Sometimes images come with `src` instead of `url`:
		blockData?.image?.src ||

		// If none of those exist, return an empty string so the caller can handle “no source”
		''
	)
}

// getPdfOrVideoThumb(blockData)
// This is for getting a *static preview image* to show in the grid for non-image media.
// It checks common preview image sizes Are.na provides (large/display/thumb).
function getPdfOrVideoThumb(blockData) {
	return (
		// Highest-quality “large” image if available:
		blockData?.image?.large?.url ||
		blockData?.image?.large?.src_2x ||
		blockData?.image?.large?.src ||

		// “display” size preview:
		blockData?.image?.display?.url ||
		blockData?.image?.display?.src ||

		// Smallest fallback thumbnail:
		blockData?.image?.thumb?.url ||
		blockData?.image?.thumb?.src ||

		// If no preview image exists, return empty string
		''
	)
}

// makeMetaRow(label, valueHTML)
// This builds one clean “row” of metadata inside the modal (like Added By / Added Date / Source).
// It returns a string of HTML that I append into the `.dialog-extra-meta` container.
function makeMetaRow(label, valueHTML) {
	return `
		<div class="dialog-meta-row">
			<!-- Left label text like "Added By" -->
			<span class="dialog-section-label">${label}</span>

			<!-- Middle dotted/line leader for styling -->
			<span class="dialog-meta-leader"></span>

			<!-- Right value (can contain HTML like links) -->
			<span class="dialog-meta-value">${valueHTML}</span>
		</div>
	`
}

// buildModalMedia(blockData)
// This decides what media element should go inside the modal based on Are.na block type.
// Returns:
// - `frame` → a DIV containing the media element (img/video/embed/etc.)
// - `modalKind` → a label like "image", "video", "embed" so CSS can style by type
function buildModalMedia(blockData) {
	// Create a wrapper div to hold whatever media we generate
	const frame = document.createElement('div')

	// This class is referenced by my CSS to size/crop the modal media consistently
	frame.className = 'media-frame'

	// Default label (used if we can’t categorize it)
	let modalKind = 'other'

	// ── CASE 1: Image blocks or Link blocks
	// Link blocks can still have a preview image provided by Are.na
	if (blockData.type === 'Image' || blockData.type === 'Link') {
		// This becomes "image" or "link" and is later set on dialog.dataset.modalKind
		modalKind = blockData.type.toLowerCase()

		// Create the actual <img> element
		const img = document.createElement('img')

		// `media-fill` is referenced in CSS to make the media fill the frame nicely
		img.className = 'media-fill'

		// Pick the best image URL based on whether it’s a real Image vs a Link preview image
		img.src = blockData.type === 'Image'
			// Image blocks: prefer high-res large src_2x, fallback to image.src
			? (blockData.image?.large?.src_2x || blockData.image?.src || '')
			// Link blocks: prefer preview images (large src_2x then medium src_2x)
			: (blockData.image?.large?.src_2x || blockData.image?.medium?.src_2x || '')

		// Alt text for accessibility (if Are.na provided it)
		img.alt = blockData.image?.alt_text || ''

		// Lazy-load so images load only when needed
		img.loading = 'lazy'

		// Put the image inside the wrapper
		frame.appendChild(img)

		// ── CASE 2: Embed blocks (ex: YouTube / Vimeo / other iframe embeds)
	} else if (blockData.type === 'Embed' && blockData.embed?.html) {
		// Label for CSS
		modalKind = 'embed'

		// Extra wrapper class used by CSS (usually for iframe scaling)
		frame.classList.add('embed-wrapper')

		// Inject Are.na-provided embed HTML (usually an iframe)
		frame.innerHTML = blockData.embed.html

		// Normalize any iframe/video inside the embed so CSS controls the size, not hardcoded attributes
		frame.querySelectorAll('iframe, video').forEach((el) => {
			// `media-fill` is referenced by CSS to fill/crop in the modal
			el.classList.add('media-fill')

			// Remove fixed dimensions so the iframe/video can be responsive
			el.removeAttribute('width')
			el.removeAttribute('height')
		})

		// ── CASE 3: Attachment blocks (file uploads hosted by Are.na)
	} else if (blockData.type === 'Attachment') {
		// Are.na stores the file’s MIME type here (ex: "video/mp4", "application/pdf")
		const ct = blockData.attachment?.content_type || ''

		// CASE 3A: Video attachments
		if (ct.includes('video') && blockData.attachment?.url) {
			modalKind = 'video'

			// Create native HTML <video> element (so users can play it)
			const video = document.createElement('video')

			// CSS hook to fill the frame
			video.className = 'media-fill'

			// Show the player controls (play/pause/volume)
			video.controls = true

			// Load basic metadata early (duration + dimensions) so layout is smoother
			video.preload = 'metadata'

			// Keeps iPhones from forcing fullscreen playback
			video.playsInline = true

			// Direct video file URL from Are.na (attachment.url)
			video.src = blockData.attachment.url

			// Add video into the wrapper
			frame.appendChild(video)

			// CASE 3B: Non-video attachments → placeholder message
		} else {
			modalKind = 'attachment'

			// Create a message element
			const msg = document.createElement('div')

			// CSS hook for placeholder styling
			msg.className = 'media-placeholder'

			// Visible text message
			msg.textContent = 'No preview available for this file.'

			// Add placeholder into the wrapper
			frame.appendChild(msg)
		}
	}

	// FINAL SAFETY: If none of the above created any media, show a generic fallback message
	if (!frame.childNodes.length) {
		const msg = document.createElement('div')
		msg.className = 'media-placeholder'
		msg.textContent = 'No preview available.'
		frame.appendChild(msg)
	}

	// Return both the element + label so `openModal()` can use them
	return { frame, modalKind }
}

//  openModal(blockData)
// This is the “full workflow” when a user clicks a card.
// It resets old content, fills in new title/description/links, injects media, builds meta rows,
// then opens the native <dialog>.
function openModal(blockData) {
	// Clear media area from the previous block
	dialogMedia.innerHTML = ''

	// Reset title text
	dialogTitle.textContent = ''

	// Reset description content
	dialogDescription.innerHTML = ''

	// Remove previous modal kind label (used by CSS)
	delete dialog.dataset.modalKind

	// Hide source link until we confirm we actually have a valid URL
	dialogSource.hidden = true
	dialogSource.href = ''

	// Always set the Are.na link using the block’s ID (Are.na uses /block/:id)
	dialogArenaLink.href = `https://www.are.na/block/${blockData.id}`

	// Remove extra meta rows from the last modal open (if they exist)
	dialog.querySelector('.dialog-extra-meta')?.remove()

	// Set title — fallback so the modal never shows blank
	dialogTitle.textContent = blockData.title || 'Untitled'

	// If Are.na provides a formatted HTML description, inject it here
	if (blockData.description?.html) {
		dialogDescription.innerHTML = blockData.description.html
	}

	// Find the best possible original/source URL for this block
	const sourceUrl = getBestSourceUrl(blockData)

	// If we found a real source URL, show the “See original” link
	if (sourceUrl) {
		dialogSource.href = sourceUrl
		dialogSource.hidden = false
	}

	// Build the correct media frame (image/video/embed/placeholder)
	const { frame, modalKind } = buildModalMedia(blockData)

	// Store modal kind on the dialog for CSS styling like:
	// dialog[data-modal-kind="video"] { ... }
	dialog.dataset.modalKind = modalKind

	// Inject the media into the modal
	dialogMedia.appendChild(frame)

	// Build a container for extra metadata rows (type, added by, date, source)
	const metaDiv = document.createElement('div')
	metaDiv.className = 'dialog-extra-meta'

	// Show Media Type (uses Are.na blockData.class or blockData.type)
	if (blockData.class || blockData.type) {
		metaDiv.innerHTML += makeMetaRow(
			'Media Type',
			escapeHtml(blockData.class || blockData.type)
		)
	}

	// Show who added it (Are.na user object: full_name / username / slug)
	if (blockData.user?.full_name || blockData.user?.username) {
		const name = blockData.user.full_name || blockData.user.username
		const slug = blockData.user.slug || blockData.user.username

		metaDiv.innerHTML += makeMetaRow(
			'Added By',
			`<a href="https://www.are.na/${escapeHtml(slug)}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`
		)
	}

	// Show date added (Are.na created_at timestamp)
	if (blockData.created_at) {
		const date = new Date(blockData.created_at).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})

		metaDiv.innerHTML += makeMetaRow('Added', escapeHtml(date))
	}

	// Show a neat shortened Source link (if one exists)
	if (sourceUrl) {
		const display = escapeHtml(
			// strip protocol for cleaner display (https://)
			sourceUrl.replace(/^https?:\/\//, '').slice(0, 40) +
			// if it’s long, add an ellipsis
			(sourceUrl.length > 45 ? '…' : '')
		)

		metaDiv.innerHTML += makeMetaRow(
			'Source',
			`<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${display}</a>`
		)
	}

	// Insert the meta block right under the title header area in the modal layout
	dialogTitle.closest('.dialog-card-header').insertAdjacentElement('afterend', metaDiv)

	// Reset scroll position so the modal always opens at the top
	dialog.scrollTop = 0

	// Add a class to <body> so CSS can lock background scrolling (and style overlays if needed)
	document.body.classList.add('modal-open')

	// Open the native dialog modal
	dialog.showModal()
}

//  makeClickable(el, blockData)
// This turns a grid card into something that behaves like a button:
// - mouse click opens modal
// - keyboard Enter/Space opens modal
// - it stays accessible (tab focus + role)
function makeClickable(el, blockData) {
	// CSS hook (usually used for cursor: pointer + hover states)
	el.classList.add('clickable')

	// Makes the <li> focusable with the keyboard (Tab key)
	el.tabIndex = 0

	// Helps screen readers understand this behaves like a button
	el.setAttribute('role', 'button')

	// Mouse click opens modal (unless they clicked an actual link/button inside the card)
	el.addEventListener('click', (e) => {
		// If the click was on an <a> or <button> inside the card, let that behave normally
		if (e.target.closest('a, button')) return

		// Otherwise open the modal for this block’s data
		openModal(blockData)
	})

	// Keyboard support: Enter or Space should open the modal when card is focused
	el.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			// Spacebar normally scrolls the page — prevent that
			e.preventDefault()

			// Open the modal for this block
			openModal(blockData)
		}
	})
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 5 — CLOSE HANDLERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Listen for a click on the 'X' button inside the dialog
dialogClose.addEventListener('click', () => {
	// Close the popup
	dialog.close()
	// Remove the scroll lock class from the main page body
	document.body.classList.remove('modal-open')
})

// Listen for a click anywhere directly on the dialog background element
dialog.addEventListener('click', (e) => {
	// If the target clicked was the backdrop (not the content inside it)...
	if (e.target === dialog) {
		// Close the popup
		dialog.close()
		// Remove the scroll lock class
		document.body.classList.remove('modal-open')
	}
})

// Listen for the 'close' event (like when the user presses the 'Escape' key on their keyboard)
dialog.addEventListener('close', () => {
	// Remove the scroll lock class
	document.body.classList.remove('modal-open')
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHANNEL + USER HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Define a function to put the main channel title and description onto the webpage
function placeChannelInfo(channelData) {
	// Find the element meant for the title
	const titleEl = document.querySelector('#channel-title')
	// If it exists, update its text with Are.na's channel title data
	if (titleEl) titleEl.textContent = channelData.title || ''

	// Find the element meant for the description
	const descEl = document.querySelector('#channel-description')
	// If it exists, inject Are.na's HTML description
	if (descEl) descEl.innerHTML = channelData.description?.html || ''
}

// Define a function to list the channel owner/user info
function renderUser(userData) {
	// Find the container for user info
	const channelUsers = document.querySelector('#channel-users')
	// Stop running if the container isn't on the page
	if (!channelUsers) return

	// Create an HTML <address> tag
	const address = document.createElement('address')
	// Choose the best available name (full name, then username, then a hardcoded default)
	const name = userData.full_name || userData.username || 'Zarah Yaqub'
	// Build a link to their profile
	address.innerHTML = `<p><a href="https://www.are.na/${userData.slug}">${name}</a></p>`
	// Inject the link into the container
	channelUsers.appendChild(address)
}

// Define a function to ask Are.na's servers for data. It handles 'pagination' (fetching page 1, then page 2, etc.)
function fetchJson(url, callback, pages = []) {
	// Use the built-in 'fetch' tool to request the URL, telling it not to use cached (old) data
	fetch(url, { cache: 'no-store' })
		// When the server responds, convert the raw response text into a usable JavaScript object (JSON)
		.then((res) => res.json())
		// When the conversion is done, take that JSON data...
		.then((json) => {
			// Add this page's data to our running list of pages
			pages.push(json)

			// If Are.na tells us there are more pages left to grab...
			if (json.meta?.has_more_pages) {
				// Run this exact same function again, but ask for the next page number
				fetchJson(`${url}&page=${pages.length + 1}`, callback, pages)
			} else {
				// If there are no more pages, combine all the data from all the pages into one giant list
				json.data = pages.flatMap((p) => p.data || [])

				// Finally, send that giant list to whatever 'callback' function asked for it
				callback(json)
			}
		})
		// If the network request fails entirely (e.g., no internet), print an error to the hidden developer console
		.catch((err) => console.error('Are.na fetch failed:', url, err))
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// renderBlock — GRID CARD BUILDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Define the main function that creates HTML cards for the grid based on block data
function renderBlock(blockData) {
	// Find the HTML list container where we will insert these cards
	const channelBlocks = document.querySelector('#channel-blocks')
	// Stop if the container doesn't exist
	if (!channelBlocks) return

	// Create a brand new list item (<li>) for this block
	const li = document.createElement('li')

	// Create a reusable mini-function specifically to finish assembling the card and putting it on the screen
	const append = () => {
		// Add our click/keyboard listeners using the helper we made earlier
		makeClickable(li, blockData)
		// Add the fully prepped card into the main grid container
		channelBlocks.appendChild(li)
	}

	// ── IF the block is a Link type... ─────────────────────────────────────────
	if (blockData.type === 'Link') {
		// Add a specific class for styling
		li.className = 'link-block'
		// Tag it so our filtering system knows it belongs to the 'links' category
		li.dataset.type = 'links'
		// Build the inside HTML, using <picture> to let the browser pick the right size image for the screen
		li.innerHTML = `
			<figure>
				<picture>
					<source media="(max-width: 500px)"  srcset="${blockData.image?.small?.src_2x || ''}">
					<source media="(max-width: 1000px)" srcset="${blockData.image?.medium?.src_2x || ''}">
					<img class="media-fill" alt="${blockData.image?.alt_text || ''}" src="${blockData.image?.large?.src_2x || blockData.image?.medium?.src_2x || ''}">
				</picture>
			</figure>
		`
		// Fire the mini-function to insert it into the page, basically “Okay, this Link card is built — now run append() to actually put it on the page.”
		append()
		// Stop running the rest of the function (since it's already complete)
		return
	}

	// ── IF the block is an Image type... ───────────────────────────────────────
	if (blockData.type === 'Image') {
		li.className = 'img-block'
		// Tag it for the 'image' filter
		li.dataset.type = 'image'
		// Build a simple wrapper with a lazy-loading (when a website waits to load something until it’s actually needed, instead of loading everything up front) image
		li.innerHTML = `
			<div class="media-frame">
				<img class="media-fill" src="${blockData.image?.large?.src_2x || blockData.image?.src || ''}" alt="${blockData.image?.alt_text || ''}" loading="lazy">
			</div>
		`
		append()
		return
	}

	// ── IF the block is a Text type... ─────────────────────────────────────────
	if (blockData.type === 'Text') {
		li.className = 'text-block'
		// Tag it for the 'text' filter
		li.dataset.type = 'text'
		// Grab the raw text from Are.na
		const text = blockData.content?.plain || ''
		// Create the HTML structure
		li.innerHTML = '<div class="text-content"><p></p></div>'
		// Use textContent (not innerHTML) to safely insert the text, preventing bugs if the user typed HTML tags
		li.querySelector('p').textContent = text
		append()
		return
	}

	// ── IF the block is an Attachment (video, pdf, audio, etc.)... ───────────
	if (blockData.type === 'Attachment') {
		// Grab the file type details
		const ct = blockData.attachment?.content_type || ''
		// Add a base class
		li.classList.add('attachment-block')

		// If it's a video file...
		if (ct.includes('video') && blockData.attachment?.url) {
			// Add video specific class
			li.classList.add('video-block')
			// Tag it for the 'attachment' filter
			li.dataset.type = 'attachment'

			// Ask our helper function to find a static thumbnail picture for the video
			const thumb = getPdfOrVideoThumb(blockData)

			if (thumb) {
				// If a picture was found, display it. The CSS class 'video-preview' draws a play button on top.
				li.innerHTML = `
					<div class="media-frame video-preview">
						<img class="media-fill" src="${thumb}" alt="${escapeHtml(blockData.title || 'Video')}" loading="lazy">
					</div>
				`
			} else {
				// If no picture exists, draw a flat colored box that says "VIDEO"
				li.innerHTML = `
					<div class="media-type-tile video-tile">
						<span class="media-type-label">VIDEO</span>
						<span class="media-type-title">${escapeHtml(blockData.title || '')}</span>
					</div>
				`
			}
			append()
			return
		}

		// If it's a PDF file...
		if (ct.includes('pdf') && blockData.attachment?.url) {
			// Add pdf specific class
			li.classList.add('pdf-block')
			// Tag it so it shows up under 'text' filters
			li.dataset.type = 'text'

			// Ask helper for a thumbnail (first page of the PDF)
			const thumb = getPdfOrVideoThumb(blockData)

			if (thumb) {
				// Show the cover picture
				li.innerHTML = `
					<div class="media-frame pdf-preview">
						<img class="media-fill" src="${thumb}" alt="${escapeHtml(blockData.title || 'PDF')}" loading="lazy">
					</div>
				`
			} else {
				// Fallback tile box that says "PDF"
				li.innerHTML = `
					<div class="media-type-tile pdf-tile">
						<span class="media-type-label">PDF</span>
						<span class="media-type-title">${escapeHtml(blockData.title || '')}</span>
					</div>
				`
			}
			append()
			return
		}

		// If it's an Audio file...
		if (ct.includes('audio') && blockData.attachment?.url) {
			// Add audio specific class
			li.classList.add('audio-block')
			// Tag it for the 'audio' filter
			li.dataset.type = 'audio'
			// Get title or fallback text
			const title = blockData.title || 'Audio'
			// Draw the stylized audio box with a music note
			li.innerHTML = `
				<div class="audio-card">
					<div class="audio-icon">♪</div>
					<div class="audio-title">${escapeHtml(title)}</div>
					<div class="audio-sub">MP3</div>
				</div>
			`
			append()
			return
		}

		// If it's some other random file format we don't recognize...
		li.dataset.type = 'attachment'
		// Show a generic block with the file name
		li.innerHTML = `<div class="media-placeholder"><p>${escapeHtml(blockData.title || 'Attachment')}</p></div>`
		append()
		return
	}

	// ── IF the block is an Embed (YouTube, Vimeo, etc.)... ───────────────────
	if (blockData.type === 'Embed') {
		// Add classes
		li.className = 'embed-block attachment-block'
		// Tag for filter
		li.dataset.type = 'attachment'

		// Try to find a static image thumbnail representing the embed
		const thumb = getPdfOrVideoThumb(blockData)

		if (thumb) {
			// Show thumbnail with a play button (using the 'video-preview' class)
			li.innerHTML = `
				<div class="media-frame video-preview">
					<img class="media-fill" src="${thumb}" alt="${escapeHtml(blockData.title || 'Video')}" loading="lazy">
				</div>
			`
		} else {
			// If no image exists, inject the actual raw iframe Are.na gave us right into the grid
			const wrapper = document.createElement('div')
			wrapper.className = 'media-frame embed-wrapper'
			wrapper.innerHTML = blockData.embed?.html || ''

			// Clean up widths/heights so our CSS grid takes control
			wrapper.querySelectorAll('iframe, video').forEach((el) => {
				el.classList.add('media-fill')
				el.removeAttribute('width')
				el.removeAttribute('height')
			})

			li.appendChild(wrapper)
		}

		append()
		return
	}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 6 — FILTER UI WIRING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Find the whole navigation block on the page
const nav = document.getElementById('navigation')

// Only run the UI code if the navigation actually exists on the page
if (nav) {
	// Find all buttons inside nav that have a 'data-filter' attribute, and convert the result into a normal Array
	const buttons = Array.from(nav.querySelectorAll('button[data-filter]'))
	// Find the mobile dropdown container
	const customSelect = document.getElementById('filter-select')
	// Find the text label inside the mobile dropdown
	const selectedLabel = document.getElementById('filter-selected')
	// Find all the clickable list options inside the dropdown, turning them into an array
	const optionItems = Array.from(document.querySelectorAll('#filter-options li'))

	// Define the exact CSS class names we use to open things or select things
	const OPEN_CLASS = 'is-open'
	const SELECTED_CLASS = 'is-selected'

	// Function to highlight the active desktop button
	const setActive = (value) => {
		// Find the specific button that matches the clicked value
		const activeBtn = nav.querySelector(`button[data-filter="${value}"]`)
		// Loop through all buttons. If the button matches 'activeBtn', turn ON the 'active' class. Otherwise, turn it OFF.
		buttons.forEach((btn) => btn.classList.toggle('active', btn === activeBtn))
	}

	// Function to update text on the mobile dropdown
	const setDropdownLabel = (value) => {
		// Find the specific dropdown list item that matches the value
		const match = optionItems.find((li) => li.dataset.value === value)
		// If it exists, change the visible label text to match it
		if (selectedLabel) selectedLabel.textContent = match ? match.textContent : 'All'

		// Loop through all dropdown options to update the checkmark/highlight styling
		optionItems.forEach((li) => {
			li.classList.toggle(SELECTED_CLASS, li.dataset.value === value)
		})
	}

	// Master function to run everything when a filter changes
	const setFilter = (value) => {
		// Guarantee lowercase text
		const v = (value || 'all').toLowerCase()
		// Update the desktop buttons
		setActive(v)
		// Update the mobile dropdown UI
		setDropdownLabel(v)
		// Actually filter the grid elements
		applyFilter(v)
	}

	// Function to forcibly close the mobile dropdown menu
	const closeDropdown = () => {
		// Remove the CSS open class
		if (customSelect) customSelect.classList.remove(OPEN_CLASS)
	}

	// Function to toggle the mobile dropdown menu (open if closed, close if open)
	const toggleDropdown = () => {
		if (!customSelect) return
		customSelect.classList.toggle(OPEN_CLASS)
	}

	// When the page first loads, immediately run the master function using our default filter
	setFilter(DEFAULT_FILTER)

	// Find the block containing the desktop buttons
	const filterButtonRow = nav.querySelector('.filter-buttons')
	// Create a listener for screen size: true if the screen is under 768px wide (mobile size)
	const mqMobile = window.matchMedia('(max-width: 768px)')

	// Function that determines which UI to show based on screen size
	const syncNavMode = () => {
		// Check our window size watcher (true or false)
		const isMobile = mqMobile.matches
		// If mobile, hide the desktop button row
		if (filterButtonRow) filterButtonRow.hidden = isMobile
		// If mobile, show the dropdown (or vice versa if not mobile)
		if (customSelect) customSelect.hidden = !isMobile
	}

	// Run the sync function immediately on load
	syncNavMode()
	// Add an event listener to run syncNavMode whenever the user rotates their phone or resizes their browser window
	mqMobile.addEventListener?.('change', syncNavMode)
	window.addEventListener('resize', syncNavMode)


	// If the mobile dropdown label exists...
	if (selectedLabel) {
		// Allow keyboards to focus on it
		selectedLabel.tabIndex = 0

		// Wait for the user to click it
		selectedLabel.addEventListener('click', (e) => {
			// Prevent this click from bubbling up and triggering the 'close clicking outside' listener below
			e.stopPropagation()
			// Open/close the menu
			toggleDropdown()
		})

		// Wait for the user to press Enter or Space while focused on it
		selectedLabel.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				toggleDropdown()
			}
		})
	}

	// Look through every single dropdown option item...
	optionItems.forEach((li) => {
		// When one is clicked...
		li.addEventListener('click', (e) => {
			e.stopPropagation()
			// Figure out what filter string it contains, or fallback to default
			const filter = li.dataset.value || DEFAULT_FILTER
			// Trigger the master filter update
			setFilter(filter)
			// Hide the menu
			closeDropdown()
		})
	})

	// Listen for a click *anywhere* on the entire webpage
	document.addEventListener('click', (e) => {
		// If the mobile menu exists, AND the place they clicked was NOT inside the menu...
		if (customSelect && !customSelect.contains(e.target)) {
			// Close the menu
			closeDropdown()
		}
	})

	// Desktop listener: click anywhere on the navigation bar area
	nav.addEventListener('click', (e) => {
		// See if the click target (or its parent) was one of our data-filter buttons
		const btn = e.target.closest('button[data-filter]')
		// If they clicked empty space instead of a button, stop running here
		if (!btn) return
		// Otherwise, trigger the master filter using that button's custom data string
		setFilter(btn.dataset.filter)
	})
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 7 — API CALLS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Use our fetch tool to grab the general channel details (Title, Description, Owner)
fetchJson(`https://api.are.na/v3/channels/${channelSlug}`, (json) => {
	// Put the Title/Description on the page
	placeChannelInfo(json)
	// Put the Owner's link on the page
	renderUser(json.owner)
})

// Use our fetch tool to grab specific details about your personal user profile
fetchJson(`https://api.are.na/v3/users/${myUsername}/`, (json) => {
	// Put your user info on the page (usually for a footer credit)
	renderUser(json)
})

// Use our fetch tool to pull every single content block out of the channel, grabbing 100 per page, sorted newest first
fetchJson(`https://api.are.na/v3/channels/${channelSlug}/contents?per=100&sort=position_desc`, (json) => {
	// Take that giant array of data, and loop through it. Run our card builder (renderBlock) on every single piece.
	json.data.forEach(renderBlock)
	// Re-run the filter logic now that all the cards exist on the page to make sure the default hides the right ones
	applyFilter(currentFilter)
	// After cards exist, enable/disable the mobile-only highlight observer
	syncHighlightMode()
	// If we ARE in mobile mode, make sure the observer is watching the visible cards
	refreshObserverTargets()
})
