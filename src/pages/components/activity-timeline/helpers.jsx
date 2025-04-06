export const MEDIA_TYPES = {
  Movies: "movies",
  Shows: "tvshows",
  Music: "music",
};

/**
 * groups subsequent seasons of shows into single entries with a combined label and timeframe
 * @param {*} timelineEntries List of entries as returned by /api/getActivityTimeLine
 * @returns Same list of entries, seasons of the same show that follow each other will be merged into one entry
 */
export function groupAdjacentSeasons(timelineEntries) {
  return timelineEntries
    .reverse()
    .map((entry, index, entryArray) => {
      if (entry?.MediaType === MEDIA_TYPES.Shows) {
        let potentialNextSeasonIndex = index + 1;
        //if the next entry is another season of the same show, merge them
        if (entry.Title === entryArray[potentialNextSeasonIndex]?.Title) {
          let highestSeasonName = entry.SeasonName;
          let lastSeasonInSession;
          let totalEpisodeCount = +entry.EpisodeCount;
          //merge all further seasons as well
          while (entry.Title === entryArray[potentialNextSeasonIndex]?.Title) {
            const potentialNextSeason = entryArray[potentialNextSeasonIndex];
            if (entry.Title === potentialNextSeason?.Title) {
              lastSeasonInSession = potentialNextSeason;
              totalEpisodeCount += +potentialNextSeason.EpisodeCount ?? 0;
              //remove season from list after usage
              entryArray[potentialNextSeasonIndex] = undefined;

              //hack: in my db the seasons weren't always sorted correctly.
              if (
                highestSeasonName?.localeCompare(
                  lastSeasonInSession.SeasonName
                ) === -1
              ) {
                highestSeasonName = lastSeasonInSession.SeasonName;
              }
            } else {
              //all subsequent seasons have been merged into one entry and were removed from the list
              break;
            }
            potentialNextSeasonIndex++;
          }
          const newSeasonName = `${entry.SeasonName} - ${highestSeasonName}`;
          const newLastActivityDate = lastSeasonInSession.LastActivityDate;
          return {
            ...entry,
            SeasonName: newSeasonName,
            LastActivityDate: newLastActivityDate,
            EpisodeCount: totalEpisodeCount,
          };
        }
      }
      return entry;
    })
    .filter((entry) => !!entry)
    .reverse();
}
