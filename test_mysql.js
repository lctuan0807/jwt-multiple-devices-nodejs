const mysql = require('mysql2');

// create connection to pool server
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'lctuan',
    database: 'test',
    port: 8811
})

// const connection = mysql.createConnection({
//   host: 'localhost', 
//   user: 'root',
//   password: 'lctuan',
//   database: 'test',
//   port: 8811 // Use the left-side port from your -p mapping
// });

// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to the database: ', err.stack);
//     return;
//   }
//   console.log('Connected to MySQL successfully!');
// });


// // perform sample operation
// pool.query('SELECT * FROM user', (err, results) => {
//     if (err) {
//         console.error('Error executing query:', err);
//         return;
//     }

//     console.log('Query results:', results);

//     pool.end((err) => {
//         if (err) {
//             console.error('Error closing the connection pool:', err);
//         } else {
//             console.log('Connection pool closed successfully.');
//         }
//     });
// });

// insert 1 million records into the database in batches of 100,000
const batchSize = 100000;
const totalRecords = 1000000;

let currentId = 0;

const insertBatch = () => {
    const values = [];
    for (let i = 0; i < batchSize && currentId <= totalRecords; i++) {
        const name = `Name_${currentId + i}`;
        const age = Math.floor(Math.random() * 100) + 1; // Random age between 1 and 100
        const address = `Address_${currentId + i}`;
        values.push([currentId + i, name, age, address]);
        currentId++;
    }
    

    if (!values.length) {
        pool.end((err) => {
            if (err) {
                console.error('Error closing the connection pool:', err);
            } else {
                console.log('Connection pool closed successfully.');
            }
        })
        return;
    }

    const sql = 'INSERT INTO users (id, name, age, address) VALUES ?';
    pool.query(sql, [values], async (err) => {
        if (err) {
            console.error('Error inserting batch:', err);
            return;
        }
        console.log(`Inserted batch of ${values.length} records. Current ID: ${currentId}`);
        await insertBatch(); // Insert the next batch
    });
}

insertBatch();