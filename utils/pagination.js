// utils/pagination.js

/**
 * Menghasilkan opsi pagination untuk query Prisma
 * @param {number} page - Nomor halaman (default: 1)
 * @param {number} limit - Jumlah data per halaman (default: 10)
 * @returns {Object} - skip & take untuk Prisma
 */
function getPagination(page, limit) {
  const pageNumber = Math.max(1, parseInt(page) || 1);
  const limitNumber = Math.max(1, Math.min(parseInt(limit) || 5, 100));
  const skip = (pageNumber - 1) * limitNumber;
  return { skip, take: limitNumber };
}

/**
 * Menghasilkan metadata pagination (total data, total halaman, dll)
 * @param {number} totalItems - Total data dari database
 * @param {number} limit - Jumlah item per halaman
 * @param {number} page - Halaman saat ini
 * @returns {Object} - Metadata pagination
 */
function getPaginationMeta(totalItems, limit, page) {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    totalItems,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    itemCount: limit,
  };
}

module.exports = {
  getPagination,
  getPaginationMeta,
};
