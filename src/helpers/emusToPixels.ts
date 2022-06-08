
const EMUS_UNIT = 9525;

export default function convertEmusToPixels(emus: number): number {
    return emus / EMUS_UNIT;
}