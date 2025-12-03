const MIN_PASSWORD_LENGTH = 8;
const LETTER_PATTERN = /[A-Za-z]/;
const NUMBER_PATTERN = /\d/;

export const PASSWORD_REQUIREMENT_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres e incluir letras y números.';

export const isPasswordSecure = (password: string): boolean => {
  if (!password) {
    return false;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return false;
  }

  return LETTER_PATTERN.test(password) && NUMBER_PATTERN.test(password);
};
