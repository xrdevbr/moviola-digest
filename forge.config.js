module.exports = {
  packagerConfig: {
    icon: './static/icon',
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'Moviola Digest',
        setupExe: 'Moviola-Digest.exe',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        arch: ['x64'],
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        arch: ['arm64'],
      },
    }
  ],
};