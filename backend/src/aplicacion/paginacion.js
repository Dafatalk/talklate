// Paginacion de listas (convenciones/api-rest.md seccion 5): { data, pagination }
function paginar(lista, query = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const total = lista.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(query.page, 10) || 1, 1), totalPages);
  return { data: lista.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, totalPages } };
}

module.exports = { paginar };
