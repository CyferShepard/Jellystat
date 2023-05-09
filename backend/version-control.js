const GitHub = require('github-api');
const packageJson = require('../package.json');

async function checkForUpdates() {
  const currentVersion = packageJson.version;
  const repoOwner = 'cyfershepard';
  const repoName = 'jellystat';
  const gh = new GitHub();
  const repo = gh.getRepo(repoOwner, repoName);
  let latestVersion;

  try {
    const releases = await repo.listReleases();

    if (releases.data.length > 0) {
      latestVersion = releases.data[0].tag_name;
      console.log(releases.data);
    }
  } catch (error) {
    console.error(`Failed to fetch releases for ${repoName}: ${error.message}`);
  }

  if (latestVersion && latestVersion !== currentVersion) {
    console.log(`A new version (${latestVersion}) of ${repoName} is available.`);
  } else if (latestVersion) {
    console.log(`${repoName} is up to date.`);
  }
  else {
    console.log(`Unable to retrieve latest version`);
  }
}

module.exports = { checkForUpdates };
