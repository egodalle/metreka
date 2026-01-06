import React from "react";

interface LogoProps {
  className?: string;
}

export const ShopifyLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 109.5 124.5" fill="currentColor">
    <path d="M95.6 28.4c-.1-.6-.6-1-1.1-1-.5 0-9.3-.2-9.3-.2s-7.4-7.2-8.1-7.9c-.8-.8-2.2-.5-2.8-.3-.1 0-1.5.5-4 1.2-2.4-6.9-6.6-13.2-14-13.2h-.7C53.4 3.5 50.5 2 48.1 2c-17.3 0-25.6 21.6-28.2 32.6-6.7 2.1-11.5 3.5-12.1 3.7C4.5 39.2 4.4 39.3 4 42c-.3 2-8 61.7-8 61.7l60.4 11.3 32.7-8.1S95.7 29 95.6 28.4zM67.3 21.9l-5.5 1.7c0-.4 0-.8 0-1.2 0-3.6-.5-6.5-1.3-8.9 3.3.5 5.4 4.2 6.8 8.4zm-10.7-7.8c.9 2.3 1.5 5.5 1.5 10 0 .3 0 .5 0 .8l-11.3 3.5c2.2-8.3 6.3-12.4 9.8-14.3zm-5.5-5.3c.6 0 1.3.2 1.9.6-4.7 2.2-9.7 7.8-11.8 19l-9 2.8C34.6 22.4 40.5 8.8 51.1 8.8z"/>
    <path d="M94.5 27.4c-.5 0-9.3-.2-9.3-.2s-7.4-7.2-8.1-7.9c-.3-.3-.6-.4-1-.5l-4.6 93.9 32.7-8.1S95.7 29 95.6 28.4c-.1-.5-.6-1-1.1-1z" fill="currentColor" opacity="0.3"/>
    <path d="M56 43.9l-4.4 13c0 0-3.9-2.1-8.6-2.1c-7 0-7.3 4.4-7.3 5.5 0 6 15.7 8.3 15.7 22.4 0 11.1-7 18.2-16.5 18.2-11.4 0-17.2-7.1-17.2-7.1l3-10s6 5.2 11.1 5.2c3.3 0 4.7-2.6 4.7-4.5 0-7.8-12.9-8.2-12.9-21.1 0-10.8 7.8-21.3 23.5-21.3 6.1 0 9 1.8 9 1.8z" fill="#fff"/>
  </svg>
);

export const LazadaLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z" fill="#0F146D"/>
    <path d="M24 8c-8.84 0-16 7.16-16 16s7.16 16 16 16 16-7.16 16-16S32.84 8 24 8z" fill="#F85606"/>
    <path d="M24 12c-6.63 0-12 5.37-12 12s5.37 12 12 12 12-5.37 12-12-5.37-12-12-12z" fill="#0F146D"/>
    <text x="24" y="28" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">L</text>
  </svg>
);

export const ShopeeLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z" fill="#EE4D2D"/>
    <path d="M31.5 18.5c0-4.14-3.36-7.5-7.5-7.5s-7.5 3.36-7.5 7.5h3c0-2.48 2.02-4.5 4.5-4.5s4.5 2.02 4.5 4.5h3z" fill="white"/>
    <path d="M15 20v14c0 2.21 1.79 4 4 4h10c2.21 0 4-1.79 4-4V20H15zm9 12c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z" fill="white"/>
  </svg>
);

export const StoreLogo: React.FC<{ store: string } & LogoProps> = ({ store, className }) => {
  switch (store) {
    case "shopify":
      return <ShopifyLogo className={className} />;
    case "lazada":
      return <LazadaLogo className={className} />;
    case "shopee":
      return <ShopeeLogo className={className} />;
    default:
      return null;
  }
};
