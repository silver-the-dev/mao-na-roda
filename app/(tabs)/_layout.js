import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

/**
 * @param {React.ComponentProps<typeof Ionicons>['name']} ativo
 * @param {React.ComponentProps<typeof Ionicons>['name']} inativo
 */
function icone(ativo, inativo) {
  /** @param {{ focused: boolean, color: string, size: number }} p */
  function TabIcon({ focused, color, size }) {
    return <Ionicons name={focused ? ativo : inativo} size={size} color={color} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        tabBarStyle: { minHeight: 64, paddingTop: 6 },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', headerTitle: 'Mão na Roda', tabBarIcon: icone('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="alugueis"
        options={{ title: 'Aluguéis', tabBarIcon: icone('swap-horizontal', 'swap-horizontal-outline') }}
      />
      <Tabs.Screen
        name="anunciar"
        options={{ title: 'Anunciar', headerTitle: 'Meus itens', tabBarIcon: icone('add-circle', 'add-circle-outline') }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', headerTitle: 'Meu perfil', tabBarIcon: icone('person', 'person-outline') }}
      />
    </Tabs>
  );
}
