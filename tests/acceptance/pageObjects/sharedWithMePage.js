module.exports = {
  url: function () {
    return this.api.launchUrl + '/index.html#/files/shared-with-me/'
  },
  commands: {
    /**
     * like build-in navigate() but also waits till for the progressbar to appear and disappear
     * @returns {*}
     */
    navigateAndWaitTillLoaded: function () {
      this.navigate()
      return this
        .page.FilesPageElement.filesList()
        .waitForElementPresent({ selector: '@filesListProgressBar', abortOnFailure: false }) // don't fail if we are too late
        .waitForElementNotPresent('@filesListProgressBar')
    }
  }
}
