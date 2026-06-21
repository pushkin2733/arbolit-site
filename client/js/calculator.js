document.addEventListener('DOMContentLoaded', function () {

    // ====================== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ======================
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            document.getElementById('simple').style.display = 'none';
            document.getElementById('advanced').style.display = 'none';
            document.getElementById(this.dataset.tab).style.display = 'block';
        });
    });

    // ====================== ПРОСТОЙ КАЛЬКУЛЯТОР ======================
    document.getElementById('btn-simple').addEventListener('click', function () {
        const select = document.getElementById('product-simple');
        const unit = document.getElementById('unit-simple').value;
        const quantityInput = parseFloat(document.getElementById('quantity-simple').value);

        if (!select.value || !quantityInput || quantityInput <= 0) {
            alert('Выберите марку блока и введите количество больше 0');
            return;
        }

        const option = select.selectedOptions[0];
        const pricePerM3 = parseFloat(option.dataset.price);
        const volumePerBlock = parseFloat(option.dataset.volume);

        let volumeM3 = (unit === 'm3') ? quantityInput : (quantityInput * volumePerBlock);
        let pieces = (unit === 'm3') ? Math.ceil(volumeM3 / volumePerBlock) : quantityInput;

        const totalPrice = Math.round(volumeM3 * pricePerM3);

        document.getElementById('vol-simple').textContent = volumeM3.toFixed(2);
        document.getElementById('pcs-simple').textContent = pieces;
        document.getElementById('price-simple').textContent = totalPrice.toLocaleString('ru-RU');

        document.getElementById('result-simple').style.display = 'block';
    });

    // ====================== РАСШИРЕННЫЙ КАЛЬКУЛЯТОР ======================
    document.getElementById('btn-advanced').addEventListener('click', function () {
        const select = document.getElementById('product-advanced');
        const length = parseFloat(document.getElementById('length').value);
        const height = parseFloat(document.getElementById('height').value);
        const windows = parseFloat(document.getElementById('windows').value) || 0;
        const doors = parseFloat(document.getElementById('doors').value) || 0;

        if (!select.value || isNaN(length) || isNaN(height) || length <= 0 || height <= 0) {
            alert('Выберите марку блока, длину и высоту стен');
            return;
        }

        const option = select.selectedOptions[0];
        const pricePerM3 = parseFloat(option.dataset.price);
        const volumePerBlock = parseFloat(option.dataset.volume);
        const thickness = parseFloat(option.dataset.thickness || 0.3);   // по умолчанию 30 см

        const grossVolume = length * height * thickness;
        const netVolume = Math.max(0, grossVolume - (windows + doors));

        const pieces = Math.ceil(netVolume / volumePerBlock);
        const totalPrice = Math.round(netVolume * pricePerM3);

        document.getElementById('vol-adv').textContent = netVolume.toFixed(2);
        document.getElementById('pcs-adv').textContent = pieces;
        document.getElementById('price-adv').textContent = totalPrice.toLocaleString('ru-RU');

        document.getElementById('result-advanced').style.display = 'block';
    });

    // ====================== КНОПКИ "ОФОРМИТЬ ЗАКАЗ" ======================
    // Простой расчёт
    const orderSimpleBtn = document.querySelector('#simple .order-btn');
    if (orderSimpleBtn) {
        orderSimpleBtn.addEventListener('click', function () {
            const product = document.getElementById('product-simple').value;
            const qty = document.getElementById('quantity-simple').value;
            const unit = document.getElementById('unit-simple').value;
            const vol = document.getElementById('vol-simple').textContent;

            if (!product || !qty) {
                alert('Сначала выполните расчёт');
                return;
            }

            const params = new URLSearchParams({
                product: product,
                qty: qty,
                unit: unit,
                volume: vol || '',
                from: 'simple'
            });

            window.location.href = `order.html?${params.toString()}`;
        });
    }

    // ====================== РАСШИРЕННЫЙ КАЛЬКУЛЯТОР ======================
const btnAdvanced = document.getElementById('btn-advanced');
btnAdvanced.addEventListener('click', function () {
    const select = document.getElementById('product-advanced');
    const length = parseFloat(document.getElementById('length').value);
    const height = parseFloat(document.getElementById('height').value);
    const windows = parseFloat(document.getElementById('windows').value) || 0;
    const doors = parseFloat(document.getElementById('doors').value) || 0;

    if (!select.value || isNaN(length) || isNaN(height) || length <= 0 || height <= 0) {
        alert('Выберите марку блока и заполните длину и высоту стен');
        return;
    }

    const pricePerM3 = parseFloat(select.selectedOptions[0].dataset.price);
    const volumePerBlock = parseFloat(select.selectedOptions[0].dataset.volume);
    const thickness = parseFloat(select.selectedOptions[0].dataset.thickness || 0.2);

    const volumeWall = length * height * thickness;
    const netVolume = Math.max(0, volumeWall - (windows + doors));

    const pieces = Math.ceil(netVolume / volumePerBlock);
    const totalPrice = Math.round(netVolume * pricePerM3);

    // Заполняем основные результаты
    document.getElementById('vol-adv').textContent = netVolume.toFixed(2);
    document.getElementById('pcs-adv').textContent = pieces;
    document.getElementById('price-adv').textContent = totalPrice.toLocaleString('ru-RU');

    document.getElementById('result-advanced').style.display = 'block';

    // Обновляем визуализацию с результатами
    updateWallVisualWithResult(length, height, netVolume, pieces);
});

// ====================== ВИЗУАЛИЗАЦИЯ СТЕНЫ ======================
function updateWallVisual() {
    const length = parseFloat(document.getElementById('length').value) || 0;
    const height = parseFloat(document.getElementById('height').value) || 0;

    document.getElementById('length-label').textContent = `Длина: ${length} м`;
    document.getElementById('height-label').textContent = `Высота: ${height} м`;
}

// Обновлённая функция с результатами после расчёта
function updateWallVisualWithResult(length, height, volume, pieces) {
    const visualVolume = document.getElementById('visual-volume');
    const visualPieces = document.getElementById('visual-pieces');
    const wallResult = document.getElementById('wall-result');

    visualVolume.textContent = volume.toFixed(2);
    visualPieces.textContent = pieces;

    wallResult.style.display = 'block';
}
});