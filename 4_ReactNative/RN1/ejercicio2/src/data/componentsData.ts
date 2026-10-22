import { NativeComponentDoc } from '../types/components';

export const NATIVE_COMPONENTS: NativeComponentDoc[] = [
  // --- BÁSICOS ---
  {
    id: 'view',
    name: 'View',
    category: 'Básicos',
    icon: 'layers-outline',
    summary: 'Contenedor universal para maquetar con Flexbox.',
    purpose: 'Es el bloque fundamental e indispensable para construir interfaces en React Native. Equivale al elemento <div> en el desarrollo web. Soporta diseño con Flexbox, estilos, accesibilidad y eventos táctiles.',
    useCases: [
      'Contenedor estructural de pantallas y tarjetas (Cards)',
      'Organización de elementos en filas (row) o columnas (column)',
      'Aplicación de padding, margin, bordes y fondos de color',
    ],
    keyProps: [
      { name: 'style', type: 'ViewStyle', description: 'Estilos visuales (flex, backgroundColor, padding, etc.)' },
      { name: 'onLayout', type: 'Function', description: 'Se dispara cuando el componente se monta y calcula dimensiones' },
      { name: 'accessible', type: 'boolean', description: 'Indica si es un elemento accesible para lectores de pantalla' },
    ],
    codeSnippet: `<View style={{ flex: 1, padding: 16, backgroundColor: '#ffffff' }}>
  <Text>Contenido dentro de la View</Text>
</View>`,
    tip: 'Las Views no renderizan texto plano directamente; todo texto debe estar siempre envuelto dentro de un componente <Text>.',
  },
  {
    id: 'text',
    name: 'Text',
    category: 'Básicos',
    icon: 'text-outline',
    summary: 'Componente para renderizar tipografía y cadenas de texto.',
    purpose: 'Permite mostrar texto con formato, admitiendo anidamiento jerárquico, estilos de fuente, truncado con puntos suspensivos y captura de eventos táctiles.',
    useCases: [
      'Títulos, subtítulos, párrafos y etiquetas',
      'Textos enriquecidos anidados (ej. una palabra en negrita dentro de una frase)',
      'Enlaces de texto clickeables mediante onPress',
    ],
    keyProps: [
      { name: 'numberOfLines', type: 'number', description: 'Trunca el texto a N líneas y agrega puntos suspensivos (...)' },
      { name: 'ellipsizeMode', type: "'head' | 'middle' | 'tail' | 'clip'", description: 'Ubicación de los puntos suspensivos' },
      { name: 'onPress', type: '() => void', description: 'Función que se ejecuta cuando el usuario toca el texto' },
    ],
    codeSnippet: `<Text style={{ fontSize: 16, color: '#333' }} numberOfLines={2}>
  Texto con formato y <Text style={{ fontWeight: 'bold' }}>negrita</Text>.
</Text>`,
    tip: 'A diferencia del navegador web, en React Native los estilos de texto no se heredan automáticamente de las Views padre; se deben definir explícitamente.',
  },
  {
    id: 'image',
    name: 'Image',
    category: 'Básicos',
    icon: 'image-outline',
    summary: 'Renderiza imágenes locales o remotas con diferentes modos de ajuste.',
    purpose: 'Permite mostrar recursos gráficos tanto almacenados localmente en el proyecto mediante require() como imágenes remotas desde URLs mediante uri.',
    useCases: [
      'Avatares de perfil, banners y logos de marcas',
      'Fotografías de productos en catálogos y comercios electrónicos',
      'Ilustraciones e íconos de estado',
    ],
    keyProps: [
      { name: 'source', type: 'ImageSourcePropType', description: 'require("./img.png") o { uri: "https://..." }' },
      { name: 'resizeMode', type: "'cover' | 'contain' | 'stretch' | 'repeat' | 'center'", description: 'Modo de escala y ajuste dentro del marco' },
      { name: 'onLoadEnd', type: '() => void', description: 'Se ejecuta cuando la imagen finalizó su carga con éxito o error' },
    ],
    codeSnippet: `<Image
  source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
  style={{ width: 64, height: 64, borderRadius: 32 }}
  resizeMode="cover"
/>`,
    tip: 'Las imágenes remotas ({ uri: ... }) REQUIEREN explícitamente que definas width y height en los estilos, de lo contrario no se visualizarán.',
  },
  {
    id: 'image-background',
    name: 'ImageBackground',
    category: 'Básicos',
    icon: 'images-outline',
    summary: 'Contenedor con imagen de fondo sobre el cual anidar otros elementos.',
    purpose: 'Elimina la necesidad de crear maquetaciones complejas con position: "absolute" cuando se desea colocar texto, botones o capas semitransparentes por encima de una imagen.',
    useCases: [
      'Encabezados visuales de pantalla con imagen de fondo y título superpuesto',
      'Tarjetas de contenido con fotografías de fondo',
      'Pantallas de bienvenida (Splash / Onboarding)',
    ],
    keyProps: [
      { name: 'source', type: 'ImageSourcePropType', description: 'Fuente de la imagen de fondo' },
      { name: 'imageStyle', type: 'StyleProp<ImageStyle>', description: 'Estilos aplicados directamente a la imagen de fondo' },
      { name: 'resizeMode', type: 'string', description: 'Modo de ajuste de la imagen de fondo' },
    ],
    codeSnippet: `<ImageBackground source={{ uri: 'https://picsum.photos/400/200' }} style={{ height: 200, padding: 16 }}>
  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Título sobre imagen</Text>
</ImageBackground>`,
  },

  // --- ENTRADAS ---
  {
    id: 'text-input',
    name: 'TextInput',
    category: 'Entradas',
    icon: 'create-outline',
    summary: 'Campo interactivo de entrada de texto mediante teclado en pantalla.',
    purpose: 'Permite al usuario ingresar y editar texto. Es la base de todos los formularios: login, registro, campos de búsqueda, comentarios y valores numéricos.',
    useCases: [
      'Campos de correo electrónico, nombre, teléfono y contraseñas',
      'Barras de búsqueda en tiempo real con filtrado dinámico',
      'Áreas de comentarios o notas multilínea (multiline={true})',
    ],
    keyProps: [
      { name: 'value', type: 'string', description: 'Valor del texto (componente controlado)' },
      { name: 'onChangeText', type: '(text: string) => void', description: 'Callback que se ejecuta ante cada pulsación de tecla' },
      { name: 'placeholder', type: 'string', description: 'Texto tenue visible cuando el campo está vacío' },
      { name: 'keyboardType', type: "'default' | 'email-address' | 'numeric' | 'phone-pad'", description: 'Tipo de teclado nativo a desplegar' },
      { name: 'secureTextEntry', type: 'boolean', description: 'Oculta los caracteres con puntos (ideal para contraseñas)' },
    ],
    codeSnippet: `<TextInput
  value={text}
  onChangeText={setText}
  placeholder="Ingresá tu correo..."
  keyboardType="email-address"
  autoCapitalize="none"
  style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
/>`,
    tip: 'Siempre recordá deshabilitar autoCapitalize="none" y autoCorrect={false} en campos de email y contraseñas para mejorar la experiencia de usuario.',
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'Entradas',
    icon: 'toggle-outline',
    summary: 'Interruptor booleano nativo (Toggle On/Off).',
    purpose: 'Proporciona un control visual nativo para seleccionar entre dos estados excluyentes (activado/desactivado, sí/no, encendido/apagado).',
    useCases: [
      'Configuración de preferencias (Notificaciones activadas, Modo oscuro)',
      'Aceptación de términos y condiciones',
      'Filtros binarios rápidos en listados',
    ],
    keyProps: [
      { name: 'value', type: 'boolean', description: 'Estado actual del switch (true o false)' },
      { name: 'onValueChange', type: '(val: boolean) => void', description: 'Función que recibe el nuevo valor booleano' },
      { name: 'trackColor', type: '{ false?: string, true?: string }', description: 'Color de la pista de deslizamiento' },
      { name: 'thumbColor', type: 'string', description: 'Color de la bolilla circular de arrastre' },
    ],
    codeSnippet: `<Switch
  value={isEnabled}
  onValueChange={setIsEnabled}
  trackColor={{ false: '#767577', true: '#2563eb' }}
  thumbColor={isEnabled ? '#ffffff' : '#f4f3f4'}
/>`,
  },

  // --- TOQUES E INTERACCIÓN ---
  {
    id: 'button',
    name: 'Button',
    category: 'Toques e Interacción',
    icon: 'radio-button-on-outline',
    summary: 'Botón nativo simple provisto por la plataforma.',
    purpose: 'Provee un botón elemental con la apariencia visual por defecto del sistema operativo (Android Material Design o iOS Cupertino). Tiene capacidades de estilización muy limitadas.',
    useCases: [
      'Prototipos rápidos y pruebas de concepto simples',
      'Acciones secundarias donde se busca el aspecto nativo estricto del SO',
    ],
    keyProps: [
      { name: 'title', type: 'string', description: 'Texto visible del botón (obligatorio)' },
      { name: 'onPress', type: '() => void', description: 'Función callback al presionar' },
      { name: 'color', type: 'string', description: 'Color del texto en iOS o color de fondo en Android' },
      { name: 'disabled', type: 'boolean', description: 'Desactiva el botón si es true' },
    ],
    codeSnippet: `<Button
  title="Guardar Datos"
  onPress={() => console.log('Guardado')}
  color="#2563eb"
/>`,
    tip: 'En aplicaciones profesionales se suele preferir TouchableOpacity o Pressable, ya que Button no admite estilos personalizados mediante style ni íconos.',
  },
  {
    id: 'touchable-opacity',
    name: 'TouchableOpacity',
    category: 'Toques e Interacción',
    icon: 'hand-left-outline',
    summary: 'Área interactiva con reducción animada de opacidad al tocar.',
    purpose: 'Convierte cualquier componente hijo en una superficie clickeable y provee retroalimentación visual inmediata atenuando la opacidad mientras se mantiene presionado.',
    useCases: [
      'Botones con diseño personalizado, íconos o gradientes',
      'Tarjetas de lista clickeables que navegan a detalles',
      'Elementos de barra de navegación y pestañas',
    ],
    keyProps: [
      { name: 'onPress', type: '() => void', description: 'Función que se dispara al pulsar y soltar' },
      { name: 'activeOpacity', type: 'number', description: 'Valor de opacidad entre 0 y 1 al presionar (default 0.2)' },
      { name: 'onLongPress', type: '() => void', description: 'Función que se dispara si se mantiene presionado prolongadamente' },
    ],
    codeSnippet: `<TouchableOpacity
  activeOpacity={0.7}
  onPress={handlePress}
  style={{ backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center' }}
>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Continuar</Text>
</TouchableOpacity>`,
  },
  {
    id: 'touchable-highlight',
    name: 'TouchableHighlight',
    category: 'Toques e Interacción',
    icon: 'flash-outline',
    summary: 'Área interactiva que resalta o cambia el fondo al presionar.',
    purpose: 'A diferencia de TouchableOpacity que atenúa todo el contenido, TouchableHighlight oscurece o tiñe el color de fondo para dar sensación de pulsación mecánica.',
    useCases: [
      'Filas de menús y listas estilo iOS',
      'Botones de teclados virtuales o diales numéricos',
    ],
    keyProps: [
      { name: 'underlayColor', type: 'string', description: 'Color que se mostrará como fondo de resalto al tocar' },
      { name: 'onPress', type: '() => void', description: 'Manejador del evento de toque' },
    ],
    codeSnippet: `<TouchableHighlight
  underlayColor="#1d4ed8"
  onPress={handlePress}
  style={{ backgroundColor: '#2563eb', padding: 12, borderRadius: 8 }}
>
  <Text style={{ color: '#fff' }}>Presionar aquí</Text>
</TouchableHighlight>`,
  },
  {
    id: 'pressable',
    name: 'Pressable',
    category: 'Toques e Interacción',
    icon: 'finger-print-outline',
    summary: 'El componente táctil moderno y flexible recomendado de React Native.',
    purpose: 'Es la evolución superior de los componentes Touchable. Provee una API declarativa basada en funciones de estado ({ pressed }), permitiendo alterar estilos dinámicamente según si está presionado o en reposo.',
    useCases: [
      'Diseño de componentes de interfaz modernos (Design Systems)',
      'Efectos de escala, cambio de color o sombra al presionar',
      'Manejo preciso de hitSlop (área táctil ampliada para dedos)',
    ],
    keyProps: [
      { name: 'style', type: '({ pressed }) => StyleProp<ViewStyle>', description: 'Función que recibe el estado pressed y retorna estilos dinámicos' },
      { name: 'hitSlop', type: 'number | Rect', description: 'Amplía el área táctil sin alterar el tamaño visual del elemento' },
      { name: 'onPressIn / onPressOut', type: '() => void', description: 'Callbacks para el instante en que entra o sale el toque' },
    ],
    codeSnippet: `<Pressable
  onPress={handleClick}
  style={({ pressed }) => [
    { backgroundColor: pressed ? '#1d4ed8' : '#2563eb', transform: [{ scale: pressed ? 0.98 : 1 }] },
    styles.buttonBase
  ]}
>
  {({ pressed }) => (
    <Text style={{ color: '#fff' }}>{pressed ? '¡Presionado!' : 'Tócame'}</Text>
  )}
</Pressable>`,
    tip: 'React Native recomienda usar Pressable para todo desarrollo nuevo en reemplazo de los componentes Touchable clásicos.',
  },

  // --- LISTAS Y DESPLAZAMIENTO ---
  {
    id: 'scroll-view',
    name: 'ScrollView',
    category: 'Listas',
    icon: 'swap-vertical-outline',
    summary: 'Contenedor deslizable de propósito general.',
    purpose: 'Permite al usuario desplazar contenido vertical u horizontalmente cuando este excede las dimensiones físicas de la pantalla. Renderiza todos sus hijos de inmediato en memoria.',
    useCases: [
      'Pantallas de formularios extensos con varios campos',
      'Artículos, vistas de detalle y pantallas de términos y condiciones',
      'Carruseles horizontales con horizontal={true}',
    ],
    keyProps: [
      { name: 'horizontal', type: 'boolean', description: 'Si es true, el desplazamiento es horizontal en lugar de vertical' },
      { name: 'showsVerticalScrollIndicator', type: 'boolean', description: 'Muestra u oculta la barra de desplazamiento' },
      { name: 'contentContainerStyle', type: 'ViewStyle', description: 'Estilos aplicados al contenedor interno que envuelve a los hijos' },
    ],
    codeSnippet: `<ScrollView contentContainerStyle={{ padding: 16 }}>
  <Text>Párrafo 1...</Text>
  <Text>Párrafo 2...</Text>
</ScrollView>`,
    tip: '¡Cuidado! No uses ScrollView para listas largas con cientos de elementos, ya que renderiza todo simultáneamente y consumirá mucha memoria. Para eso usa FlatList.',
  },
  {
    id: 'flat-list',
    name: 'FlatList',
    category: 'Listas',
    icon: 'list-outline',
    summary: 'Lista virtualizada de alto rendimiento para grandes volúmenes de datos.',
    purpose: 'Es el componente optimizado estrella de React Native para renderizar colecciones de cientos o miles de elementos. Solo mantiene en memoria los elementos visibles en pantalla (reciclado de vistas).',
    useCases: [
      'Feeds de redes sociales (Instagram, Twitter)',
      'Listados de productos en ecommerce',
      'Resultados de búsqueda con paginación infinita (onEndReached)',
    ],
    keyProps: [
      { name: 'data', type: 'Array<ItemT>', description: 'Arreglo de datos a renderizar' },
      { name: 'renderItem', type: '({ item, index }) => ReactElement', description: 'Función que retorna el componente visual para cada elemento' },
      { name: 'keyExtractor', type: '(item, index) => string', description: 'Extrae una clave única para cada fila' },
      { name: 'ListEmptyComponent', type: 'ReactElement', description: 'Elemento que se muestra si la lista no tiene datos' },
    ],
    codeSnippet: `<FlatList
  data={usuarios}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <View style={styles.row}>
      <Text>{item.nombre}</Text>
    </View>
  )}
/>`,
  },
  {
    id: 'section-list',
    name: 'SectionList',
    category: 'Listas',
    icon: 'file-tray-stacked-outline',
    summary: 'Lista agrupada por secciones con cabeceras fijas.',
    purpose: 'Similar a FlatList en rendimiento, pero estructurada para mostrar datos divididos en secciones o categorías lógicas, con soporte para encabezados sticky.',
    useCases: [
      'Agendas telefónicas ordenadas alfabéticamente (A, B, C...)',
      'Menús de restaurantes agrupados por Entradas, Platos y Postres',
      'Historiales de transacciones agrupados por Mes o Semana',
    ],
    keyProps: [
      { name: 'sections', type: 'Array<{ title: string, data: any[] }>', description: 'Arreglo de secciones con título y datos' },
      { name: 'renderItem', type: '({ item }) => ReactElement', description: 'Render de los elementos individuales de cada sección' },
      { name: 'renderSectionHeader', type: '({ section }) => ReactElement', description: 'Render del encabezado de cada sección' },
    ],
    codeSnippet: `<SectionList
  sections={[
    { title: 'Frutas', data: ['Manzana', 'Banana'] },
    { title: 'Verduras', data: ['Zanahoria', 'Lechuga'] }
  ]}
  keyExtractor={(item, index) => item + index}
  renderItem={({ item }) => <Text>{item}</Text>}
  renderSectionHeader={({ section: { title } }) => (
    <Text style={styles.header}>{title}</Text>
  )}
/>`,
  },

  // --- FEEDBACK Y DIÁLOGOS ---
  {
    id: 'activity-indicator',
    name: 'ActivityIndicator',
    category: 'Feedback y Diálogos',
    icon: 'reload-circle-outline',
    summary: 'Spinner o indicador circular de carga animado nativo.',
    purpose: 'Muestra un indicador giratorio nativo para informar al usuario que una operación asíncrona (petición a una API, guardado, descarga) se encuentra en ejecución.',
    useCases: [
      'Carga inicial de datos desde un servidor',
      'Estados de espera al presionar un botón de inicio de sesión',
      'Indicador de carga al final de una lista con scroll infinito',
    ],
    keyProps: [
      { name: 'size', type: "'small' | 'large' | number", description: 'Tamaño del indicador' },
      { name: 'color', type: 'string', description: 'Color del spinner' },
      { name: 'animating', type: 'boolean', description: 'Si es true muestra la animación (default true)' },
    ],
    codeSnippet: `<ActivityIndicator size="large" color="#2563eb" />`,
  },
  {
    id: 'modal',
    name: 'Modal',
    category: 'Feedback y Diálogos',
    icon: 'albums-outline',
    summary: 'Ventana emergente que se superpone a la vista actual.',
    purpose: 'Permite presentar contenido en una capa separada encima de la pantalla en curso, bloqueando la interacción con el fondo o requiriendo la atención directa del usuario.',
    useCases: [
      'Diálogos de confirmación crítica (ej. ¿Desea eliminar su cuenta?)',
      'Selectores complejos (fechas, filtros avanzados, selector de países)',
      'Previsualización de imágenes o documentos a pantalla completa',
    ],
    keyProps: [
      { name: 'visible', type: 'boolean', description: 'Controla si el modal está visible o no' },
      { name: 'animationType', type: "'none' | 'slide' | 'fade'", description: 'Tipo de transición visual de entrada y salida' },
      { name: 'transparent', type: 'boolean', description: 'Si es true, permite ver la pantalla de fondo atenuada' },
      { name: 'onRequestClose', type: '() => void', description: 'Callback requerido para gestionar el botón atrás físico en Android' },
    ],
    codeSnippet: `<Modal visible={showModal} transparent={true} animationType="fade" onRequestClose={() => setShowModal(false)}>
  <View style={styles.backdrop}>
    <View style={styles.modalContent}>
      <Text>Este es el contenido del Modal</Text>
      <Button title="Cerrar" onPress={() => setShowModal(false)} />
    </View>
  </View>
</Modal>`,
  },
  {
    id: 'alert',
    name: 'Alert',
    category: 'Feedback y Diálogos',
    icon: 'alert-circle-outline',
    summary: 'Diálogo nativo del sistema operativo con título, mensaje y botones.',
    purpose: 'Es una API estática (no se renderiza como componente JSX) que invoca directamente el cuadro de diálogo estándar nativo de Android o iOS.',
    useCases: [
      'Mensajes de advertencia o error en validaciones',
      'Confirmación de acciones destructivas con botones Cancelar / Aceptar',
      'Notificaciones rápidas del sistema',
    ],
    keyProps: [
      { name: 'Alert.alert(title, message, buttons, options)', type: 'Método estático', description: 'Despliega el diálogo nativo en pantalla' },
    ],
    codeSnippet: `Alert.alert(
  'Confirmación',
  '¿Estás seguro de que deseas continuar?',
  [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Aceptar', onPress: () => console.log('Confirmado') }
  ]
);`,
  },

  // --- SISTEMA Y UTILIDADES ---
  {
    id: 'status-bar',
    name: 'StatusBar',
    category: 'Sistema',
    icon: 'battery-charging-outline',
    summary: 'Control del estilo de la barra superior del sistema.',
    purpose: 'Permite controlar el aspecto de la barra superior de información del teléfono (icono de batería, hora, señal de red y modo claro/oscuro).',
    useCases: [
      'Garantizar legibilidad de los íconos según el color del encabezado de la app',
      'Ocultar la barra en experiencias inmersivas (reproductor de video, juegos)',
    ],
    keyProps: [
      { name: 'barStyle', type: "'default' | 'light-content' | 'dark-content'", description: 'Estilo de los íconos (claros u oscuros)' },
      { name: 'hidden', type: 'boolean', description: 'Si es true, oculta la barra de estado' },
    ],
    codeSnippet: `<StatusBar barStyle="light-content" backgroundColor="#2563eb" />`,
  },
  {
    id: 'keyboard-avoiding-view',
    name: 'KeyboardAvoidingView',
    category: 'Sistema',
    icon: 'keypad-outline',
    summary: 'Ajuste automático de la pantalla ante el teclado virtual.',
    purpose: 'Mueve o redimensiona automáticamente la vista hacia arriba cuando el teclado virtual del dispositivo se abre, impidiendo que el teclado tape los campos de texto activos.',
    useCases: [
      'Pantallas de login y formularios de registro',
      'Barras de chat donde el input de mensaje debe quedar siempre encima del teclado',
    ],
    keyProps: [
      { name: 'behavior', type: "'height' | 'position' | 'padding'", description: 'Estrategia de desplazamiento (comúnmente "padding" en iOS y "height" en Android)' },
      { name: 'keyboardVerticalOffset', type: 'number', description: 'Compensación de altura adicional (ej. altura del header)' },
    ],
    codeSnippet: `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
  <TextInput placeholder="Tu mensaje..." />
</KeyboardAvoidingView>`,
  },
];
