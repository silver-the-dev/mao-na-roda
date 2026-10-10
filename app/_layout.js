import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorState, LoadingState } from '../src/components';
import { inicializarBanco } from '../src/db';
import { useSession } from '../src/store/session';
import { colors } from '../src/theme';

export default function RootLayout() {
  const logado = useSession((s) => s.userId !== null);
  const [estado, setEstado] = useState(/** @type {'carregando' | 'pronto' | 'erro'} */ ('carregando'));

  const iniciar = useCallback(() => {
    inicializarBanco()
      .then(() => setEstado('pronto'))
      .catch((e) => {
        console.error('Falha ao abrir o banco de dados', e);
        setEstado('erro');
      });
  }, []);

  useEffect(() => {
    iniciar();
  }, [iniciar]);

  function tentarDeNovo() {
    setEstado('carregando');
    iniciar();
  }

  if (estado !== 'pronto') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {estado === 'carregando' ? (
            <LoadingState message="Preparando o app..." />
          ) : (
            <ErrorState message="Não foi possível abrir o banco de dados do app." onRetry={tentarDeNovo} />
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primaryDark,
          headerTitleStyle: { fontWeight: '700', color: colors.text },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!logado}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={logado}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="busca" options={{ title: 'Buscar itens' }} />
          <Stack.Screen name="item/novo" options={{ title: 'Anunciar item' }} />
          <Stack.Screen name="item/[id]/index" options={{ title: 'Detalhes do item' }} />
          <Stack.Screen name="item/[id]/editar" options={{ title: 'Editar item' }} />
          <Stack.Screen name="item/[id]/alugar" options={{ title: 'Solicitar aluguel' }} />
          <Stack.Screen name="aluguel/[id]/index" options={{ title: 'Aluguel' }} />
          <Stack.Screen name="aluguel/[id]/avaliar" options={{ title: 'Avaliar' }} />
          <Stack.Screen name="usuario/[id]" options={{ title: 'Perfil' }} />
          <Stack.Screen name="perfil/editar" options={{ title: 'Editar perfil' }} />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
