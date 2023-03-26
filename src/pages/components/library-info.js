import { useParams } from 'react-router-dom';

import LibraryDetails from './library/library-details';
import LibraryGlobalStats from './library/library-stats';
import LastLibraryPlayed from './library/lastplayed';




function LibraryInfo() {
  const { LibraryId } = useParams();
  
   
  return (
    <div>
       <LibraryDetails LibraryId={LibraryId}/>
       <LibraryGlobalStats LibraryId={LibraryId}/>
       <LastLibraryPlayed LibraryId={LibraryId}/>
    </div>
  );
}
export default LibraryInfo;
