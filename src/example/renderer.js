const ElectronTabs = require("../electron-browser")
const electronTabs = new ElectronTabs()


electronTabs.addTab("Test div view", "")
electronTabs.addTab("Test webview view", "", "test.html")
electronTabs.addTab("Google", "favicons/google-favicon.ico", "https://google.com")
// electronTabs.addTab("Facebook", "https://facebook.com", "favicons/facebook-favicon.ico")
// electronTabs.addTab("YouTube", "https://youtube.com", "favicons/youtube-favicon.ico")

document.getElementById('btn-toggle-theme').addEventListener('click', function () {
	// Then toggle (add/remove) the .dark-theme class to the body
	document.body.classList.toggle('dark-theme');
})