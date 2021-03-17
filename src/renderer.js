const ElectronTabs = require("./electron-browser")
const electronTabs = new ElectronTabs()

electronTabs.addTab("Test", "test.html")
electronTabs.addTab("Google", "https://google.com", "favicons/google-favicon.ico")
electronTabs.addTab("Facebook", "https://facebook.com", "favicons/facebook-favicon.ico")
electronTabs.addTab("YouTube", "https://youtube.com", "favicons/youtube-favicon.ico")
