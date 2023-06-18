const GitHub = require('github-api');
const packageJson = require('../package.json');
const {compareVersions} =require('compare-versions');

async function checkForUpdates() {
  const currentVersion = packageJson.version;
  const repoOwner = 'cyfershepard';
  const repoName = 'Jellystat';
  const gh = new GitHub();

  let result={current_version: packageJson.version, latest_version:'', message:'', update_available:false};

  let latestVersion;

  try {
    const path = 'package.json';

    const response = await gh.getRepo(repoOwner, repoName).getContents('main', path);
    const content = response.data.content;
    const decodedContent = Buffer.from(content, 'base64').toString();
    latestVersion = JSON.parse(decodedContent).version;

    if (compareVersions(latestVersion,currentVersion) > 0) {
      // console.log(`A new version V.${latestVersion} of ${repoName} is available.`);
      result = { current_version: packageJson.version, latest_version: latestVersion, message: `${repoName} has an update ${latestVersion}`, update_available:true };
    } else if (compareVersions(latestVersion,currentVersion) < 0) {
      // console.log(`${repoName} is using a beta version.`);
      result = { current_version: packageJson.version, latest_version: latestVersion, message: `${repoName} is using a beta version`, update_available:false };
    } else {
      // console.log(`${repoName} is up to date.`);
      result = { current_version: packageJson.version, latest_version: latestVersion, message: `${repoName} is up to date`, update_available:false };
    }
  } catch (error) {
    console.error(`Failed to fetch releases for ${repoName}: ${error.message}`);
    result = { current_version: packageJson.version, latest_version: 'N/A', message: `Failed to fetch releases for ${repoName}: ${error.message}`, update_available:false };
  }

  return result;
}



module.exports = { checkForUpdates };
