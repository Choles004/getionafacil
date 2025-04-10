document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Management (Consistent) ---
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const body = document.body;
    const themeIcon = themeToggleButton.querySelector('i');
    const sunIcon = 'fa-sun';
    const moonIcon = 'fa-moon';

    function applyTheme(theme) {
        body.classList.remove('dark-theme', 'light-theme');
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            themeIcon.classList.remove(sunIcon);
            themeIcon.classList.add(moonIcon);
            themeToggleButton.setAttribute('aria-label', 'Cambiar a tema claro');
        } else {
            body.classList.add('light-theme');
            themeIcon.classList.remove(moonIcon);
            themeIcon.classList.add(sunIcon);
            themeToggleButton.setAttribute('aria-label', 'Cambiar a tema oscuro');
        }
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.error("Error saving theme to localStorage", e);
        }
    }

    function toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || getDefaultTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        themeToggleButton.classList.add('changing');
        themeIcon.style.transform = 'scale(0)';
        applyTheme(newTheme);
        setTimeout(() => {
            themeToggleButton.classList.remove('changing');
            themeIcon.style.transform = '';
        }, 400);
    }

    function getDefaultTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('theme') === null) {
            return 'dark';
        }
        return localStorage.getItem('theme') || 'light'; // Prioritize saved theme
    }

    // Apply initial theme
    applyTheme(getDefaultTheme());

    themeToggleButton.addEventListener('click', toggleTheme);

    // Listen for system theme changes only if no theme is manually set
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) { // Only apply if user hasn't set a theme
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // --- Elements & Config ---
    const spinnerIconHTML = '<i class="fas fa-spinner fa-spin spinner"></i>'; // Store as HTML string
    let currency = '$';
    let allProducts = [];
    let restaurantTables = [];
    // { orderId: { id, type: 'table'|'delivery', items: [], createdAt, status ('free'/'occupied'/'paying' for table, 'new'/'preparing'/'dispatched'/'delivered'/'paid'/'cancelled' for delivery), tableId?, tableName?, customerName?, customerPhone?, customerAddress?, deliveryNotes?, paymentMethod?, deliveryFee?, preparingAt?, dispatchedAt?, deliveredAt?, paidAt?, cancelledAt?, closedAt?, ... }, ... }
    let activeOrders = {};
    let selectedOrderId = null; // Can be tableId or deliveryOrderId
    let isCashRegisterOpen = false; // Track cash register status

    // Main Layout Elements
    const tablesGridContainer = document.getElementById('tables-grid-container');
    const noTablesViewMsg = document.getElementById('no-tables-view-msg');
    const orderDetailsSection = document.getElementById('order-details-section');
    const detailsOrderTitle = document.getElementById('details-order-title');
    const detailsOrderStatus = document.getElementById('details-order-status');
    const detailsDeliveryInfoBlock = document.getElementById('details-delivery-info');
    const detailsDeliveryCustomer = document.getElementById('details-delivery-customer');
    const detailsDeliveryPhone = document.getElementById('details-delivery-phone');
    const detailsDeliveryAddress = document.getElementById('details-delivery-address');
    const detailsDeliveryNotes = document.getElementById('details-delivery-notes');

    // Order Taking Elements
    const orderProductSearch = document.getElementById('order-product-search');
    const orderSearchResults = document.getElementById('order-search-results');
    const orderItemsUl = document.getElementById('order-items');
    const orderEmptyMsg = document.getElementById('order-empty-msg');
    const orderTimestampsEl = document.getElementById('order-timestamps');

    // Order Footer Elements
    const orderSubtotalEl = document.getElementById('order-subtotal');
    const orderTotalEl = document.getElementById('order-total');
    const orderPaymentMethodButtonsContainer = document.querySelector('#order-details-section .payment .payment-methods');
    const paymentMethodPagoEntrega = document.querySelector('.payment-method[data-method="PagoEntrega"]');
    const orderCashDetails = document.getElementById('order-cash-details');
    const orderCashReceivedInput = document.getElementById('order-cash-received');
    const orderChangeDueEl = document.getElementById('order-change-due');
    const payButton = document.getElementById('pay-button');
    const releaseTableButton = document.getElementById('release-table-button'); // Also used for Cancel Delivery
    const orderSelectedPaymentMethodEl = document.getElementById('order-selected-payment-method');
    const orderError = document.getElementById('order-error');
    const orderErrorSpan = orderError.querySelector('span');
    const printButtonsContainer = document.getElementById('print-buttons-container');
    const printKitchenButton = document.getElementById('print-kitchen-button');
    const printDeliveryButton = document.getElementById('print-delivery-button');

    // Modals & Management Buttons
    const manageMenuButton = document.getElementById('manage-menu-button');
    const manageTablesButton = document.getElementById('manage-tables-button');
    const manageDeliveryButton = document.getElementById('manage-delivery-button');
    const menuModal = document.getElementById('menu-modal');
    const tableModal = document.getElementById('table-modal');
    const deliveryModal = document.getElementById('delivery-modal');
    const newDeliveryOrderModal = document.getElementById('new-delivery-order-modal');

    // Menu Modal Elements
    const menuItemsTableBody = document.getElementById('menu-items-table-body');
    const noMenuItemsMsg = document.getElementById('no-menu-items-msg');

    // Table Modal Elements
    const tableForm = document.getElementById('table-form');
    const tableFormTitle = document.getElementById('table-form-title');
    const tableIdInput = document.getElementById('table-id');
    const tableNameInput = document.getElementById('table-name');
    const tableFormError = document.getElementById('table-form-error');
    const tableFormErrorSpan = tableFormError.querySelector('span');
    const tablesListBody = document.getElementById('tables-list-body');
    const noTablesMsg = document.getElementById('no-tables-msg');
    const saveTableButton = document.getElementById('save-table-button');


    // Delivery Modal Elements
    const newDeliveryOrderButton = document.getElementById('new-delivery-order-button');
    const deliveryOrdersListContainer = document.getElementById('delivery-orders-list');
    const noDeliveryOrdersMsg = document.getElementById('no-delivery-orders-msg');

    // New Delivery Form Elements
    const newDeliveryForm = document.getElementById('new-delivery-form');
    const deliveryOrderIdInput = document.getElementById('delivery-order-id'); // Hidden field for editing later
    const deliveryCustomerNameInput = document.getElementById('delivery-customer-name');
    const deliveryCustomerPhoneInput = document.getElementById('delivery-customer-phone');
    const deliveryCustomerAddressInput = document.getElementById('delivery-customer-address');
    const deliveryNotesInput = document.getElementById('delivery-notes');
    const deliveryInitialPaymentMethodSelect = document.getElementById('delivery-initial-payment-method');
    const newDeliveryFormError = document.getElementById('new-delivery-form-error');
    const newDeliveryFormErrorSpan = newDeliveryFormError.querySelector('span');
    const saveDeliveryOrderButton = document.getElementById('save-delivery-order-button');

    // --- Utility Functions ---
    const formatCurrency = (amount) => {
        const num = typeof amount === 'number' ? amount : 0;
        return `${currency}${num.toFixed(2)}`;
    };

    const displayError = (element, spanElement, message) => {
        spanElement.textContent = message;
        element.classList.remove('hidden');
    };
    const hideError = (element) => element.classList.add('hidden');

    const displayOrderError = (message) => displayError(orderError, orderErrorSpan, message);
    const hideOrderError = () => hideError(orderError);
    const displayTableError = (message) => displayError(tableFormError, tableFormErrorSpan, message);
    const hideTableError = () => hideError(tableFormError);
    const displayDeliveryFormError = (message) => displayError(newDeliveryFormError, newDeliveryFormErrorSpan, message);
    const hideDeliveryFormError = () => hideError(newDeliveryFormError);

    const setLoading = (button, loadingText = "Procesando...") => {
        if (!button) return;
        button.disabled = true;
        const originalContent = button.innerHTML;
        button.dataset.originalContent = originalContent; // Store original content
        const textSpan = button.querySelector('.button-text');
        button.innerHTML = `${spinnerIconHTML} <span class="button-text">${loadingText}</span>`;
    };

    const clearLoading = (button) => {
        if (!button) return;
        button.disabled = false;
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent; // Restore original content
            delete button.dataset.originalContent; // Clean up dataset
        } else {
            // Fallback if original content wasn't stored (shouldn't happen often)
            const spinner = button.querySelector('.spinner');
            if (spinner) spinner.remove();
        }
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return '-';
        try {
            return new Date(isoString).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return 'Fecha inválida';
        }
    };

    const generateUniqueId = (prefix = 'ID') => `${prefix}${Date.now()}${Math.random().toString(16).slice(2, 8)}`;

    // --- Data Loading & Saving ---
    function loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Error loading data for key "${key}":`, e);
            alert(`Error al cargar datos (${key}). La aplicación podría no funcionar correctamente.`);
            return null;
        }
    }

    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving data for key "${key}":`, e);
            alert(`Error crítico al guardar datos (${key}). Los cambios podrían perderse.`);
        }
    }

    function loadInitialConfigAndData() {
        console.log("Loading initial configuration and data...");
        // Config
        const businessName = loadData('businessName') || 'Mi Negocio';
        document.getElementById('business-name-sidebar').textContent = businessName;
        currency = loadData('currency') || '$';        
        const businessType = localStorage.getItem('businessType') || null;

       
        // Data
        allProducts = loadData('productos') || [];
        restaurantTables = loadData('restaurantTables') || [];
        activeOrders = loadData('activeOrders') || {};

        // Data Migration/Normalization (Run once or periodically)
        let ordersModified = false;
        Object.keys(activeOrders).forEach(orderId => {
            const order = activeOrders[orderId];
            if (!order) return; // Skip if order somehow null/undefined

            // Ensure ID field matches key
            if (order.id !== orderId) {
                order.id = orderId;
                ordersModified = true;
            }

            // Ensure 'type' field exists
            if (!order.type) {
                const tableMatch = restaurantTables.find(t => t.id === orderId);
                if (tableMatch) {
                    order.type = 'table';
                    order.tableId = orderId;
                    order.tableName = tableMatch.name;
                    if (!order.status) order.status = 'occupied'; // Default status
                    ordersModified = true;
                } else {
                    console.warn(`Order ${orderId} found without type and no matching table. Assuming it might be an old delivery or orphaned. Check data.`);
                    // Decide action: delete order? Mark as unknown? For now, leave it but log.
                    // delete activeOrders[orderId]; ordersModified = true;
                }
            }

            // Ensure essential fields for tables
            if (order.type === 'table') {
                if (!order.tableId) { order.tableId = order.id; ordersModified = true; }
                if (!order.tableName) {
                    const tableMatch = restaurantTables.find(t => t.id === order.tableId);
                    if (tableMatch) { order.tableName = tableMatch.name; ordersModified = true; }
                }
                if (!order.status) { order.status = 'occupied'; ordersModified = true; } // Default status
            }

            // Ensure essential fields for delivery
            if (order.type === 'delivery') {
                if (!order.status) { order.status = 'new'; ordersModified = true; } // Default status
            }

            // Ensure items array exists
            if (!Array.isArray(order.items)) {
                order.items = [];
                ordersModified = true;
            }
        });

        if (ordersModified) {
            console.log("Normalizing and saving active orders data.");
            saveData('activeOrders', activeOrders);
        }

        // Cash Status (Optional, if needed on this page)
        const cashStatusData = loadData('cashRegisterStatus');
        isCashRegisterOpen = cashStatusData?.isOpen === true;
        // Example: Disable payment if cash register is closed?
        // if (!isCashRegisterOpen) {
        //     console.warn("Cash register is closed. Payment functionality might be limited.");
        // }

        renderTablesGrid(); // Initial render of tables
        console.log("Restaurant data loaded. Tables:", restaurantTables.length, "Active Orders:", Object.keys(activeOrders).length);
    }

    // --- LocalStorage Savers (Wrappers around saveData) ---
    const saveTables = () => saveData('restaurantTables', restaurantTables);
    const saveActiveOrders = () => saveData('activeOrders', activeOrders);
    const saveProducts = () => saveData('productos', allProducts);

    // --- Table Grid Rendering ---
    function renderTablesGrid() {
        tablesGridContainer.innerHTML = ''; // Clear previous grid
        noTablesViewMsg.classList.toggle('hidden', restaurantTables.length > 0);

        if (restaurantTables.length === 0) return;

        // Sort tables alphabetically by name
        const sortedTables = [...restaurantTables].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        sortedTables.forEach(table => {
            const button = document.createElement('button');
            button.className = 'table-item';
            button.dataset.tableId = table.id; // Specific dataset for table grid interaction
            const order = activeOrders[table.id];
            // Determine status: If an order exists, use its status; otherwise, it's 'free'.
            const status = order ? (order.status || 'occupied') : 'free'; // Default to occupied if order exists but status missing

            button.dataset.status = status; // Set status attribute for CSS styling

            let iconClass = 'fa-chair';
            let statusText = 'Libre';
            if (status === 'occupied') { iconClass = 'fa-users'; statusText = 'Ocupada'; }
            else if (status === 'paying') { iconClass = 'fa-file-invoice-dollar'; statusText = 'Pagando'; }
            // Add other table-specific statuses here if needed

            button.innerHTML = `
                <div class="table-name">${table.name || 'Sin Nombre'}</div>
                <i class="fas ${iconClass} table-status-icon"></i>
                <div class="table-status-text">${statusText}</div>
            `;
            // Attach event listener to select the order/table when clicked
            button.addEventListener('click', () => selectOrder(table.id));
            tablesGridContainer.appendChild(button);
        });
    }

    // --- Order Selection & Display (Unified) ---
    function selectOrder(orderId) {
        console.log(`Selecting order/table ID: ${orderId}`);
        selectedOrderId = orderId;
        const order = activeOrders[orderId];

        if (!order) {
            // Handle case where a free table is clicked (no existing order yet)
            const table = restaurantTables.find(t => t.id === orderId);
            if (table) {
                // Display details for a potential new order on this table
                displayOrderDetails({
                    id: table.id, // Use table ID as temporary ID
                    type: 'table',
                    tableId: table.id,
                    tableName: table.name,
                    items: [],
                    createdAt: null,
                    status: 'free' // Indicate it's currently free
                });
                console.log(`Selected free table: ${table.name}. Ready for new order.`);
            } else {
                console.error(`Table with ID ${orderId} not found.`);
                deselectOrder(); // Clear selection if table doesn't exist
                return;
            }
        } else {
            // Display details for the existing order
            displayOrderDetails(order);
        }

        orderDetailsSection.classList.remove('hidden');
        // Scroll details section into view on smaller screens if needed
        if (window.innerWidth < 992) {
            orderDetailsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function displayOrderDetails(order) {
        if (!order || !order.id) {
            console.error("Invalid order object passed to displayOrderDetails", order);
            deselectOrder();
            return;
        }
        selectedOrderId = order.id; // Ensure global state is updated

        // --- Reset UI Elements ---
        detailsDeliveryInfoBlock.classList.add('hidden');
        paymentMethodPagoEntrega.classList.add('hidden');
        releaseTableButton.classList.add('hidden'); // Hide by default, show based on type
        printButtonsContainer.classList.add('hidden'); // Hide by default
        printDeliveryButton.classList.add('hidden'); // Hide delivery print by default
        payButton.querySelector('.button-text').textContent = "Cobrar y Cerrar Cuenta"; // Default text
        releaseTableButton.querySelector('.button-text').textContent = "Liberar Mesa (Sin Cobrar)"; // Default text

        // --- Populate Header ---
        let title = 'Pedido Desconocido';
        let statusText = getStatusText(order.status, order.type); // Use helper function
        detailsOrderStatus.textContent = `Estado: ${statusText}`;

        // --- Populate Content based on Type ---
        if (order.type === 'table') {
            title = `Mesa: ${order.tableName || order.tableId}`;
            releaseTableButton.classList.remove('hidden'); // Show release button
            releaseTableButton.disabled = order.status === 'free'; // Disable if table is free
            printButtonsContainer.classList.remove('hidden'); // Show print container
            printKitchenButton.disabled = !order.items || order.items.length === 0;

        } else if (order.type === 'delivery') {
            title = `Domicilio: #${order.id.substring(order.id.length - 6)}`; // Use last 6 digits
            detailsDeliveryInfoBlock.classList.remove('hidden'); // Show delivery details
            detailsDeliveryCustomer.textContent = order.customerName || 'N/A';
            detailsDeliveryPhone.textContent = order.customerPhone || 'N/A';
            detailsDeliveryAddress.textContent = order.customerAddress || 'N/A';
            detailsDeliveryNotes.textContent = order.deliveryNotes || 'Ninguna';
            paymentMethodPagoEntrega.classList.remove('hidden'); // Show "Pago en Entrega" button

            // Adapt 'Pay' button text
            if (order.status === 'delivered' && order.paymentMethod?.startsWith('PagoEntrega')) {
                payButton.querySelector('.button-text').textContent = "Confirmar Pago y Cerrar";
            }

            // Adapt 'Release' button to 'Cancel Order'
            releaseTableButton.classList.remove('hidden');
            releaseTableButton.querySelector('.button-text').textContent = "Cancelar Pedido";
            releaseTableButton.disabled = ['paid', 'cancelled'].includes(order.status); // Can't cancel if already done

            printButtonsContainer.classList.remove('hidden'); // Show print container
            printDeliveryButton.classList.remove('hidden'); // Show delivery slip button
            printKitchenButton.disabled = !order.items || order.items.length === 0;
            printDeliveryButton.disabled = !order.items || order.items.length === 0;

            // Add Delivery Status Update Controls (Example - more controls needed)
            addDeliveryStatusControls(order);


        } else {
            title = `Pedido: ${order.id}`; // Fallback for unknown type
        }

        detailsOrderTitle.textContent = title;

        // --- Populate Order Items, Totals, Timestamps ---
        renderOrderItems(order.items || []);
        updateOrderTotals(order.items || [], order.deliveryFee); // Pass delivery fee if exists
        displayTimestamps(order);

        // --- Reset Payment & Errors ---
        resetPaymentSelection(); // Reset payment selection for this order
        hideOrderError();

        // --- Update Button States ---
        updateActionButtonsState(order); // Central function to manage button states

        // Focus search input for quick adding
        orderProductSearch.focus();
    }

    function deselectOrder() {
        selectedOrderId = null;
        orderDetailsSection.classList.add('hidden');
        // Clear details panel content
        detailsOrderTitle.textContent = "Selecciona Mesa/Pedido";
        detailsOrderStatus.textContent = "Estado: -";
        orderItemsUl.innerHTML = '';
        orderEmptyMsg.classList.remove('hidden');
        orderSubtotalEl.textContent = formatCurrency(0);
        orderTotalEl.textContent = formatCurrency(0);
        orderTimestampsEl.innerHTML = '';
        detailsDeliveryInfoBlock.classList.add('hidden');
        resetPaymentSelection();
        hideOrderError();
        // Clear any dynamic status controls
        const dynamicControls = orderDetailsSection.querySelector('#delivery-status-controls');
        if (dynamicControls) dynamicControls.remove();
    }

    // --- Order Item Rendering ---
    function renderOrderItems(items) {
        orderItemsUl.innerHTML = ''; // Clear previous items
        orderEmptyMsg.classList.toggle('hidden', items && items.length > 0);

        if (!items || items.length === 0) return;

        items.forEach(item => {
            const li = document.createElement('li');
            // Use productId for identifying the product, cartItemId for unique instance if needed
            li.dataset.productId = item.productId || item.id; // Prefer productId
            li.dataset.cartItemId = item.cartItemId || generateUniqueId('CI'); // Ensure unique cart item ID

            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = item.name || 'Producto Desconocido';
            nameSpan.title = item.name || 'Producto D deesconocido'; // Tooltip for long names

            const qtySpan = document.createElement('span');
            qtySpan.className = 'item-qty';

            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.value = item.quantity;
            qtyInput.min = "0"; // Allow setting to 0 via input, which triggers removal on change
            const isUnitBased = item.unit === 'unidad' || item.unit === 'paquete' || item.unit === 'caja';
            qtyInput.step = isUnitBased ? '1' : '0.01'; // Step for units vs others
            // Use 'change' event for final update after input loses focus or Enter is pressed
            qtyInput.addEventListener('change', (e) => updateOrderItemQuantity(li.dataset.productId, e.target.value));
            // Optional: Use 'input' for live validation/feedback if needed
            // qtyInput.addEventListener('input', (e) => { /* Live validation? */ });

            const decreaseBtn = document.createElement('button');
            decreaseBtn.className = 'qty-btn';
            decreaseBtn.innerHTML = '<i class="fas fa-minus"></i>';
            decreaseBtn.title = "Disminuir Cantidad";
            decreaseBtn.onclick = () => updateOrderItemQuantity(li.dataset.productId, item.quantity - (isUnitBased ? 1 : 0.1)); // Adjust step for non-units?

            const increaseBtn = document.createElement('button');
            increaseBtn.className = 'qty-btn';
            increaseBtn.innerHTML = '<i class="fas fa-plus"></i>';
            increaseBtn.title = "Aumentar Cantidad";
            increaseBtn.onclick = () => updateOrderItemQuantity(li.dataset.productId, item.quantity + (isUnitBased ? 1 : 0.1)); // Adjust step for non-units?

            if (isUnitBased) {
                qtySpan.append(decreaseBtn, qtyInput, increaseBtn);
            } else {
                // For non-unit items, maybe hide +/- buttons or adjust their step?
                // Let's keep input primary for weight/volume
                qtySpan.appendChild(qtyInput);
                const unitLabel = document.createElement('span');
                unitLabel.className = 'item-unit';
                unitLabel.textContent = item.unit || '';
                qtySpan.appendChild(unitLabel);
                // Optionally add +/- buttons for non-units too, adjusting the step in their onclick
                // qtySpan.insertBefore(decreaseBtn, qtyInput);
                // qtySpan.appendChild(increaseBtn);
            }

            const itemSubtotalValue = (item.price || 0) * item.quantity;
            const subtotalSpan = document.createElement('span');
            subtotalSpan.className = 'item-subtotal';
            subtotalSpan.textContent = formatCurrency(itemSubtotalValue);

            const removeSpan = document.createElement('span');
            removeSpan.className = 'item-remove';
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = "Quitar Item";
            removeSpan.appendChild(removeBtn);

            li.append(nameSpan, qtySpan, subtotalSpan, removeSpan);
            orderItemsUl.appendChild(li);
        });
    }

    // --- Order Totals & Timestamps ---
    function updateOrderTotals(items, deliveryFee = 0) {
        const validItems = items || [];
        let subtotal = validItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
        let total = subtotal + (deliveryFee || 0);

        orderSubtotalEl.textContent = formatCurrency(subtotal);
        orderTotalEl.textContent = formatCurrency(total);

        // Recalculate change if cash payment was selected and input has value
        if (orderSelectedPaymentMethod === 'Efectivo' && orderCashReceivedInput.value) {
            handleOrderCashReceivedInput();
        }
        // Update button states as totals might affect payment readiness
        if (selectedOrderId && activeOrders[selectedOrderId]) {
             updateActionButtonsState(activeOrders[selectedOrderId]);
        }
    }

    function displayTimestamps(order) {
        let html = '';
        if (order.createdAt) html += `<span><i class="far fa-clock fa-fw"></i> Creado: ${formatDateTime(order.createdAt)}</span>`;
        if (order.type === 'delivery') {
            if (order.preparingAt) html += `<span><i class="fas fa-fire-alt fa-fw"></i> Preparando: ${formatDateTime(order.preparingAt)}</span>`;
            if (order.dispatchedAt) html += `<span><i class="fas fa-shipping-fast fa-fw"></i> Despachado: ${formatDateTime(order.dispatchedAt)}</span>`;
            if (order.deliveredAt) html += `<span><i class="fas fa-check-circle fa-fw"></i> Entregado: ${formatDateTime(order.deliveredAt)}</span>`;
            if (order.paidAt) html += `<span><i class="fas fa-money-check-alt fa-fw"></i> Pagado: ${formatDateTime(order.paidAt)}</span>`;
            if (order.cancelledAt) html += `<span><i class="fas fa-ban fa-fw"></i> Cancelado: ${formatDateTime(order.cancelledAt)}</span>`;
        }
        orderTimestampsEl.innerHTML = html;
    }

    // --- Add Item to Order ---
    orderProductSearch.addEventListener('input', () => {
        const query = orderProductSearch.value.toLowerCase().trim();
        orderSearchResults.innerHTML = ''; // Clear previous results
        if (query.length < 1 || !selectedOrderId) {
            orderSearchResults.classList.add('hidden'); // Hide if no query or no order selected
            return;
        }

        const filtered = allProducts.filter(p =>
            p.activo !== false && // Only show active products
            ((p.name || '').toLowerCase().includes(query) || (p.sku || '').toLowerCase().includes(query))
        ).slice(0, 10); // Limit results for performance

        if (filtered.length > 0) {
            filtered.forEach(p => {
                const btn = document.createElement('button');
                const stock = p.manageStock ? (p.stock ?? 0) : Infinity;
                const stockInfo = p.manageStock ? `<span class="stock-info" style="font-size:0.8em; color: ${stock <= 0 ? 'var(--danger-color)' : 'var(--text-muted-color)'}">(Stock: ${stock})</span>` : '';
                const priceInfo = `${formatCurrency(p.price || 0)}${p.unit && p.unit !== 'unidad' ? '/'+p.unit : ''}`;
                btn.innerHTML = `${p.name || 'Sin Nombre'} ${stockInfo} <span class="price-info" style="float:right; font-weight: 500;">${priceInfo}</span>`;
                btn.dataset.productId = p.id;
                if (p.manageStock && stock <= 0) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.title = 'Producto agotado';
                } else {
                    btn.addEventListener('click', () => addItemToOrder(p));
                }
                orderSearchResults.appendChild(btn);
            });
            orderSearchResults.classList.remove('hidden'); // Show results container
        } else {
            orderSearchResults.innerHTML = '<div class="no-results" style="padding: 10px 12px;">No se encontraron productos.</div>';
            orderSearchResults.classList.remove('hidden'); // Show "no results" message
        }
    });

    // Close search results on blur, with a delay to allow clicking an item
    orderProductSearch.addEventListener('blur', () => {
        setTimeout(() => {
            // Check if the focus is still within the search results container or the input itself
            if (!orderSearchResults.contains(document.activeElement) && document.activeElement !== orderProductSearch) {
                orderSearchResults.innerHTML = '';
                orderSearchResults.classList.add('hidden');
            }
        }, 200); // Delay in ms
    });

    function addItemToOrder(product) {
        if (!selectedOrderId) { displayOrderError("Selecciona una mesa o pedido primero."); return; }
        hideOrderError();

        let order = activeOrders[selectedOrderId];
        let isNewOrder = false;

        // If no order exists (e.g., free table selected), create it now
        if (!order) {
            const table = restaurantTables.find(t => t.id === selectedOrderId);
            if (table) { // It must be a table if no order exists with this ID yet
                order = {
                    id: selectedOrderId,
                    type: 'table',
                    tableId: selectedOrderId,
                    tableName: table.name,
                    items: [],
                    createdAt: new Date().toISOString(),
                    status: 'occupied' // Mark as occupied immediately
                };
                activeOrders[selectedOrderId] = order;
                isNewOrder = true;
                console.log(`Created new order for table ${table.name}`);
            } else {
                console.error("Cannot add item: Selected ID does not correspond to an existing order or table.");
                displayOrderError("Error interno: No se pudo encontrar la mesa o pedido.");
                return;
            }
        }

        // Find if item already exists in the order
        const existingItemIndex = order.items.findIndex(item => (item.productId || item.id) === product.id);
        const productInStorage = allProducts.find(p => p.id === product.id); // Get full product details
        const currentStock = (productInStorage && productInStorage.manageStock) ? (productInStorage.stock ?? 0) : Infinity;
        const quantityInCart = existingItemIndex > -1 ? order.items[existingItemIndex].quantity : 0;

        // Stock check before adding/incrementing
        if (product.manageStock) {
            if (currentStock <= 0) { displayOrderError(`"${product.name}" está agotado.`); return; }
            if (existingItemIndex > -1 && quantityInCart + 1 > currentStock) {
                 displayOrderError(`No hay suficiente stock de "${product.name}". Disponible: ${currentStock}, En pedido: ${quantityInCart}`); return;
            }
            if (existingItemIndex === -1 && 1 > currentStock) { // Adding first item
                 displayOrderError(`No hay suficiente stock de "${product.name}". Disponible: ${currentStock}`); return;
            }
        }


        if (existingItemIndex > -1) { // Item exists, increment quantity
            const item = order.items[existingItemIndex];
            const isUnitBased = item.unit === 'unidad' || item.unit === 'paquete' || item.unit === 'caja';

            if (isUnitBased) {
                item.quantity++;
            } else {
                // For non-unit items, maybe just focus the input instead of auto-incrementing?
                const inputElement = orderItemsUl.querySelector(`li[data-product-id="${product.id}"] .item-qty input`);
                if (inputElement) {
                    inputElement.focus();
                    inputElement.select();
                    displayOrderError(`Ajusta la cantidad de "${product.name}" manualmente.`); // Inform user
                } else {
                    // Fallback: increment by a small amount if input not found? Or just add 1?
                    item.quantity += 0.1; // Example increment
                }
                // Avoid further processing for non-unit auto-increment here
                // Let manual input handle the update via its 'change' event
                saveActiveOrders(); // Save the order state
                displayOrderDetails(order); // Re-render to show focused input/message
                return; // Stop here for non-unit items
            }
        } else { // New item for the order
            order.items.push({
                productId: product.id,
                cartItemId: generateUniqueId('CI'), // Unique ID for this instance
                name: product.name,
                price: product.price || 0,
                unit: product.unit || 'unidad',
                quantity: 1
            });
        }

        // If it was a newly created table order, update the grid visually
        if (isNewOrder && order.type === 'table') {
            renderTablesGrid(); // Update grid to show table as occupied
        } else if (order.type === 'table' && order.status !== 'occupied') {
            // If adding item to a 'paying' table, maybe revert status to 'occupied'?
            // order.status = 'occupied'; // Decide on workflow
            renderTablesGrid(); // Update grid status if needed
        }

        saveActiveOrders(); // Save the updated order
        displayOrderDetails(order); // Re-render the details panel

        // Clear search
        orderProductSearch.value = '';
        orderSearchResults.innerHTML = '';
        orderSearchResults.classList.add('hidden');
    }

    // --- Update/Remove Order Items ---
    function updateOrderItemQuantity(productId, newQuantityStr) {
        if (!selectedOrderId || !activeOrders[selectedOrderId]) return;
        hideOrderError();
        const order = activeOrders[selectedOrderId];
        const itemIndex = order.items.findIndex(item => (item.productId || item.id) === productId);
        if (itemIndex === -1) { console.warn(`Item with product ID ${productId} not found in order ${selectedOrderId}`); return; }

        const item = order.items[itemIndex];
        let newQuantity = parseFloat(newQuantityStr);

        // Validate quantity
        if (isNaN(newQuantity)) {
            displayOrderError("Cantidad no válida.");
            displayOrderDetails(order); // Re-render to reset input
            return;
        }

        // Remove item if quantity is zero or less
        if (newQuantity <= 0) {
            removeOrderItem(productId); // Calls save and re-render
            return;
        }

        // Stock check
        const productInStorage = allProducts.find(p => p.id === item.productId);
        if (productInStorage && productInStorage.manageStock) {
            const currentStock = productInStorage.stock ?? 0;
            if (newQuantity > currentStock) {
                displayOrderError(`No hay suficiente stock de "${item.name}". Disponible: ${currentStock}`);
                displayOrderDetails(order); // Re-render to reset input
                return;
            }
        }

        // Format quantity (round units, allow decimals otherwise)
        const isUnitBased = item.unit === 'unidad' || item.unit === 'paquete' || item.unit === 'caja';
        if (isUnitBased) {
            newQuantity = Math.round(newQuantity);
        } else {
            newQuantity = parseFloat(newQuantity.toFixed(3)); // Limit decimal places
        }

        // Final check: ensure quantity is positive after formatting
        if (newQuantity <= 0) {
            removeOrderItem(productId);
            return;
        }

        // Update quantity and save
        order.items[itemIndex].quantity = newQuantity;
        saveActiveOrders();
        displayOrderDetails(order); // Re-render the entire details panel
    }

    function removeOrderItem(productId) {
        if (!selectedOrderId || !activeOrders[selectedOrderId]) return;
        const order = activeOrders[selectedOrderId];
        const initialLength = order.items.length;
        order.items = order.items.filter(item => (item.productId || item.id) !== productId);

        // If item was actually removed
        if (order.items.length < initialLength) {
            console.log(`Removed item ${productId} from order ${selectedOrderId}`);
            saveActiveOrders();
            displayOrderDetails(order); // Re-render the panel

            // If the last item was removed from a table order, update grid (it remains 'occupied' but visually might change if styled)
            if (order.type === 'table' && order.items.length === 0) {
                 renderTablesGrid(); // Update table grid display
            }
        }
    }

    // --- Payment Logic ---
    orderPaymentMethodButtonsContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.payment-method');
        if (button && !button.disabled) {
            // Deselect all buttons first
            orderPaymentMethodButtonsContainer.querySelectorAll('.payment-method').forEach(btn => btn.classList.remove('selected'));
            // Select the clicked one
            button.classList.add('selected');
            orderSelectedPaymentMethod = button.dataset.method;
            orderSelectedPaymentMethodEl.textContent = `Seleccionado: ${orderSelectedPaymentMethod}`;
            orderCashDetails.classList.toggle('hidden', orderSelectedPaymentMethod !== 'Efectivo');
            hideOrderError();

            if (orderSelectedPaymentMethod === 'Efectivo') {
                orderCashReceivedInput.focus();
                handleOrderCashReceivedInput(); // Calculate change if value exists
            } else {
                orderCashReceivedInput.value = ''; // Clear cash fields if other method selected
                orderChangeDueEl.textContent = formatCurrency(0);
            }
            // Update button states based on selection
            if (selectedOrderId && activeOrders[selectedOrderId]) {
                 updateActionButtonsState(activeOrders[selectedOrderId]);
            }
        }
    });

    function handleOrderCashReceivedInput() {
        const totalText = orderTotalEl.textContent || '0';
        const total = parseFloat(totalText.replace(currency, '')) || 0;
        const received = parseFloat(orderCashReceivedInput.value) || 0;
        const change = Math.max(0, received - total);
        orderChangeDueEl.textContent = formatCurrency(change);
        // Update button states based on cash input
        if (selectedOrderId && activeOrders[selectedOrderId]) {
             updateActionButtonsState(activeOrders[selectedOrderId]);
        }
    }
    orderCashReceivedInput.addEventListener('input', handleOrderCashReceivedInput);

    function resetPaymentSelection() {
        orderPaymentMethodButtonsContainer.querySelectorAll('.payment-method').forEach(btn => btn.classList.remove('selected'));
        orderSelectedPaymentMethod = null;
        orderSelectedPaymentMethodEl.textContent = '';
        orderCashDetails.classList.add('hidden');
        orderCashReceivedInput.value = '';
        orderChangeDueEl.textContent = formatCurrency(0);
        // Don't call updateActionButtonsState here, it's called by displayOrderDetails which calls this
    }

    // --- Action Buttons State Management ---
    function updateActionButtonsState(order) {
        if (!order) {
            payButton.disabled = true;
            releaseTableButton.disabled = true;
            printKitchenButton.disabled = true;
            printDeliveryButton.disabled = true;
            return;
        }

        const hasItems = order.items && order.items.length > 0;
        const total = parseFloat(orderTotalEl.textContent.replace(currency, '')) || 0;

        // Pay Button Logic
        let payEnabled = hasItems && orderSelectedPaymentMethod !== null;
        if (payEnabled) {
            if (orderSelectedPaymentMethod === 'Efectivo') {
                const received = parseFloat(orderCashReceivedInput.value) || 0;
                if (received < total) payEnabled = false;
            }

            if (order.type === 'table' && !['occupied', 'paying'].includes(order.status)) {
                payEnabled = false; // Can only pay occupied/paying tables
            } else if (order.type === 'delivery') {
                // Can only finalize if not already paid/cancelled
                if (['paid', 'cancelled'].includes(order.status)) {
                    payEnabled = false;
                }
                // If paying on delivery, must be delivered first
                else if (orderSelectedPaymentMethod === 'PagoEntrega' && order.status !== 'delivered') {
                    payEnabled = false;
                }
                // If pre-paid, allow finalization once delivered (or maybe earlier?)
                else if (orderSelectedPaymentMethod !== 'PagoEntrega' && order.status !== 'delivered') {
                     // Let's allow finalizing pre-paid earlier if needed, e.g., dispatched
                     // if (!['delivered', 'dispatched'].includes(order.status)) payEnabled = false;
                     // For now, require 'delivered' for pre-paid finalization too for consistency
                     payEnabled = false;
                }
            }
        }
        payButton.disabled = !payEnabled;

        // Release/Cancel Button Logic
        let releaseEnabled = true;
        if (order.type === 'table') {
            releaseEnabled = order.status !== 'free'; // Can release occupied/paying tables
        } else if (order.type === 'delivery') {
            releaseEnabled = !['paid', 'cancelled'].includes(order.status); // Can cancel active deliveries
        } else {
            releaseEnabled = false; // Unknown type
        }
        releaseTableButton.disabled = !releaseEnabled;

        // Print Button Logic
        printKitchenButton.disabled = !hasItems;
        printDeliveryButton.disabled = !hasItems || order.type !== 'delivery';
    }


    // --- Release Table / Cancel Order ---
    releaseTableButton.addEventListener('click', () => {
        if (!selectedOrderId || releaseTableButton.disabled) return;
        const order = activeOrders[selectedOrderId];
        if (!order) return;

        if (order.type === 'table') {
            const tableName = order.tableName || order.tableId;
            if (confirm(`¿Estás seguro de liberar la mesa "${tableName}"? Se borrará el pedido actual sin generar venta.`)) {
                console.log(`Releasing table ${tableName} (Order ID: ${order.id})`);
                delete activeOrders[selectedOrderId]; // Remove the order object
                saveActiveOrders();
                renderTablesGrid(); // Update grid to show table as free
                deselectOrder(); // Clear the details panel
                alert(`Mesa ${tableName} liberada.`);
            }
        } else if (order.type === 'delivery') {
            const shortId = order.id.substring(order.id.length - 6);
            if (confirm(`¿Estás seguro de cancelar el pedido a domicilio #${shortId}? Esta acción no se puede deshacer.`)) {
                console.log(`Cancelling delivery order #${shortId}`);
                order.status = 'cancelled';
                order.cancelledAt = new Date().toISOString();
                // Decide if stock should be returned - complex, depends on workflow. Assume NO for now.
                saveActiveOrders();
                // Update delivery list modal if open
                if (deliveryModal.classList.contains('visible')) {
                    loadDeliveryOrdersForModal();
                }
                deselectOrder(); // Clear the details panel
                alert(`Pedido a domicilio #${shortId} cancelado.`);
            }
        }
    });

    // --- Pay and Close / Complete Order ---
    payButton.addEventListener('click', () => {
        if (payButton.disabled || !selectedOrderId) return;
        hideOrderError();
        const order = activeOrders[selectedOrderId];
        if (!order) { displayOrderError("No se encontró el pedido seleccionado."); return; }

        const total = parseFloat(orderTotalEl.textContent.replace(currency, '')) || 0;
        const originalButtonText = payButton.querySelector('.button-text').textContent;
        setLoading(payButton, 'Procesando...');

        // --- Final Validations ---
        try {
            if (!order.items || order.items.length === 0) throw new Error('No hay items en el pedido.');
            if (!orderSelectedPaymentMethod) throw new Error('Selecciona un método de pago.');

            if (orderSelectedPaymentMethod === 'Efectivo') {
                const received = parseFloat(orderCashReceivedInput.value) || 0;
                if (received < total) throw new Error('El efectivo recibido es menor que el total.');
            }

            // Delivery specific validations
            if (order.type === 'delivery') {
                if (orderSelectedPaymentMethod === 'PagoEntrega' && order.status !== 'delivered') {
                     throw new Error('El pedido debe marcarse como "Entregado" antes de confirmar el Pago en Entrega.');
                 }
                if (orderSelectedPaymentMethod !== 'PagoEntrega' && order.status !== 'delivered') {
                     // Require 'delivered' status even for pre-paid before closing? Or allow earlier?
                     // Let's enforce 'delivered' for consistency.
                     throw new Error('El pedido debe marcarse como "Entregado" antes de finalizar la venta (incluso si está pre-pagado).');
                }
            }
            // Table specific validations
            if (order.type === 'table' && !['occupied', 'paying'].includes(order.status)) {
                 throw new Error('Solo se pueden cobrar mesas ocupadas o en estado de pago.');
            }


            // Final stock check before committing
            for (const item of order.items) {
                const productInStorage = allProducts.find(p => p.id === item.productId);
                if (productInStorage && productInStorage.manageStock) {
                    const currentStock = productInStorage.stock ?? 0;
                    if (item.quantity > currentStock) {
                        throw new Error(`Stock insuficiente para "${item.name}". Disponible: ${currentStock}`);
                    }
                }
            }
        } catch (validationError) {
            displayOrderError(validationError.message);
            clearLoading(payButton); // Restore original text implicitly
            return;
        }

        // --- Prepare Sale Data ---
        const nowISO = new Date().toISOString();
        const venta = {
            id: generateUniqueId('V'),
            fecha: nowISO,
            items: JSON.parse(JSON.stringify(order.items)), // Deep copy items
            subtotal: parseFloat(orderSubtotalEl.textContent.replace(currency, '')),
            deliveryFee: order.deliveryFee || 0, // Include delivery fee if present
            total: total,
            metodoPago: orderSelectedPaymentMethod,
            efectivoRecibido: orderSelectedPaymentMethod === 'Efectivo' ? (parseFloat(orderCashReceivedInput.value) || 0) : null,
            cambioDado: orderSelectedPaymentMethod === 'Efectivo' ? (parseFloat(orderChangeDueEl.textContent.replace(currency, '')) || 0) : null,
            cajaAbierta: isCashRegisterOpen, // Record if cash register was open at time of sale
            tipoVenta: order.type, // 'table' or 'delivery'
            // Table specific
            mesaId: order.type === 'table' ? order.tableId : null,
            mesaNombre: order.type === 'table' ? order.tableName : null,
            // Delivery specific
            deliveryOrderId: order.type === 'delivery' ? order.id : null,
            clienteNombre: order.customerName || null,
            clienteTelefono: order.customerPhone || null,
            clienteDireccion: order.customerAddress || null,
            // Timestamps
            pedidoCreadoEn: order.createdAt,
            pedidoEntregadoEn: order.deliveredAt || null,
            pagoConfirmadoEn: nowISO // Mark when the sale was finalized/paid
        };

        // --- Save Sale & Update Stock (Simulated delay for UX) ---
        console.log("Attempting to save sale:", venta);
        setTimeout(() => {
            let productsUpdated = false;
            try {
                // 1. Update Inventory (In Memory First)
                venta.items.forEach(item => {
                    const productIndex = allProducts.findIndex(p => p.id === item.productId);
                    if (productIndex > -1 && allProducts[productIndex].manageStock) {
                        const currentStock = allProducts[productIndex].stock ?? 0;
                        allProducts[productIndex].stock = currentStock - item.quantity;
                        console.log(`Stock updated for ${item.productId}: ${currentStock} -> ${allProducts[productIndex].stock}`);
                        productsUpdated = true;
                    }
                });
                if (productsUpdated) saveProducts(); // Save updated products array to LS

                // 2. Save Sale Record
                let ventasGuardadas = loadData('ventas') || [];
                ventasGuardadas.push(venta);
                saveData('ventas', ventasGuardadas);
                console.log(`Venta (${venta.tipoVenta}) guardada: ${venta.id}`);

                // 3. Update Active Order Status / Remove Order
                if (order.type === 'table') {
                    delete activeOrders[selectedOrderId]; // Remove completed table order
                } else if (order.type === 'delivery') {
                    // Mark delivery as 'paid' and add timestamps
                    activeOrders[selectedOrderId].status = 'paid';
                    activeOrders[selectedOrderId].paidAt = nowISO;
                    activeOrders[selectedOrderId].closedAt = nowISO; // Mark when officially closed
                    // Ensure the final payment method is stored if it was PagoEntrega
                     if (orderSelectedPaymentMethod === 'PagoEntrega') {
                         activeOrders[selectedOrderId].paymentMethod = orderSelectedPaymentMethod; // Store how it was finally paid
                     } else if (orderSelectedPaymentMethod === 'Efectivo' || orderSelectedPaymentMethod === 'Tarjeta' || orderSelectedPaymentMethod === 'Transferencia') {
                          activeOrders[selectedOrderId].paymentMethod = orderSelectedPaymentMethod; // Store how it was finally paid
                     }
                }
                saveActiveOrders(); // Save changes to active orders

                // 4. Update UI
                let confirmationMessage = '';
                if (venta.tipoVenta === 'table') {
                    confirmationMessage = `Cuenta de ${venta.mesaNombre} cerrada y cobrada con éxito.`;
                    renderTablesGrid(); // Update table view
                } else {
                    confirmationMessage = `Pedido a domicilio #${venta.deliveryOrderId.substring(venta.deliveryOrderId.length - 6)} completado y marcado como pagado.`;
                    // Update delivery list if visible
                    if (deliveryModal.classList.contains('visible')) {
                        loadDeliveryOrdersForModal();
                    }
                }
                alert(confirmationMessage);
                deselectOrder(); // Hide details panel

            } catch (error) {
                console.error("Error finalizing sale:", error);
                displayOrderError(`Error al finalizar la venta: ${error.message}. Verifica la consola.`);
                // IMPORTANT: Consider how to handle partial failure (e.g., sale saved but stock not updated).
                // This might require more robust transaction handling or logging for manual correction.
            } finally {
                clearLoading(payButton); // Restore button state
            }
        }, 250); // Simulate processing time
    });


    // --- Modal Management ---
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
             // Ensure other modals are hidden first
            document.querySelectorAll('.modal.visible').forEach(m => hideModal(m.id));
            modal.classList.add('visible');
            // Focus first focusable element in modal? Maybe later.
        }
        // Load data specifically for the shown modal
        if (modalId === 'menu-modal') loadMenuItemsForModal();
        if (modalId === 'table-modal') loadTablesForModal();
        if (modalId === 'delivery-modal') loadDeliveryOrdersForModal();
        if (modalId === 'new-delivery-order-modal') resetNewDeliveryForm(); // Reset form when opening
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('visible');
        // Reset forms when modals are hidden (optional, but good practice)
        if (modalId === 'table-modal') resetTableForm();
        if (modalId === 'new-delivery-order-modal') resetNewDeliveryForm();
    }

    // Event listeners for opening modals
    manageMenuButton.addEventListener('click', () => showModal('menu-modal'));
    manageTablesButton.addEventListener('click', () => showModal('table-modal'));
    manageDeliveryButton.addEventListener('click', () => showModal('delivery-modal'));
    newDeliveryOrderButton.addEventListener('click', () => showModal('new-delivery-order-modal'));

    // Close modal on background click
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal') && event.target.classList.contains('visible')) {
             // Check if the click is directly on the modal backdrop, not its content
             if (event.target === event.currentTarget) {
                 hideModal(event.target.id);
             }
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const visibleModal = document.querySelector('.modal.visible');
            if (visibleModal) {
                hideModal(visibleModal.id);
            }
        }
    });

    // --- Menu Management (Product Listing) ---
    function loadMenuItemsForModal() {
        menuItemsTableBody.innerHTML = '';
        const activeProducts = allProducts.filter(p => p.activo !== false); // Show only active products
        noMenuItemsMsg.classList.toggle('hidden', activeProducts.length === 0);

        if (activeProducts.length > 0) {
            activeProducts.sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach(p => {
                const row = menuItemsTableBody.insertRow();
                const stockDisplay = p.manageStock ? (p.stock ?? 0) : 'N/A';
                row.innerHTML = `
                    <td>${p.name || 'Sin Nombre'}</td>
                    <td>${formatCurrency(p.price || 0)}</td>
                    <td>${stockDisplay} ${p.unit && p.unit !== 'unidad' ? p.unit : ''}</td>
                    <td class="actions">
                        <button class="edit-btn" title="Editar Producto" onclick="window.location.href='productos.html#edit-${p.id}'"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Ir a Productos para Eliminar/Inactivar" onclick="window.location.href='productos.html#view-${p.id}'"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        }
    }

    // --- Table Management ---
    function loadTablesForModal() {
        tablesListBody.innerHTML = '';
        noTablesMsg.classList.toggle('hidden', restaurantTables.length > 0);
        resetTableForm(); // Ensure form is clean when showing list

        if (restaurantTables.length > 0) {
            restaurantTables.sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach(t => {
                const row = tablesListBody.insertRow();
                // Check if table has an active, non-empty order
                const order = activeOrders[t.id];
                const hasActiveOrder = order && order.items && order.items.length > 0;
                const deleteDisabled = hasActiveOrder;
                const deleteTitle = deleteDisabled ? "No se puede eliminar: Mesa con pedido activo" : "Eliminar Mesa";

                row.innerHTML = `
                    <td>${t.name || 'Sin Nombre'}</td>
                    <td class="actions">
                        <button class="edit-table-btn" data-id="${t.id}" title="Editar Mesa"><i class="fas fa-edit"></i></button>
                        <button class="delete-table-btn" data-id="${t.id}" title="${deleteTitle}" ${deleteDisabled ? 'disabled' : ''} style="${deleteDisabled ? 'opacity:0.5; cursor:not-allowed;' : ''}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });

            // Add listeners AFTER rows are created
            tablesListBody.querySelectorAll('.edit-table-btn').forEach(btn => btn.addEventListener('click', (e) => editTable(e.currentTarget.dataset.id)));
            tablesListBody.querySelectorAll('.delete-table-btn:not(:disabled)').forEach(btn => btn.addEventListener('click', (e) => deleteTable(e.currentTarget.dataset.id)));
        }
    }

    function resetTableForm() {
        tableForm.reset();
        tableIdInput.value = '';
        tableFormTitle.innerHTML = '<i class="fas fa-chair"></i> Agregar Nueva Mesa';
        hideTableError();
        clearLoading(saveTableButton); // Ensure button is reset
    }

    tableForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideTableError();
        const id = tableIdInput.value;
        const name = tableNameInput.value.trim();
        if (!name) { displayTableError("El nombre/número de mesa es obligatorio."); tableNameInput.focus(); return; }

        setLoading(saveTableButton, id ? "Guardando..." : "Creando...");

        setTimeout(() => { // Simulate save
            try {
                const isEditing = id !== '';
                const nameLower = name.toLowerCase();
                // Check for duplicate name (excluding self when editing)
                if (restaurantTables.some(t => t.id !== id && (t.name || '').toLowerCase() === nameLower)) {
                    throw new Error(`Ya existe una mesa llamada "${name}".`);
                }

                if (isEditing) {
                    const tableIndex = restaurantTables.findIndex(t => t.id === id);
                    if (tableIndex > -1) {
                        restaurantTables[tableIndex].name = name;
                        // If this table has an active order, update its name there too
                        if (activeOrders[id]) {
                            activeOrders[id].tableName = name;
                            saveActiveOrders(); // Save order change
                        }
                        console.log(`Table ${id} updated to name: ${name}`);
                    } else { throw new Error("No se encontró la mesa para editar."); }
                } else {
                    const newTable = { id: generateUniqueId('T'), name: name, status: 'free' }; // Status is implicit now
                    restaurantTables.push(newTable);
                    console.log(`New table created: ${name} (ID: ${newTable.id})`);
                }
                saveTables();
                loadTablesForModal(); // Reload list in modal
                renderTablesGrid(); // Reload main grid view
                resetTableForm(); // Reset form after successful save
            } catch (error) {
                console.error("Error saving table:", error);
                displayTableError(error.message || "Error desconocido al guardar la mesa.");
            } finally {
                clearLoading(saveTableButton);
            }
        }, 50); // Short delay
    });

    function editTable(id) {
        const table = restaurantTables.find(t => t.id === id);
        if (table) {
            resetTableForm();
            tableIdInput.value = table.id;
            tableNameInput.value = table.name;
            tableFormTitle.innerHTML = `<i class="fas fa-edit"></i> Editar Mesa: ${table.name}`;
            tableNameInput.focus();
            // Scroll form into view if needed
            tableForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function deleteTable(id) {
        const order = activeOrders[id];
        if (order && order.items && order.items.length > 0) {
            alert("No se puede eliminar una mesa con un pedido activo. Cierra o libera la mesa primero.");
            return;
        }
        const tableIndex = restaurantTables.findIndex(t => t.id === id);
        if (tableIndex > -1) {
            const tableName = restaurantTables[tableIndex].name;
            if (confirm(`¿Eliminar la mesa "${tableName}"? Esta acción no se puede deshacer.`)) {
                console.log(`Deleting table ${tableName} (ID: ${id})`);
                restaurantTables.splice(tableIndex, 1);
                // Also remove from active orders just in case (though check should prevent this)
                delete activeOrders[id];
                saveTables();
                saveActiveOrders();
                loadTablesForModal(); // Reload list in modal
                renderTablesGrid(); // Reload main grid view
                if (selectedOrderId === id) deselectOrder(); // Deselect if it was selected
                alert(`Mesa "${tableName}" eliminada.`);
            }
        }
    }

    // --- Delivery Management ---
    function getStatusText(status, type) {
        if (type === 'table') {
            switch (status) {
                case 'free': return 'Libre';
                case 'occupied': return 'Ocupada';
                case 'paying': return 'Pagando';
                default: return status || 'Desconocido';
            }
        } else if (type === 'delivery') {
            switch (status) {
                case 'new': return 'Nuevo';
                case 'preparing': return 'Preparando';
                case 'dispatched': return 'Despachado';
                case 'delivered': return 'Entregado';
                case 'paid': return 'Pagado';
                case 'cancelled': return 'Cancelado';
                default: return status || 'Desconocido';
            }
        }
        return status || 'Desconocido';
    }

    function loadDeliveryOrdersForModal() {
        deliveryOrdersListContainer.innerHTML = '';
        // Filter active delivery orders (adjust status filter as needed)
        const activeDeliveryOrders = Object.values(activeOrders)
            .filter(order => order.type === 'delivery' && !['paid', 'cancelled'].includes(order.status))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort newest first

        noDeliveryOrdersMsg.classList.toggle('hidden', activeDeliveryOrders.length > 0);

        if (activeDeliveryOrders.length > 0) {
            activeDeliveryOrders.forEach(order => {
                const item = document.createElement('div');
                item.className = 'delivery-list-item';
                item.dataset.orderId = order.id;
                item.dataset.status = order.status || 'new'; // For CSS styling
                const shortId = order.id.substring(order.id.length - 6);
                const total = (order.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0) + (order.deliveryFee || 0);

                item.innerHTML = `
                    <div class="info">
                        <strong>${order.customerName || 'Cliente Desconocido'} (#${shortId})</strong>
                        <small>${order.customerAddress || 'Dirección no especificada'}</small>
                        <small style="display:block; margin-top: 3px;">Creado: ${formatDateTime(order.createdAt)}</small>
                    </div>
                    <div class="status">${getStatusText(order.status, 'delivery')}</div>
                    <div class="total-preview" style="margin-left: 15px; text-align: right;">
                        <strong>${formatCurrency(total)}</strong>
                        <small style="display: block;">${(order.items || []).length} item(s)</small>
                    </div>
                `;
                item.addEventListener('click', () => {
                    selectOrder(order.id); // Select this delivery order in the main panel
                    hideModal('delivery-modal'); // Close the list modal
                });
                deliveryOrdersListContainer.appendChild(item);
            });
        }
    }

    function resetNewDeliveryForm() {
        newDeliveryForm.reset();
        deliveryOrderIdInput.value = ''; // Clear hidden ID
        hideDeliveryFormError();
        clearLoading(saveDeliveryOrderButton); // Reset button
    }

    // Handle New Delivery Form Submission
    newDeliveryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideDeliveryFormError();

        // --- Validation ---
        const customerName = deliveryCustomerNameInput.value.trim();
        const customerPhone = deliveryCustomerPhoneInput.value.trim();
        const customerAddress = deliveryCustomerAddressInput.value.trim();
        const notes = deliveryNotesInput.value.trim();
        const initialPaymentMethod = deliveryInitialPaymentMethodSelect.value;

        if (!customerName) { displayDeliveryFormError("El nombre del cliente es obligatorio."); deliveryCustomerNameInput.focus(); return; }
        if (!customerPhone) { displayDeliveryFormError("El teléfono del cliente es obligatorio."); deliveryCustomerPhoneInput.focus(); return; }
        if (!customerAddress) { displayDeliveryFormError("La dirección de entrega es obligatoria."); deliveryCustomerAddressInput.focus(); return; }

        setLoading(saveDeliveryOrderButton, "Creando...");

        // --- Create Order Object ---
        const newOrderId = generateUniqueId('D');
        const newOrder = {
            id: newOrderId,
            type: 'delivery',
            items: [], // Start with empty items, add them via details panel
            createdAt: new Date().toISOString(),
            status: 'new', // Initial status
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            deliveryNotes: notes,
            paymentMethod: initialPaymentMethod, // Store the initially selected method
            deliveryFee: 0, // Add field for delivery fee (can be set later)
            // Timestamps will be added as status changes
        };

        console.log("Creating new delivery order:", newOrder);

        // Simulate saving
        setTimeout(() => {
            try {
                activeOrders[newOrderId] = newOrder;
                saveActiveOrders();

                resetNewDeliveryForm();
                hideModal('new-delivery-order-modal');
                loadDeliveryOrdersForModal(); // Update the list in the other modal

                alert(`Nuevo pedido a domicilio #${newOrderId.substring(newOrderId.length - 6)} creado. Añade productos ahora.`);

                // Automatically select the new order in the details panel
                selectOrder(newOrderId);

            } catch (error) {
                console.error("Error creating delivery order:", error);
                displayDeliveryFormError("Error al crear el pedido. Intenta de nuevo.");
            } finally {
                clearLoading(saveDeliveryOrderButton);
            }
        }, 250);
    });

    // --- Delivery Status Updates ---
    function addDeliveryStatusControls(order) {
        // Remove existing controls first
        const existingControls = orderDetailsSection.querySelector('#delivery-status-controls');
        if (existingControls) existingControls.remove();

        // Don't add controls if order is finished
        if (['paid', 'cancelled'].includes(order.status)) return;

        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'delivery-status-controls';
        controlsContainer.style.marginTop = '15px';
        controlsContainer.style.paddingTop = '15px';
        controlsContainer.style.borderTop = '1px dashed var(--border-color)';

        let nextStatus = null;
        let buttonText = '';
        let buttonIcon = 'fa-question-circle';

        switch (order.status) {
            case 'new':
                nextStatus = 'preparing';
                buttonText = 'Marcar como Preparando';
                buttonIcon = 'fa-fire-alt';
                break;
            case 'preparing':
                nextStatus = 'dispatched';
                buttonText = 'Marcar como Despachado';
                buttonIcon = 'fa-shipping-fast';
                break;
            case 'dispatched':
                nextStatus = 'delivered';
                buttonText = 'Marcar como Entregado';
                buttonIcon = 'fa-check-circle';
                break;
            // No button needed if 'delivered' (payment is the next step)
            case 'delivered':
                 // Add info text instead of button?
                 const info = document.createElement('p');
                 info.style.fontSize = '0.9em';
                 info.style.color = 'var(--text-muted-color)';
                 info.innerHTML = '<i class="fas fa-info-circle"></i> Pedido entregado. Procede al cobro.';
                 controlsContainer.appendChild(info);
                 orderDetailsSection.querySelector('.details-footer').appendChild(controlsContainer); // Append to footer
                 return; // Stop here for delivered status

        }

        if (nextStatus) {
            const statusButton = document.createElement('button');
            statusButton.className = 'action-button';
            statusButton.style.backgroundColor = 'var(--info-color)'; // Example color
            statusButton.style.color = 'white';
            statusButton.style.width = '100%';
            statusButton.innerHTML = `<i class="fas ${buttonIcon}"></i> <span class="button-text">${buttonText}</span>`;
            statusButton.onclick = () => updateDeliveryStatus(order.id, nextStatus);
            controlsContainer.appendChild(statusButton);
        }

        // Append controls container to the footer
        orderDetailsSection.querySelector('.details-footer').appendChild(controlsContainer);
    }

    function updateDeliveryStatus(orderId, newStatus) {
        if (!activeOrders[orderId] || activeOrders[orderId].type !== 'delivery') return;

        const order = activeOrders[orderId];
        const originalStatus = order.status;

        // Basic validation (can add more complex rules)
        const allowedTransitions = {
            'new': ['preparing', 'cancelled'],
            'preparing': ['dispatched', 'cancelled'],
            'dispatched': ['delivered', 'cancelled'],
            'delivered': ['paid'], // Only transition to paid via the pay button logic
        };

        if (!allowedTransitions[originalStatus] || !allowedTransitions[originalStatus].includes(newStatus)) {
             console.warn(`Invalid status transition: ${originalStatus} -> ${newStatus}`);
             alert(`No se puede cambiar el estado de "${getStatusText(originalStatus, 'delivery')}" a "${getStatusText(newStatus, 'delivery')}".`);
             return;
         }


        console.log(`Updating delivery ${orderId} status from ${originalStatus} to ${newStatus}`);
        order.status = newStatus;
        const now = new Date().toISOString();

        // Add timestamps
        if (newStatus === 'preparing') order.preparingAt = now;
        else if (newStatus === 'dispatched') order.dispatchedAt = now;
        else if (newStatus === 'delivered') order.deliveredAt = now;
        // 'paid' and 'cancelled' timestamps handled elsewhere

        saveActiveOrders();
        displayOrderDetails(order); // Re-render details panel with new status and controls
        // Update delivery list modal if open
        if (deliveryModal.classList.contains('visible')) {
            loadDeliveryOrdersForModal();
        }
    }


    // --- Printing Logic (Placeholders) ---
    printKitchenButton.addEventListener('click', () => {
        if (!selectedOrderId || printKitchenButton.disabled) return;
        const order = activeOrders[selectedOrderId];
        if (!order || !order.items || order.items.length === 0) return;

        console.log("--- TICKET COCINA ---");
        if (order.type === 'table') {
            console.log(`Mesa: ${order.tableName}`);
        } else if (order.type === 'delivery') {
            console.log(`Domicilio: #${order.id.substring(order.id.length - 6)}`);
            console.log(`Cliente: ${order.customerName || ''}`);
        }
        console.log(`Fecha/Hora: ${formatDateTime(new Date().toISOString())}`);
        console.log("---------------------");
        order.items.forEach(item => {
            console.log(`${item.quantity} x ${item.name}`);
            // Add variations/notes here if stored on the item
        });
        console.log("---------------------");
        alert("Ticket de cocina enviado a la consola (simulado).");
        // Actual printing requires a more complex setup (e.g., dedicated print service, browser print API with formatting)
    });

    printDeliveryButton.addEventListener('click', () => {
        if (!selectedOrderId || printDeliveryButton.disabled) return;
        const order = activeOrders[selectedOrderId];
        if (!order || order.type !== 'delivery' || !order.items || order.items.length === 0) return;

        const total = (order.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0) + (order.deliveryFee || 0);
        const paymentInstructions = {
            'PagoEntregaEfectivo': `Pagar ${formatCurrency(total)} en Efectivo al recibir.`,
            'PagoEntregaTarjeta': `Pagar ${formatCurrency(total)} con Tarjeta al recibir.`,
            'Transferencia': 'Pagado por Transferencia.',
            // Add others as needed
        };

        console.log("--- TICKET DOMICILIO ---");
        console.log(`Pedido #: ${order.id.substring(order.id.length - 6)}`);
        console.log(`Fecha/Hora Pedido: ${formatDateTime(order.createdAt)}`);
        console.log(`Fecha/Hora Impresión: ${formatDateTime(new Date().toISOString())}`);
        console.log("---------------------");
        console.log("CLIENTE:");
        console.log(`Nombre: ${order.customerName || 'N/A'}`);
        console.log(`Teléfono: ${order.customerPhone || 'N/A'}`);
        console.log(`Dirección: ${order.customerAddress || 'N/A'}`);
        if (order.deliveryNotes) {
            console.log(`Notas: ${order.deliveryNotes}`);
        }
        console.log("---------------------");
        console.log("PEDIDO:");
        order.items.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            console.log(`${item.quantity} x ${item.name} ..... ${formatCurrency(itemTotal)}`);
        });
        console.log("---------------------");
        console.log(`Subtotal: ${formatCurrency(order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0))}`);
        if (order.deliveryFee > 0) {
            console.log(`Costo Envío: ${formatCurrency(order.deliveryFee)}`);
        }
        console.log(`TOTAL: ${formatCurrency(total)}`);
        console.log("---------------------");
        console.log("PAGO:");
        console.log(paymentInstructions[order.paymentMethod] || `Método: ${order.paymentMethod || 'No especificado'}`);
        if (order.paymentMethod === 'PagoEntregaEfectivo' && order.deliveryNotes?.toLowerCase().includes('pagar con')) {
            // Extract amount if possible - basic example
            const match = order.deliveryNotes.match(/pagar?\s+con\s+\$?(\d+(\.\d+)?)/i);
            if (match && match[1]) {
                const payingWith = parseFloat(match[1]);
                if (payingWith >= total) {
                    console.log(`(Paga con: ${formatCurrency(payingWith)} - Cambio: ${formatCurrency(payingWith - total)})`);
                } else {
                     console.log(`(Nota indica pagar con: ${formatCurrency(payingWith)} - ¡VERIFICAR!)`);
                }
            }
        }

        console.log("--- FIN TICKET ---");
        alert("Ticket de domicilio enviado a la consola (simulado).");
    });


    // --- Logout Logic ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            let canLogout = true;
            let activeOrderMessage = '';

            // Check for any active, non-free orders
            const activeUnsavedOrder = Object.values(activeOrders).find(order =>
                (order.type === 'table' && order.status !== 'free' && order.items?.length > 0) ||
                (order.type === 'delivery' && !['paid', 'cancelled'].includes(order.status) && order.items?.length > 0)
            );

            if (activeUnsavedOrder) {
                const orderName = activeUnsavedOrder.type === 'table'
                    ? activeUnsavedOrder.tableName
                    : `#${activeUnsavedOrder.id.substring(activeUnsavedOrder.id.length - 6)}`;
                activeOrderMessage = `Hay al menos un pedido activo (${orderName}). Si sales ahora, los cambios no guardados podrían perderse.`;
                if (!confirm(`${activeOrderMessage} ¿Estás seguro de que quieres salir?`)) {
                    canLogout = false;
                }
            }

            // Check cash register status if logout is still possible
            if (canLogout) {
                try {
                    const cashStatus = loadData('cashRegisterStatus') || {};
                    if (cashStatus.isOpen) {
                        alert("¡Atención! La caja está abierta. Debes cerrarla antes de salir.");
                        canLogout = false;
                        // Optionally redirect to cash register page
                        // window.location.href = 'caja.html';
                        return; // Stop logout process
                    }
                } catch (err) {
                    console.error("Error checking cash status on logout", err);
                    // Decide if logout should proceed despite error - safer to block?
                    // alert("Error al verificar estado de caja. No se pudo salir.");
                    // canLogout = false;
                }
            }

            // Final confirmation if no blocking issues
            if (canLogout && (activeUnsavedOrder || confirm('¿Estás seguro de que quieres salir?'))) { // Ask again only if no active order warning shown
                console.log("Logging out...");
                // Clear sensitive session data if needed before redirecting
                // localStorage.removeItem('userToken'); // Example
                window.location.href = 'login.html';
            }
        });
    }

    // --- Initial Load Execution ---
    loadInitialConfigAndData();

}); // End DOMContentLoaded