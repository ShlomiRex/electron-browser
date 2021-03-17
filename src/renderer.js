const ElectronTabs = require("./electron-browser")
const electronTabs = new ElectronTabs()

electronTabs.addTab("Test", "test.html")
electronTabs.addTab("Test aaaaaaaaaaaaaaaaaaaaaaaaaaaa", "test.html")
electronTabs.addTab("Test", "test.html")
electronTabs.addTab("Test", "test.html")
electronTabs.addTab("Test aaaaaaaaaaaaaaaaaaaaaaaaaaaa", "test.html")

electronTabs.addTab("Test aaaaaaaaaaaaaaaaaaaaaaaaaaaa", "test.html")

electronTabs.addTab("Test aaaaaaaaaaaaaaaaaaaaaaaaaaaa", "test.html")

// electronTabs.addTab("Google", "https://google.com", "favicons/google-favicon.ico")
// electronTabs.addTab("YouTube", "https://youtube.com", "favicons/youtube-favicon.ico")
