module.exports = {
  appId: 'com.personal.okr-manager',
  productName: 'Personal OKR Manager',
  directories: {
    output: 'release'
  },
  files: [
    'dist/**/*',
    'node_modules/**/*'
  ],
  mac: {
    category: 'public.app-category.productivity',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ]
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      }
    ]
  }
};