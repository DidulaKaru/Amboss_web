export default {
  paths: ['features/**/*.feature'],
  import: ['features/support/**/*.ts', 'features/steps/**/*.ts'],
  format: ['progress-bar', 'html:reports/cucumber-report.html', 'summary'],
}
