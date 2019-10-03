const groupSharePostfix = '\nGroup'
const userSharePostfix = '\nUser'
const util = require('util')
const _ = require('lodash')

const collaboratorPermissionArray = ['share', 'change', 'create', 'delete']

module.exports = {
  commands: {
    /**
     *
     * @param {string} permissions
     */
    getArrayFromPermissionString: function (permissions) {
      permissions = permissions.replace(/\s/g, '')
      return permissions.split(',').filter(x => x)
    },
    /**
     *
     * @param {string} permission
     */
    getPermissionSwitchXpath: function (permission) {
      return util.format(this.elements.permissionButton.selector, permission)
    },

    /**
     *
     * @param {string} sharee
     */
    removePendingCollaboratorForShare: function (sharee) {
      const newCollaboratorXpath = util.format(this.elements.newCollaboratorItems.selector, sharee)
      const removeCollaboratorBtnXpath = newCollaboratorXpath + this.elements.newCollaboratorRemoveButton.selector

      return this.useXpath().click(removeCollaboratorBtnXpath).useCss()
    },

    /**
     *
     * @param {string} sharee
     * @param {boolean} [shareWithGroup=false]
     */
    selectCollaboratorForShare: async function (sharee, shareWithGroup = false) {
      // We need waitForElementPresent here.
      // waitForElementVisible would break even with 'abortOnFailure: false' if the element is not present
      await this.enterAutoComplete(sharee)
        .waitForElementPresent({
          selector: '@sharingAutoCompleteDropDownElements',
          abortOnFailure: false
        }, (result) => {
          if (result.value === false) {
            // sharing dropdown was not shown
            console.log('WARNING: no sharing autocomplete dropdown found, retry typing')
            this.clearValue('@sharingAutoComplete')
              .enterAutoComplete(sharee)
              .waitForElementVisible('@sharingAutoCompleteDropDownElements')
          }
        })
      const webElementIdList = await this.getShareAutocompleteWebElementIdList()

      let index = 0
      for (; index !== webElementIdList.length; index++) {
        let wasFound = false
        const webElementId = webElementIdList[index]
        await this.api.elementIdText(webElementId, (text) => {
          const suffix = (shareWithGroup === true) ? groupSharePostfix : userSharePostfix
          if (text.value === sharee + suffix) {
            wasFound = true
            this.api
              .elementIdClick(webElementId)
              .waitForOutstandingAjaxCalls()
          }
        })
        if (wasFound === true) break
      }

      if (index === webElementIdList.length) {
        // * we won't see this probably, unless dropdown gives different results than entered
        throw new Error(`Could not find ${sharee} on the sharing auto-completion list.`)
      }
    },

    /**
     * @param {string} permissions
     */
    selectPermissionsOnPendingShare: async function (permissions) {
      const permissionArray = this.getArrayFromPermissionString(permissions)
      console.log(permissionArray)
      for (const permission of permissionArray) {
        const permissionSwitchXpath = this.getPermissionSwitchXpath(permission)
        if (this.useXpath().assert.visible(permissionSwitchXpath)) {
          await this.useXpath().click(permissionSwitchXpath).useCss()
        }
      }
    },

    /**
     *
     * @param {string} sharee
     * @param {boolean} shareWithGroup
     * @param {string} role
     * @param {string} permissions
     */
    shareWithUserOrGroup: async function (sharee, shareWithGroup = false, role, permissions) {
      await this.selectCollaboratorForShare(sharee, shareWithGroup)
      this.selectRoleForNewCollaborator(role)
      if (permissions === undefined) {
        return this.confirmShare()
      }
      await this.selectPermissionsOnPendingShare(permissions)

      return this.confirmShare()
    },
    /**
     *
     * @param {String} role
     */
    selectRoleForNewCollaborator: function (role) {
      role = _(role).chain().toLower().startCase().replace(/\s/g, '').value()
      return this.waitForElementPresent('@newCollaboratorSelectRoleButton')
        .click('@newCollaboratorSelectRoleButton')
        .waitForElementVisible('@newCollaboratorRolesDropdown')
        .waitForElementVisible(`@newCollaboratorRole${role}`)
        .click(`@newCollaboratorRole${role}`)
        .waitForElementNotVisible('@newCollaboratorRolesDropdown')
    },
    confirmShare: function () {
      return this.waitForElementPresent('@addShareButton')
        .click('@addShareButton')
        .waitForElementNotPresent('@addShareButton')
    },
    saveCollaboratorPermission: function () {
      return this.waitForElementVisible('@saveShareButton')
        .click('@saveShareButton')
        .waitForOutstandingAjaxCalls()
        .waitForElementNotPresent('@saveShareButton')
    },
    /**
     *
     * @param {string} collaborator
     */
    expandInformationSelector: function (collaborator) {
      const informationSelector = util.format(this.elements.collaboratorInformationByCollaboratorName.selector, collaborator)
      const selectRoleButton = informationSelector + this.elements.selectRoleButtonInCollaboratorInformation.selector
      this
        .useXpath()
        .waitForElementVisible(informationSelector)
        .click(informationSelector)
        .waitForElementVisible(selectRoleButton)
    },
    /**
     *
     * @param {string} collaborator
     * @param {string} requiredPermissions
     */
    changeCustomPermissionsTo: async function (collaborator, requiredPermissions) {
      const requiredPermissionArray = this.getArrayFromPermissionString(requiredPermissions)

      let permission = ''
      this.expandInformationSelector(collaborator)

      for (let i = 0; i < collaboratorPermissionArray.length; i++) {
        permission = collaboratorPermissionArray[i]
        const permissionXpath = this.getPermissionSwitchXpath(permission)
        // Check if the xpath of permission is visible
        await this.api.waitForElementVisible({ selector: permissionXpath, timeout: 100, abortOnFailure: false }, function (result) {
          if (result.value === true) {
            this
              .getAttribute(permissionXpath, 'data-state', (state) => {
                if ((state.value === 'on' && !requiredPermissionArray.includes(permission)) ||
                  (state.value === 'off' && requiredPermissionArray.includes(permission))) {
                  // need to click
                  this.useXpath()
                    .click(permissionXpath)
                }
              })
          }
          // check if the requiredPermission is not visible
          if (result.value === false && requiredPermissionArray.includes(permission)) {
            throw new Error(`permission ${permission} is not visible `)
          }
        })
      }
      return this.saveCollaboratorPermission()
    },
    /**
     * asserts that the permission is set to "off" or not displayed at all
     *
     * @param {string} permissionXpath
     */
    assertPermissionDataStateIsOff: function (permissionXpath) {
      return this.api.isVisible(permissionXpath, result => {
        if (result.value === true) {
          this
            .assert
            .attributeEquals(permissionXpath, 'data-state', 'off', `data-state of xpath ${permissionXpath} is set `)
        }
      })
    },
    /**
     *
     * @param {string} collaborator
     * @param {string} permissions
     */
    assertPermissionIsDisplayed: async function (collaborator, permissions = undefined) {
      let requiredPermissionArray
      if (permissions !== undefined) {
        requiredPermissionArray = this.getArrayFromPermissionString(permissions)
      }
      this.expandInformationSelector(collaborator)

      for (let i = 0; i < collaboratorPermissionArray.length; i++) {
        const permissionXpath = this.getPermissionSwitchXpath(collaboratorPermissionArray[i])
        if (permissions !== undefined) {
          // check all the required permissions are set
          if (requiredPermissionArray.includes(collaboratorPermissionArray[i])) {
            await this
              .assert
              .attributeEquals(permissionXpath, 'data-state', 'on', `data-state of xpath ${permissionXpath} is not set`)
          } else {
            // check unexpected permissions are not set
            return this.assertPermissionDataStateIsOff(permissionXpath)
          }
        } else {
          // check all the permissions are not set
          return this.assertPermissionDataStateIsOff(permissionXpath)
        }
      }
    },
    /**
     *
     * @param {string} collaborator
     */
    disableAllCustomPermissions: async function (collaborator) {
      this.expandInformationSelector(collaborator)

      for (let i = 0; i < collaboratorPermissionArray.length; i++) {
        const permission = collaboratorPermissionArray[i]
        const permissionXpath = this.getPermissionSwitchXpath(permission)
        // Check if the xpath of permission is visible
        await this.api.waitForElementVisible({ selector: permissionXpath, timeout: 100, abortOnFailure: false }, function (result) {
          if (result.value === true) {
            this
              .getAttribute(permissionXpath, 'data-state', (state) => {
                if (state.value === 'on') {
                  // need to click
                  this.useXpath()
                    .click(permissionXpath)
                }
              })
          }
        })
      }
      return this.saveCollaboratorPermission()
    },
    /**
     *
     * @param {string} input
     */
    enterAutoComplete: function (input) {
      return this.initAjaxCounters()
        .waitForElementVisible('@sharingAutoComplete')
        .setValueBySingleKeys('@sharingAutoComplete', input)
        .waitForOutstandingAjaxCalls()
    },
    /**
     *
     * @returns {Promise.<string[]>} Array of autocomplete items
     */
    getShareAutocompleteItemsList: async function () {
      const webElementIdList = await this.getShareAutocompleteWebElementIdList()
      const itemsListPromises = webElementIdList.map((webElementId) => {
        return new Promise((resolve, reject) => {
          this.api.elementIdText(webElementId, (text) => {
            resolve(text.value.trim())
          })
        })
      })

      return Promise.all(itemsListPromises)
    },
    /**
     *
     * @returns {Promise.<string[]>} Array of autocomplete webElementIds
     */
    getShareAutocompleteWebElementIdList: function () {
      const webElementIdList = []
      return this
        .waitForElementVisible('@sharingAutoCompleteDropDownElements')
        .api.elements('css selector', this.elements.sharingAutoCompleteDropDownElements.selector, (result) => {
          result.value.forEach((value) => {
            webElementIdList.push(value[Object.keys(value)[0]])
          })
        })
        .then(() => webElementIdList)
    },
    /**
     *
     * @returns {Promise.<string[]>} Array of autocomplete webElementIds
     */
    deleteShareWithUserGroup: function (item) {
      const informationSelector = util.format(this.elements.collaboratorInformationByCollaboratorName.selector, item)
      const moreInformationSelector = informationSelector + this.elements.collaboratorMoreInformation.selector
      const deleteSelector = informationSelector + this.elements.deleteShareButton.selector
      return this
        .useXpath()
        .waitForElementVisible(moreInformationSelector)
        .click(moreInformationSelector)
        .waitForElementVisible(deleteSelector)
        .waitForAnimationToFinish()
        .click(deleteSelector)
        .waitForElementNotPresent(informationSelector)
    },
    /**
     *
     * @param {string} collaborator
     * @param {string} newRole
     * @returns {Promise}
     */
    changeCollaboratorRole: function (collaborator, newRole) {
      const util = require('util')
      const informationSelector = util.format(this.elements.collaboratorInformationByCollaboratorName.selector, collaborator)
      const moreInformationSelector = informationSelector + this.elements.collaboratorMoreInformation.selector
      const selectRoleButton = informationSelector + this.elements.selectRoleButtonInCollaboratorInformation.selector
      const roleDropdown = informationSelector + this.elements.roleDropdownInCollaboratorInformation.selector
      const roleButtonInDropdown = roleDropdown + util.format(
        this.elements.roleButtonInDropdown.selector, newRole.toLowerCase()
      )

      return this
        .useXpath()
        .waitForElementVisible(moreInformationSelector)
        .click(moreInformationSelector)
        .waitForElementVisible(selectRoleButton)
        .click(selectRoleButton)
        .waitForElementVisible(roleDropdown)
        .waitForElementVisible(roleButtonInDropdown)
        .click(roleButtonInDropdown)
        .waitForElementVisible('@saveShareButton')
        .click('@saveShareButton')
        .waitForElementNotPresent('@saveShareButton')
        .waitForOutstandingAjaxCalls()
    },
    /**
     *
     * @returns {Promise.<string[]>} Array of users/groups in share list
     */
    getCollaboratorsList: async function () {
      const promiseList = []
      await this.initAjaxCounters()
        .waitForElementPresent({ selector: '@collaboratorsInformation', abortOnFailure: false })
        .waitForOutstandingAjaxCalls()
        .api.elements('css selector', this.elements.collaboratorsInformation, result => {
          result.value.map(item => {
            promiseList.push(new Promise((resolve, reject) => {
              this.api.elementIdText(item[Object.keys(item)[0]], text => {
                resolve(text.value)
              })
            })
            )
          })
        })
      return Promise.all(promiseList)
    },
    showAllAutoCompleteResults: function () {
      return this.waitForElementVisible('@sharingAutoCompleteShowAllResultsButton')
        .click('@sharingAutoCompleteShowAllResultsButton')
        .waitForElementNotPresent('@sharingAutoCompleteShowAllResultsButton')
    },
    /**
     *
     * @returns {string}
     */
    getGroupSharePostfix: function () {
      return groupSharePostfix
    },
    /**
     *
     * @returns {string}
     */
    getUserSharePostfix: function () {
      return userSharePostfix
    }
  },
  elements: {
    sharingAutoComplete: {
      selector: '#oc-sharing-autocomplete .oc-autocomplete-input'
    },
    sharingAutoCompleteDropDown: {
      selector: '#oc-sharing-autocomplete .oc-autocomplete-suggestion-list'
    },
    sharingAutoCompleteDropDownElements: {
      selector: '#oc-sharing-autocomplete .oc-autocomplete-suggestion'
    },
    sharingAutoCompleteShowAllResultsButton: {
      selector: '.oc-autocomplete-suggestion-overflow'
    },
    sharedWithListItem: {
      selector: '//*[@id="file-share-list"]//*[@class="oc-user"]//div[.="%s"]/../..',
      locateStrategy: 'xpath'
    },
    collaboratorsInformation: {
      // addresses users and groups
      selector: '.files-collaborators-collaborator .files-collaborators-collaborator-information'
    },
    collaboratorInformationByCollaboratorName: {
      selector: '//*[contains(@class, "files-collaborators-collaborator-name") and .="%s"]/ancestor::li',
      locateStrategy: 'xpath'
    },
    collaboratorMoreInformation: {
      // within collaboratorInformationByCollaboratorName
      selector: '/a',
      locateStrategy: 'xpath'
    },
    deleteShareButton: {
      // within collaboratorInformationByCollaboratorName
      selector: '//*[@aria-label="Delete Share"]',
      locateStrategy: 'xpath'
    },
    addShareButton: {
      selector: '#files-collaborators-add-new-button'
    },
    saveShareButton: {
      selector: '//button[@aria-label="Save Share"]',
      locateStrategy: 'xpath'
    },
    newCollaboratorSelectRoleButton: {
      selector: '#files-collaborators-role-button'
    },
    newCollaboratorRolesDropdown: {
      selector: '#files-collaborators-roles-dropdown'
    },
    newCollaboratorRoleViewer: {
      selector: '#files-collaborator-new-collaborator-role-viewer'
    },
    newCollaboratorRoleEditor: {
      selector: '#files-collaborator-new-collaborator-role-editor'
    },
    newCollaboratorItems: {
      selector: "//div[@id='oc-files-sharing-sidebar']//span[contains(@class, 'oc-icon-danger')]/ancestor::div[position()=1 and contains(., '%s')]"
    },
    newCollaboratorRemoveButton: {
      selector: "//span[contains(@class, 'oc-icon-danger')]"
    },
    newCollaboratorRoleCustomRole: {
      selector: '#files-collaborator-new-collaborator-role-custom'
    },
    selectRoleButtonInCollaboratorInformation: {
      selector: '//button[contains(@class, "files-collaborators-role-button")]',
      locateStrategy: 'xpath'
    },
    roleDropdownInCollaboratorInformation: {
      selector: '//div[contains(@id, "files-collaborators-roles-dropdown")]',
      locateStrategy: 'xpath'
    },
    roleButtonInDropdown: {
      // the translate bit is to make it case-insensitive
      selector: '//span[translate(.,"ABCDEFGHJIKLMNOPQRSTUVWXYZ","abcdefghjiklmnopqrstuvwxyz") ="%s"]',
      locateStrategy: 'xpath'
    },
    permissionButton: {
      selector: '//span[.="Can %s"]/parent::div/div',
      locateStrategy: 'xpath'
    }
  }
}
