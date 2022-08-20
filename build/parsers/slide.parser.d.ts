interface ISlideParseResult {
    theme: any;
    layers: any[];
    background: any;
    properties: any;
}
export declare const parseSlide: (slideId: any, presentation: any) => Promise<ISlideParseResult>;
export {};
