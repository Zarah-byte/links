let channelSlug = 'glassware-rxfrlfenjcu' // The “slug” is just the end of the URL.
let myUsername = 'zarah-yaqub' // For linking to your profile.


// First, let’s lay out some *functions*, starting with our basic metadata:
let placeChannelInfo = (channelData) => {
	// Target some elements in your HTML:
	let channelTitle = document.querySelector('#channel-title')
	let channelDescription = document.querySelector('#channel-description')
	let channelCount = document.querySelector('#channel-count')
	let channelLink = document.querySelector('#channel-link')

	// Then set their content/attributes to our data:
	channelTitle.innerHTML = channelData.title
	channelDescription.innerHTML = channelData.description.html
	channelCount.innerHTML = channelData.counts.blocks
	channelLink.href = `https://www.are.na/channel/${channelSlug}`
}

// for each of the if/else if or else branches 
// define another constant called: 
// url = blockData.type src? || ""
// <div class="image-container" 
//    style = "--link-url: url('${getUrl(blockdata.type)')}>


// Then our big function for specific-block-type rendering:
let renderBlock = (blockData) => {
	// function getUrl(type){
	// 	if (type === "Link")  return "/Users/zarahyaqub/Desktop/Repos.nosync/links/Svgs/01.svg";
	// 	if (type === "Image") return svgImage;
	//   }
	//   const getUrl = (type) => MASKS[type]
	// To start, a shared `ul` where we’ll insert all our blocks
	let channelBlocks = document.querySelector('#channel-blocks')

	// Links!
	if (blockData.type == 'Link') {
		// Declares a “template literal” of the dynamic HTML we want.
		// <p><em>Link</em></p>
		let linkItem =
		`
			<li>
					<figure>
						<picture>
							<source media="(width < 500px)" srcset="${blockData.image.small.src_2x}">
							<source media="(width < 1000px)" srcset="${blockData.image.medium.src_2x}">
							<img alt="${blockData.image.alt_text}" src="${blockData.image.large.src_2x}">
						</picture>
					</figure>
						<button id="modal">Click here!</button>
		<dialog id="dialog">
						<figcaption>
							<h3>
								${ blockData.title
									? blockData.title // If `blockData.title` exists, do this.
									: `Untitled` // Otherwise do this.
									// This is a “ternary operator”: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator
								}
							</h3>
							${ blockData.description // Here, checks for the object; could also write `blockData.description?.html`.
								? `<div>${blockData.description.html}</div>` // Wrap/interpolate the HTML.
								: `` // Our “otherwise” can also be blank!
							}
						</figcaption>
										</figure>
			<button>Close it!</button>
		</dialog>
				<p><a href="${ blockData.source.url }">See the original ↗</a></p>
				
			</li>
			`

		// And puts it into the page!
		channelBlocks.insertAdjacentHTML('beforeend', linkItem)

		// More on template literals:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
	}

	// Images!
	else if (blockData.type == 'Image') {
		// Declares a “template literal” of the dynamic HTML we want.
		console.log(blockData)
		let imageItem =
			// <p><em>Image</em></p>
			`
			<button id="modal">
				<li class="img-block">
				<img src="${blockData.image.src}" alt="">
			</button>
			`

		// And puts it into the page!
		channelBlocks.insertAdjacentHTML('beforeend', imageItem)
		// …up to you!
	}

	// Text!
	else if (blockData.type == 'Text') {
		let textItem =
			`
			<li class="text-block">
				<div class="text-content">
					<p>${blockData.content.plain}</p>
				</div>
			</li>
		`

		channelBlocks.insertAdjacentHTML('beforeend', textItem)
	}

	// Uploaded (not linked) media…
	else if (blockData.type == 'Attachment') {
		let contentType = blockData.attachment.content_type // Save us some repetition.

		// Uploaded videos!
		if (contentType.includes('video')) {
			// …still up to you, but we’ll give you the `video` element:
			let videoItem =
				`
				<li>
					<video controls src="${blockData.attachment.url}"></video>
				</li>
				`

			channelBlocks.insertAdjacentHTML('beforeend', videoItem)

			// More on `video`, like the `autoplay` attribute:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
		}

		// Uploaded PDFs!
		else if (blockData.type == 'Attachment' &&
			blockData.attachment.content_type.includes('pdf')) {

			let pdfItem = `
	   <li class="pdf-block">
		   <iframe src="${blockData.attachment.url}" width="100%" height="500px"></iframe>
	   </li>
	   `

			channelBlocks.insertAdjacentHTML('beforeend', pdfItem)
		}

		// Uploaded audio!
		else if (contentType.includes('audio')) {
			// …still up to you, but here’s an `audio` element:
			let audioItem =
				`
				<div class="cover-audio">
					<li>
						<audio controls src="${blockData.attachment.url}"></video>
					</li>
				</div>
				`

			channelBlocks.insertAdjacentHTML('beforeend', audioItem)

			// More on`audio`:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
		}
	}

	// Linked (embedded) media…
	else if (blockData.type == 'Embed') {
		let embedType = blockData.embed.type

		// Linked video!
		if (embedType.includes('video')) {
			// …still up to you, but here’s an example `iframe` element:
			let linkedVideoItem =
				`
				<div class="cover-video">
					<li>
						${blockData.embed.html}
					</li>
				</div>
				`

			channelBlocks.insertAdjacentHTML('beforeend', linkedVideoItem)
			// More on `iframe`:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
		}
		// Linked audio!
		else if (embedType.includes('rich')) {
			// …up to you!
		}
	}
}

// A function to display the owner/collaborator info:
let renderUser = (userData) => {
	let channelUsers = document.querySelector('#channel-users') // Container.

	let userAddress =
		`
		<address>
			<p><a href="https://are.na/${userData.slug}">Zarah Yaqub</a></p>
		</address>
		`

	channelUsers.insertAdjacentHTML('beforeend', userAddress)
}



// Finally, a helper function to fetch data from the API, then run a callback function with it:
let fetchJson = (url, callback, pageResponses = []) => {
	fetch(url, { cache: 'no-store' })
		.then((response) => response.json())
		.then((json) => {
			// Add this page to our temporary “accumulator” list parameter (an array).
			pageResponses.push(json)

			// Are.na response includes this “there are more!” flag (a boolean):
			if (json.meta && json.meta.has_more_pages) { // If that exists and is `true`, keep going…
				// Fetch *another* page worth, passing along our previous/accumulated responses.
				fetchJson(`${url}&page=${pageResponses.length + 1}`, callback, pageResponses)
			} else { // If it is `false`, there are no more pages…
				// “Flattens” them all together as if they were one page response.
				json.data = pageResponses.flatMap((page) => page.data)

				// Return the data to the callback!
				callback(json)
			}
		})
}

// Similar to before, setting up variables.
let modalButton = document.querySelector('#modal') // The thing we’re clicking.
let modalDialog = document.querySelector('#dialog') // Now one for our `dialog`.
let closeButton = modalDialog.querySelector('button') // Only looking within `modalDialog`.

modalButton.addEventListener('click', () => { // “Listen” for clicks.
	modalDialog.showModal() // This opens it up.
})

closeButton.addEventListener('click', () => {
	modalDialog.close() // And this closes it!
})

// Listen to *all* clicks, now including the `event` parameter…
document.addEventListener('click', (event) => {
	// Only clicks on the page itself behind the `dialog`.
	if (event.target == document.documentElement) {
		modalDialog.close() // Close it too then.
	}
})
// More on `fetch`:
// https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch



// Now that we have said all the things we *can* do, go get the channel data:
fetchJson(`https://api.are.na/v3/channels/${channelSlug}`, (json) => {
	console.log(json) // Always good to check your response!

	placeChannelInfo(json) // Pass all the data to the first function, above.
	renderUser(json.owner) // Pass just the nested object `.owner`.
})

// Get your info to put with the owner's:
fetchJson(`https://api.are.na/v3/users/${myUsername}/`, (json) => {
	console.log(json) // See what we get back.

	renderUser(json) // Pass this to the same function, no nesting.
})

// And the data for the blocks:
fetchJson(`https://api.are.na/v3/channels/${channelSlug}/contents?per=100&sort=position_desc`, (json) => {
	console.log(json) // See what we get back.

	// Loop through the nested `.data` array (list).
	json.data.forEach((blockData) => {
		// console.log(blockData) // The data for a single block.

		renderBlock(blockData) // Pass the single block’s data to the render function.
	})
})
