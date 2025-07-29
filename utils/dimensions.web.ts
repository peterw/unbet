// Web-specific implementation of Dimensions
const Dimensions = {
  get: (dim: string) => {
    if (dim === 'window') {
      return {
        width: typeof window !== 'undefined' ? window.innerWidth : 375,
        height: typeof window !== 'undefined' ? window.innerHeight : 812,
        scale: 1,
        fontScale: 1,
      };
    }
    return { width: 0, height: 0, scale: 1, fontScale: 1 };
  },
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
};

export { Dimensions };
export default Dimensions;