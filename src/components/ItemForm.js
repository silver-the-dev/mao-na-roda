import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CATEGORIAS, CONSERVACOES, MAX_FOTOS_ITEM } from '../constants';
import { mensagemDeErro } from '../domain/errors';
import { itemSchema, paraDadosItem } from '../schemas/item';
import Button from './Button';
import ChoiceField from './ChoiceField';
import FormField from './FormField';
import Notice from './Notice';
import PhotoPicker from './PhotoPicker';
import Screen from './Screen';

/**
 * Formulário de item usado em "Anunciar item" e "Editar item".
 * @param {{
 *   valoresIniciais: import('../schemas/item').ItemForm,
 *   fotosIniciais: string[],
 *   textoBotao: string,
 *   onSubmit: (dados: import('../repositories/items').DadosItem, fotos: string[]) => Promise<void>,
 * }} props
 */
export default function ItemForm({ valoresIniciais, fotosIniciais, textoBotao, onSubmit }) {
  const [fotos, setFotos] = useState(fotosIniciais);
  const [erro, setErro] = useState(/** @type {string | null} */ (null));

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: valoresIniciais,
  });

  const enviar = handleSubmit(async (form) => {
    setErro(null);
    try {
      await onSubmit(paraDadosItem(form), fotos);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  });

  const temErros = Object.keys(errors).length > 0;

  return (
    <Screen scroll>
      {erro ? <Notice tipo="erro">{erro}</Notice> : null}

      <PhotoPicker value={fotos} onChange={setFotos} max={MAX_FOTOS_ITEM} />

      <FormField control={control} name="titulo" label="Título" placeholder="Ex.: Furadeira de impacto" maxLength={80} />
      <FormField
        control={control}
        name="descricao"
        label="Descrição"
        placeholder="Conte o que acompanha o item, como usar e cuidados."
        multiline
        maxLength={500}
      />
      <ChoiceField
        control={control}
        name="categoria"
        label="Categoria"
        options={CATEGORIAS.map((c) => ({ value: c.value, label: c.label, icon: c.icon }))}
      />
      <ChoiceField control={control} name="conservacao" label="Estado de conservação" options={CONSERVACOES} />
      <FormField
        control={control}
        name="valorDiaria"
        label="Valor da diária (R$)"
        placeholder="15,00"
        keyboardType="decimal-pad"
      />
      <FormField
        control={control}
        name="caucao"
        label="Caução (R$, opcional)"
        placeholder="Deixe vazio se não cobrar"
        hint="Valor deixado como garantia e devolvido no fim do aluguel. O pagamento é combinado fora do app."
        keyboardType="decimal-pad"
      />
      <FormField control={control} name="bairro" label="Bairro onde o item está" autoCapitalize="words" />
      <FormField control={control} name="cidade" label="Cidade" autoCapitalize="words" />

      {temErros ? <Notice tipo="erro">Confira os campos destacados acima.</Notice> : null}
      <Button title={textoBotao} icon="checkmark" onPress={enviar} loading={isSubmitting} />
    </Screen>
  );
}
