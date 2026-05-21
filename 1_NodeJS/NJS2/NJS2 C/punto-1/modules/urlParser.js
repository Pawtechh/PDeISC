/**
 * Archivo: urlParser.js
 * Propósito: Módulo que utiliza el módulo URL nativo de Node.js (Punto 3)
 */

import url from 'url';

/**
 * Analiza una URL y extrae sus componentes usando el módulo URL nativo
 * @param {string} urlString - URL completa a analizar
 * @returns {object} - Componentes de la URL
 */
export function analizarURL(urlString) {
  // Usar módulo URL nativo de Node.js
  const urlObj = new url.URL(urlString);
  
  // Parsear parámetros de query string manualmente (o usar URLSearchParams)
  const queryParams = {};
  urlObj.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  
  return {
    href: urlObj.href,
    protocol: urlObj.protocol,
    host: urlObj.host,
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
    pathname: urlObj.pathname,
    search: urlObj.search,
    hash: urlObj.hash,
    queryParams: queryParams,
    origen: urlObj.origin
  };
}