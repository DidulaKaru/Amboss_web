Feature: Instant 3D-print quotation
  As a maker who has uploaded an STL model
  I want an instant, itemised price
  So that I can decide whether to order without waiting for a human

  Background:
    Given the Amboss quote service is running

  Scenario: Customer gets a price for a valid PLA+ model
    Given I have a 20 mm cube with volume 8 cm³ and surface area 24 cm²
    And I choose material "pla-plus" with 20% infill and 0.20 mm layers
    When I request a quote
    Then the response status should be 200
    And the total price should equal material + machine + handling cost
    And the handling cost should be 250 LKR
    And the recommended machine should contain "A1 Mini"

  Scenario Outline: Out-of-range print settings are rejected
    Given I have a 20 mm cube with volume 8 cm³ and surface area 24 cm²
    And I choose material "pla-plus" with <infill>% infill and <layer> mm layers
    When I request a quote
    Then the response status should be <status>

    Examples:
      | infill | layer | status |
      | 10     | 0.20  | 200    |
      | 100    | 0.40  | 200    |
      | 101    | 0.20  | 400    |
      | 9      | 0.20  | 400    |
      | 20     | 0.41  | 400    |

  Scenario: Unknown material is reported clearly
    Given I have a 20 mm cube with volume 8 cm³ and surface area 24 cm²
    And I choose material "unobtainium" with 20% infill and 0.20 mm layers
    When I request a quote
    Then the response status should be 404
    And the error message should contain "not found"
