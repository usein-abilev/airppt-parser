export const inchToEmus = (inch: number): number => inch * 914400;
export const emusToInch = (emus: number): number => emus / 914400;
export const emusToPoints = (emus: number): number => emusToInch(emus) * 72;