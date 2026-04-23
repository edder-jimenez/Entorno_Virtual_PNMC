import { fireEvent, render, screen } from '@testing-library/react';
import { FormField, TextAreaInput, TextInput } from './FormControls.jsx';

describe('FormControls', () => {
  it('asocia label con input y muestra error accesible', () => {
    render(
      <FormField label="Correo" htmlFor="correo" error="Campo requerido" required>
        <TextInput id="correo" name="correo" aria-label="Correo" />
      </FormField>,
    );

    const input = screen.getByLabelText('Correo');
    expect(input).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Campo requerido');
  });

  it('permite editar textarea', () => {
    render(
      <FormField label="Descripción" htmlFor="descripcion">
        <TextAreaInput id="descripcion" aria-label="Descripción" />
      </FormField>,
    );

    const textarea = screen.getByLabelText('Descripción');
    fireEvent.change(textarea, { target: { value: 'Texto de prueba' } });
    expect(textarea).toHaveValue('Texto de prueba');
  });
});
