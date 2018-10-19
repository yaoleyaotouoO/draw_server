const mysql = require('mysql');
const path = require('path');
const fs = require('fs');


const filePath = path.join(__dirname, '../../config.json');
const mysqlConfig = JSON.parse(fs.readFileSync(filePath));

const pool = mysql.createPool(mysqlConfig);

let sqlQuery = (sql, values) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                connection.query(sql, values, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                })
            }
        });
    });
}

module.exports = {
    sqlQuery
}