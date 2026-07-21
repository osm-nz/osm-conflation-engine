import { describe, expect, it } from 'vitest';
import { distanceBetweenBboxes } from '../geo.js';

describe(distanceBetweenBboxes, () => {
  // /--A=B--\
  // \-------/
  it('is 0 when the bboxes fully overlap', () => {
    const a = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 };
    expect(distanceBetweenBboxes(a, a)).toBe(0);
  });

  // /-----\
  // |  A  |
  // \--/--\
  //    |B  |
  //    \---/
  it('is 0 when the bboxes partially overlap', () => {
    const a = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 };
    const b = { minLat: 5, maxLat: 15, minLng: 5, maxLng: 15 };
    expect(distanceBetweenBboxes(a, b)).toBe(0);
  });

  // /-------\
  // |A/---\ |
  // | | B | |
  // | \---/ |
  // \-------/
  it('is 0 when one bbox is inside the other', () => {
    const a = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 };
    const b = { minLat: 2, maxLat: 4, minLng: 2, maxLng: 4 };
    expect(distanceBetweenBboxes(a, b)).toBe(0);
  });

  // /-----|-----\
  // |  A  |  B  |
  // \-----|-----/
  it('is 0 when the bboxes only touch at an edge', () => {
    const a = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 };
    const b = { minLat: 0, maxLat: 10, minLng: 10, maxLng: 20 };
    expect(distanceBetweenBboxes(a, b)).toBe(0);
  });

  //       /--B--\
  //       \-----/
  // /-----\
  // |  A  |
  // \-----/
  it('is 0 when the bboxes only touch at a corner', () => {
    const a = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 };
    const b = { minLat: 10, maxLat: 20, minLng: 10, maxLng: 20 };
    expect(distanceBetweenBboxes(a, b)).toBe(0);
  });

  // /-----\     /-----\
  // |  A  |     |  B  |
  // \-----/     \-----/
  it('measures the gap when separated horizontally (aligned on lat)', () => {
    const a = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 };
    const b = { minLat: 0, maxLat: 10, minLng: 15, maxLng: 20 };
    expect(distanceBetweenBboxes(a, b)).toBe(5);
  });

  // /--B--\
  // \-----/
  //
  // /--A--\
  // \-----/
  it('measures the gap when separated vertically (aligned on lng)', () => {
    const a = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 };
    const b = { minLat: 15, maxLat: 20, minLng: 0, maxLng: 10 };
    expect(distanceBetweenBboxes(a, b)).toBe(5);
  });

  //        /--B--\
  //        \-----/
  //
  // /--A--\
  // \-----/
  it('measures the diagonal distance between the closest corners', () => {
    const a = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 };
    const b = { minLat: 14, maxLat: 20, minLng: 13, maxLng: 20 };
    // gap on lng axis = 13 - 10 = 3, gap on lat axis = 14 - 10 = 4
    // closest points are the corners (10, 10) and (13, 14) -> 3-4-5 triangle
    expect(distanceBetweenBboxes(a, b)).toBe(5);
  });
});
