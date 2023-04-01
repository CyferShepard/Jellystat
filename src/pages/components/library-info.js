import { useParams } from 'react-router-dom';

import LibraryDetails from './library/library-details';
import LibraryGlobalStats from './library/library-stats';
import LibraryLastPlayed from './library/lastplayed';
import RecentlyPlayed from './library/recently-added';




function LibraryInfo() {
  const { LibraryId } = useParams();
  
   
  return (
    <div>
       <LibraryDetails LibraryId={LibraryId}/>
       <LibraryGlobalStats LibraryId={LibraryId}/>
       <RecentlyPlayed LibraryId={LibraryId}/>
       <LibraryLastPlayed LibraryId={LibraryId}/>
    </div>
  );
}
export default LibraryInfo;
