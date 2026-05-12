export function runSmokeChecks() {
  return {
    navbarPresent: Boolean(document.querySelector('.site-nav')),
    footerPresent: Boolean(document.querySelector('.site-footer')),
    timestamp: new Date().toISOString()
  };
}
