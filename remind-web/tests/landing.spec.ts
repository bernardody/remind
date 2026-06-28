import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("renderiza hero e CTAs principais", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /dependência digital/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /comece agora grátis/i }),
    ).toBeVisible();
  });

  test("formulário de demonstração valida campos obrigatórios", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /solicitar demonstração/i }).first().click();
    await page.getByRole("button", { name: /solicitar agendamento/i }).click();
    await expect(page.getByText(/informe seu nome completo/i)).toBeVisible();
  });
});
