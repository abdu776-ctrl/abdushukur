import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, locale: string = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function exportToWord(elementId: string, filename: string) {
  if (typeof window === 'undefined') {
    throw new Error('Word export must run in the browser');
  }

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Preview element "#${elementId}" not found. Open the preview and try again.`);
  }

  // Word opens an HTML document saved with a .doc extension. Keeping the
  // preview's inline styles preserves layout, and text stays selectable
  // (unlike the image-based PDF).
  const html =
    `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="utf-8"><title>${filename}</title>` +
    `<style>body{font-family:'Malgun Gothic','Noto Sans KR',sans-serif;} ` +
    `@page{size:A4;margin:1.6cm;}</style></head>` +
    `<body>${element.innerHTML}</body></html>`;

  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToPDF(elementId: string, filename: string) {
  if (typeof window === 'undefined') {
    throw new Error('PDF export must run in the browser');
  }

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Preview element "#${elementId}" not found. Open the preview and try again.`);
  }

  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  // Wait for any images inside the preview (photo, avatars) to finish loading
  // so they are captured instead of appearing blank.
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
    )
  );

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  if (imgHeight <= pageHeight) {
    // Fits on one page.
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    // Taller than one page — slice across multiple A4 pages.
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * Produce a REAL, text-based PDF via the browser's own print pipeline.
 *
 * exportToPDF() above rasterises the preview, so its output is an image: the
 * text is not selectable and an ATS cannot parse it — a serious defect for a
 * résumé. Printing keeps the text as text, and renders Korean correctly using
 * the system fonts, without embedding a multi-megabyte CJK font in the bundle.
 *
 * The target is cloned into a dedicated print root so ancestor scroll
 * containers, sticky headers and overflow rules can't clip the document.
 */
export function printDocument(elementId: string, documentTitle?: string) {
  if (typeof window === 'undefined') {
    throw new Error('Printing must run in the browser');
  }

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Preview element "#${elementId}" not found. Open the preview and try again.`);
  }

  document.getElementById('print-root')?.remove();

  const holder = document.createElement('div');
  holder.id = 'print-root';
  holder.innerHTML = element.outerHTML;
  document.body.appendChild(holder);

  const previousTitle = document.title;
  if (documentTitle) document.title = documentTitle;
  document.documentElement.classList.add('printing');

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.documentElement.classList.remove('printing');
    holder.remove();
    document.title = previousTitle;
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  window.print();
  // Some browsers never fire afterprint — don't leave the clone behind.
  setTimeout(cleanup, 60000);
}
