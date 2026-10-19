import { addComplaintCanvasPages, waitForComplaintImages } from './complaint-pdf';
import jsPDF from 'jspdf';

describe('Complaint PDF export', () => {
  it('exports the bottom AFTER photo on additional pages', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 2500;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'white';
    context.fillRect(0, 0, 800, 2500);
    context.fillStyle = 'green';
    context.fillRect(0, 2300, 800, 200);
    const addPage = jasmine.createSpy();
    const addImage = jasmine.createSpy();
    const pdf = {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addPage, addImage
    } as unknown as jsPDF;
    addComplaintCanvasPages(pdf, canvas);
    expect(addPage).toHaveBeenCalledTimes(2);
    expect(addImage).toHaveBeenCalledTimes(3);
    const heights = addImage.calls.allArgs().map(args => args[5]);
    expect(heights.every(height => height <= 277)).toBeTrue();
    expect(heights.reduce((sum, height) => sum + height, 0)).toBeCloseTo(2500 * 190 / 800);
  });

  it('waits for all attached images before capture', async () => {
    const element = document.createElement('div');
    const image = document.createElement('img');
    Object.defineProperty(image, 'complete', { value: false });
    element.appendChild(image);
    const waiting = waitForComplaintImages(element);
    image.dispatchEvent(new Event('load'));
    await expectAsync(waiting).toBeResolved();
  });

  it('rejects failed photos instead of silently exporting an incomplete record', async () => {
    const element = document.createElement('div');
    const image = document.createElement('img');
    Object.defineProperty(image, 'complete', { value: true });
    Object.defineProperty(image, 'naturalWidth', { value: 0 });
    element.appendChild(image);
    await expectAsync(waitForComplaintImages(element)).toBeRejectedWithError(/could not be loaded/);
  });
});
