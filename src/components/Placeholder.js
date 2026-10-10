import { EmptyState } from './StateViews';
import Screen from './Screen';

/**
 * Tela provisória para rotas que serão implementadas nas próximas etapas.
 * @param {{ title: string, etapa: number, children?: React.ReactNode }} props
 */
export default function Placeholder({ title, etapa, children }) {
  return (
    <Screen scroll>
      <EmptyState icon="construct-outline" title={title} message={`Esta tela será feita na etapa ${etapa}.`} />
      {children}
    </Screen>
  );
}
