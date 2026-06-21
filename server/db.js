const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const configuredDbPath = process.env.DB_PATH;
const dbPath = configuredDbPath
    ? (path.isAbsolute(configuredDbPath) ? configuredDbPath : path.resolve(__dirname, configuredDbPath))
    : process.env.RAILWAY_VOLUME_MOUNT_PATH
        ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'orders.db')
    : path.join(__dirname, 'orders.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        product TEXT NOT NULL,
        quantity TEXT NOT NULL,
        price TEXT NOT NULL,
        comment TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        mail_status TEXT NOT NULL DEFAULT 'pending',
        mail_error TEXT
    );
`);

const columns = db.prepare('PRAGMA table_info(orders)').all().map((column) => column.name);
if (!columns.includes('mail_error')) {
    db.exec('ALTER TABLE orders ADD COLUMN mail_error TEXT');
}

const insertOrderStatement = db.prepare(`
    INSERT INTO orders (
        order_number,
        created_at,
        name,
        phone,
        email,
        product,
        quantity,
        price,
        comment,
        status,
        mail_status,
        mail_error
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateMailStatusStatement = db.prepare(`
    UPDATE orders
    SET mail_status = ?, mail_error = ?
    WHERE order_number = ?
`);

const listOrdersStatement = db.prepare(`
    SELECT
        id,
        order_number AS orderNumber,
        created_at AS createdAt,
        name,
        phone,
        email,
        product,
        quantity,
        price,
        comment,
        status,
        mail_status AS mailStatus,
        mail_error AS mailError
    FROM orders
    ORDER BY id DESC
`);

const getOrderStatement = db.prepare(`
    SELECT
        id,
        order_number AS orderNumber,
        created_at AS createdAt,
        name,
        phone,
        email,
        product,
        quantity,
        price,
        comment,
        status,
        mail_status AS mailStatus,
        mail_error AS mailError
    FROM orders
    WHERE order_number = ?
`);

function createOrder(order) {
    insertOrderStatement.run(
        order.orderNumber,
        order.createdAt,
        order.name,
        order.phone,
        order.email,
        order.product,
        order.quantity,
        order.price,
        order.comment,
        order.status,
        order.mailStatus,
        order.mailError || null
    );

    return getOrder(order.orderNumber);
}

function updateMailStatus(orderNumber, mailStatus, mailError = null) {
    updateMailStatusStatement.run(mailStatus, mailError, orderNumber);
    return getOrder(orderNumber);
}

function listOrders() {
    return listOrdersStatement.all();
}

function getOrder(orderNumber) {
    return getOrderStatement.get(orderNumber);
}

module.exports = {
    createOrder,
    updateMailStatus,
    listOrders,
    getOrder,
    dbPath
};
