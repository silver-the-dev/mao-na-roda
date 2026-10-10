import { Button } from '../../src/components';
import Placeholder from '../../src/components/Placeholder';
import { useSession } from '../../src/store/session';

export default function PerfilScreen() {
  const signOut = useSession((s) => s.signOut);

  return (
    <Placeholder title="Meu perfil e configurações" etapa={7}>
      <Button title="Sair" variant="outline" icon="log-out-outline" onPress={signOut} />
    </Placeholder>
  );
}
