module.exports = {
  appId: 'com.personal-okr-manager',
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
    target: 'dmg'
  },
  win: {
    target: 'nsis'
  },
  linux: {
    target: 'AppImage'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  },
  publish: {
    provider: 'github',
    owner: 'crazylxr',
    repo: 'personal-okr'
  }
};