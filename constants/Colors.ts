/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: '#000000',
    icon: '#000000',
    tabIconDefault: '#000000',
    tabIconSelected: '#000000',
    buttonBackground: '#E8E8ED',
    buttonText: '#000000',
    secondaryButtonBackground: '#000000',
    secondaryButtonText: '#FFFFFF',
    progressBar: '#E5E5EA',
    progressBarFill: '#1E1E1E',
    buttonSelectedText: '#FFFFFF',
    gold: '#F0B373',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    buttonBackground: '#2D3133',
    buttonText: '#ECEDEE',
    progressBar: '#374151',
    progressBarFill: '#0a7ea4',
  },
};
