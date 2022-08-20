import { FillType } from "../types";
export declare const parseSolidFill: (solidFill: any) => {
    type: FillType;
    opacity: number;
    value?: undefined;
} | {
    type: FillType;
    value: any;
    opacity: any;
};
export declare const parseGradientFill: (gradFill: any) => any;
export declare const parseBlipFill: (blipFill: any) => {
    type: FillType;
    value: {
        id: any;
        stretch: {
            type: string;
            fillRect: {
                x: number;
                y: number;
                cx: number;
                cy: number;
            };
        };
    };
    opacity: number;
};
export declare const parseGroupFill: (groupFill: any) => {
    type: FillType;
    opacity: number;
};
export declare const parsePatternFill: (patternFill: any) => {
    type: FillType;
    opacity: number;
};
