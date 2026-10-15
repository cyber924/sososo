import React, { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App.js';
import type { InitialPageData } from '../App.js';
export function renderPage(data: InitialPageData): string {
  return renderToString(<StrictMode><App initialData={data} /></StrictMode>);
}
