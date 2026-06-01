@PhotoWall @RequiresTestData
Feature: Photo Wall Grid View
    As a 使用者
    I want to browse all my body photos in a grid layout
    So that I can visually see my body changes over time

Background:
    Given the app is launched
    And at least 3 body photos exist in the database

@AC1 @GridDisplay
Scenario: Display photos in a 3-column grid
    Given I am on the "Photo Wall" tab
    Then I see all body photos arranged in a 3-column grid
    And photos are sorted with the newest first

@AC2 @PhotoPreview
Scenario: Tap to preview a photo
    Given I am on the "Photo Wall" tab
    When I tap on any photo in the grid
    Then a full-screen preview modal opens
    And the photo is displayed in full-screen
    And the taken date is shown below the photo
    And a close button is visible

@AC3 @PreviewClose
Scenario: Close the photo preview
    Given a photo preview modal is open
    When I tap the close button
    Then the modal closes
    And I return to the Photo Wall grid view

@AC4 @EmptyWall
Scenario: Photo wall with no photos
    Given no body photos have been taken
    When I navigate to the "Photo Wall" tab
    Then I see an empty state message encouraging me to take my first photo
