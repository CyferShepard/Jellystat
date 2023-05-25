
const db = require("./db");



const {jf_logging_columns,jf_logging_mapping,} = require("./models/jf_logging");
const express = require("express");
const router = express.Router();

router.get("/getLogs", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM jf_logging order by "TimeRun" desc LIMIT 50 `);
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});


async function insertLog(logItem)
{
  try {
   
   
    await db.insertBulk("jf_logging",logItem,jf_logging_columns);
      // console.log(result); 
  
     } catch (error) {
      console.log(error);
     return [];
   }
   
}


module.exports = 
{router,insertLog};
