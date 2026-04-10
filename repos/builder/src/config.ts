export enum Platform {
  Linux = "linux",
  Windows = "windows",
  Macos = "macos",
}

export const BuildConfig = {
  platform: getPlatform(),

  outdir: "build",
};

function getPlatform(): Platform {
  const platform = process.argv[2];

  switch (platform) {
    case Platform.Linux:
      return Platform.Linux;
    case Platform.Windows:
      return Platform.Windows;
    case Platform.Macos:
      return Platform.Macos;
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
