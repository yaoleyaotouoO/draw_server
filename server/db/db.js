const mysql = require('mysql');

const pool = mysql.createPool({
    host: '47.106.185.178',
    user: 'root',
    password: 'Xjx13874731322',
    port: '3306',
    database: 'draw'
});

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