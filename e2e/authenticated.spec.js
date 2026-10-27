import { expect, test } from '@playwright/test'
import { mockSupabase, signInAsE2eUser } from './helpers.js'

test('login navega pelas áreas principais sem erros de servidor', async ({ page }) => {
  await mockSupabase(page)
  await signInAsE2eUser(page)

  for (const [label, path] of [
    ['Tarefas', '/tarefas'],
    ['Anotações', '/anotacoes'],
    ['Biblioteca de Programação', '/biblioteca'],
    ['Calendário', '/calendario'],
    ['Produtividade', '/analytics'],
    ['Tags', '/tags'],
    ['Configurações', '/configuracoes']
  ]) {
    await page.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  }
})

test('altera idioma e atualiza navegação e controles', async ({ page }) => {
  await mockSupabase(page)
  await signInAsE2eUser(page)
  await page.goto('/configuracoes')
  await page.getByLabel('Idioma').selectOption('en-US')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
  await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  await page.getByRole('link', { name: 'Tasks' }).click()
  await expect(page.getByRole('button', { name: 'New task' })).toBeVisible()
})

test('exige TOTP quando a conta tem segundo fator ativo', async ({ page }) => {
  await mockSupabase(page, { mfaEnrolled: true })
  await page.goto('/entrar')
  await page.getByLabel('E-mail ou nome de usuário').fill('e2e@example.test')
  await page.getByLabel('Senha').fill('E2e-password-123!')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Confirme sua identidade' })).toBeVisible()
  await page.getByLabel('Código de verificação').fill('123456')
  await page.getByRole('button', { name: 'Verificar e continuar' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('link', { name: 'Tarefas' })).toBeVisible()
})

test('abre formulário de tarefa com os campos e validações iniciais', async ({ page }) => {
  await mockSupabase(page)
  await signInAsE2eUser(page)
  await page.goto('/tarefas')
  await page.getByRole('button', { name: 'Nova tarefa' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('Título')).toBeVisible()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Informe o título.')).toBeVisible()
})

test('configura autenticador TOTP nas configurações da conta', async ({ page }) => {
  await mockSupabase(page)
  await signInAsE2eUser(page)
  await page.goto('/configuracoes')
  await page.getByRole('button', { name: 'Configurar app autenticador' }).click()
  await expect(page.getByAltText('QR code para configurar autenticação em duas etapas')).toBeVisible()
  await page.getByLabel('Código do autenticador').fill('123456')
  await page.getByRole('button', { name: 'Confirmar ativação' }).click()
  await expect(page.getByText('DevCodes · ativo')).toBeVisible()
})
