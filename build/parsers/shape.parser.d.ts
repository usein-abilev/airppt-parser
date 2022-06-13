import { FillType, TextType } from "../types";
export declare const parseSlideShapes: (shapeTree: any, props: any) => any[];
export declare const parseTextBody: (textBody: any, props: any) => {
    type: TextType;
    style: any;
    text?: undefined;
} | {
    type: TextType;
    text: any;
    style: any;
};
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
