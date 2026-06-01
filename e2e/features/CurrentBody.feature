@CurrentBody @RequiresPermissions
Feature: Current Body Photo Management
    As a 使用者
    I want to capture and view my current body photo
    So that I can track my physical appearance over time

Background:
    Given the app is launched
    And camera and photo library permissions are granted

@AC1 @CapturePhoto
Scenario: Capture a new body photo with camera
    Given I am on the "Current Body" tab
    When I tap the camera FAB button
    And I select "Take Photo"
    And the camera opens in 3:4 aspect ratio
    And I take a photo
    Then the alignment screen appears with a silhouette overlay
    When I adjust the photo position to align with the silhouette
    And I tap "Confirm"
    Then the photo is saved to local storage in 4 sizes (thumb, grid, detail, full)
    And the "Current Body" page displays the newly captured photo

@AC2 @UploadPhoto
Scenario: Upload a photo from the photo library
    Given I am on the "Current Body" tab
    When I tap the camera FAB button
    And I select "Choose from Library"
    And I select a photo with 3:4 aspect ratio
    Then the alignment screen appears with a silhouette overlay
    When I tap "Confirm"
    Then the photo is saved to local storage
    And the "Current Body" page displays the uploaded photo

@AC3 @EmptyState
Scenario: First launch with no photos
    Given I am on the "Current Body" tab
    And no body photos have been taken yet
    Then I see an empty state with a guidance message
    And the camera FAB button is visible

@AC4 @AlignCancel
Scenario: Cancel alignment screen
    Given I have taken a photo and am on the alignment screen
    When I tap "Cancel"
    Then I return to the "Current Body" page
    And no photo is saved

@AC5 @PermissionDenied
Scenario: Camera permission denied
    Given camera permission has been denied
    When I tap the camera FAB button
    And I select "Take Photo"
    Then I see a permission guidance message explaining how to enable camera access
