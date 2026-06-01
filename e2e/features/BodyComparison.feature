@BodyComparison @RequiresTestData
Feature: Body Shape Comparison
    As a 使用者
    I want to compare two body photos side-by-side
    So that I can see my physical progress between two time points

Background:
    Given the app is launched
    And at least 2 body photos taken on different dates exist

@AC1 @SelectPhotos
Scenario: Select two photos for comparison
    Given I am on the "Body Comparison" tab
    When I tap the left photo slot
    Then a photo selection sheet appears showing all available photos as thumbnails
    When I select the oldest photo
    And I tap the right photo slot
    And I select the most recent photo
    Then both photos are displayed side-by-side
    And each photo shows its taken date below
    And the time difference between the two dates is displayed

@AC2 @PinchZoom
Scenario: Pinch to zoom on comparison photos
    Given two photos are displayed side-by-side on the comparison page
    When I use two fingers to pinch-zoom on the left photo
    Then the left photo zooms in independently
    When I use two fingers to pinch-zoom on the right photo
    Then the right photo zooms in independently
    And the left photo zoom state is unaffected

@AC3 @EmptyComparison
Scenario: Comparison page with no photos selected
    Given I am on the "Body Comparison" tab
    And no photos have been selected yet
    Then I see an empty state with instructions to select photos
    And both left and right slots show a placeholder

@AC4 @ReplacePhoto
Scenario: Replace a selected photo
    Given two photos are already selected for comparison
    When I tap on the currently selected left photo slot
    Then the photo selection sheet opens
    When I choose a different photo
    Then the left slot updates with the newly selected photo

@AC5 @InsufficientPhotos
Scenario: Comparison page with only one photo in library
    Given only one body photo exists in the database
    When I navigate to the "Body Comparison" tab
    Then I see a message indicating at least 2 photos are needed for comparison
