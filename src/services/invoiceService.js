/**
 * Invoice Service
 * Handles data retrieval and business logic for invoices.
 */

const db = require('../db/knex');

/**
 * Get a single invoice by its ID.
 * Performs authorization checks.
 *
 * @param {string} id - The unique identifier of the invoice.
 * @param {string} tenantId - The tenant ID for isolation.
 * @returns {Object|null} The invoice data or null if not found.
 */
const getInvoiceById = async (id, tenantId) => {
  // 1. Basic validation
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid invoice ID');
  }

  // 2. Fetch from DB with tenant isolation
  const invoice = await db('invoices')
    .where({ invoice_id: id, tenant_id: tenantId, deleted_at: null })
    .first();

  // 3. Not Found handling
  if (!invoice) {
    return null;
  }

  return invoice;
};

/**
 * Get all invoices for a tenant, with optional status filter.
 *
 * @param {string} tenantId - The tenant ID.
 * @param {string} [status] - Optional status filter.
 * @returns {Array} List of invoices.
 */
const getInvoices = async (tenantId, status) => {
  let query = db('invoices')
    .where({ tenant_id: tenantId, deleted_at: null })
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where({ status });
  }

  return await query;
};

/**
 * Create a new invoice.
 *
 * @param {Object} invoiceData - The invoice data.
 * @param {string} tenantId - The tenant ID.
 * @returns {Object} The created invoice.
 */
const createInvoice = async (invoiceData, tenantId) => {
  const { amount, customer, status = 'pending', metadata } = invoiceData;

  const invoiceId = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const [newInvoice] = await db('invoices')
    .insert({
      invoice_id: invoiceId,
      amount,
      customer,
      status,
      tenant_id: tenantId,
      metadata: metadata || null,
    })
    .returning('*');

  return newInvoice;
};

/**
 * Update invoice status.
 *
 * @param {string} id - Invoice ID.
 * @param {string} status - New status.
 * @param {string} tenantId - Tenant ID.
 * @returns {Object|null} Updated invoice or null.
 */
const updateInvoiceStatus = async (id, status, tenantId) => {
  const [updated] = await db('invoices')
    .where({ invoice_id: id, tenant_id: tenantId })
    .update({ status, updated_at: db.fn.now() })
    .returning('*');

  return updated || null;
};

module.exports = {
  getInvoiceById,
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
};
