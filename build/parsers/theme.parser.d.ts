export declare const getThemeColor: (theme: any, color: any) => any;
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
};
