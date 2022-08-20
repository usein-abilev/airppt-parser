import { FillType } from "../types";
export declare const getThemeColor: (color: any, theme: any) => {
    type: FillType;
    opacity: number;
    value?: undefined;
} | {
    type: FillType;
    value: any;
    opacity: any;
};
export declare const parseThemeStyles: (theme: any) => {
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
    colorSchemeMap: any;
};
