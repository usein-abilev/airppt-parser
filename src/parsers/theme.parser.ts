import { ColorType } from "../types";

export const getThemeColor = (theme, color) => {
    if (!color) return null;

    let colors = theme["a:theme"]["a:themeElements"][0]["a:clrScheme"][0];
    let targetTheme = "a:" + color;

    if (targetTheme in colors) {
        return colors[targetTheme][0]["a:srgbClr"][0]["$"]["val"];
    }

    return null;
}

export const parseThemeStyles = (theme) => {
    return {
        colorScheme: parseThemeColors(theme),
        fontScheme: parseThemeFonts(theme),
    }
}

const parseThemeColors = (theme) => {
    const colors = theme["a:theme"]["a:themeElements"][0]["a:clrScheme"][0];
    const colorSchemes = {};

    for (let colorScheme in colors) {
        if (colorScheme.startsWith("a:")) {
            const key = colorScheme.substring(2);

            if (colors[colorScheme][0]["a:srgbClr"]) {
                colorSchemes[key] = {
                    type: ColorType.SRGB,
                    value: `#${colors[colorScheme][0]["a:srgbClr"][0]["$"]["val"]}`
                }
            }

            if (colors[colorScheme][0]["a:sysClr"]) {
                colorSchemes[key] = {
                    type: ColorType.SYSTEM,
                    value: colors[colorScheme][0]["a:sysClr"][0]["$"]["val"]
                }
            }
        }
    }

    return {
        name: colors["$"]["name"],
        colors: colorSchemes,
    };
}

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
    }
}