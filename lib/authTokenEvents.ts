type AuthTokenListener = (hasToken: boolean) => void;

const listeners = new Set<AuthTokenListener>();

export const subscribeToAuthTokenChanges = (listener: AuthTokenListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyAuthTokenChange = (hasToken: boolean) => {
  listeners.forEach((listener) => {
    try {
      listener(hasToken);
    } catch (error) {
      console.warn('Auth token listener failed', error);
    }
  });
};
