import jsPDF from 'jspdf';

export async function waitForComplaintImages(element: HTMLElement): Promise<void> {
  await Promise.all(Array.from(element.querySelectorAll('img')).map(image => {
    if (image.complete) {
      if (!image.naturalWidth) throw new Error('An attached complaint photo could not be loaded.');
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        image.removeEventListener('load', loaded);
        image.removeEventListener('error', failed);
      };
      const loaded = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error('An attached complaint photo could not be loaded.')); };
      const timeout = setTimeout(failed, 15000);
      image.addEventListener('load', loaded, { once: true });
      image.addEventListener('error', failed, { once: true });
    });
  }));
}

export function addComplaintCanvasPages(pdf: jsPDF, canvas: HTMLCanvasElement): void {
  const margin = 10;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const height = pdf.internal.pageSize.getHeight() - margin * 2;
  const pixelsPerPage = Math.max(1, Math.floor(height * canvas.width / width));

  // Crop each page so the last photo is not clipped by a single A4 page.
  for (let top = 0; top < canvas.height; top += pixelsPerPage) {
    const page = document.createElement('canvas');
    page.width = canvas.width;
    page.height = Math.min(pixelsPerPage, canvas.height - top);
    const context = page.getContext('2d');
    if (!context) throw new Error('Could not create a PDF page.');
    context.drawImage(canvas, 0, top, canvas.width, page.height, 0, 0, page.width, page.height);
    if (top > 0) pdf.addPage();
    pdf.addImage(page.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin,
      width, page.height * width / page.width);
  }
}
