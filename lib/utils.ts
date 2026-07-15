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
