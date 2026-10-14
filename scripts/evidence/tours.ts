import type { Page } from "playwright";

export type Tour = (page: Page) => Promise<void>;

const pause = (page: Page, ms = 1200) => page.waitForTimeout(ms);

export const tours: Record<string, Tour> = {
  scaffold: async (page) => {
    await page.goto("/");
    await page.getByRole("region", { name: "Ready" }).waitFor();
    await pause(page, 2000);
    await page.getByRole("button", { name: "Campaigns" }).click();
    await pause(page);
    await page.getByRole("button", { name: "My streams" }).click();
    await pause(page);
    await page.getByRole("button", { name: "All" }).click();
    await pause(page);
    await page.getByRole("button", { name: "Skip it" }).click();
    await pause(page, 1500);
    await page.getByRole("button", { name: "Schedule 6 pm" }).click();
    await pause(page, 2000);
    await page.getByLabel("Tell Cue what to do").fill("Move every rage clip to Friday");
    await page.getByLabel("Tell Cue what to do").press("Enter");
    await pause(page, 2500);
    await page.getByRole("link", { name: "The 1v3 nobody saw coming" }).click();
    await page.getByRole("tab", { name: "v2" }).waitFor();
    await pause(page, 2000);
    await page.getByRole("tab", { name: "v1" }).click();
    await pause(page, 1500);
    await page.getByRole("tab", { name: "v2" }).click();
    await pause(page, 1500);
    await page.getByRole("button", { name: "Zoom in on the last kill" }).click();
    await pause(page, 2500);
    await page.getByRole("link", { name: "Pipeline" }).click();
    await pause(page, 1200);
    await page.getByRole("link", { name: "Planner" }).click();
    await page.getByRole("button", { name: "Let Cue fill the week" }).waitFor();
    await pause(page, 2500);
    await page.getByRole("button", { name: "Next week" }).click();
    await pause(page);
    await page.getByRole("button", { name: "Previous week" }).click();
    await pause(page, 2000);
  },
};
