/**
 * isMatchMajorVersion('^1.2.3', '1') -> true
 *
 * support ~version & ^version
 * @param version currentVersion
 * @param majorVersion target majorVersion
 */
export const isMatchMajorVersion = (version: string, majorVersion: string) => {
  return (
    version.startsWith(`^${majorVersion}`) ||
    version.startsWith(`~${majorVersion}`) ||
    version.startsWith(majorVersion)
  );
};

/**
 * safely get deps value from packageJson
 * @param packageJson
 * @param key
 * @returns
 */
export const safeGetDepsFromPkgJSON = (packageJson: any, key: string) => {
  return packageJson?.dependencies?.[key] || packageJson?.devDependencies?.[key];
};

export const crossPlatformNpm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
