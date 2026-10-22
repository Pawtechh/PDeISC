// controllers/userController.js
const UserModel = require('../models/userModel');

// GET /api/users/profile  (ruta protegida)
async function getProfile(req, res) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error('Error en getProfile:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

// GET /api/users  (ruta protegida - lista de usuarios)
async function getAllUsers(req, res) {
  try {
    const users = await UserModel.findAll();
    return res.status(200).json({ users });
  } catch (err) {
    console.error('Error en getAllUsers:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

module.exports = { getProfile, getAllUsers };
