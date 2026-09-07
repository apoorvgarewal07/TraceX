import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';
import { Navbar } from '@/components/Navbar';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>CryptoFraud Trace | Real-Time Blockchain Forensics for Law Enforcement</title>
        <meta
          name="description"
          content="Real-time multi-hop cryptocurrency fraud attribution platform for Indian Law Enforcement (I4C / MHA). Trace stolen crypto, identify exchange cash-out points, and generate legal freeze notices."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
        <Navbar />
        <main className="flex-grow">
          <Component {...pageProps} />
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              fontSize: '13px',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0f172a',
              },
            },
          }}
        />
      </div>
    </>
  );
}
