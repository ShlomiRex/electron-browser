
let instanceId = 0

const Draggabilly = require('draggabilly')

const TAB_CONTENT_MARGIN = 9
const TAB_CONTENT_OVERLAP_DISTANCE = 1

const TAB_CONTENT_MIN_WIDTH = 24
const TAB_CONTENT_MAX_WIDTH = 240

const TAB_SIZE_SMALL = 84
const TAB_SIZE_SMALLER = 60
const TAB_SIZE_MINI = 48

const TAB_CLASS = "tab";
const DATA_TABS_INSTANCE_ID = "data-tabs-instance-id";

class ChromeTabs {
	constructor() {
		this.draggabillies = []
	}

	init(el) {
		this.DOM_chrome_tabs = el

		this.instanceId = instanceId
		this.DOM_chrome_tabs.setAttribute(DATA_TABS_INSTANCE_ID, this.instanceId)
		instanceId += 1

		this.setupCustomProperties()
		this.setupStyleEl()
		this.setupEvents()
		this.layoutTabs()
		this.setupDraggabilly()
	}

	emit(eventName, data) {
		this.DOM_chrome_tabs.dispatchEvent(new CustomEvent(eventName, { detail: data }))
	}

	setupCustomProperties() {
		this.DOM_chrome_tabs.style.setProperty('--tab-content-margin', `${TAB_CONTENT_MARGIN}px`)
	}

	setupStyleEl() {
		this.styleEl = document.createElement('style')
		this.DOM_chrome_tabs.appendChild(this.styleEl)
	}

	setupEvents() {
		window.addEventListener('resize', _ => {
			this.cleanUpPreviouslyDraggedTabs()
			this.layoutTabs()
		})

		this.DOM_chrome_tabs.addEventListener('dblclick', event => {
			if ([this.DOM_chrome_tabs, this.tabContentEl].includes(event.target)) this.addTab()
		})

		this.tabEls.forEach((tabEl) => this.setTabCloseEventListener(tabEl))
	}

	get tabEls() {
		return Array.prototype.slice.call(this.DOM_chrome_tabs.querySelectorAll('.' + TAB_CLASS))
	}

	get tabContentEl() {
		return this.DOM_chrome_tabs.querySelector('.tabs-content')
	}

	get tabContentWidths() {
		const numberOfTabs = this.tabEls.length
		const tabsContentWidth = this.tabContentEl.clientWidth
		const tabsCumulativeOverlappedWidth = (numberOfTabs - 1) * TAB_CONTENT_OVERLAP_DISTANCE
		const targetWidth = (tabsContentWidth - (2 * TAB_CONTENT_MARGIN) + tabsCumulativeOverlappedWidth) / numberOfTabs
		const clampedTargetWidth = Math.max(TAB_CONTENT_MIN_WIDTH, Math.min(TAB_CONTENT_MAX_WIDTH, targetWidth))
		const flooredClampedTargetWidth = Math.floor(clampedTargetWidth)
		const totalTabsWidthUsingTarget = (flooredClampedTargetWidth * numberOfTabs) + (2 * TAB_CONTENT_MARGIN) - tabsCumulativeOverlappedWidth
		const totalExtraWidthDueToFlooring = tabsContentWidth - totalTabsWidthUsingTarget

		// TODO - Support tabs with different widths / e.g. "pinned" tabs
		const widths = []
		let extraWidthRemaining = totalExtraWidthDueToFlooring
		for (let i = 0; i < numberOfTabs; i += 1) {
			const extraWidth = flooredClampedTargetWidth < TAB_CONTENT_MAX_WIDTH && extraWidthRemaining > 0 ? 1 : 0
			widths.push(flooredClampedTargetWidth + extraWidth)
			if (extraWidthRemaining > 0) extraWidthRemaining -= 1
		}

		return widths
	}

	get tabContentPositions() {
		const positions = []
		const tabContentWidths = this.tabContentWidths

		let position = TAB_CONTENT_MARGIN
		tabContentWidths.forEach((width, i) => {
			const offset = i * TAB_CONTENT_OVERLAP_DISTANCE
			positions.push(position - offset)
			position += width
		})

		return positions
	}

	get tabPositions() {
		const positions = []

		this.tabContentPositions.forEach((contentPosition) => {
			positions.push(contentPosition - TAB_CONTENT_MARGIN)
		})

		return positions
	}

	layoutTabs() {
		const tabContentWidths = this.tabContentWidths

		this.tabEls.forEach((tabEl, i) => {
			const contentWidth = tabContentWidths[i]
			const width = contentWidth + (2 * TAB_CONTENT_MARGIN)

			tabEl.style.width = width + 'px'
			tabEl.removeAttribute('is-small')
			tabEl.removeAttribute('is-smaller')
			tabEl.removeAttribute('is-mini')

			if (contentWidth < TAB_SIZE_SMALL) tabEl.setAttribute('is-small', '')
			if (contentWidth < TAB_SIZE_SMALLER) tabEl.setAttribute('is-smaller', '')
			if (contentWidth < TAB_SIZE_MINI) tabEl.setAttribute('is-mini', '')
		})

		let styleHTML = ''
		this.tabPositions.forEach((position, i) => {
			styleHTML += `
	  .tabs[${DATA_TABS_INSTANCE_ID}="${this.instanceId}"] .${TAB_CLASS}:nth-child(${i + 1}) {
		transform: translate3d(${position}px, 0, 0)
	  }
	`
		})
		this.styleEl.innerHTML = styleHTML
	}

	createNewTabEl() {
		const div = document.createElement('div')
		div.innerHTML = tabTemplate
		return div.firstElementChild
	}

	addTab(tabProperties, { animate = true, background = false } = {}) {
		const tabEl = this.createNewTabEl()

		if (animate) {
			tabEl.classList.add(`${TAB_CLASS}-was-just-added`)
			setTimeout(() => tabEl.classList.remove(`${TAB_CLASS}-was-just-added`), 500)
		}

		tabProperties = Object.assign({}, defaultTapProperties, tabProperties)
		this.tabContentEl.appendChild(tabEl)
		this.setTabCloseEventListener(tabEl)
		this.updateTab(tabEl, tabProperties)
		this.emit('tabAdd', { tabEl })
		if (!background) this.setCurrentTab(tabEl)
		this.cleanUpPreviouslyDraggedTabs()
		this.layoutTabs()
		this.setupDraggabilly()

		return tabEl
	}

	setTabCloseEventListener(tabEl) {
		tabEl.querySelector(`.${TAB_CLASS}-close`).addEventListener('click', _ => this.removeTab(tabEl))
	}

	get activeTabEl() {
		return this.DOM_chrome_tabs.querySelector(`.${TAB_CLASS}[active]`)
	}

	hasActiveTab() {
		return !!this.activeTabEl
	}

	setCurrentTab(tabEl) {
		const activeTabEl = this.activeTabEl
		if (activeTabEl === tabEl) return
		if (activeTabEl) {
			activeTabEl.removeAttribute('active')
			activeTabEl.classList.remove("selected")
		}
		tabEl.setAttribute('active', '')
		tabEl.classList.add("selected")
		this.emit('activeTabChange', { tabEl })
	}

	removeTab(tabEl) {
		if (tabEl === this.activeTabEl) {
			if (tabEl.nextElementSibling) {
				this.setCurrentTab(tabEl.nextElementSibling)
			} else if (tabEl.previousElementSibling) {
				this.setCurrentTab(tabEl.previousElementSibling)
			}
		}
		tabEl.parentNode.removeChild(tabEl)
		this.emit('tabRemove', { tabEl })
		this.cleanUpPreviouslyDraggedTabs()
		this.layoutTabs()
		this.setupDraggabilly()
	}

	updateTab(tabEl, tabProperties) {
		tabEl.querySelector(`.${TAB_CLASS}-title`).textContent = tabProperties.title

		const faviconEl = tabEl.querySelector(`.${TAB_CLASS}-favicon`)
		if (tabProperties.favicon) {
			faviconEl.style.backgroundImage = `url('${tabProperties.favicon}')`
			faviconEl.removeAttribute('hidden', '')
		} else {
			faviconEl.setAttribute('hidden', '')
			faviconEl.removeAttribute('style')
		}

		if (tabProperties.id) {
			tabEl.setAttribute('data-tab-id', tabProperties.id)
		}
	}

	cleanUpPreviouslyDraggedTabs() {
		this.tabEls.forEach((tabEl) => tabEl.classList.remove(`${TAB_CLASS}-was-just-dragged`))
	}

	setupDraggabilly() {
		const tabEls = this.tabEls
		const tabPositions = this.tabPositions

		if (this.isDragging) {
			this.isDragging = false
			this.DOM_chrome_tabs.classList.remove('tabs-is-sorting')
			this.draggabillyDragging.element.classList.remove(`${TAB_CLASS}-is-dragging`)
			this.draggabillyDragging.element.style.transform = ''
			this.draggabillyDragging.dragEnd()
			this.draggabillyDragging.isDragging = false
			this.draggabillyDragging.positionDrag = noop // Prevent Draggabilly from updating tabEl.style.transform in later frames
			this.draggabillyDragging.destroy()
			this.draggabillyDragging = null
		}

		this.draggabillies.forEach(d => d.destroy())

		tabEls.forEach((tabEl, originalIndex) => {
			const originalTabPositionX = tabPositions[originalIndex]
			const draggabilly = new Draggabilly(tabEl, {
				axis: 'x',
				handle: `.${TAB_CLASS}-drag-handle`,
				containment: this.tabContentEl
			})

			this.draggabillies.push(draggabilly)

			draggabilly.on('pointerDown', _ => {
				this.setCurrentTab(tabEl)
			})

			draggabilly.on('dragStart', _ => {
				this.isDragging = true
				this.draggabillyDragging = draggabilly
				tabEl.classList.add(`${TAB_CLASS}-is-dragging`)
				this.DOM_chrome_tabs.classList.add('tabs-is-sorting')
			})

			draggabilly.on('dragEnd', _ => {
				this.isDragging = false
				const finalTranslateX = parseFloat(tabEl.style.left, 10)
				tabEl.style.transform = `translate3d(0, 0, 0)`

				// Animate dragged tab back into its place
				requestAnimationFrame(_ => {
					tabEl.style.left = '0'
					tabEl.style.transform = `translate3d(${finalTranslateX}px, 0, 0)`

					requestAnimationFrame(_ => {
						tabEl.classList.remove(`${TAB_CLASS}-is-dragging`)
						this.DOM_chrome_tabs.classList.remove('tabs-is-sorting')

						tabEl.classList.add(`${TAB_CLASS}-was-just-dragged`)

						requestAnimationFrame(_ => {
							tabEl.style.transform = ''

							this.layoutTabs()
							this.setupDraggabilly()
						})
					})
				})
			})

			draggabilly.on('dragMove', (event, pointer, moveVector) => {
				// Current index be computed within the event since it can change during the dragMove
				const tabEls = this.tabEls
				const currentIndex = tabEls.indexOf(tabEl)

				const currentTabPositionX = originalTabPositionX + moveVector.x
				const destinationIndexTarget = closest(currentTabPositionX, tabPositions)
				const destinationIndex = Math.max(0, Math.min(tabEls.length, destinationIndexTarget))

				if (currentIndex !== destinationIndex) {
					this.animateTabMove(tabEl, currentIndex, destinationIndex)
				}
			})
		})
	}

	animateTabMove(tabEl, originIndex, destinationIndex) {
		if (destinationIndex < originIndex) {
			tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex])
		} else {
			tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex + 1])
		}
		this.emit('tabReorder', { tabEl, originIndex, destinationIndex })
		this.layoutTabs()
	}
}


const noop = _ => { }

const closest = (value, array) => {
	let closest = Infinity
	let closestIndex = -1

	array.forEach((v, i) => {
		if (Math.abs(value - v) < closest) {
			closest = Math.abs(value - v)
			closestIndex = i
		}
	})

	return closestIndex
}

const tabTemplate = `
<div class="${TAB_CLASS}">
  <div class="${TAB_CLASS}-dividers"></div>
  <div class="${TAB_CLASS}-content">
	<div class="${TAB_CLASS}-favicon"></div>
	<div class="${TAB_CLASS}-title"></div>
	<div class="${TAB_CLASS}-drag-handle"></div>
	<div class="${TAB_CLASS}-close"></div>
  </div>
</div>
`

const defaultTapProperties = {
	title: 'New tab',
	favicon: false
}

var chromeTabs = new ChromeTabs()

class ElectronChromeTabs {
	DOM_chrome_tabs;
	accTabId = 0;

	tabs = []
	webviews = [] // Holes in array are allowed, access tabId fast (index = tabId)
	webviewtoPush = undefined; //Set this 

	activeTab = undefined;
	activeWebview = undefined;

	constructor() {
		this.DOM_chrome_tabs = document.querySelector('.tabs')
		chromeTabs.init(this.DOM_chrome_tabs)

		this.DOM_chrome_tabs.addEventListener("activeTabChange", (event) => {
			let tab = event.detail.tabEl
			let id = tab["data-ectTabId"]
			console.debug("Active tab changed to: ", tab)

			function set_active_webview_and_deselect_others(webview, i) {
				if (i == id) {
					webview.classList.add("selected");
					this.activeWebview = webview
				} else {
					webview.classList.remove("selected");
				}
			}
			var boundFunction = set_active_webview_and_deselect_others.bind(this)

			this.webviews.forEach(boundFunction)

			this.activeTab = this.tabs[id]

			this.getCurrent()
		});

		this.DOM_chrome_tabs.addEventListener('tabAdd', (event) => {
			let tab = event.detail.tabEl
			let id = this.accTabId++
			tab["data-ectTabId"] = id
			this.tabs.push(tab)
			//console.debug("Tab added:", id, event.detail)

			this.webviews.push(this.webviewtoPush)
		});

		this.DOM_chrome_tabs.addEventListener("tabRemove", (event) => {
			let tab = event.detail.tabEl
			let id = tab["data-ectTabId"]
			console.debug("Tab remove: ", id)

			console.debug("Tab array: ", this.webviews)

			this.webviews[id].remove() //Delete from document
			delete this.webviews[id] //Delete from array

			console.debug("Tab array after delete: ", this.webviews)
		});
	}

	addTab(title, src, favicon = "") {
		const webview = document.createElement("webview")
		webview.setAttribute("src", src)

		const parent = document.querySelector(".browser-views")
		parent.appendChild(webview)

		this.webviewtoPush = webview

		let tabEl = chromeTabs.addTab({
			title: title,
			favicon: favicon
		})

		this.activeTab = tabEl;
		this.activeWebview = webview;

		return {
			"tab": tabEl,
			"webview": webview
		}
	}

	getCurrent() {
		return {
			"activeTab": this.activeTab,
			"activeWebview": this.activeWebview
		}
	}
}

module.exports = ElectronChromeTabs