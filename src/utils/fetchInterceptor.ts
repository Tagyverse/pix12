// Suppress alert() from being called for validation warnings
const originalAlert = window.alert;
window.alert = function(message: string) {
  // Check if this is a validation warning from the API
  if (
    typeof message === 'string' && 
    (message.includes('Missing') && message.includes('will be empty'))
  ) {
    console.warn('[PUBLISH WARNINGS]', message);
    return;
  }
  
  // Call the original alert for other messages
  originalAlert.call(window, message);
};

export function initFetchInterceptor() {
  console.log('[FETCH INTERCEPTOR] Initialized - validation warnings will be logged, not shown as alerts');
}
