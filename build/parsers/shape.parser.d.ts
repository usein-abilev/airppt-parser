import { FillType } from "../types";
export declare const parseSlideShapes: (shapeTree: any, props?: {}) => any[];
export declare const parseTextContent: (textContent: any, props: any) => any;
export declare const parseListStyle: (levelStyle: any) => any;
export declare const parseBoundingBox: (element: any) => {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare const parseShapeGeometry: (shapeProperties: any) => {
    type: any;
    path?: undefined;
} | {
    type: string;
    path: {
        size: {
            width: number;
            height: number;
        };
        points: any;
        moveTo: {
            x: number;
            y: number;
        };
    };
};
export declare const parseShapeFill: (shape: any, props: any) => {
    type: FillType;
    value?: any;
    opacity: number;
};
