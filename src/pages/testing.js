import React from 'react';


import './css/library/libraries.css';




// import LibraryOverView from './components/libraryOverview';
// import HomeStatisticCards from './components/HomeStatisticCards';
// import Sessions from './components/sessions/sessions';
import MostActiveUsers from './components/statCards/most_active_users';




function Testing() {


  

// async function getToken(username,password) {
//   const response = await fetch('http://localhost:3003/login', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       username: username,
//       password: password,
//     }),
//   });

//   const data = await response.json();
//   return data.token;
// }

// // Make a GET request with JWT authentication
// async function getDataWithAuth() {
//   try {
//     const token = await getToken('test','pass'); // a function to get the JWT token
//     // console.log(token);
//     localStorage.setItem('token', token);
//   } catch (error) {
//     console.error(error);
//   }
// }
// getDataWithAuth();



  return (
    <div className='Activity'>

  <MostActiveUsers/>

    </div>

  );
}

export default Testing;
