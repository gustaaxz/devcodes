import { expect, test } from '@playwright/test'
import { mockSupabase } from './helpers.js'

test('página de login apresenta os campos e links públicos', async ({ page }) => {
  await page.goto('/entrar')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  await expect(page.getByLabel('E-mail ou nome de usuário')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cadastre-se' })).toBeVisible()
})

test('valida cadastro e confirma sucesso de registro mockado', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/cadastro')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByText('Informe seu nome completo.')).toBeVisible()
  await expect(page.getByText(/Nome de usuário deve ter/)).toBeVisible()

  await page.getByLabel('Nome completo').fill('E2E User')
  await page.getByLabel('Nome de usuário').fill('e2e-user')
  await page.getByLabel('E-mail').fill('e2e@example.test')
  await page.getByLabel('Senha', { exact: true }).fill('E2e-password-123!')
  await page.getByLabel('Confirmar senha').fill('E2e-password-123!')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Verifique seu e-mail' })).toBeVisible()
})

test('solicita recuperação de senha sem expor existência da conta', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/recuperar-senha')
  await page.getByLabel('E-mail').fill('e2e@example.test')
  await page.getByRole('button', { name: 'Enviar link' }).click()
  await expect(page.getByText('Se existir uma conta com este e-mail, você receberá um link para redefinir a senha.')).toBeVisible()
})
