import { useCallback } from 'react';
import { ErrorState, LoadingState } from '../../src/components';
import ProfileForm from '../../src/components/ProfileForm';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { buscarUsuario } from '../../src/repositories/users';
import { useUsuarioId } from '../../src/store/session';

export default function EditarPerfilScreen() {
  const userId = useUsuarioId();
  const { dados: usuario, carregando, erro, recarregar } = useFocusQuery(
    useCallback(() => buscarUsuario(userId), [userId]),
  );

  if (carregando) return <LoadingState />;
  if (erro || !usuario) return <ErrorState message={erro ?? 'Usuário não encontrado.'} onRetry={recarregar} />;
  return <ProfileForm usuario={usuario} />;
}
