document.addEventListener('DOMContentLoaded', () => {
    const money = new Intl.NumberFormat('ru-RU');

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((item) => item.classList.remove('active'));
            tab.classList.add('active');

            document.getElementById('simple').style.display = 'none';
            document.getElementById('advanced').style.display = 'none';
            document.getElementById(tab.dataset.tab).style.display = 'block';
        });
    });

    const productFromUrl = new URLSearchParams(window.location.search).get('product');
    const productMap = {
        wall: 'Стеновой блок D600',
        belt: 'Армопоясной блок',
        partition: 'Перегородочный блок'
    };

    if (productMap[productFromUrl]) {
        ['product-simple', 'product-advanced'].forEach((id) => {
            const select = document.getElementById(id);
            const option = Array.from(select.options).find((item) => item.value === productMap[productFromUrl]);
            if (option) select.value = option.value;
        });
    }

    function readProduct(selectId) {
        const select = document.getElementById(selectId);
        if (!select.value) return null;

        const option = select.selectedOptions[0];
        return {
            name: select.value,
            pricePerM3: Number(option.dataset.price),
            volumePerBlock: Number(option.dataset.volume),
            thickness: Number(option.dataset.thickness)
        };
    }

    function showSimpleResult(result) {
        document.getElementById('vol-simple').textContent = result.volumeM3.toFixed(2);
        document.getElementById('pcs-simple').textContent = result.pieces;
        document.getElementById('price-simple').textContent = money.format(result.totalPrice);
        document.getElementById('result-simple').style.display = 'block';
    }

    function showAdvancedResult(result) {
        document.getElementById('vol-adv').textContent = result.volumeM3.toFixed(2);
        document.getElementById('pcs-adv').textContent = result.pieces;
        document.getElementById('price-adv').textContent = money.format(result.totalPrice);
        document.getElementById('result-advanced').style.display = 'block';
    }

    document.getElementById('btn-simple').addEventListener('click', () => {
        const product = readProduct('product-simple');
        const unit = document.getElementById('unit-simple').value;
        const quantity = Number(document.getElementById('quantity-simple').value);

        if (!product || !Number.isFinite(quantity) || quantity <= 0) {
            alert('Выберите марку блока и введите количество больше 0.');
            return;
        }

        const volumeM3 = unit === 'm3' ? quantity : quantity * product.volumePerBlock;
        const pieces = unit === 'm3' ? Math.ceil(volumeM3 / product.volumePerBlock) : Math.ceil(quantity);
        const totalPrice = Math.round(volumeM3 * product.pricePerM3);

        showSimpleResult({ volumeM3, pieces, totalPrice });
    });

    document.getElementById('btn-advanced').addEventListener('click', () => {
        const product = readProduct('product-advanced');
        const length = Number(document.getElementById('length').value);
        const height = Number(document.getElementById('height').value);
        const windows = Number(document.getElementById('windows').value) || 0;
        const doors = Number(document.getElementById('doors').value) || 0;

        if (!product || !Number.isFinite(length) || !Number.isFinite(height) || length <= 0 || height <= 0) {
            alert('Выберите марку блока, длину и высоту стен.');
            return;
        }

        const openingsArea = Math.max(0, windows + doors);
        const wallArea = Math.max(0, length * height - openingsArea);
        const volumeM3 = wallArea * product.thickness;
        const pieces = Math.ceil(volumeM3 / product.volumePerBlock);
        const totalPrice = Math.round(volumeM3 * product.pricePerM3);

        showAdvancedResult({ volumeM3, pieces, totalPrice });
    });

    document.querySelector('#simple .order-btn').addEventListener('click', () => {
        const product = readProduct('product-simple');
        const quantity = document.getElementById('quantity-simple').value;
        const unit = document.getElementById('unit-simple').value;
        const volume = document.getElementById('vol-simple').textContent;
        const price = document.getElementById('price-simple').textContent.replace(/\s/g, '');

        if (!product || !volume) {
            alert('Сначала выполните расчет.');
            return;
        }

        const params = new URLSearchParams({
            product: product.name,
            qty: quantity,
            unit,
            volume,
            price,
            from: 'simple'
        });

        window.location.href = `order.html?${params.toString()}`;
    });

    document.querySelector('#advanced .order-btn').addEventListener('click', () => {
        const product = readProduct('product-advanced');
        const volume = document.getElementById('vol-adv').textContent;
        const pieces = document.getElementById('pcs-adv').textContent;
        const price = document.getElementById('price-adv').textContent.replace(/\s/g, '');

        if (!product || !volume) {
            alert('Сначала выполните расчет.');
            return;
        }

        const params = new URLSearchParams({
            product: product.name,
            qty: pieces,
            unit: 'pcs',
            volume,
            price,
            from: 'advanced'
        });

        window.location.href = `order.html?${params.toString()}`;
    });
});
