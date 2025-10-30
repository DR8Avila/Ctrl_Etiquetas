// ===============================
// ESTADO GLOBAL - Datos en Memoria
// ===============================
let appState = {
  etiquetas: [],
  navigationStack: [],
  currentView: 'welcome',
  currentFilter: {}
};

// ===============================
// DATOS DE PRUEBA (para test inicial)
// ===============================
const SAMPLE_DATA = [
  { Referencia: '0003-01412012', Etiqueta: 'J056458T', Destino: 'Agronorte SRL', Ciudad: 'san justo', Ruta: 'ROS_4' },
  { Referencia: '0003-01411975', Etiqueta: 'J057556D', Destino: 'Andres Parra y Cia SCC', Ciudad: 'roque saenz peña', Ruta: 'ROS_8' },
  
];

// ===============================
// ELEMENTOS DEL DOM
// ===============================
const elements = {
  // Cabecera
  menuBtn: null,
  searchBtn: null,
  headerTitle: null,

  // Vistas
  welcomeView: null,
  listView: null,

  // Lista
  backButtonContainer: null,
  backBtn: null,
  listContainer: null,

  // Pie de app
  appFooter: null,
  footerCounter: null,

  // Menú Modal
  menuModal: null,
  importBtn: null,
  exportBtn: null,
  clearDataBtn: null,
  closeMenuBtn: null,
  exitBtn: null,

  // Modal de Búsqueda
  searchModal: null,
  searchInput: null,
  searchSubmitBtn: null,
  simulateScanBtn: null,
  searchResultsList: null,
  closeSearchBtn: null,

  // Loading/Spinner
  loadingSpinner: null,

  // Input de archivo
  fileInput: null
};

// ===============================
// INICIALIZACIÓN DE INTERFAZ
// ===============================
function init() {
  // Obtener referencias del DOM
  elements.menuBtn = document.getElementById('menuBtn');
  elements.searchBtn = document.getElementById('searchBtn');
  elements.headerTitle = document.getElementById('headerTitle');
  elements.welcomeView = document.getElementById('welcomeView');
  elements.listView = document.getElementById('listView');
  elements.backButtonContainer = document.getElementById('backButtonContainer');
  elements.backBtn = document.getElementById('backBtn');
  elements.listContainer = document.getElementById('listContainer');
  elements.appFooter = document.getElementById('appFooter');
  elements.footerCounter = document.getElementById('footerCounter');
  elements.menuModal = document.getElementById('menuModal');
  elements.importBtn = document.getElementById('importBtn');
  elements.exportBtn = document.getElementById('exportBtn');
  elements.clearDataBtn = document.getElementById('clearDataBtn');
  elements.closeMenuBtn = document.getElementById('closeMenuBtn');
  elements.exitBtn = document.getElementById('exitBtn');
  elements.searchModal = document.getElementById('searchModal');
  elements.searchInput = document.getElementById('searchInput');
  elements.searchSubmitBtn = document.getElementById('searchSubmitBtn');
  elements.simulateScanBtn = document.getElementById('simulateScanBtn');
  elements.searchResultsList = document.getElementById('searchResultsList');
  elements.closeSearchBtn = document.getElementById('closeSearchBtn');
  elements.loadingSpinner = document.getElementById('loadingSpinner');
  elements.fileInput = document.getElementById('fileInput');

  // EVENTOS BOTONERÍA Y ACCIONES
  elements.menuBtn.addEventListener('click', openMenu);
  elements.searchBtn.addEventListener('click', openSearch);
  elements.backBtn.addEventListener('click', navigateBack);
  elements.closeMenuBtn.addEventListener('click', closeMenu);
  elements.importBtn.addEventListener('click', triggerFileImport);
  elements.exportBtn.addEventListener('click', exportToExcel);
  elements.clearDataBtn.addEventListener('click', clearData);
  elements.exitBtn.addEventListener('click', exitApp);
  elements.searchSubmitBtn.addEventListener('click', performSearch);
  elements.simulateScanBtn.addEventListener('click', simulateScan);
  elements.closeSearchBtn.addEventListener('click', closeSearch);
  elements.fileInput.addEventListener('change', handleFileSelect);

  // Usar ENTER para buscar
  elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // --- MEJORA: Búsqueda automática al escanear / escribir ---
  elements.searchInput.addEventListener('input', function(e) {
    if (e.target.value.length >= 8) { 
      performSearch();
    }
  });
  // ----------------------------------------------------------
}

// ===============================
// CARGA DE DATOS DE PRUEBA (Opcional)
// ===============================
function loadSampleData() {
  appState.etiquetas = SAMPLE_DATA.map(item => ({
    ...item,
    validado: false
  }));
  updateUI();
  navigateToRoutes();
}

// ===============================
// IMPORTACIÓN Y MANEJO DE ARCHIVO EXCEL
// ===============================
function triggerFileImport() {
  elements.fileInput.click();
  closeMenu();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  showLoading();

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // Validar columnas requeridas
      if (jsonData.length === 0) {
        hideLoading();
        alert('El archivo está vacío');
        return;
      }

      const requiredColumns = ['Referencia', 'Etiqueta', 'Destino', 'Ciudad', 'Ruta'];
      const firstRow = jsonData[0];
      const hasAllColumns = requiredColumns.every(col => col in firstRow);

      if (!hasAllColumns) {
        hideLoading();
        alert('El archivo debe contener las columnas: Referencia, Etiqueta, Destino, Ciudad, Ruta');
        return;
      }

      // Guardar datos en memoria y agregar estado
      appState.etiquetas = jsonData.map(item => ({
        Referencia: String(item.Referencia || ''),
        Etiqueta: String(item.Etiqueta || ''),
        Destino: String(item.Destino || ''),
        Ciudad: String(item.Ciudad || '').toLowerCase(),
        Ruta: String(item.Ruta || ''),
        validado: false
      }));

      hideLoading();
      updateUI();
      navigateToRoutes();
      alert(`Archivo importado: ${appState.etiquetas.length} etiquetas cargadas`);

    } catch (error) {
      hideLoading();
      console.error('Error al importar:', error);
      alert('Error al importar el archivo. Verifique que sea un archivo Excel válido.');
    }
  };

  reader.readAsArrayBuffer(file);
  event.target.value = ''; // Resetea el input archivo
}

// ===============================
// EXPORTACIÓN A EXCEL
// ===============================
function exportToExcel() {
  if (appState.etiquetas.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  showLoading();

  setTimeout(() => {
    try {
      const exportData = appState.etiquetas.map(item => ({
        Referencia: item.Referencia,
        Etiqueta: item.Etiqueta,
        Destino: item.Destino,
        Ciudad: item.Ciudad,
        Ruta: item.Ruta,
        Estado: item.validado ? 'OK' : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Etiquetas');

      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const filename = `HR_Export_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);

      hideLoading();
      closeMenu();
      alert('Archivo exportado correctamente');

    } catch (error) {
      hideLoading();
      console.error('Error al exportar:', error);
      alert('Error al exportar el archivo');
    }
  }, 100);
}

// ===============================
// FUNCIONALIDAD LIMPIAR DATOS
// ===============================
function clearData() {
  if (appState.etiquetas.length === 0) {
    alert('No hay datos para limpiar');
    return;
  }

  if (confirm('¿Está seguro de que desea limpiar todos los datos?')) {
    appState.etiquetas = [];
    appState.navigationStack = [];
    appState.currentFilter = {};
    updateUI();
    showWelcomeView();
    closeMenu();
  }
}

// ===============================
// FUNCIONALIDAD SALIR DE LA APP
// ===============================
function exitApp() {
  if (appState.etiquetas.length > 0) {
    const hasValidated = appState.etiquetas.some(e => e.validado);
    if (hasValidated) {
      if (confirm('¿Desea exportar los resultados antes de salir?')) {
        exportToExcel();
      }
    }
  }

  // En una app real, esta opción cerraría la ventana o finalizaría la sesión
  if (confirm('¿Está seguro de que desea salir?')) {
    appState.etiquetas = [];
    appState.navigationStack = [];
    appState.currentFilter = {};
    updateUI();
    showWelcomeView();
    closeMenu();
  }
}

// ===============================
// NAVEGACIÓN JERÁRQUICA
// ===============================
function navigateToRoutes() {
  appState.navigationStack = [];
  appState.currentFilter = {};
  renderRoutes();
}

function navigateToCities(ruta) {
  appState.navigationStack.push({ type: 'rutas', filter: {} });
  appState.currentFilter = { Ruta: ruta };
  renderCities(ruta);
}

function navigateToDestinations(ruta, ciudad) {
  appState.navigationStack.push({ type: 'ciudades', filter: { Ruta: ruta } });
  appState.currentFilter = { Ruta: ruta, Ciudad: ciudad };
  renderDestinations(ruta, ciudad);
}

function navigateToReferences(ruta, ciudad, destino) {
  appState.navigationStack.push({ type: 'destinos', filter: { Ruta: ruta, Ciudad: ciudad } });
  appState.currentFilter = { Ruta: ruta, Ciudad: ciudad, Destino: destino };
  renderReferences(ruta, ciudad, destino);
}

function navigateToLabels(ruta, ciudad, destino, referencia) {
  appState.navigationStack.push({ type: 'referencias', filter: { Ruta: ruta, Ciudad: ciudad, Destino: destino } });
  appState.currentFilter = { Ruta: ruta, Ciudad: ciudad, Destino: destino, Referencia: referencia };
  renderLabels(ruta, ciudad, destino, referencia);
}

function navigateBack() {
  if (appState.navigationStack.length === 0) {
    return;
  }

  const previous = appState.navigationStack.pop();
  appState.currentFilter = previous.filter;

  switch (previous.type) {
    case 'rutas':
      renderRoutes();
      break;
    case 'ciudades':
      renderCities(previous.filter.Ruta);
      break;
    case 'destinos':
      renderDestinations(previous.filter.Ruta, previous.filter.Ciudad);
      break;
    case 'referencias':
      renderReferences(previous.filter.Ruta, previous.filter.Ciudad, previous.filter.Destino);
      break;
  }
}

// ===============================
// RENDERIZADO DE INTERFACES
// ===============================
function renderRoutes() {
  elements.headerTitle.textContent = 'Control de Etiquetas';
  elements.backButtonContainer.style.display = 'none';
  showListView();

  const rutas = getUniqueValues('Ruta');
  const html = rutas.map(ruta => {
    const counter = getCounter({ Ruta: ruta });
    const isComplete = counter.validated === counter.total;
    return `
      <div class="list-item" data-ruta="${ruta}">
        <div class="list-item-content">
          <div class="list-item-title">${ruta}</div>
        </div>
        <div class="list-item-counter ${isComplete ? 'completed' : ''}">${counter.validated}/${counter.total}</div>
      </div>
    `;
  }).join('');

  elements.listContainer.innerHTML = html;

  // Evento para navegar por rutas
  document.querySelectorAll('.list-item[data-ruta]').forEach(item => {
    item.addEventListener('click', () => {
      const ruta = item.dataset.ruta;
      navigateToCities(ruta);
    });
  });
}

function renderCities(ruta) {
  elements.headerTitle.textContent = `Ruta: ${ruta}`;
  elements.backButtonContainer.style.display = 'block';
  showListView();

  const ciudades = getUniqueValues('Ciudad', { Ruta: ruta });
  const html = ciudades.map(ciudad => {
    const counter = getCounter({ Ruta: ruta, Ciudad: ciudad });
    const isComplete = counter.validated === counter.total;
    return `
      <div class="list-item" data-ciudad="${ciudad}">
        <div class="list-item-content">
          <div class="list-item-title">${capitalizeText(ciudad)}</div>
        </div>
        <div class="list-item-counter ${isComplete ? 'completed' : ''}">${counter.validated}/${counter.total}</div>
      </div>
    `;
  }).join('');

  elements.listContainer.innerHTML = html;

  // Evento para navegar por ciudades
  document.querySelectorAll('.list-item[data-ciudad]').forEach(item => {
    item.addEventListener('click', () => {
      const ciudad = item.dataset.ciudad;
      navigateToDestinations(ruta, ciudad);
    });
  });
}

function renderDestinations(ruta, ciudad) {
  elements.headerTitle.textContent = `Ciudad: ${capitalizeText(ciudad)}`;
  elements.backButtonContainer.style.display = 'block';
  showListView();

  const destinos = getUniqueValues('Destino', { Ruta: ruta, Ciudad: ciudad });
  const html = destinos.map(destino => {
    const counter = getCounter({ Ruta: ruta, Ciudad: ciudad, Destino: destino });
    const isComplete = counter.validated === counter.total;
    return `
      <div class="list-item" data-destino="${escapeHtml(destino)}">
        <div class="list-item-content">
          <div class="list-item-title">${escapeHtml(destino)}</div>
        </div>
        <div class="list-item-counter ${isComplete ? 'completed' : ''}">${counter.validated}/${counter.total}</div>
      </div>
    `;
  }).join('');

  elements.listContainer.innerHTML = html;

  // Evento para navegar por destinos
  document.querySelectorAll('.list-item[data-destino]').forEach(item => {
    item.addEventListener('click', () => {
      const destino = item.dataset.destino;
      navigateToReferences(ruta, ciudad, destino);
    });
  });
}

function renderReferences(ruta, ciudad, destino) {
  elements.headerTitle.textContent = `Destino: ${destino}`;
  elements.backButtonContainer.style.display = 'block';
  showListView();

  const referencias = getUniqueValues('Referencia', { Ruta: ruta, Ciudad: ciudad, Destino: destino });
  const html = referencias.map(referencia => {
    const counter = getCounter({ Ruta: ruta, Ciudad: ciudad, Destino: destino, Referencia: referencia });
    const isComplete = counter.validated === counter.total;
    return `
      <div class="list-item" data-referencia="${referencia}">
        <div class="list-item-content">
          <div class="list-item-title">${referencia}</div>
        </div>
        <div class="list-item-counter ${isComplete ? 'completed' : ''}">${counter.validated}/${counter.total}</div>
      </div>
    `;
  }).join('');

  elements.listContainer.innerHTML = html;

  // Evento para navegar por referencias
  document.querySelectorAll('.list-item[data-referencia]').forEach(item => {
    item.addEventListener('click', () => {
      const referencia = item.dataset.referencia;
      navigateToLabels(ruta, ciudad, destino, referencia);
    });
  });
}

function renderLabels(ruta, ciudad, destino, referencia) {
  elements.headerTitle.textContent = `Ref: ${referencia}`;
  elements.backButtonContainer.style.display = 'block';
  showListView();

  const labels = appState.etiquetas.filter(e =>
    e.Ruta === ruta &&
    e.Ciudad === ciudad &&
    e.Destino === destino &&
    e.Referencia === referencia
  );

  const html = labels.map((label, index) => `
    <div class="label-item ${label.validado ? 'validated' : ''}" data-index="${index}">
      <input type="checkbox" class="label-checkbox" ${label.validado ? 'checked' : ''} data-etiqueta="${label.Etiqueta}">
      <div class="label-item-content">
        <div class="label-item-code">${label.Etiqueta}</div>
        <div class="label-item-info">
          ${label.Referencia}<br>
          ${escapeHtml(label.Destino)} - ${capitalizeText(label.Ciudad)}
        </div>
      </div>
    </div>
  `).join('');

  elements.listContainer.innerHTML = html;

  // Evento para validar/desvalidar etiquetas
  document.querySelectorAll('.label-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const etiqueta = e.target.dataset.etiqueta;
      toggleLabelValidation(etiqueta);
    });
  });
}

// ===============================
// FUNCIONALIDAD DE BÚSQUEDA Y ESCANEO
// ===============================
function performSearch() {
  const query = elements.searchInput.value.trim().toLowerCase();

  if (!query) {
    elements.searchResultsList.innerHTML = '<div class="search-result-empty">Ingrese un código para buscar</div>';
    return;
  }

  const results = appState.etiquetas.filter(e =>
    e.Etiqueta.toLowerCase().includes(query)
  );

  // --- MEJORA: Feedback visual en campo búsqueda ---
  if (results.length > 0) {
    elements.searchInput.style.background = '#bbffbb'; // verde éxito
  } else {
    elements.searchInput.style.background = '#ffbbbb'; // rojo no encontrado
  }
  setTimeout(() => elements.searchInput.style.background = '', 700);

  if (results.length === 0) {
    elements.searchResultsList.innerHTML = '<div class="search-result-empty">No se encontraron resultados</div>';
    return;
  }

  // Renderizar resultados
  const html = results.map(label => `
    <div class="label-item ${label.validado ? 'validated' : ''}">
      <input type="checkbox" class="label-checkbox" ${label.validado ? 'checked' : ''} data-etiqueta="${label.Etiqueta}">
      <div class="label-item-content">
        <div class="label-item-code">${label.Etiqueta}</div>
        <div class="label-item-info">
          ${label.Referencia}<br>
          ${escapeHtml(label.Destino)} - ${capitalizeText(label.Ciudad)}<br>
          Ruta: ${label.Ruta}
        </div>
      </div>
    </div>
  `).join('');

  elements.searchResultsList.innerHTML = html;

  // Evento para validar/desvalidar desde búsqueda
  document.querySelectorAll('#searchResultsList .label-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const etiqueta = e.target.dataset.etiqueta;
      toggleLabelValidation(etiqueta);
      updateUI();
      // Re-renderizar resultados para mostrar estado actualizado
      setTimeout(() => performSearch(), 10);
    });
  });

  // --- MEJORA: Limpiar campo tras buscar ---
  setTimeout(() => elements.searchInput.value = '', 1000);
}

function simulateScan() {
  // Simula el escaneo asignando una etiqueta no validada al input
  const unvalidated = appState.etiquetas.filter(e => !e.validado);

  if (unvalidated.length === 0) {
    alert('Todas las etiquetas están validadas');
    return;
  }

  const randomLabel = unvalidated[Math.floor(Math.random() * unvalidated.length)];
  elements.searchInput.value = randomLabel.Etiqueta;
  performSearch();
}

// ===============================
// CAMBIO DE ESTADO DE VALIDACIÓN
// ===============================
function toggleLabelValidation(etiqueta) {
  const label = appState.etiquetas.find(e => e.Etiqueta === etiqueta);
  if (label) {
    label.validado = !label.validado;
    updateUI();
  }
}

// ===============================
// FUNCIONES DE INTERFAZ Y AYUDA
// ===============================
function showWelcomeView() {
  elements.welcomeView.classList.add('active');
  elements.listView.classList.remove('active');
  elements.appFooter.style.display = 'none';
}

function showListView() {
  elements.welcomeView.classList.remove('active');
  elements.listView.classList.add('active');
  elements.appFooter.style.display = 'block';
}

function updateUI() {
  // Actualizar contador total en pie de página
  const totalCounter = getCounter({});
  elements.footerCounter.textContent = `Total: ${totalCounter.validated}/${totalCounter.total}`;

  // Habilitar/deshabilitar botones según si hay datos
  const hasData = appState.etiquetas.length > 0;
  elements.exportBtn.disabled = !hasData;
  elements.clearDataBtn.disabled = !hasData;
}

function openMenu() {
  elements.menuModal.classList.add('active');
}

function closeMenu() {
  elements.menuModal.classList.remove('active');
}

function openSearch() {
  if (appState.etiquetas.length === 0) {
    alert('Primero debe importar un archivo');
    return;
  }
  elements.searchInput.value = '';
  elements.searchResultsList.innerHTML = '<div class="search-result-empty">Ingrese un código para buscar</div>';
  elements.searchModal.classList.add('active');
  setTimeout(() => elements.searchInput.focus(), 100);
}

function closeSearch() {
  elements.searchModal.classList.remove('active');
}

function showLoading() {
  elements.loadingSpinner.style.display = 'flex';
}

function hideLoading() {
  elements.loadingSpinner.style.display = 'none';
}

// ===============================
// FUNCIONES DE AYUDA DE DATOS
// ===============================
function getUniqueValues(field, filter = {}) {
  const filtered = filterData(filter);
  const values = [...new Set(filtered.map(item => item[field]))];
  return values.sort();
}

function filterData(filter) {
  return appState.etiquetas.filter(item => {
    for (let key in filter) {
      if (item[key] !== filter[key]) return false;
    }
    return true;
  });
}

function getCounter(filter) {
  const filtered = filterData(filter);
  return {
    total: filtered.length,
    validated: filtered.filter(e => e.validado).length
  };
}

function capitalizeText(text) {
  return text.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===============================
// INICIO DE APP
// ===============================
document.addEventListener('DOMContentLoaded', init);
