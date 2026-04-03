;(function () {
  var key = "klimdev-theme-id"
  var themeId = localStorage.getItem(key) || "klimdev"

  if (themeId === "klimdev") {
    themeId = "klimdev"
    localStorage.setItem(key, themeId)
    localStorage.removeItem("klimdev-theme-css-light")
    localStorage.removeItem("klimdev-theme-css-dark")
  }

  var scheme = localStorage.getItem("opencode-color-scheme") || "system"
  var isDark = scheme === "dark" || (scheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
  var mode = isDark ? "dark" : "light"

  document.documentElement.dataset.theme = themeId
  document.documentElement.dataset.colorScheme = mode

  if (themeId === "klimdev") return

  var css = localStorage.getItem("opencode-theme-css-" + mode)
  if (css) {
    var style = document.createElement("style")
    style.id = "oc-theme-preload"
    style.textContent =
      ":root{color-scheme:" +
      mode +
      ";--text-mix-blend-mode:" +
      (isDark ? "plus-lighter" : "multiply") +
      ";" +
      css +
      "}"
    document.head.appendChild(style)
  }
})()
