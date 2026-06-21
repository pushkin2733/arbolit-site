const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const {
    createOrder,
    updateMailStatus,
    listOrders,
    getOrder,
    dbPath
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const siteDir = path.join(__dirname, '..');
const pages = ['index.html', 'products.html', 'calculator.html', 'order.html'];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/css', express.static(path.join(siteDir, 'css')));
app.use('/js', express.static(path.join(siteDir, 'js')));

app.get('/', (req, res) => {
    res.sendFile(path.join(siteDir, 'index.html'));
});

pages.forEach((page) => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(siteDir, page));
    });
});

const brevoEnabled = Boolean(process.env.BREVO_API_KEY);
const smtpEnabled = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const mailEnabled = process.env.MAIL_ENABLED !== 'false' && (brevoEnabled || smtpEnabled);
const mailProvider = brevoEnabled ? 'brevo' : (smtpEnabled ? 'smtp' : 'disabled');

const transporter = smtpEnabled
    ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.yandex.com',
        port: Number(process.env.EMAIL_PORT || 465),
        secure: process.env.EMAIL_SECURE !== 'false',
        connectionTimeout: 3000,
        greetingTimeout: 3000,
        socketTimeout: 5000,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            servername: process.env.EMAIL_TLS_SERVERNAME || process.env.EMAIL_HOST || 'smtp.yandex.com'
        }
    })
    : null;

function makeOrderNumber() {
    return `AR-${Math.floor(100000 + Math.random() * 900000)}`;
}

function normalizeOrderData(body) {
    return {
        name: String(body.name || '').trim(),
        phone: String(body.phone || '').trim(),
        email: String(body.email || '').trim(),
        product: String(body.product || 'Не выбрано').trim(),
        quantity: String(body.quantity || 'Уточняется').trim(),
        price: String(body.price || 'Уточняется').trim(),
        comment: String(body.comment || '').trim()
    };
}

function describeMailError(error) {
    return [
        error.provider,
        error.code,
        error.command,
        error.responseCode,
        error.response,
        error.status,
        error.statusText,
        error.message
    ].filter(Boolean).join(' | ');
}

function buildOrderEmailHtml(order) {
    return `
            <h2>Новый заказ на арболит</h2>
            <p><strong>Номер заказа:</strong> ${order.orderNumber}</p>
            <p><strong>Дата:</strong> ${order.createdAt}</p>
            <p><strong>Клиент:</strong> ${order.name}</p>
            <p><strong>Телефон:</strong> ${order.phone}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            <p><strong>Продукция:</strong> ${order.product}</p>
            <p><strong>Количество:</strong> ${order.quantity}</p>
            <p><strong>Стоимость:</strong> ${order.price}</p>
            <p><strong>Комментарий:</strong> ${order.comment || '—'}</p>
        `;
}

async function sendBrevoEmail({ subject, html }) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
    const senderName = process.env.BREVO_SENDER_NAME || 'Arbolit';
    const toEmail = process.env.ADMIN_EMAIL || senderEmail;

    if (!senderEmail || !toEmail) {
        const error = new Error('BREVO_SENDER_EMAIL/EMAIL_USER and ADMIN_EMAIL are required for Brevo.');
        error.provider = 'brevo';
        throw error;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    email: senderEmail,
                    name: senderName
                },
                to: [
                    {
                        email: toEmail
                    }
                ],
                subject,
                htmlContent: html
            }),
            signal: controller.signal
        });

        const responseText = await response.text();

        if (!response.ok) {
            const error = new Error(responseText || 'Brevo rejected the email.');
            error.provider = 'brevo';
            error.status = response.status;
            error.statusText = response.statusText;
            throw error;
        }
    } finally {
        clearTimeout(timeout);
    }
}

async function sendConfiguredEmail({ subject, html }) {
    if (brevoEnabled) {
        await sendBrevoEmail({ subject, html });
        return 'sent-brevo';
    }

    if (!transporter) {
        return 'disabled';
    }

    await transporter.sendMail({
        from: `"Арболит" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject,
        html
    });

    return 'sent-smtp';
}

async function sendOrderEmail(order) {
    return sendConfiguredEmail({
        subject: `Новый заказ №${order.orderNumber}`,
        html: buildOrderEmailHtml(order)
    });
}

function sendOrderEmailInBackground(order) {
    if (!mailEnabled) {
        updateMailStatus(order.orderNumber, 'disabled', 'MAIL_ENABLED=false или не указаны EMAIL_USER/EMAIL_PASS');
        return;
    }

    sendOrderEmail(order)
        .then((mailStatus) => {
            updateMailStatus(order.orderNumber, mailStatus, null);
            console.log(`Письмо по заказу ${order.orderNumber}: ${mailStatus}`);
        })
        .catch((error) => {
            const mailError = describeMailError(error);
            updateMailStatus(order.orderNumber, 'failed', mailError);
            console.error(`Ошибка отправки письма по заказу ${order.orderNumber}: ${mailError}`);
        });
}

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        database: dbPath,
        mailEnabled,
        mailProvider
    });
});

app.get('/api/orders', (req, res) => {
    res.json({
        success: true,
        orders: listOrders()
    });
});

app.get('/api/orders/:orderNumber', (req, res) => {
    const order = getOrder(req.params.orderNumber);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Заказ не найден.'
        });
    }

    res.json({
        success: true,
        order
    });
});

app.post('/api/mail/test', async (req, res) => {
    if (!mailEnabled) {
        return res.status(400).json({
            success: false,
            message: 'Почта отключена или не настроена.'
        });
    }

    try {
        const mailStatus = await sendConfiguredEmail({
            subject: 'Тест уведомлений Арболит',
            html: '<p>Если вы получили это письмо, SMTP-уведомления работают.</p>'
        });

        res.json({
            success: true,
            mailStatus,
            message: 'Тестовое письмо отправлено.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: describeMailError(error)
        });
    }
});

app.post('/api/order', (req, res) => {
    const data = normalizeOrderData(req.body);

    if (!data.name || !data.phone || !data.email) {
        return res.status(400).json({
            success: false,
            message: 'Заполните имя, телефон и e-mail.'
        });
    }

    const order = createOrder({
        ...data,
        orderNumber: makeOrderNumber(),
        createdAt: new Date().toLocaleString('ru-RU'),
        status: 'new',
        mailStatus: mailEnabled ? 'pending' : 'disabled'
    });

    sendOrderEmailInBackground(order);

    res.json({
        success: true,
        orderNumber: order.orderNumber,
        mailStatus: order.mailStatus,
        message: mailEnabled
            ? 'Заказ сохранен в базе. Письмо отправляется в фоне.'
            : 'Заказ сохранен в базе. Почтовые уведомления отключены.'
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`База данных заказов: ${dbPath}`);

    if (!mailEnabled) {
        console.log('Почта отключена или не настроена: проверьте MAIL_ENABLED, EMAIL_USER и EMAIL_PASS в server/.env.');
    }
});
