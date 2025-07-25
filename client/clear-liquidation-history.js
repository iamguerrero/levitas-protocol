// Clear liquidation history from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  window.localStorage.removeItem('liquidationHistory');
  console.log('Liquidation history cleared');
} else {
  console.log('Run this in the browser console to clear liquidation history:');
  console.log("localStorage.removeItem('liquidationHistory');");
}
