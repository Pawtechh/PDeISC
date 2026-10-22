import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NATIVE_COMPONENTS } from '../data/componentsData';
import { ComponentCategory, NativeComponentDoc } from '../types/components';

const CATEGORIES: ComponentCategory[] = [
  'Todos',
  'Básicos',
  'Entradas',
  'Toques e Interacción',
  'Listas',
  'Feedback y Diálogos',
  'Sistema',
];

export default function CatalogScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('Todos');
  const [expandedId, setExpandedId] = useState<string | null>('view');

  const filteredComponents = useMemo(() => {
    return NATIVE_COMPONENTS.filter((comp) => {
      const matchesSearch =
        comp.name.toLowerCase().includes(search.toLowerCase()) ||
        comp.summary.toLowerCase().includes(search.toLowerCase()) ||
        comp.purpose.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        selectedCategory === 'Todos' || comp.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [search, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Básicos':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      case 'Entradas':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'Toques e Interacción':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'Listas':
        return { bg: '#fae8ff', text: '#86198f', border: '#f5d0fe' };
      case 'Feedback y Diálogos':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'Sistema':
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
      default:
        return { bg: '#e2e8f0', text: '#1e293b', border: '#cbd5e1' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Barra de Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar componente o para qué se usa..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de Categorías */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Componentes */}
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            Mostrando <Text style={styles.bold}>{filteredComponents.length}</Text> de{' '}
            {NATIVE_COMPONENTS.length} componentes
          </Text>
          <TouchableOpacity
            style={styles.labShortcut}
            onPress={() => router.push('/playground')}
            activeOpacity={0.8}
          >
            <Ionicons name="flask" size={14} color="#4f46e5" />
            <Text style={styles.labShortcutText}>Ir al Laboratorio</Text>
          </TouchableOpacity>
        </View>

        {filteredComponents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No se encontraron componentes</Text>
            <Text style={styles.emptyDesc}>Intentá con otro término o seleccioná otra categoría.</Text>
          </View>
        ) : (
          filteredComponents.map((item) => {
            const isExpanded = expandedId === item.id;
            const catColors = getCategoryColor(item.category);

            return (
              <View key={item.id} style={styles.card}>
                {/* Cabecera del Componente */}
                <TouchableOpacity
                  style={styles.cardHeader}
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name={item.icon as any} size={22} color="#4f46e5" />
                  </View>

                  <View style={styles.headerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.componentName}>&lt;{item.name} /&gt;</Text>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: catColors.bg, borderColor: catColors.border },
                        ]}
                      >
                        <Text style={[styles.categoryBadgeText, { color: catColors.text }]}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.summaryText}>{item.summary}</Text>
                  </View>

                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {/* Contenido Expandido */}
                {isExpanded && (
                  <View style={styles.cardExpanded}>
                    <View style={styles.divider} />

                    {/* Para qué se usa */}
                    <View style={styles.sectionBlock}>
                      <View style={styles.sectionHeaderRow}>
                        <Ionicons name="help-circle-outline" size={18} color="#4f46e5" />
                        <Text style={styles.sectionBlockTitle}>¿Para qué se usa?</Text>
                      </View>
                      <Text style={styles.purposeText}>{item.purpose}</Text>
                    </View>

                    {/* Casos de uso habituales */}
                    <View style={styles.sectionBlock}>
                      <View style={styles.sectionHeaderRow}>
                        <Ionicons name="checkmark-done-circle-outline" size={18} color="#16a34a" />
                        <Text style={styles.sectionBlockTitle}>Casos de uso típicos</Text>
                      </View>
                      {item.useCases.map((useCase, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{useCase}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Props principales */}
                    <View style={styles.sectionBlock}>
                      <View style={styles.sectionHeaderRow}>
                        <Ionicons name="code-slash-outline" size={18} color="#d97706" />
                        <Text style={styles.sectionBlockTitle}>Props principales</Text>
                      </View>
                      <View style={styles.propsTable}>
                        {item.keyProps.map((prop, idx) => (
                          <View key={idx} style={styles.propRow}>
                            <View style={styles.propNameBadge}>
                              <Text style={styles.propNameText}>{prop.name}</Text>
                            </View>
                            <Text style={styles.propTypeText}>({prop.type})</Text>
                            <Text style={styles.propDescText}>{prop.description}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Código de ejemplo */}
                    <View style={styles.sectionBlock}>
                      <View style={styles.sectionHeaderRow}>
                        <Ionicons name="terminal-outline" size={18} color="#0f172a" />
                        <Text style={styles.sectionBlockTitle}>Sintaxis de ejemplo</Text>
                      </View>
                      <View style={styles.snippetContainer}>
                        <Text style={styles.snippetText}>{item.codeSnippet}</Text>
                      </View>
                    </View>

                    {/* Tip didáctico si existe */}
                    {item.tip && (
                      <View style={styles.tipBox}>
                        <Ionicons name="bulb-outline" size={20} color="#b45309" />
                        <Text style={styles.tipText}>
                          <Text style={styles.tipBold}>Tip clave: </Text>
                          {item.tip}
                        </Text>
                      </View>
                    )}

                    {/* Botón para interactuar en el Playground */}
                    <TouchableOpacity
                      style={styles.actionButton}
                      activeOpacity={0.8}
                      onPress={() => router.push('/playground')}
                    >
                      <Ionicons name="play" size={16} color="#ffffff" />
                      <Text style={styles.actionButtonText}>
                        Probar &lt;{item.name} /&gt; en el Laboratorio
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterText: {
    fontSize: 13,
    color: '#64748b',
  },
  bold: {
    fontWeight: '700',
    color: '#1e293b',
  },
  labShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  labShortcutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  componentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  cardExpanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 14,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  purposeText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: '#4f46e5',
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  propsTable: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  propRow: {
    gap: 2,
  },
  propNameBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  propNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6d28d9',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  propTypeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  propDescText: {
    fontSize: 12,
    color: '#475569',
  },
  snippetContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
  },
  snippetText: {
    color: '#38bdf8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 8,
    marginBottom: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  tipBold: {
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
