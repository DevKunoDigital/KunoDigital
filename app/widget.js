// Variable global para almacenar la lista de productos
let productsList = [];
let priceLists = [];

// Inicializar características de Bootstrap
function initializeBootstrapFeatures() {
  // Inicializar el sistema de notificaciones
  initializeToastSystem();

  // Tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Configurar modal de confirmación para cancelar
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', function () {
      ZOHO.CRM.UI.Popup.close()
        .then(function (data) {
          console.log("Widget cerrado:", data);
        })
        .catch(function (error) {
          console.error("Error al cerrar el widget:", error);
        });
    });
  }

  // Configurar validación de formulario
  const form = document.getElementById('invoiceForm');
  if (form) {
    form.addEventListener('submit', function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  }
}

// Sistema de notificaciones mejorado
function initializeToastSystem() {
  // Crear el toast dinámicamente si no existe
  if (!document.getElementById('bootstrapToast')) {
    const toastHTML = `
    <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 11; width: 100%; max-width: 600px;">
      <div id="bootstrapToast" class="toast align-items-center text-white border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center">
            <i class="bi me-3 fs-4"></i>
            <div>
              <h6 class="mb-1 fw-semibold"></h6>
              <p class="mb-0 small"></p>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white me-3 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', toastHTML);
  }
}

function showSuccessToast(message = "Operación completada exitosamente") {
  const toastEl = document.getElementById('bootstrapToast');
  const icon = toastEl.querySelector('i');
  const title = toastEl.querySelector('h6');
  const msg = toastEl.querySelector('p');

  // Configurar para éxito
  icon.className = "bi bi-check-circle-fill me-3 fs-4";
  toastEl.className = "toast align-items-center text-white bg-success border-0";

  // Actualizar contenido
  title.textContent = "¡Éxito!";
  msg.textContent = message;

  // Mostrar notificación
  const toast = new bootstrap.Toast(toastEl, {
    animation: true,
    autohide: true,
    delay: 12000,
  });
  toast.show();
}

// Función para calcular el total de la fila y mostrarlo
function calculateRowTotal(row) {
  const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
  const unitPrice = parseFloat(row.querySelector('.unit-price').value) || 0;
  const total = quantity * unitPrice;

  // Mostrar el total en la fila (necesitarás agregar una celda para esto)
  const totalCell = row.querySelector('.total-price');
  if (totalCell) {
    totalCell.textContent = total.toFixed(2);
  }

  return total;
}


// Función para actualizar el precio unitario base y resetear cantidad
function updateBasePrice(row) {
  const productSelect = row.querySelector('.product-select');
  if (productSelect && productSelect.value) {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const basePrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;

    // Actualizar precio base y resetear cantidad a 1
    row.setAttribute('data-base-price', basePrice);
    row.querySelector('.unit-price').value = basePrice;
    row.querySelector('.quantity').value = 1;

    // Calcular y actualizar totales
    calculateRowTotal(row);
    updateGrandTotal();
  }
}

// Función para configurar eventos de fila
function setupRowEvents(row) {
  // Configurar eventos para el select de producto
  const productSelect = row.querySelector('.product-select');
  productSelect.addEventListener('change', function () {
    updateBasePrice(row);
  });

  // Configurar eventos para cambios en cantidad y precio
  const quantityInput = row.querySelector('.quantity');
  const unitPriceInput = row.querySelector('.unit-price');

  const handleInputChange = function () {
    calculateRowTotal(row);
    updateGrandTotal();
  };

  // Usar evento 'input' para respuesta en tiempo real
  quantityInput.addEventListener('input', handleInputChange);
  unitPriceInput.addEventListener('input', handleInputChange);

  // Configurar evento para eliminar fila
  // const removeBtn = row.querySelector('.remove-product');
  // removeBtn.addEventListener('click', function () {
  //   row.remove();
  //   updateGrandTotal();

  //   // Si no quedan filas, agregar una nueva
  //   if (document.querySelectorAll("#lineItemsTable tbody tr").length === 0) {
  //     addProductRow();
  //   }
  // });
}

// Función para actualizar el total general
function updateGrandTotal() {
  const rows = document.querySelectorAll("#lineItemsTable tbody tr");
  let subtotal = 0;

  rows.forEach(row => {
    subtotal += calculateRowTotal(row);
  });

  // Obtener el descuento e impuesto ingresados
  const discountInput = document.getElementById('discountInput');
  const taxInput = document.getElementById('taxInput');

  const discount = parseFloat(discountInput?.value) || 0;
  let taxRate = 0;
  if (taxInput) {
    let taxText = taxInput.textContent.trim(); // Ej: "7%"
    taxText = taxText.replace('%', ''); // Quitamos el símbolo %
    taxRate = parseFloat(taxText) || 0;
  }


  // Calcular total final (subtotal - descuento + impuesto)
  const totalAfterDiscount = subtotal - discount;
  const taxAmount = (totalAfterDiscount * taxRate) / 100;
  const grandTotal = totalAfterDiscount + taxAmount;

  const totalAfterDiscountElement = document.getElementById('totalAfterDiscount');
  if (totalAfterDiscountElement) {
    totalAfterDiscountElement.textContent = `$${totalAfterDiscount.toFixed(2)}`;
  }


  if (discount > subtotal) {
    discountInput.classList.add('is-invalid');
    subtotal = 0;
  } else {
    discountInput.classList.remove('is-invalid');
  }

  // Actualizar elementos visuales
  const subtotalElement = document.getElementById('subtotal');
  if (subtotalElement) {
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  }




  const taxAmountElement = document.getElementById('taxAmount');
  if (taxAmountElement) {
    taxAmountElement.textContent = `$${taxAmount.toFixed(2)}`;
  }

  const grandTotalElement = document.getElementById('grandTotal');
  if (grandTotalElement) {
    grandTotalElement.textContent = `$${grandTotal.toFixed(2)}`;
  }


  const discountPriceElement = document.getElementById('descuentoprice');
  if (discountPriceElement) {
    discountPriceElement.textContent = `$${discount.toFixed(2)}`;
  }
  const discountDisplay = document.getElementById('discountDisplay');
  if (discountDisplay) {
    discountDisplay.textContent = `$${discount.toFixed(2)}`;
  }

}



// // Función para agregar nueva fila de producto
// function addProductRow() {
//   const tbody = document.querySelector("#lineItemsTable tbody");
//   const newRow = document.createElement("tr");

//   newRow.innerHTML = `
//     <td>
//       <select class="form-select form-select-sm product-select" required>
//         <option value="">Seleccione un producto</option>
//         ${productsList.map(product =>
//     `<option value="${product.id}" data-price="${product.Unit_Price || 0}">
//             ${product.Product_Name}
//           </option>`
//   ).join('')}
//       </select>
//     </td>
//     <td>
//       <input type="number" class="form-control form-control-sm quantity" min="1" value="1">
//     </td>
//     <td>
//       <div class="input-group input-group-sm">
//         <span class="input-group-text bg-transparent">$</span>
//         <input type="number" class="form-control unit-price" step="0.01" min="0">
//       </div>
//     </td>
//     <td class="total-price text-end">
//       0.00
//     </td>
//     <td>
//       <button type="button" class="btn btn-sm btn-outline-danger remove-product">
//         <i class="bi bi-trash"></i>
//       </button>
//     </td>
//   `;

//   tbody.appendChild(newRow);
//   setupRowEvents(newRow);
//   updateGrandTotal();
// }


// Función para configurar eventos de una fila


function showErrorToast(message = "Ocurrió un error") {
  const toastEl = document.getElementById('bootstrapToast');
  const icon = toastEl.querySelector('i');
  const title = toastEl.querySelector('h6');
  const msg = toastEl.querySelector('p');

  // Configurar para error
  icon.className = "bi bi-exclamation-triangle-fill me-3 fs-4";
  toastEl.className = "toast align-items-center text-white bg-danger border-0";

  // Actualizar contenido
  title.textContent = "¡Error!";
  msg.textContent = message;

  // Mostrar notificación
  const toast = new bootstrap.Toast(toastEl, {
    animation: true,
    autohide: true,
    delay: 8000
  });
  toast.show();
}

function showToast(message, isSuccess = true) {
  if (isSuccess) {
    showSuccessToast(message);
  } else {
    showErrorToast(message);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("Widget cargado.");

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  });

  // Inicializar características de Bootstrap
  initializeBootstrapFeatures();

  // Escuchar el evento PageLoad para obtener datos del contexto
  ZOHO.embeddedApp.on("PageLoad", function (data) {
    console.log("Datos de contexto recibidos:", data);

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 8);

    // Formatear fechas como YYYY-MM-DD (formato input date)
    document.getElementById("Invoice_Date").value = today.toISOString().split('T')[0];
    document.getElementById("Due_Date").value = dueDate.toISOString().split('T')[0];

    ZOHO.CRM.UI.Resize({
      height: "1300",
      width: "1000"
    });

    if (data && data.Entity === "Deals") {
      ZOHO.CRM.API.getRecord({
        Entity: "Deals",
        RecordID: data.EntityId,
        fields: ["Contact_Name", "Deal_Name", "Owner"]
      }).then(function (response) {
        const dealData = response.data[0];
        console.log("Datos completos del Deal:", dealData);

        if (dealData.Contact_Name && dealData.Contact_Name.id) {
          const contactName = dealData.Contact_Name.name;
          const contactId = dealData.Contact_Name.id;

          console.log("ID del Contacto encontrado:", contactId);
          console.log("Nombre del Contacto:", contactName);

          // Mostrar en el HTML
          document.getElementById("Customer_ID").value = contactId;
          document.getElementById("Customer_Name").value = contactName;
          document.getElementById("headerTitle").textContent = "Crear Cotización - " + contactName;
          document.getElementById("Deal_Name").value = dealData.Deal_Name || '';

          if (dealData.Owner && dealData.Owner.name) {
            document.getElementById("Deal_Owner").value = dealData.Owner.name;
          }

          // ➕ Obtener datos del contacto (RUC y Teléfono)
          ZOHO.CRM.API.getRecord({
            Entity: "Contacts",
            RecordID: contactId
          }).then(function (contactResponse) {
            const contactData = contactResponse.data[0];
            console.log("Datos del contacto:", contactData);

            // Aquí se pasa al HTML
            document.getElementById("contac_ruc").value = contactData.RUC_C_dula || '';
            document.getElementById("contac_tel").value = contactData.Phone || '';
            document.getElementById("razonsocial").value = contactData.Nombre_o_raz_n_social || '';
            document.getElementById("ciudad").value = contactData.Ciudad || '';
            document.getElementById("codigopostal").value = contactData.Codigo_postal || '';
            document.getElementById("email").value = contactData.Email || '';
            document.getElementById("pais").value = contactData.Pa_s || '';

          }).catch(function (error) {
            console.error("Error al obtener el contacto:", error);
          });
        }
      }).catch(function (error) {
        console.error("Error al obtener datos del Deal:", error);
        showToast("Error al cargar datos del trato", false);
      });

    }
  });



  document.getElementById('discountInput').addEventListener('input', updateGrandTotal);


  // Inicializar el SDK de Zoho CRM
  ZOHO.embeddedApp.init().then(function () {
    console.log("SDK de Zoho CRM inicializado correctamente.");
    initializeWidget();
  }).catch(function (error) {
    console.error("Error al inicializar el SDK de Zoho CRM:", error);
    showToast("Error al inicializar el widget", false);
  });
});

async function initializeWidget() {
  console.log("Inicializando widget...");

  // Configurar botón de cerrar
  document.getElementById("closeWidgetBtn").addEventListener("click", function () {
    const modal = new bootstrap.Modal(document.getElementById('confirmCancelModal'));
    modal.show();
  });

  // Obtener la lista de productos desde Zoho CRM
  await getProductsFromCRM();

  const initialRow = document.querySelector("#lineItemsTable tbody tr");
  if (initialRow) {
    setupRowEvents(initialRow);
  }

  // document.getElementById("addProductBtn").addEventListener("click", addProductRow);

  // Manejar el clic en "Crear Factura"
  document.getElementById("invoiceForm").addEventListener("submit", function (e) {

    e.preventDefault();
    createInvoice();
  });
}


// async function getPriceListsFromAPI() {
//   try {
//     const response = await fetch("https://project-rainfall-883996440.catalystserverless.com/server/kuno-api/listprice");
//     if (!response.ok) {
//       throw new Error("Error en la solicitud de lista de precios: " + response.statusText);
//     }
//     const responseJSON = await response.json();
//     priceLists = responseJSON.pricebooks;
//     // Llenar el select de lista de precios
//     const priceListSelect = document.getElementById("priceList");
//     priceListSelect.innerHTML = `<option value="">Seleccione una lista de precios</option>`;
//     priceLists.forEach(priceObj => {

//       const option = document.createElement("option");
//       option.value = priceObj.pricebooks_id;
//       option.textContent = priceObj.name;
//       priceListSelect.appendChild(option);
//     });
//   } catch (error) {
//     console.error("Error al obtener lista de precios:", error);
//     showToast("Error al cargar la lista de precios", false);
//   }
// }

function populateChasisSelect(serialNumbers) {
  console.log("→ populateChasisSelect llamado con:", serialNumbers);

  const chasisSelect = document.getElementById('chasis');


  // 1) Limpiar cualquier opción previa
  chasisSelect.options.length = 0;

  // 2) Añadir placeholder
  const placeholder = new Option('Selecciona un chasis', '');
  placeholder.disabled = true;
  placeholder.selected = true;
  chasisSelect.add(placeholder);

  if (Array.isArray(serialNumbers) && serialNumbers.length > 0) {
    // 3) Añadir cada serial como opción
    serialNumbers.forEach(serial => {
      const opt = new Option(serial.serialnumber, serial.serialnumber);
      opt.setAttribute('data-serial-id', serial.serialnumber_id);
      chasisSelect.add(opt);
    });
    // 4) Si sólo hay uno, lo seleccionamos automáticamente
    if (serialNumbers.length === 1) {
      chasisSelect.selectedIndex = 1;
    }
  } else {
    // 5) Si no hay seriales, mostrar mensaje
    const none = new Option('No hay chasis disponibles', '');
    none.disabled = true;
    none.selected = true;
    chasisSelect.add(none);
  }
}

function populateVehiculoDetailsFromFinance(vehiculoData) {
  const customFields = vehiculoData.custom_field_hash || {};

  document.getElementById('marca').value = vehiculoData.brand || '';
  document.getElementById('anio').value = customFields.cf_a_o || '';
  document.getElementById('modelo').value = customFields.cf_modelo || '';
  document.getElementById('tapiceria').value = customFields.cf_tapiceria || '';
  document.getElementById('color').value = vehiculoData.attribute_option_name1 || '';
  document.getElementById('tipo').value = customFields.cf_categor_a_del_producto || '';
  document.getElementById('motor').value = '';
  document.getElementById('entransito').textContent = customFields.cf_pedido_especial || '';


}



async function getProductsFromCRM() {
  console.log("Obteniendo lista de productos desde Zoho CRM...");

  try {
    const response = await fetch("https://project-rainfall-883996440.development.catalystserverless.com/server/kuno-api/itemsbooks");

    if (!response.ok) {
      throw new Error("Error en la solicitud: " + response.statusText);
    }

    const responseJSON = await response.json();
    productsList = responseJSON.items;
    console.log("📦 Datos obtenidos desde Catalyst:", productsList);

    const productSelect = document.querySelector(".product-select");

    if (productSelect) {
      productSelect.innerHTML = "<option value=''>Seleccione un producto</option>";

      productsList.forEach(product => {
        const productOption = document.createElement("option");
        productOption.value = product.item_id;
        productOption.textContent = product.item_name;
        productOption.setAttribute('data-price', product.rate || 0);
        productOption.setAttribute('data-stock', product.actual_available_stock || 0);
        productSelect.appendChild(productOption);
      });

      document.addEventListener("change", function (e) {
        if (e.target.classList.contains("product-select")) {
          const selectedOption = e.target.options[e.target.selectedIndex];
          const stock = selectedOption.getAttribute("data-stock") || "0";

          const row = e.target.closest("tr");
          const stockSpan = row.querySelector(".stock-display");

          stockSpan.textContent = stock;
        }
      });




      productSelect.addEventListener('change', async function () {
        const selectedOption = this.options[this.selectedIndex];
        const selectedProductId = this.value;
        const row = this.closest('tr');
      
        // Mostrar precio y stock
        row.querySelector('.unit-price').value = selectedOption.getAttribute('data-price');
        row.querySelector('.stock-display').textContent = selectedOption.getAttribute('data-stock');
      
        // 1) Invocamos a Inventory
        const resp = await ZOHO.CRM.CONNECTION.invoke("inventory_link", {
          url: `https://inventory.zoho.com/api/v1/items/serialnumbers?organization_id=878347402&item_id=${selectedProductId}`,
          method: "GET",
          headers: { "Content-Type": "application/json" },
          param_type: 2,
        });
      
        // 2) Vemos TODO el objeto para inspeccionar la estructura
        console.log("→ Inventory full JSON:", JSON.stringify(resp, null, 2));
      
        // 3) Helper recursivo para extraer serial_numbers de donde sea que esté
        function findSerials(obj) {
          if (!obj || typeof obj !== 'object') return null;
          if (Array.isArray(obj.serial_numbers)) return obj.serial_numbers;
          for (const key of Object.keys(obj)) {
            const found = findSerials(obj[key]);
            if (found) return found;
          }
          return null;
        }
      
        // 4) Usamos el helper (o un array vacío si no lo encuentra)
        const serialArray = findSerials(resp) || [];
        console.log("→ serialArray extraída:", serialArray);
      
        // 5) Y poblamos tu select
        populateChasisSelect(serialArray);
      
       
      
      
      
      





        // Obtener detalles del producto desde Zoho Finance (función específica)
        ZOHO.CRM.FUNCTIONS.execute("itemsinventory", {
          arguments: JSON.stringify({
            item_id: selectedProductId
          })
        })
          .then(function (data) {
            console.log("Resultado de la función itemsinventory:", data);

            if (data.code === "success" && data.details && data.details.output) {
              const parsedOutput = JSON.parse(data.details.output);

              if (parsedOutput.item) {
                populateVehiculoDetailsFromFinance(parsedOutput.item);
              } else {
                console.warn("No se encontró el objeto 'item' en la respuesta.");
              }
            } else {
              console.error("La función no se ejecutó correctamente o falta información en la respuesta.");
            }
          })
          .catch(function (error) {
            console.error("Error al ejecutar la función de Zoho Finance:", error);
          });
      });
    }
  } catch (error) {
    console.error("Error al obtener la lista de productos:", error);
    showToast("Error al cargar la lista de productos", false);
  }
}




async function sendToWebhook(data) {
  const webhookUrl = "https://hook.us1.make.com/cs8qt6g51ugf633qc4v5gudg87w39j9i";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.warn(`El webhook respondió con error (status: ${response.status})`);
    }

    // No hacemos .json() para evitar errores si no es un JSON válido
    return;

  } catch (error) {
    console.error("Error al enviar datos al webhook:", error);
    // Aún así continuamos con el flujo, no lanzamos el error
  }
}



// Función para crear la Estimacion
async function createInvoice() {
  console.log("Creando Estimacion...");

  // Validar formulario
  const form = document.getElementById('invoiceForm');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    showErrorToast("Por favor complete todos los campos requeridos");
    return;
  }
  const equipoSolicitado = document.querySelector('textarea[name="equipo_solicitado[]"]').value.trim();
  const codigoEquipo = document.querySelector('textarea[name="codigo[]"]').value.trim();
  // Capturar los valores del formulario dinámicamente
  const invoiceData = {
    organization_id: "878347402",
    customer_id: document.getElementById("Customer_ID").value,
    contact_persons: [""],
    date: document.getElementById("Invoice_Date").value,
    reference_number: document.getElementById("Reference_Number").value,
    line_items: [],
    total: grandTotal,
    terms: document.getElementById("TermsAndConditions").value,
    // Agregar los campos extra de vehículo:
    vehicle_details: {
      descuento: document.getElementById('discountInput').value,
      marca: document.getElementById('marca').value,
      anio: document.getElementById('anio').value,
      tapiceria: document.getElementById('tapiceria').value,
      color: document.getElementById('color').value,
      tipo: document.getElementById('tipo').value,
      modelo: document.getElementById('modelo').value,
      chasis: document.getElementById('chasis').value,
      motor: document.getElementById('motor').value,

    },
    equipo_solicitado: {
      nombre: equipoSolicitado,
      codigo: codigoEquipo
    }
  };

  // Validar que al menos haya un producto
  const rows = document.querySelectorAll("#lineItemsTable tbody tr");
  if (rows.length === 0) {
    showErrorToast("Debe agregar al menos un producto");
    return;
  }

  // Capturar los productos (Line Items) dinámicamente
  let hasValidProducts = false;
  let stockError = false;

  rows.forEach(row => {
    const productSelect = row.querySelector(".product-select");
    const quantityInput = row.querySelector(".quantity");
    const unitPriceInput = row.querySelector(".unit-price");

    if (productSelect && productSelect.value && quantityInput && unitPriceInput) {
      const selectedProductId = productSelect.value;
      const selectedProduct = productsList.find(product => product.item_id === selectedProductId);

      // Limpiar clases previas
      quantityInput.classList.remove("error", "is-valid");

      if (selectedProduct) {
        const quantity = parseFloat(quantityInput.value) || 0;
        const stock = parseFloat(selectedProduct.actual_available_stock) ?? 0;

        // Asignar evento input solo una vez
        if (!quantityInput._hasStockListener) {
          const validateInRealTime = function () {
            const currentQuantity = parseFloat(this.value) || 0;
            if (currentQuantity > stock) {
              this.classList.add("error");
              this.classList.remove("is-valid");
            } else {
              this.classList.remove("error");
              this.classList.add("is-valid");
            }
          };
          quantityInput.addEventListener('input', validateInRealTime);
          quantityInput._hasStockListener = true; // evitar múltiples listeners
        }

        // Validación al enviar
        if (quantity > stock) {
          stockError = true;
          quantityInput.classList.add("error");
          quantityInput.classList.remove("is-valid");
        } else {
          hasValidProducts = true;

          const product = {
            item_id_crm: selectedProduct.item_id,
            name: selectedProduct.item_name || selectedProduct.name,
            rate: parseFloat(unitPriceInput.value) || 0,
            quantity: quantity
          };

          invoiceData.line_items.push(product);
        }
      }
    }
  });


  if (stockError) {
    showErrorToast("La cantidad ingresada supera el stock disponible. Corriga el Campo cantidad");
    return;
  }

  if (!hasValidProducts) {
    showErrorToast("Debe seleccionar al menos un producto válido");
    return;
  }

  console.log("Datos de la factura que se enviarán al webhook:", invoiceData);

  // Enviar los datos al webhook de Make
  try {
    const webhookResponse = await sendToWebhook(invoiceData);
    console.log("Respuesta del webhook:", webhookResponse);
    showSuccessToast("¡Cotización creada exitosamente!");

    try {
      await ZOHO.CRM.BLUEPRINT.proceed();
      console.log("Transición de blueprint ejecutada correctamente");
    } catch (bpError) {
      console.warn("No se pudo avanzar en el blueprint:", bpError);
      showToast("Cotización creada pero hubo un problema con el proceso interno", false);
    }


    // Cerrar el widget después de 2 segundos
    setTimeout(() => {
      ZOHO.CRM.UI.Popup.close();
    }, 3000);

  } catch (error) {
    console.error("Error al enviar datos al webhook:", error);
    showErrorToast("Error al crear la cotización: " + (error.message || "Por favor intente nuevamente"));
  }
}