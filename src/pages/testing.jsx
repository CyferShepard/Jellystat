import {  toast } from 'react-toastify';

import './css/library/libraries.css';




// import LibraryOverView from './components/libraryOverview';
// import HomeStatisticCards from './components/HomeStatisticCards';
// import Sessions from './components/sessions/sessions';
import LibrarySelector from './library_selector';
import { Button } from '@mui/material';



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

  <LibrarySelector/>
  <Button variant="contained" color="primary" onClick={()=>toast.info('Test Info', {autoClose: 15000,})}>Test Toast Info</Button>
  <Button variant="contained" color="success" onClick={()=>toast.success('Test Success', {autoClose: 15000,})}>Test Toast Success</Button>
  <Button variant="contained" color="error"   onClick={()=>toast.error('Test Error', {autoClose: 15000,})}>Test Toast Error</Button>
  <Button variant="contained" color="warning" onClick={()=>toast.warn('Test Warn', {autoClose: 15000,})}>Test Toast Warn</Button>

    </div>

  );
}

export default Testing;
