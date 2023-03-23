import { useParams } from 'react-router-dom';

import GlobalStats from './user-info/globalStats';
import UserDetails from './user-info/user-details';




function UserInfo() {
  const { UserId } = useParams();
  
   
  return (
    <div>
       <UserDetails UserId={UserId}/>
       <GlobalStats UserId={UserId}/>
    </div>
  );
}
export default UserInfo;
