import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ErrorState, LoadingState } from '../../../src/components';
import ItemForm from '../../../src/components/ItemForm';
import { useFocusQuery } from '../../../src/hooks/useFocusQuery';
import { atualizarItemComFotos, buscarItem } from '../../../src/repositories/items';
import { paraFormularioItem } from '../../../src/schemas/item';
import { useUsuarioId } from '../../../src/store/session';

export default function EditarItemScreen() {
  const { id } = useLocalSearchParams();
  const itemId = Number(id);
  const userId = useUsuarioId();
  const { dados: item, carregando, erro, recarregar } = useFocusQuery(
    useCallback(() => buscarItem(itemId), [itemId]),
  );

  if (carregando) return <LoadingState />;
  if (erro) return <ErrorState message={erro} onRetry={recarregar} />;
  if (!item || item.status === 'excluido') return <ErrorState message="Item não encontrado." />;
  if (item.dono_id !== userId) return <ErrorState message="Só o dono pode editar este item." />;

  return (
    <ItemForm
      textoBotao="Salvar alterações"
      fotosIniciais={item.fotos.map((f) => f.uri)}
      valoresIniciais={paraFormularioItem(item)}
      onSubmit={async (dados, fotos) => {
        await atualizarItemComFotos(itemId, userId, dados, fotos);
        router.back();
      }}
    />
  );
}
