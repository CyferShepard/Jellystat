import { useParams } from 'react-router-dom';

import LibraryDetails from './library/library-details';
import LibraryGlobalStats from './library/library-stats';
import LibraryLastWatched from './library/last-watched';
import RecentlyPlayed from './library/recently-added';




function LibraryInfo() {
  const { LibraryId } = useParams();
  
   
  return (
    <div>
       <LibraryDetails LibraryId={LibraryId}/>
       <LibraryGlobalStats LibraryId={LibraryId}/>
       <RecentlyPlayed LibraryId={LibraryId}/>
       <LibraryLastWatched LibraryId={LibraryId}/>
    </div>
  );
}
export default LibraryInfo;
