document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const form = document.getElementById('order-form');
    const status = document.getElementById('form-status');
    const fileInput = document.getElementById('files');
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileList = document.getElementById('file-list');

    const apiBaseUrl = getApiBaseUrl();

    function getApiBaseUrl() {
        const { hostname, protocol, port } = window.location;
        const isLocalPage = protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';
        const isBackendHost = (hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000';

        if (isLocalPage && !isBackendHost) {
            return 'http://localhost:3000';
        }

        return '';
    }

    document.getElementById('product-name').value = urlParams.get('product') || 'Не выбрано';

    if (urlParams.get('qty') && urlParams.get('unit')) {
        const unitText = urlParams.get('unit') === 'm3' ? 'м³' : 'шт.';
        document.getElementById('quantity-display').value = `${urlParams.get('qty')} ${unitText}`;
    } else if (urlParams.get('volume')) {
        document.getElementById('quantity-display').value = `${urlParams.get('volume')} м³`;
    } else {
        document.getElementById('quantity-display').value = 'Уточняется';
    }

    document.getElementById('total-price').value = urlParams.get('price')
        ? `${urlParams.get('price')} ₽`
        : 'Уточняется менеджером';

    function showStatus(message) {
        if (status) {
            status.textContent = message;
            status.style.display = 'block';
        } else {
            alert(message);
        }
    }

    fileUploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        fileList.innerHTML = '';
        const files = Array.from(fileInput.files);

        if (files.length > 2) {
            alert('Можно прикрепить не более 2 файлов.');
            fileInput.value = '';
            return;
        }

        files.forEach((file) => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`Файл ${file.name} слишком большой. Максимум 10 МБ.`);
                return;
            }

            const div = document.createElement('div');
            div.textContent = `✓ ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} МБ)`;
            fileList.appendChild(div);
        });
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const orderData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            product: document.getElementById('product-name').value,
            quantity: document.getElementById('quantity-display').value,
            price: document.getElementById('total-price').value,
            comment: document.getElementById('comment').value.trim()
        };

        if (!orderData.name || !orderData.phone || !orderData.email) {
            alert('Заполните имя, телефон и e-mail.');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Отправляем...';
        if (status) status.style.display = 'none';

        try {
            const response = await fetch(`${apiBaseUrl}/api/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Сервер не принял заявку.');
            }

            document.getElementById('order-number').textContent = result.orderNumber;
            document.getElementById('success-message').style.display = 'block';
            form.style.display = 'none';
        } catch (error) {
            showStatus(`Не удалось отправить заявку: ${error.message}. Проверьте, что сервер запущен на localhost:3000.`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Отправить заказ';
        }
    });

    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', (event) => {
        let value = event.target.value.replace(/\D/g, '');

        if (value.startsWith('8')) value = `7${value.slice(1)}`;
        if (!value.startsWith('7')) value = `7${value}`;
        if (value.length > 11) value = value.slice(0, 11);

        const part1 = value.slice(1, 4);
        const part2 = value.slice(4, 7);
        const part3 = value.slice(7, 9);
        const part4 = value.slice(9, 11);

        let formatted = '+7';
        if (part1) formatted += ` (${part1}`;
        if (part1.length === 3) formatted += ')';
        if (part2) formatted += ` ${part2}`;
        if (part3) formatted += `-${part3}`;
        if (part4) formatted += `-${part4}`;

        event.target.value = formatted;
    });
});
