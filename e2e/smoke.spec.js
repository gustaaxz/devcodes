import { expect, test } from '@playwright/test'

test('abre o DevCodes e apresenta a tela inicial adequada à configuração', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toContainText(/DevCodes|Entrar|Supabase não configurado/)
  await expect(page.locator('body')).not.toContainText(/Internal Server Error/)
})

test('rotas desconhecidas não deixam uma tela em branco', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page.locator('body')).toContainText(/DevCodes|Entrar|Supabase não configurado/)
})
