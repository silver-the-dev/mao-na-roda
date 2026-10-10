import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { ErrorState, LoadingState } from '../../src/components';
import ItemForm from '../../src/components/ItemForm';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { criarItemComFotos } from '../../src/repositories/items';
import { buscarUsuario } from '../../src/repositories/users';
import { useUsuarioId } from '../../src/store/session';

export default function NovoItemScreen() {
  const userId = useUsuarioId();
  const { dados: usuario, carregando, erro, recarregar } = useFocusQuery(
    useCallback(() => buscarUsuario(userId), [userId]),
  );

  if (carregando) return <LoadingState />;
  if (erro || !usuario) return <ErrorState message={erro ?? undefined} onRetry={recarregar} />;

  return (
    <ItemForm
      textoBotao="Publicar anúncio"
      fotosIniciais={[]}
      valoresIniciais={{
        titulo: '',
        descricao: '',
        categoria: '',
        conservacao: '',
        valorDiaria: '',
        caucao: '',
        bairro: usuario.bairro,
        cidade: usuario.cidade,
      }}
      onSubmit={async (dados, fotos) => {
        const id = await criarItemComFotos(userId, dados, fotos);
        Alert.alert('Anúncio publicado', 'Seu item já aparece nas buscas.');
        router.replace(`/item/${id}`);
      }}
    />
  );
}
