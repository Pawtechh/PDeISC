import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BienvenidaCardProps } from '../types/auth';

/**
 * Componente que recibe todos los datos del usuario mediante PROPS
 * según lo especificado en el Punto 2 de la consigna.
 */
export default function BienvenidaCard({
  id,
  nombre,
  email,
  rol,
  horaIngreso,
  onLogout,
}: BienvenidaCardProps) {
  // Generar iniciales del nombre para el avatar
  const initials = nombre
    ? nombre
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const getRoleColor = (userRol: string) => {
    switch (userRol.toLowerCase()) {
      case 'administrador':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'docente':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'desarrollador':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      default:
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
    }
  };

  const roleStyle = getRoleColor(rol);

  return (
    <View style={styles.cardContainer}>
      {/* Avatar circular con iniciales */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
        </View>
      </View>

      {/* Saludo y Nombre */}
      <Text style={styles.greetingTitle}>¡Bienvenido/a de nuevo!</Text>
      <Text style={styles.userName}>{nombre}</Text>

      {/* Badge de Rol */}
      <View
        style={[
          styles.roleBadge,
          { backgroundColor: roleStyle.bg, borderColor: roleStyle.border },
        ]}
      >
        <Ionicons name="shield-checkmark" size={14} color={roleStyle.text} />
        <Text style={[styles.roleText, { color: roleStyle.text }]}>{rol}</Text>
      </View>

      <View style={styles.divider} />

      {/* Datos del usuario pasados por Props */}
      <View style={styles.detailsList}>
        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <Ionicons name="key-outline" size={18} color="#6366f1" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>ID de Usuario (Prop)</Text>
            <Text style={styles.detailValue}>#{id}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <Ionicons name="mail-outline" size={18} color="#6366f1" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>Correo Electrónico (Prop)</Text>
            <Text style={styles.detailValue}>{email}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <Ionicons name="time-outline" size={18} color="#6366f1" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>Hora de Ingreso (Prop)</Text>
            <Text style={styles.detailValue}>{horaIngreso || 'Recién'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <Ionicons name="server-outline" size={18} color="#16a34a" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>Estado de Sesión</Text>
            <Text style={[styles.detailValue, { color: '#16a34a' }]}>Autenticado vía API</Text>
          </View>
        </View>
      </View>

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16a34a',
  },
  greetingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  detailsList: {
    width: '100%',
    gap: 14,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
});
