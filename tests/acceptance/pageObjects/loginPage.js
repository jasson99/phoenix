module.exports = {
  url: function () {
    return this.api.launchUrl + '/index.html#/login'
  },
  elements: {
    body: 'body',
    authenticateButton: {
      selector: '#authenticate'
    }
  },
  commands: [
    {
      authenticate: function () {
        return this.waitForElementVisible('@authenticateButton')
          .click('@authenticateButton')
      }
    }
  ]
}
