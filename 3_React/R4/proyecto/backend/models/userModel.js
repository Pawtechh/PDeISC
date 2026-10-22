// models/userModel.js
// Capa de acceso a datos (Data Access Layer) para la tabla `users`.
// Mantener el SQL aislado aquí facilita testear y migrar a un ORM después.

const pool = require('../config/db');

const UserModel = {
  async create({ name, email, passwordHash, role = 'user' }) {
    const query = `
      INSERT INTO users (name, email, password_hash, role, provider)
      VALUES ($1, $2, $3, $4, 'local')
      RETURNING id, name, email, role, provider, avatar_url, created_at
    `;
    const { rows } = await pool.query(query, [name, email, passwordHash, role]);
    return rows[0];
  },

  async findByProvider(provider, providerId) {
    const query = `SELECT * FROM users WHERE provider = $1 AND provider_id = $2`;
    const { rows } = await pool.query(query, [provider, providerId]);
    return rows[0] || null;
  },

  async createFromProvider({ name, email, provider, providerId, avatarUrl }) {
    const query = `
      INSERT INTO users (name, email, password_hash, role, provider, provider_id, avatar_url)
      VALUES ($1, $2, NULL, 'user', $3, $4, $5)
      RETURNING id, name, email, role, provider, avatar_url, created_at
    `;
    const { rows } = await pool.query(query, [name, email, provider, providerId, avatarUrl]);
    return rows[0];
  },

  /**
   * Busca un usuario por (provider, providerId). Si no existe, lo crea.
   * Si ya existe un usuario local con el mismo email, vincula la cuenta social a ese registro.
   */
  async findOrCreateByProvider({ provider, providerId, name, email, avatarUrl }) {
    let user = await UserModel.findByProvider(provider, providerId);
    if (user) return user;

    if (email) {
      const existingByEmail = await UserModel.findByEmail(email.toLowerCase());
      if (existingByEmail) {
        const query = `
          UPDATE users SET provider = $1, provider_id = $2, avatar_url = COALESCE($3, avatar_url)
          WHERE id = $4
          RETURNING id, name, email, role, provider, avatar_url, created_at
        `;
        const { rows } = await pool.query(query, [provider, providerId, avatarUrl, existingByEmail.id]);
        return rows[0];
      }
    }

    return UserModel.createFromProvider({
      name,
      email: email ? email.toLowerCase() : `${provider}_${providerId}@sin-email.local`,
      provider,
      providerId,
      avatarUrl,
    });
  },

  async findByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1`;
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const query = `
      SELECT id, name, email, role, created_at
      FROM users WHERE id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async findAll() {
    const query = `
      SELECT id, name, email, role, created_at
      FROM users ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },
};

module.exports = UserModel;
