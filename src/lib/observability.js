// Basic Observability / Error Tracking Logger
export const logError = (error, context = {}) => {
  console.error('[Observability Error]', error, context);
  if (window.Sentry) {
    window.Sentry.captureException(error, { extra: context });
  }
};

export const logEvent = (eventName, data = {}) => {
  console.log('[Observability Event]', eventName, data);
};
