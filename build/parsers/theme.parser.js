import { ColorType, FillType } from "../types";
export const getThemeColor = (color, theme) => {
    if (!color)
        return { type: FillType.NO_FILL, opacity: 1, };
    if (!theme?.colorScheme?.colors) {
        return {
            type: FillType.VARIABLE,
            value: color,
            opacity: 1,
        };
    }
    const colorMapped = theme.colorSchemeMap[color] || color;
    const colorResolved = theme.colorScheme.colors[colorMapped];
    if (colorResolved) {
        return {
            type: FillType.SOLID,
            value: colorResolved.value,
            opacity: colorResolved.opacity,
        };
    }
    return {
        type: FillType.VARIABLE,
        value: color,
        opacity: 1,
    };
};
export const parseThemeStyles = (theme) => {
    return {
        colorScheme: parseThemeColors(theme),
        fontScheme: parseThemeFonts(theme),
        colorSchemeMap: parseThemeColorMap(theme),
    };
};
const parseThemeColors = (theme) => {
    const colors = theme["a:theme"]["a:themeElements"][0]["a:clrScheme"][0];
    const colorSchemes = {};
    for (let colorScheme in colors) {
        if (colorScheme.startsWith("a:")) {
            const key = colorScheme.substring(2);
            if (colors[colorScheme][0]["a:srgbClr"]) {
                colorSchemes[key] = {
                    type: ColorType.SRGB,
                    value: `#${colors[colorScheme][0]["a:srgbClr"][0]["$"]["val"]}`,
                    opacity: colors[colorScheme][0]["a:srgbClr"][0]["a:alpha"]
                        ? colors[colorScheme][0]["a:srgbClr"][0]["a:alpha"][0]["$"].val / 100000
                        : 1
                };
            }
            if (colors[colorScheme][0]["a:sysClr"]) {
                colorSchemes[key] = {
                    type: ColorType.SYSTEM,
                    value: colors[colorScheme][0]["a:sysClr"][0]["$"]["val"]
                };
            }
        }
    }
    return {
        name: colors["$"]["name"],
        colors: colorSchemes,
    };
};
const parseThemeColorMap = (theme) => {
    const element = theme["a:theme"]["a:extraClrSchemeLst"]?.[0]?.["a:extraClrScheme"]?.[0];
    if (!element)
        return {};
    return element["a:clrMap"][0].$;
};
const parseThemeFonts = (theme) => {
    const fonts = theme["a:theme"]["a:themeElements"][0]["a:fontScheme"][0];
    return {
        name: fonts["$"]["name"],
        fonts: {
            major: {
                latin: fonts["a:majorFont"][0]["a:latin"][0]["$"]["typeface"],
                eastAsia: fonts["a:majorFont"][0]["a:ea"][0]["$"]["typeface"],
                complexScript: fonts["a:majorFont"][0]["a:cs"][0]["$"]["typeface"]
            },
            minor: {
                latin: fonts["a:minorFont"][0]["a:latin"][0]["$"]["typeface"],
                eastAsia: fonts["a:minorFont"][0]["a:ea"][0]["$"]["typeface"],
                complexScript: fonts["a:minorFont"][0]["a:cs"][0]["$"]["typeface"]
            }
        }
    };
};
