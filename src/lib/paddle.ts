import { initializePaddle, type Paddle, type Environments } from '@paddle/paddle-js';

let paddlePromise: Promise<Paddle | undefined> | null = null;

function resolveEnvironment(): Environments {
  const explicit = import.meta.env.VITE_PADDLE_ENVIRONMENT as string | undefined;
  if (explicit === 'sandbox' || explicit === 'production') {
    return explicit;
  }

  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  if (token?.startsWith('test_')) return 'sandbox';
  return 'production';
}

/** Lazily initialize Paddle.js once per page load. */
export async function getPaddle(): Promise<Paddle> {
  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  if (!token) {
    throw new Error(
      'Paddle client token is not configured. Set VITE_PADDLE_CLIENT_TOKEN in your environment.',
    );
  }

  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token,
      environment: resolveEnvironment(),
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          // Soft signal for listeners; Dashboard also watches ?subscription=success
          window.dispatchEvent(new CustomEvent('metreka:checkout-completed'));
        }
      },
    });
  }

  const paddle = await paddlePromise;
  if (!paddle) {
    throw new Error('Failed to initialize Paddle.js');
  }
  return paddle;
}

export async function openPaddleCheckout(transactionId: string): Promise<void> {
  const paddle = await getPaddle();
  const successUrl = `${window.location.origin}/dashboard?subscription=success`;

  paddle.Checkout.open({
    transactionId,
    settings: {
      successUrl,
      displayMode: 'overlay',
      theme: 'light',
      allowLogout: false,
    },
  });
}

export function hasPaddleClientToken(): boolean {
  return Boolean(import.meta.env.VITE_PADDLE_CLIENT_TOKEN);
}
