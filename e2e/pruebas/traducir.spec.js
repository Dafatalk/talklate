// Recorrido real en el navegador (vista de celular): iniciar sesion, crear una conversacion, pasar al
// modo chat, escribir un modismo y ver la traduccion adaptada a la region destino.
const { test, expect } = require('@playwright/test');

const ADMIN = { correo: 'dafa123.daf@gmail.com', password: 'Admin123!' };

test('iniciar sesion, crear conversacion y traducir un modismo en el chat', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Iniciar sesion/i).first().click();
  const campos = page.locator('input');
  await campos.nth(0).fill(ADMIN.correo);
  await campos.nth(1).fill(ADMIN.password);
  await page.getByText('Iniciar sesion', { exact: true }).last().click();

  // La pantalla inicial es la lista de conversaciones: se abre una nueva con el boton +
  await page.getByRole('button', { name: 'Nueva conversacion' }).click();

  // Nueva conversacion: idioma y region destino
  // Los selectores abren una hoja inferior con la lista de opciones
  await page.getByRole('button', { name: 'Traducir a: Elige un idioma' }).click();
  await page.getByText('Ingles', { exact: true }).filter({ visible: true }).last().click();
  await page.getByRole('button', { name: 'Region del idioma de destino: Elige una region' }).click();
  await page.getByText('New York', { exact: true }).filter({ visible: true }).last().click();
  await page.getByText('Empezar a traducir').click();

  // Abre en la burbuja de voz (la IA); se cambia al chat desde la cabecera
  await expect(page.getByText('Toca la burbuja y habla')).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar a chat' }).click();

  await page.getByPlaceholder('Escribe tu mensaje').fill('Hay que ponerse las pilas con el trabajo');
  await page.getByLabel('Enviar', { exact: true }).click();

  await expect(page.getByText('We need to get cracking on the work')).toBeVisible();
  await expect(page.getByText(/ponerse las pilas/).first()).toBeVisible();
});

test('un correo o contrasena incorrectos muestran un aviso y no dejan entrar', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Iniciar sesion/i).first().click();
  const campos = page.locator('input');
  await campos.nth(0).fill(ADMIN.correo);
  await campos.nth(1).fill('Incorrecta123!');
  await page.getByText('Iniciar sesion', { exact: true }).last().click();
  await expect(page.getByText(/incorrect/i)).toBeVisible();
  await expect(page.getByText('Empezar a traducir')).toHaveCount(0);
});
