const { client } = require('nightwatch-api')
const assert = require('assert')
const { Given, When, Then, Before } = require('cucumber')
const webdav = require('../helpers/webdavHelper')
const loginHelper = require('../helpers/loginHelper')
let deletedElements

Before(() => {
  deletedElements = []
})

When('the user browses to the files page',
  () => {
    return client
      .page.filesPage()
      .navigateAndWaitTillLoaded()
  })

When('the user browses to the favorites page', function () {
  return client
    .page.favoritesPage()
    .navigateAndWaitTillLoaded()
})

Given('the user has browsed to the favorites page', function () {
  return client
    .page.favoritesPage()
    .navigateAndWaitTillLoaded()
})

When('the user browses to the shared-with-me page', function () {
  return client
    .page.sharedWithMePage()
    .navigateAndWaitTillLoaded()
})

When('the user browses to the shared-with-others page', function () {
  return client
    .page.sharedWithOthersPage()
    .navigateAndWaitTillLoaded()
})

Given('the user has browsed to the trashbin page', function () {
  return client
    .page.trashbinPage()
    .navigateAndWaitTillLoaded()
})

When('the user browses to the trashbin page', function () {
  return client
    .page.trashbinPage()
    .navigateAndWaitTillLoaded()
})

Given('the user has browsed to the favorites page using the webUI', function () {
  return client
    .page.phoenixPage()
    .navigateToUsingMenu('Favorites')
})

When('the user browses to the favorites page using the webUI', function () {
  return client
    .page.phoenixPage()
    .navigateToUsingMenu('Favorites')
})

When('the user browses to the files page using the webUI', function () {
  return client
    .page.phoenixPage()
    .navigateToUsingMenu('All files')
})

Then('the files table should be displayed',
  () => {
    return client.page.FilesPageElement.filesList()
      .waitForElementVisible('@filesTable')
  })

Given('the user has browsed to the files page', function () {
  return client
    .page.filesPage()
    .navigateAndWaitTillLoaded()
})

When('the user creates a folder with the name {string} using the webUI', function (folderName) {
  return client.page.filesPage().createFolder(folderName)
})

When('the user creates a folder with default name using the webUI', function () {
  return client.page.filesPage().createFolder(null, false)
})

When('the user creates a folder without name using the webUI', function () {
  return client.page.filesPage().createFolder('', false)
})

When('the user creates a folder with the invalid name {string} using the webUI', function (folderName) {
  return client.page.filesPage().createFolder(folderName, false)
})

Given('the user has opened folder {string}', (folder) => client.page.FilesPageElement.filesList().navigateToFolder(folder))
When('the user opens folder {string} using the webUI', (folder) => client.page.FilesPageElement.filesList().navigateToFolder(folder))

Given('the user has opened the share dialog for folder {string}', function (fileName) {
  return client.page.FilesPageElement.filesList().openSharingDialog(fileName)
})

When('the user enables the setting to view hidden folders on the webUI', function () {
  return client.page.filesPage().showHiddenFiles()
})

When('the user deletes file/folder {string} using the webUI', function (element) {
  return client.page.FilesPageElement.filesList().deleteFile(element)
})

When('the user deletes the following elements using the webUI', function (table) {
  for (const line of table.rows()) {
    client.page.FilesPageElement.filesList().deleteFile(line[0])
    deletedElements.push(line[0])
  }
  return client.page.filesPage()
})

Then('it should not be possible to delete file {string} using the webUI', function (resource) {
  return client.page.FilesPageElement.filesList().isActionDisabled(resource, 'delete', (isDisabled) => {
    client.assert.strictEqual(isDisabled, true, `Delete action must not be enabled for "${resource}"`)
  })
})

Given('the following files have been deleted by user {string}', function (user, table) {
  for (const line of table.rows()) {
    webdav.delete(user, line[0])
  }
  return client.page.filesPage()
})

When('the user uploads file {string} using the webUI', function (element) {
  return client.page.filesPage().uploadFile(element)
})

Then('it should not be possible to create files using the webUI', function () {
  return client.page.filesPage().canCreateFiles((isDisabled) => {
    client.assert.strictEqual(isDisabled, true, 'Create action must not be enabled')
  })
})

When('the user renames file/folder {string} to {string} using the webUI', function (fromName, toName) {
  return client.page.FilesPageElement.filesList().renameFile(fromName, toName)
})

When('the user renames file/folder {string} to an invalid name {string} using the webUI', function (fromName, toName) {
  return client.page.FilesPageElement.filesList().renameFile(fromName, toName, false)
})

Given('the user has disabled folder filter', () => {
  return client.page.filesPage().toggleFilterFileOrFolder('folder', 'disable')
})

When('the user disables folder filter using the webUI', () => {
  return client.page.filesPage().toggleFilterFileOrFolder('folder', 'disable')
})

When('the user enables folder filter using the webUI', function () {
  return client.page.filesPage().toggleFilterFileOrFolder('folder', 'enable')
})

Given('the user has disabled file filter', () => {
  return client.page.filesPage().toggleFilterFileOrFolder('file', 'disable')
})

When('the user disables file filter using the webUI', () => {
  return client.page.filesPage().toggleFilterFileOrFolder('file', 'disable')
})

When('the user enables file filter using the webUI', function () {
  return client.page.filesPage().toggleFilterFileOrFolder('file', 'enable')
})

Given('the user has marked file/folder {string} as favorite using the webUI', function (path) {
  return client.page.FilesPageElement.filesList().markAsFavorite(path)
})

When('the user marks file/folder {string} as favorite using the webUI', function (path) {
  return client.page.FilesPageElement.filesList().markAsFavorite(path)
})

When('the user unmarks the favorited file/folder {string} using the webUI', function (path) {
  return client.page.FilesPageElement.filesList().unmarkFavorite(path)
})

Then(/there should be no files\/folders listed on the webUI/, function () {
  return client.page.FilesPageElement.filesList().allFileRows(function (result) {
    client.assert.equal(result.value.length, 0)
  })
})

Then('file/folder {string} should be listed on the webUI', function (folder) {
  return client
    .page
    .FilesPageElement.filesList()
    .waitForFileVisible(folder)
})

Then('file/folder {string} should not be listed on the webUI', function (folder) {
  return client.page.FilesPageElement.filesList().assertElementNotListed(folder)
})

Then('the deleted elements should not be listed on the webUI', function () {
  return assertDeletedElementsAreNotListed()
})

Then('the deleted elements should not be listed on the webUI after a page reload', function () {
  client.refresh()
  return assertDeletedElementsAreNotListed()
})

When('the user reloads the current page of the webUI', function () {
  return client.refresh()
})

When('the user marks all files for batch action using the webUI', function () {
  return client.page.FilesPageElement.filesList().checkAllFiles()
})

When('the user batch deletes the marked files using the webUI', function () {
  return client.page.filesPage().deleteAllCheckedFiles()
})

When('the user batch deletes these files using the webUI', function (fileOrFolders) {
  fileOrFolders.rows().forEach(entry => {
    client.page.FilesPageElement.filesList().toggleFileOrFolderCheckbox('enable', entry[0])
    deletedElements.push(entry[0])
  })
  return client.page.filesPage().deleteAllCheckedFiles()
})

When('the user unmarks these files for batch action using the webUI', function (fileOrFolders) {
  fileOrFolders.rows().forEach(entry => {
    client.page.FilesPageElement.filesList().toggleFileOrFolderCheckbox('disable', entry[0])
  })
  return client
})

When('the user marks these files for batch action using the webUI', function (fileOrFolders) {
  fileOrFolders.rows().forEach(entry => {
    client.page.FilesPageElement.filesList().toggleFileOrFolderCheckbox('enable', entry[0])
  })
  return client
})

When('the user batch restores the marked files using the webUI', function () {
  return client.page.FilesPageElement.filesList().restoreSelected()
})

When('the user picks the row of file/folder {string} in the webUI', function (item) {
  return client.page.FilesPageElement.filesList().clickRow(item)
})

When('the user switches to {string} tab in details panel using the webUI', function (tab) {
  return client.page.filesPage().selectTabInSidePanel(tab)
})

Then('the folder should be empty on the webUI', async function () {
  const allFileRows = await client.page.FilesPageElement.filesList().allFileRows()
  return client.assert.equal(allFileRows.value.length, 0)
})

const theseResourcesShouldNotBeListed = function (entryList) {
  entryList.rows().forEach(entry => {
    client.page.FilesPageElement.filesList().assertElementNotListed(entry[0])
  })
  return client
}

/**
 * needs a heading line in the table
 */
Then('these folders/files/resources should not be listed on the webUI', function (entryList) {
  return theseResourcesShouldNotBeListed(entryList)
})

/**
 * needs a heading line in the table
 */
Then('as {string} these folders/files/resources should not be listed on the webUI', async function (user, entryList) {
  if (user !== client.globals.currentUser) {
    await loginHelper.reLoginAsUser(user)
  }
  return theseResourcesShouldNotBeListed(entryList)
})

/**
 * currently this only works with the files page, on other pages the user cannot navigate into subfolders
 *
 * needs a heading line in the table
 */
Then('these folders/files/resources should not be listed in the folder {string} on the webUI', function (folder, entryList) {
  client.page.filesPage().navigateAndWaitTillLoaded(folder)
  return theseResourcesShouldNotBeListed(entryList)
})

/**
 * currently this only works with the files page, on other pages the user cannot navigate into subfolders
 *
 * needs a heading line in the table
 */
Then('as {string} these folders/files/resources should not be listed in the folder {string} on the webUI', async function (user, folder, entryList) {
  if (user !== client.globals.currentUser) {
    await loginHelper.reLoginAsUser(user)
  }
  client.page.filesPage().navigateAndWaitTillLoaded(folder)
  return theseResourcesShouldNotBeListed(entryList)
})

/**
 *
 * @param {DataTable} entryList the list needs a heading line
 */
const theseResourcesShouldBeListed = function (entryList) {
  entryList.rows().forEach(entry => {
    // here each entry is an array with one element,
    // which is the name of the entry from the table
    client.page.FilesPageElement.filesList().waitForFileVisible(entry[0])
  })
  return client
}

/**
 * needs a heading line in the table
 */
Then('these files/folders/resources should be listed on the webUI', function (entryList) {
  return theseResourcesShouldBeListed(entryList)
})

/**
 * currently this only works with the files page, on other pages the user cannot navigate into subfolders
 *
 * needs a heading line in the table
 */
Then('these files/folders/resources should be listed in the folder {string} on the webUI', function (folder, entryList) {
  client.page.filesPage().navigateAndWaitTillLoaded(folder)
  return theseResourcesShouldBeListed(entryList)
})

/**
 * needs a heading line in the table
 */
Then('as {string} these files/folders/resources should be listed on the webUI', async function (user, entryList) {
  if (user !== client.globals.currentUser) {
    await loginHelper.reLoginAsUser(user)
  }
  return theseResourcesShouldBeListed(entryList)
})

/**
 * currently this only works with the files page, on other pages the user cannot navigate into subfolders
 *
 * needs a heading line in the table
 */
Then('as {string} these files/folders/resources should be listed in the folder {string} on the webUI', async function (user, folder, entryList) {
  if (user !== client.globals.currentUser) {
    await loginHelper.reLoginAsUser(user)
  }
  client.page.filesPage().navigateAndWaitTillLoaded(folder)
  return theseResourcesShouldBeListed(entryList)
})

Then('file/folder {string} should be marked as favorite on the webUI', function (path) {
  return client.page.FilesPageElement.filesList().isMarkedFavorite(path, (value) => {
    assert.strictEqual(value, true, `${path} expected to be favorite but was not`)
  })
})

Then('file/folder {string} should not be marked as favorite on the webUI', function (path) {
  return client.page.FilesPageElement.filesList().isMarkedFavorite(path, (value) => {
    assert.strictEqual(value, false, `not expected ${path} to be favorite but was`)
  })
})

Then(/there should be (\d+) files\/folders listed on the webUI/, async function (noOfItems) {
  const allFileRows = await client.page.FilesPageElement.filesList().allFileRows()
  return client.assert.equal(allFileRows.value.length, noOfItems)
})

Then('the folder should be empty on the webUI after a page reload', async function () {
  await client.refresh()
  const allFileRows = await client.page.FilesPageElement.filesList().allFileRows()
  return client.assert.equal(allFileRows.value.length, 0)
})

Then('the app-sidebar should be visible', function () {
  return client.page.filesPage().isSidebarVisible((value) => {
    assert.strictEqual(value, true, 'side-bar should be visible, but is not')
  })
})

Then('the {string} details panel should be visible', function (panel) {
  return client.page.filesPage().isPanelVisible(panel, (value) => {
    assert.strictEqual(value, true, `'${panel}-panel' should be visible, but is not`)
  })
})

Then('no {string} tab should be available in the details panel', function (tab) {
  const tabSelector = client.page.filesPage().getXpathOfLinkToTabInSidePanel()
  return client.page.filesPage()
    .useXpath()
    .waitForElementNotPresent(tabSelector)
})

const assertElementsAreListed = function (elements) {
  for (const element of elements) {
    client.page.FilesPageElement.filesList().assertElementListed(element)
  }
  return client
}

const assertElementsAreNotListed = function (elements) {
  for (const element of elements) {
    client.page.FilesPageElement.filesList().assertElementNotListed(element)
  }
  return client
}

const assertDeletedElementsAreNotListed = function () {
  return assertElementsAreNotListed(deletedElements)
}

const assertDeletedElementsAreListed = function () {
  return assertElementsAreListed(deletedElements)
}

When('the user restores file/folder {string} from the trashbin using the webUI', function (element) {
  return client.page.FilesPageElement.filesList().restoreFile(element)
})

Then('the following files should be listed on the webUI', function (table) {
  return assertElementsAreListed([].concat.apply([], table.rows()))
})

Then('file {string} should be listed in the folder {string} on the webUI', function (file, folder) {
  return client
    .page
    .FilesPageElement
    .filesList()
    .navigateToFolder(folder)
    .waitForFileVisible(file)
})

Then('the deleted elements should be listed on the webUI', function () {
  return assertDeletedElementsAreListed()
})

Given('the user has renamed the following files', function (table) {
  return Promise.all(table.hashes().map((row) => {
    return webdav.move(client.globals.currentUser, row['from-name-parts'], row['to-name-parts'])
  }))
})

Given('user {string} has renamed file/folder {string} to {string}', webdav.move)

Given('the user has created folder {string}', function (fileName) {
  return webdav.createFolder(client.globals.currentUser, fileName)
})

Then('file/folder {string} should not be listed in shared-with-others page on the webUI', function (filename) {
  client.page.sharedWithOthersPage().navigateAndWaitTillLoaded()
  return client.page.FilesPageElement.filesList().assertElementNotListed(filename)
})

Then('file/folder {string} should be listed in shared-with-others page on the webUI', function (filename) {
  client.page.sharedWithOthersPage().navigateAndWaitTillLoaded()
  return client.page.FilesPageElement.filesList().waitForFileVisible(filename)
})
Given('the user has created file {string}', function (fileName) {
  return webdav.createFile(client.globals.currentUser, fileName, '')
})
Given('the user has created the following folders', function (entryList) {
  entryList.rows().forEach(entry => {
    webdav.createFolder(client.globals.currentUser, entry[0])
  })
  return client
})
Given('the user has created the following files', function (entryList) {
  entryList.rows().forEach(entry => {
    webdav.createFile(client.globals.currentUser, entry[0])
  })
  return client
})

When('the user browses to the folder {string} on the files page', (folderName) => {
  const targetFolder = folderName === '/' ? '' : folderName
  return client
    .page.filesPage()
    .navigateAndWaitTillLoaded(targetFolder)
})
When('the user copies the permalink of the current folder using the webUI', function () {
  return client.page.filesPage().copyPermalinkFromFilesAppBar()
})
Then('the clipboard content should match permalink of resource {string}', function (folderName) {
  return client.getClipBoardContent(function (value) {
    webdav.getProperties(folderName, client.globals.currentUser, ['oc:privatelink'])
      .then(folderData => {
        assert.strictEqual(folderData['oc:privatelink'], value)
      })
  })
})
