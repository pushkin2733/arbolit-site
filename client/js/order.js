document.addEventListener('DOMContentLoaded', function () {

    const urlParams = new URLSearchParams(window.location.search);
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

    // Предзаполнение данных
    document.getElementById('product-name').value = urlParams.get('product') || 'Не выбрано';

    if (urlParams.get('qty') && urlParams.get('unit')) {
        const unitText = urlParams.get('unit') === 'm3' ? 'м³' : 'шт.';
        document.getElementById('quantity-display').value = `${urlParams.get('qty')} ${unitText}`;
    } else if (urlParams.get('volume')) {
        document.getElementById('quantity-display').value = `${urlParams.get('volume')} м³`;
    }

    if (urlParams.get('price')) {
        document.getElementById('total-price').value = urlParams.get('price') + ' ₽';
    } else {
        document.getElementById('total-price').value = 'Уточняется';
    }

    // Отправка формы
    const form = document.getElementById('order-form');
    
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем...';

        const orderData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            product: document.getElementById('product-name').value,
            quantity: document.getElementById('quantity-display').value,
            price: document.getElementById('total-price').value,
            comment: document.getElementById('comment').value.trim()
        };

        try {
            const response = await fetch(`${apiBaseUrl}/api/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('order-number').textContent = result.orderNumber;
                document.getElementById('success-message').style.display = 'block';
                form.style.display = 'none';
            } else {
                alert('Ошибка сервера: ' + (result.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось подключиться к серверу.\nУбедитесь, что сервер запущен командой: npm run dev');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить заказ';
        }
    });

    // Маска телефона
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0,11);
        if (value.length > 0) {
            value = '+7 (' + value.slice(1,4) + ') ' + value.slice(4,7) + '-' + value.slice(7,9) + '-' + value.slice(9);
        }
        e.target.value = value;
    });
});
