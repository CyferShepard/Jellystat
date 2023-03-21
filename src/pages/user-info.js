import { useParams } from 'react-router-dom';

function UserInfo() {
  const { UserId } = useParams();
  
  // Fetch data for the user with the specified userId
  
  return (
    <div>
       <p>{UserId}</p>
    </div>
  );
}
export default UserInfo;
