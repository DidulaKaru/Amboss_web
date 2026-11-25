Feature: Admin login brute-force protection
  As the shop owner
  I want repeated failed logins to lock the attacker out
  So that my admin password cannot be guessed

  Background:
    Given the Amboss quote service is running
    And I am connecting from IP "192.0.2.50"

  Scenario: Valid credentials open an admin session
    When I log in as "Dory" with password "poplintu7577"
    Then the response status should be 200
    And a HttpOnly session cookie should be set

  Scenario: Account locks after 5 failed logins
    When I fail to log in 5 times
    Then the response status should be 401
    And the error message should contain "Access locked for 15 minutes"
    When I log in as "Dory" with password "poplintu7577"
    Then the response status should be 429
    And the response should include a Retry-After header
