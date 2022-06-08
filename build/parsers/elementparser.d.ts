/**
 * Entry point for all Parsers
 */
declare class PowerpointElementParser {
    private slideShowGlobals;
    private slideShowTheme;
    private element;
    constructor(slideShowGlobals: any, slideShowTheme: any);
    getProcessedElement(rawElement: any, slideRelationships: any): {
        name: string;
        shapeType: import("airppt-models/pptelement").ElementType;
        specialtyType: import("airppt-models/pptelement").SpecialityType;
        position: {
            x: number;
            y: number;
        };
        offsetPosition: {
            x: number;
            y: number;
        };
        paragraph: {
            text: string;
            textCharacterProperties: {
                fontAttributes: import("airppt-models/pptelement").FontAttributes[];
                font: string;
                size: number;
                fillColor: string;
            };
            paragraphProperties: {
                alignment: import("airppt-models/pptelement").TextAlignment;
            };
        };
        shape: {
            fill: {
                type: import("airppt-models/pptelement").FillType;
                color: string;
            };
            border: {
                color: any;
                thickness: any;
                type: import("airppt-models/pptelement").BorderType;
            };
            opacity: number;
        };
        links: {
            type: import("airppt-models/pptelement").LinkType;
            url: any;
        };
        raw: any;
    };
}
export default PowerpointElementParser;
