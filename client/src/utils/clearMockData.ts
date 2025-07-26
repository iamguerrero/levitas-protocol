// Utility to clear all mock data from localStorage
export function clearAllMockData() {
  console.log('🧹 Clearing all mock data...');
  
  // Remove all mock-related items
  localStorage.removeItem('mockBalances');
  localStorage.removeItem('liquidatedVaults');
  localStorage.removeItem('liquidationHistory');
  
  // Log what was cleared
  console.log('✅ Mock data cleared:', {
    mockBalances: 'removed',
    liquidatedVaults: 'removed', 
    liquidationHistory: 'removed'
  });
  
  // Trigger storage events to refresh components
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'mockBalances',
    newValue: null
  }));
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'liquidatedVaults', 
    newValue: null
  }));
}

// Auto-clear on page load
if (typeof window !== 'undefined') {
  clearAllMockData();
}