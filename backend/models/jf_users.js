////////////////////////// pn delete move to playback
const jf_users_columns = [
  "Id",
  "Name",
  "PrimaryImageTag",
  "LastLoginDate",
  "LastActivityDate",
  "IsAdministrator",
];

const jf_users_mapping = (item) => ({
  Id: item.Id,
  Name: item.Name,
  PrimaryImageTag: item.PrimaryImageTag,
  LastLoginDate: item.LastLoginDate,
  LastActivityDate: item.LastActivityDate,
  IsAdministrator:
    item.Policy && item.Policy.IsAdministrator
      ? item.Policy.IsAdministrator
      : false,
});

module.exports = {
  jf_users_columns,
  jf_users_mapping,
};
