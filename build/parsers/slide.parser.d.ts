import { FillType } from "../types";
export declare const parseSlide: (slideId: any) => Promise<{
    backgrounds: {
        type: FillType;
        value?: any;
        opacity: number;
    }[];
    layers: [any[], any[]];
    theme: {
        colorScheme: {
            name: any;
            colors: {};
        };
        fontScheme: {
            name: any;
            fonts: {
                major: {
                    latin: any;
                    eastAsia: any;
                    complexScript: any;
                };
                minor: {
                    latin: any;
                    eastAsia: any;
                    complexScript: any;
                };
            };
        };
    };
}>;
