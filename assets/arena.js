// All LLM attributions to ChatGPT

// Config: the Are.na channel and the cover images.
const channelSlug = "glassware-rxfrlfenjcu";

// Covers stand in for media in the fan; the real thing shows on the big card.
const LINK_COVER = "assets/links-cover.svg";
const AUDIO_COVER = "assets/audio-cover.png";
const VIDEO_COVER = "assets/video-cover.svg"; // uploaded videos and YouTube/Vimeo embeds
const TEXT_COVER = "assets/text.svg"; // text blocks and PDFs

// Card view: the big, flippable card, built once as a native <dialog>.
// Front shows the media; Flip shows the back (name, number, ingredients, source, Are.na link).

// Lucide icons: repeat, x, arrows and ↗.
const ICON_FLIP =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>';
const ICON_EXIT =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const ICON_PREV =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>';
const ICON_NEXT =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
const ICON_ARROW =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';

const dialog = document.createElement("dialog");
dialog.id = "dialog";
dialog.setAttribute("aria-label", "Selected card");
dialog.innerHTML = `
	<div class="card-stage">
	<button class="pill-button btn-step btn-card-prev" type="button" aria-label="Previous card">${ICON_PREV}</button>
	<div class="flip-card">
		<div class="card-face card-front"></div>
		<div class="card-face card-back">
			<div class="card-back-header">
				<h2 class="card-name"></h2>
				<span class="card-number"></span>
			</div>
			<section class="card-ingredients">
				<h3>Ingredients</h3>
				<ul class="card-tags"></ul>
			</section>
			<section class="card-source">
				<h3>Source</h3>
				<p class="card-source-text"></p>
			</section>
			<a class="card-arena-link" target="_blank" rel="noopener noreferrer">See on Are.na ${ICON_ARROW}</a>
		</div>
	</div>
	<button class="pill-button btn-step btn-card-next" type="button" aria-label="Next card">${ICON_NEXT}</button>
	</div>
	<div class="card-actions">
		<button class="pill-button btn-flip" type="button">Flip ${ICON_FLIP}</button>
		<button class="pill-button btn-exit" type="button">Exit ${ICON_EXIT}</button>
	</div>
`;
document.body.appendChild(dialog);

// Card view parts, looked up once.
const cardFront = dialog.querySelector(".card-front");
const cardBack = dialog.querySelector(".card-back");
const cardName = dialog.querySelector(".card-name");
const cardNumber = dialog.querySelector(".card-number");
const cardTags = dialog.querySelector(".card-tags");
const cardSource = dialog.querySelector(".card-source");
const cardSourceText = dialog.querySelector(".card-source-text");
const cardArenaLink = dialog.querySelector(".card-arena-link");

// Makes text safe to put inside innerHTML (& first, so it isn't escaped twice).
function escapeHtml(s) {
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

// Best preview image Are.na made for a PDF or video, largest first.
function getPdfOrVideoThumb(blockData) {
	return (
		blockData?.image?.large?.url ||
		blockData?.image?.large?.src_2x ||
		blockData?.image?.large?.src ||
		blockData?.image?.display?.url ||
		blockData?.image?.display?.src ||
		blockData?.image?.thumb?.url ||
		blockData?.image?.thumb?.src ||
		""
	);
}

// Front of the big card: the real media for a block.
// modalKind "other"/"attachment" means there's nothing to show, so openModal copies the small card instead.
function buildModalMedia(blockData) {
	const frame = document.createElement("div");
	frame.className = "media-frame";
	let modalKind = "other";

	// Images, and links (which always use the links cover).
	if (blockData.type === "Image" || blockData.type === "Link") {
		modalKind = blockData.type.toLowerCase();
		const img = document.createElement("img");
		img.className = "media-fill";
		if (blockData.type === "Image") {
			img.src = blockData.image?.large?.src_2x || blockData.image?.src || "";
			img.alt = blockData.image?.alt_text || "";
		} else {
			img.src = LINK_COVER;
			img.alt = blockData.title || "Link";
		}
		img.loading = "lazy";
		frame.appendChild(img);

		// Embeds (YouTube, Vimeo…): drop their fixed size so CSS can fill the card.
	} else if (blockData.type === "Embed" && blockData.embed?.html) {
		modalKind = "embed";
		frame.classList.add("embed-wrapper");
		frame.innerHTML = blockData.embed.html;
		frame.querySelectorAll("iframe, video").forEach((el) => {
			el.classList.add("media-fill");
			el.removeAttribute("width");
			el.removeAttribute("height");
		});

		// Text: the words themselves (textContent, so typed HTML shows as plain text).
	} else if (blockData.type === "Text") {
		modalKind = "text";
		frame.classList.add("text-block");
		frame.innerHTML = '<div class="text-content"><p></p></div>';
		frame.querySelector("p").textContent = blockData.content?.plain || "";
	} else if (blockData.type === "Attachment") {
		const ct = blockData.attachment?.content_type || "";

		// PDFs: the first page, if Are.na made an image of it.
		if (ct.includes("pdf") && getPdfOrVideoThumb(blockData)) {
			modalKind = "pdf";
			const page = document.createElement("img");
			page.className = "media-fill";
			page.src = getPdfOrVideoThumb(blockData);
			page.alt = blockData.title || "PDF";
			frame.appendChild(page);

			// Videos: a native player (playsInline stops iPhones forcing fullscreen).
		} else if (ct.includes("video") && blockData.attachment?.url) {
			modalKind = "video";
			const video = document.createElement("video");
			video.className = "media-fill";
			video.controls = true;
			video.preload = "metadata";
			video.playsInline = true;
			video.src = blockData.attachment.url;
			frame.appendChild(video);
		} else {
			modalKind = "attachment";
			const msg = document.createElement("div");
			msg.className = "media-placeholder";
			msg.textContent = "No preview available for this file.";
			frame.appendChild(msg);
		}
	}

	// Nothing matched: say so rather than show an empty card.
	if (!frame.childNodes.length) {
		const msg = document.createElement("div");
		msg.className = "media-placeholder";
		msg.textContent = "No preview available.";
		frame.appendChild(msg);
	}

	return { frame, modalKind };
}

// Hashtags in a block's description (#coupe #gin) are its ingredients.
const TAG_PATTERN = /#[\p{L}\p{N}_-]+/gu;

// Names longer than this are cut off with … on the back of the card.
const NAME_MAX = 14;

// Media type for the first ingredient pill; attachments are named by file type.
function blockTypeLabel(blockData) {
	const ct = blockData.attachment?.content_type || "";
	if (ct.includes("video")) return "Video";
	if (ct.includes("pdf")) return "PDF";
	if (ct.includes("audio")) return "Audio";
	return blockData.type || "Unknown";
}

// Drops a leading "source:" / "Sourced from" / "from:" (the heading already says Source).
// A bare "from" needs a colon, so "From the 1950s…" is left alone.
const SOURCE_LABEL = /^\s*(?:sourced?(?:\s+(?:from|form))?\s*:?|from\s*:)\s*/i;
const URL_PATTERN = /https?:\/\/\S+/g;

// A link to the full URL that just reads "site.com".
function shortLink(url) {
	const link = document.createElement("a");
	link.href = url;
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	try {
		link.textContent = new URL(url).hostname.replace(/^www\./, "");
	} catch {
		link.textContent = url;
	}
	return link;
}

// Text with any pasted URLs swapped for short links.
function withShortLinks(text) {
	const parts = [];
	let last = 0;
	for (const match of text.matchAll(URL_PATTERN)) {
		parts.push(text.slice(last, match.index), shortLink(match[0]));
		last = match.index + match[0].length;
	}
	parts.push(text.slice(last));
	return parts;
}

// Turns the big card over; the hidden face is inert so Tab can't reach it.
function showSide(side) {
	const isBack = side === "back";
	dialog.classList.toggle("is-flipped", isBack);
	cardFront.inert = isBack;
	cardBack.inert = !isBack;
}

// The small card currently shown big, so the arrows know where they are.
let currentCard = null;

// Fills both faces of the big card, then opens it front-side up.
function openModal(blockData, cardEl) {
	currentCard = cardEl;

	// Front: the real media, or a copy of the small card (audio, a PDF with no page image).
	const { frame, modalKind } = buildModalMedia(blockData);
	if ((modalKind === "other" || modalKind === "attachment") && cardEl) {
		const copy = cardEl.cloneNode(true);
		copy.removeAttribute("tabindex");
		copy.removeAttribute("role");
		cardFront.replaceChildren(copy);
	} else {
		cardFront.replaceChildren(frame);
	}

	// Back: name (full name on hover) and the order it was added to the board.
	const name = blockData.title || "Untitled";
	cardName.textContent = name.length > NAME_MAX ? name.slice(0, NAME_MAX).trimEnd() + "…" : name;
	cardName.title = name;
	cardNumber.textContent = blockData.addedNumber ? `#${blockData.addedNumber}` : "";

	// Ingredients: the media type, then the description's hashtags.
	const description = blockData.description?.plain || "";
	const tags = description.match(TAG_PATTERN) || [];
	const pills = [blockTypeLabel(blockData).toUpperCase(), ...tags.map((tag) => tag.slice(1))];
	cardTags.replaceChildren(
		...pills.map((text) => {
			const li = document.createElement("li");
			li.textContent = text;
			return li;
		})
	);

	// Source: the description minus hashtags and label, or else a link to the original page.
	const about = description.replace(TAG_PATTERN, "").replace(SOURCE_LABEL, "").trim();
	const sourceUrl = blockData.source?.url;
	if (about) {
		cardSourceText.replaceChildren(...withShortLinks(about));
	} else if (sourceUrl) {
		cardSourceText.replaceChildren(shortLink(sourceUrl));
	}
	cardSource.hidden = !about && !sourceUrl;

	cardArenaLink.href = `https://www.are.na/block/${blockData.id}`;
	cardBack.scrollTop = 0;

	// Stepping with the arrows keeps whichever side you're on.
	if (!dialog.open) {
		showSide("front");
		dialog.showModal();
	}
}

// Shows the previous/next card, wrapping around the ends.
function step(direction) {
	if (!currentCard) return;
	const cards = [...currentCard.parentElement.children];
	const i = cards.indexOf(currentCard);
	cards[(i + direction + cards.length) % cards.length].click();
}

// Makes a card behave like a button: click, Enter or Space opens the big card.
function makeClickable(el, blockData) {
	el.tabIndex = 0;
	el.setAttribute("role", "button");

	el.addEventListener("click", (e) => {
		if (e.target.closest("a, button")) return;
		openModal(blockData, el);
	});

	el.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault(); // Space would scroll the page
			openModal(blockData, el);
		}
	});
}

// Card view buttons: flip, arrows and exit.
dialog.querySelector(".btn-flip").addEventListener("click", () => {
	showSide(dialog.classList.contains("is-flipped") ? "front" : "back");
});

dialog.querySelector(".btn-card-prev").addEventListener("click", () => step(-1));
dialog.querySelector(".btn-card-next").addEventListener("click", () => step(1));
dialog.addEventListener("keydown", (e) => {
	if (e.key === "ArrowLeft") step(-1);
	if (e.key === "ArrowRight") step(1);
});

// Exit, Escape (built into <dialog>) or a click outside the card all close it.
dialog.querySelector(".btn-exit").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
	if (e.target === dialog) dialog.close();
});

// Empty the front on close so a playing video stops.
dialog.addEventListener("close", () => cardFront.replaceChildren());

// Fetch helper: gets every page of an Are.na request, then hands back all the blocks at once.
function fetchJson(url, callback, pages = []) {
	fetch(url, { cache: "no-store" })
		.then((res) => res.json())
		.then((json) => {
			pages.push(json);
			if (json.meta?.has_more_pages) {
				fetchJson(`${url}&page=${pages.length + 1}`, callback, pages);
			} else {
				json.data = pages.flatMap((p) => p.data || []);
				callback(json);
			}
		})
		.catch((err) => console.error("Are.na fetch failed:", url, err));
}

// Card builder: turns one Are.na block into a card <li> in `list`.
function renderBlock(blockData, list) {
	if (!list) return;

	const li = document.createElement("li");
	li.dataset.id = blockData.id;

	const append = () => {
		makeClickable(li, blockData);
		list.appendChild(li);
	};

	// A card that's just a cover or image, filling the card.
	const cover = (src, alt, lazy = false) => {
		li.innerHTML = `
			<div class="media-frame">
				<img class="media-fill" src="${src}" alt="${escapeHtml(alt)}"${lazy ? ' loading="lazy"' : ""}>
			</div>
		`;
		append();
	};

	if (blockData.type === "Link") return cover(LINK_COVER, blockData.title || "Link");
	if (blockData.type === "Image")
		return cover(blockData.image?.large?.src_2x || blockData.image?.src || "", blockData.image?.alt_text || "", true);
	if (blockData.type === "Text") return cover(TEXT_COVER, blockData.title || "Text");
	if (blockData.type === "Embed") return cover(VIDEO_COVER, blockData.title || "Video");

	if (blockData.type === "Attachment") {
		const ct = blockData.attachment?.content_type || "";
		const hasFile = !!blockData.attachment?.url;
		if (ct.includes("video") && hasFile) return cover(VIDEO_COVER, blockData.title || "Video");
		if (ct.includes("pdf") && hasFile) return cover(TEXT_COVER, blockData.title || "PDF");
		if (ct.includes("audio") && hasFile) return cover(AUDIO_COVER, blockData.title || "Audio");

		// Any other file: just its name.
		li.innerHTML = `<div class="media-placeholder"><p>${escapeHtml(blockData.title || "Attachment")}</p></div>`;
		append();
	}
}

// Hero: the hand of five, the phone deck and See all.

// Mobile deck: on phones the five cards are a stack (see CSS).
// Drag the top card past SWIPE_MIN and it flies off to the back; a short drag snaps back; a tap opens it.
const mqDeck = window.matchMedia("(width <= 768px)");
const SWIPE_MIN = 80; // px
const FLY_MS = 250; // fly-off time before the card goes to the back

function setUpDeckSwipe(heroList) {
	let card = null; // the top card while it's dragged
	let startX = 0;
	let dx = 0;
	let dragged = false;

	heroList.addEventListener("pointerdown", (e) => {
		if (!mqDeck.matches || heroList.closest(".is-browsing")) return;
		const li = e.target.closest("li");
		if (!li || li !== heroList.firstElementChild) return; // only the top card moves
		card = li;
		startX = e.clientX;
		dx = 0;
		dragged = false;
		card.setPointerCapture(e.pointerId);
		card.style.transition = "none"; // follow the finger exactly
	});

	heroList.addEventListener("pointermove", (e) => {
		if (!card) return;
		dx = e.clientX - startX;
		if (Math.abs(dx) > 6) dragged = true;
		card.style.translate = `${dx}px 0`;
		card.style.rotate = `${dx / 20}deg`;
	});

	const release = () => {
		if (!card) return;
		const li = card;
		card = null;
		li.style.transition = "";

		if (Math.abs(dx) > SWIPE_MIN) {
			li.style.translate = `${Math.sign(dx) * 120}vw 0`;
			li.style.rotate = `${Math.sign(dx) * 20}deg`;
			setTimeout(() => {
				li.style.translate = "";
				li.style.rotate = "";
				heroList.append(li);
			}, FLY_MS);
		} else {
			li.style.translate = "";
			li.style.rotate = "";
		}
	};
	heroList.addEventListener("pointerup", release);
	heroList.addEventListener("pointercancel", release);

	// A swipe isn't a tap: swallow the click after a drag so the big card doesn't open.
	heroList.addEventListener(
		"click",
		(e) => {
			if (dragged) e.stopPropagation();
		},
		true
	);
}

setUpDeckSwipe(document.querySelector("#hero-cards"));

// How long the old hand gathers before Shuffle deals a new one (matches the CSS).
const GATHER_MS = 350;

// Block types renderBlock can draw; anything else would leave an empty slot.
const HERO_TYPES = ["Image", "Link", "Text", "Attachment", "Embed"];

// The hand in the fan; Back to hand returns to it.
let lastHand = [];

// Deals 5 random blocks into the fan, or re-deals a given hand.
function dealHeroCards(blocks, hand = null) {
	const heroList = document.querySelector("#hero-cards");
	if (!heroList) return;
	heroList.replaceChildren();

	if (!hand) {
		// Fisher–Yates on a copy, so the channel order isn't touched.
		const pool = blocks.filter((b) => HERO_TYPES.includes(b.type));
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pool[i], pool[j]] = [pool[j], pool[i]];
		}
		hand = pool.slice(0, 5);
	}

	lastHand = hand;
	hand.forEach((block) => renderBlock(block, heroList));
}

// See all: the fan straightens into a row of every card, #1 → last,
// with arrows (or ← →) and a counter.
const hero = document.querySelector(".hero");
const heroCards = document.querySelector("#hero-cards");
const seeAllLabel = document.querySelector(".btn-see-all-label");
const browseCount = document.querySelector(".browse-count");

// Every displayable block in the order it was added (set once the channel loads).
let browseList = [];

const isBrowsing = () => hero.classList.contains("is-browsing");

// Distance between cards in the row (they overlap, so measure it).
function rowStep() {
	const [first, second] = heroCards.children;
	return first && second ? second.offsetLeft - first.offsetLeft : 0;
}

function updateBrowseCount() {
	const i = Math.round(heroCards.scrollLeft / rowStep()) + 1;
	browseCount.textContent = `${Math.min(Math.max(i, 1), browseList.length)} / ${browseList.length}`;
}

// Runs a layout change as a view transition, so the cards in `ids` glide to their new spot.
// Instant when unsupported or the visitor prefers reduced motion.
let morphing = false; // blocks a second click mid-morph

function morph(ids, update) {
	morphing = true;
	const name = () =>
		heroCards.querySelectorAll("li").forEach((li) => {
			li.style.viewTransitionName = ids.includes(li.dataset.id) ? `card-${li.dataset.id}` : "";
		});
	const done = () => {
		heroCards.querySelectorAll("li").forEach((li) => {
			li.style.viewTransitionName = "";
		});
		heroCards.classList.remove("no-deal");
		morphing = false;
	};

	heroCards.classList.add("no-deal"); // the morph moves the cards, so no deal-in animation

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (!document.startViewTransition || reduceMotion) {
		update();
		done();
		return;
	}
	name();
	const transition = document.startViewTransition(() => {
		update();
		name();
	});
	transition.ready.catch(() => {}); // a skipped transition rejects; the layout still changes
	transition.finished.finally(done);
}

function enterBrowse() {
	const ids = lastHand.map((b) => String(b.id));
	// Start on the top of the phone deck, or the middle of the fan, so it straightens in place.
	const focusId = (mqDeck.matches ? heroCards.firstElementChild : heroCards.children[2])?.dataset.id;
	morph(ids, () => {
		hero.classList.add("is-browsing");
		heroCards.setAttribute("aria-label", "Every piece in the collection");
		heroCards.replaceChildren();
		browseList.forEach((block) => renderBlock(block, heroCards));

		const focus = heroCards.querySelector(`li[data-id="${focusId}"]`);
		heroCards.scrollLeft = focus ? [...heroCards.children].indexOf(focus) * rowStep() : 0;
		updateBrowseCount();
	});
	seeAllLabel.textContent = "Back to hand";
}

function exitBrowse() {
	morph(
		lastHand.map((b) => String(b.id)),
		() => {
			hero.classList.remove("is-browsing");
			heroCards.setAttribute("aria-label", "Five random pieces from the collection");
			heroCards.scrollLeft = 0;
			dealHeroCards(null, lastHand); // the same hand, not a new shuffle
		}
	);
	seeAllLabel.textContent = "See all";
}

document.querySelector(".btn-see-all").addEventListener("click", () => {
	if (!browseList.length || morphing) return; // still loading, or mid-morph
	isBrowsing() ? exitBrowse() : enterBrowse();
});

// Arrows, or ← → while the big card is closed, move one card.
const browseStep = (direction) => heroCards.scrollBy({ left: direction * rowStep(), behavior: "smooth" });
document.querySelector(".btn-prev").addEventListener("click", () => browseStep(-1));
document.querySelector(".btn-next").addEventListener("click", () => browseStep(1));
document.addEventListener("keydown", (e) => {
	if (!isBrowsing() || dialog.open) return;
	if (e.key === "ArrowLeft") browseStep(-1);
	if (e.key === "ArrowRight") browseStep(1);
});
heroCards.addEventListener("scroll", () => {
	if (isBrowsing()) updateBrowseCount();
});

// Load the channel and deal the first hand.
fetchJson(`https://api.are.na/v3/channels/${channelSlug}/contents?per=100&sort=position_desc`, (json) => {
	// Number blocks by when they were added (#1 = first). Not connection.position:
	// that's the display order, which changes when blocks are rearranged. Ties → lower id first.
	const byAdded = [...json.data].sort(
		(a, b) => a.connection.connected_at.localeCompare(b.connection.connected_at) || a.id - b.id
	);
	byAdded.forEach((block, i) => {
		block.addedNumber = i + 1;
	});

	browseList = byAdded.filter((block) => HERO_TYPES.includes(block.type));
	dealHeroCards(json.data);

	// Shuffle: gather the old hand into the centre (CSS .is-gathering), then deal a new one.
	document.querySelector(".btn-shuffle")?.addEventListener("click", () => {
		const heroList = document.querySelector("#hero-cards");
		if (heroList.classList.contains("is-gathering")) return; // mid-shuffle

		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		heroList.classList.add("is-gathering");
		setTimeout(
			() => {
				heroList.classList.remove("is-gathering");
				dealHeroCards(json.data);
			},
			reduceMotion ? 0 : GATHER_MS
		);
	});
});
