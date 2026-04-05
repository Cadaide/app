export enum Platform {
  Linux = "linux",
  Windows = "windows",
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
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
