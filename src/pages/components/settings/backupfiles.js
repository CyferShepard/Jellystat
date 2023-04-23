import React, { useState,useEffect } from "react";
import axios from "axios";
import  Button  from "react-bootstrap/Button";
import  Alert  from "react-bootstrap/Alert";



import "../../css/settings/backups.css";
import { Table } from "react-bootstrap";


export default function BackupFiles() {
    const [files, setFiles] = useState([]);
    const [showAlert, setshowAlert] = useState({visible:false,type:'danger',title:'Error',message:''});
    const token = localStorage.getItem('token');

    useEffect(() => {

        const fetchData = async () => {
          try {
            const backupFiles = await axios.get(`/data/files`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            setFiles(backupFiles.data);
          } catch (error) {
            console.log(error);
          }
        };
    
        fetchData();
    
        const intervalId = setInterval(fetchData, 60000 * 5);
        return () => clearInterval(intervalId);
      }, [files,token]);



      async function downloadBackup(filename) {
        const url=`/data/files/${filename}`;
        axios({
            url: url,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            method: 'GET',
            responseType: 'blob',
          }).then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
          });
      }

      async function deleteBackup(filename) {
        const url=`/data/files/${filename}`;
        axios
        .delete(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
            setshowAlert({visible:true,title:'Success',type:'success',message:response.data});
        })
        .catch((error) => {
            setshowAlert({visible:true,title:'Error',type:'danger',message:error.response.data});
        });


      }

      function formatFileSize(sizeInBytes) {
        const sizeInKB = sizeInBytes / 1024; // 1 KB = 1024 bytes
        if (sizeInKB < 1024) {
          return `${sizeInKB.toFixed(2)} KB`;
        } else {
          const sizeInMB = sizeInKB / 1024; // 1 MB = 1024 KB
          if (sizeInMB < 1024) {
            return `${sizeInMB.toFixed(2)} MB`;
          } else {
            const sizeInGB = sizeInMB / 1024; // 1 GB = 1024 MB
            if (sizeInGB < 1024) {
              return `${sizeInGB.toFixed(2)} GB`;
            } else {
              const sizeInTB = sizeInGB / 1024; // 1 TB = 1024 GB
              if (sizeInTB < 1024) {
                return `${sizeInTB.toFixed(2)} TB`;
              } else {
                const sizeInPB = sizeInTB / 1024; // 1 PB = 1024 TB
                return `${sizeInPB.toFixed(2)} PB`;
              }
            }
          }
        }
      }

  


      const options = {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      };

    function handleCloseAlert() {
      setshowAlert({visible:false});
    }
    
      return (
        <div>
          <h1 className="my-2">Backups</h1>
            {showAlert && showAlert.visible && (
                <Alert variant={showAlert.type} onClose={handleCloseAlert} dismissible>
                  <Alert.Heading>{showAlert.title}</Alert.Heading>
                  <p>
                  {showAlert.message}
                  </p>
                </Alert>
            )}
          <Table>
            <thead>
                <tr>
                    <th>File Name</th>
                    <th>Date Created</th>
                    <th>Size</th>
                    <th></th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {files &&
                 files.sort((a, b) =>new Date(b.datecreated) - new Date(a.datecreated)).map((file, index) => (
                  <tr key={index}>
                        <td>{file.name}</td>
                        <td>{Intl.DateTimeFormat('en-UK', options).format(new Date(file.datecreated))}</td>
                        <td>{formatFileSize(file.size)}</td>
                        <td ><Button type="button" onClick={()=>downloadBackup(file.name)}  >Download</Button></td>
                        <td ><Button type="button" className="btn-danger" onClick={()=>deleteBackup(file.name)}  >Delete</Button></td>
                  </tr>
                ))}
                {files.length===0 ? <tr><td colSpan="5" style={{ textAlign: "center", fontStyle: "italic" ,color:"gray"}}>No Backups Found</td></tr> :''}
            </tbody>
          </Table>
         
        </div>
      );


}